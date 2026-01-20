import time
from pathlib import Path

import modal

# Configure the modal image to run the LLM with TensorRT
tensorrt_image = modal.Image.from_registry(
    "nvidia/cuda:12.8.1-devel-ubuntu22.04",
    add_python="3.12",  # TRT-LLM requires Python 3.12
).entrypoint([])  # remove verbose logging by base image on entry

# Install system and Python dependencies, including openmpi for multi-GPU(?) message-passing
tensorrt_image = tensorrt_image.apt_install(
    "openmpi-bin", "libopenmpi-dev", "git", "git-lfs", "wget"
).pip_install(
    "tensorrt-llm==0.18.0",
    "pynvml<12",  # avoid breaking change to pynvml version API
    "flashinfer-python==0.2.5",
    "cuda-python==12.9.1",
    "onnx==1.19.1",
    pre=True,
    extra_index_url="https://pypi.nvidia.com",
)

# Set up a persistent volume to cache the model file
volume = modal.Volume.from_name(
    "example-trtllm-inference-volume", create_if_missing=True
)
VOLUME_PATH = Path("/vol")
MODELS_PATH = VOLUME_PATH / "models"

MODEL_ID = "NousResearch/Meta-Llama-3-8B-Instruct"  # fork without repo gating
MODEL_REVISION = "53346005fb0ef11d3b6a83b12c895cca40156b6c"

tensorrt_image = tensorrt_image.uv_pip_install(
    "huggingface_hub==0.36.0",
).env(
    {
        "HF_XET_HIGH_PERFORMANCE": "1",
        "HF_HOME": str(MODELS_PATH),
        "TORCH_CUDA_ARCH_LIST": "9.0 9.0a",  # H100, silence noisy logs
    }
)

# Configure the python environment in the container
with tensorrt_image.imports():
    import os

    import torch
    from tensorrt_llm import LLM, SamplingParams


N_GPUS = 1  # Bumping this to 2 will improve latencies further but not 2x
GPU_CONFIG = f"H100:{N_GPUS}"

# Quantization config for the model, using FP8 to get only ~2% quality degradation for a much smaller model.  
def get_quant_config():
    from tensorrt_llm.llmapi import QuantConfig
    # Using FP8 for support on H100 GPUs
    return QuantConfig(quant_algo="FP8")

# Improve perf slightly by tuning params after quantization
def get_calib_config():
    from tensorrt_llm.llmapi import CalibConfig

    return CalibConfig(
        calib_batches=512,
        calib_batch_size=1,
        calib_max_seq_length=2048,
        tokenizer_max_seq_length=4096,
    )

# TensorRT-LLM plugin configs for better performance
def get_plugin_config():
    from tensorrt_llm.plugin.plugin import PluginConfig

    return PluginConfig.from_dict(
        {
            "multiple_profiles": True,
            "paged_kv_cache": True,
            "low_latency_gemm_swiglu_plugin": "fp8",
            "low_latency_gemm_plugin": "fp8",
        }
    )

# SpecDec! see https://theourban.com/10623
def get_speculative_config():
    from tensorrt_llm.llmapi import LookaheadDecodingConfig

    return LookaheadDecodingConfig(
        max_window_size=8,
        max_ngram_size=6,
        max_verification_set_size=8,
    )

MAX_BATCH_SIZE = MAX_CONCURRENT_INPUTS = 1


# Increasing MAX_BATCH_SIZE/CONCURRENT_INPUTS will reduce latency in favor of throughput.  Probably some dynamic config is best.
def get_build_config():
    from tensorrt_llm import BuildConfig

    return BuildConfig(
        plugin_config=get_plugin_config(),
        speculative_decoding_mode="LOOKAHEAD_DECODING",
        max_input_len=8192,
        max_num_tokens=16384,
        max_batch_size=MAX_BATCH_SIZE,
    )

app = modal.App("trtllm-sandbox")

MINUTES = 60  # seconds


@app.cls(
    image=tensorrt_image,
    gpu=GPU_CONFIG,
    scaledown_window=10 * MINUTES,
    timeout=10 * MINUTES,
    volumes={VOLUME_PATH: volume},
)
@modal.concurrent(max_inputs=MAX_CONCURRENT_INPUTS)
class Model:
    mode: str = modal.parameter(default="fast")

    def build_engine(self, engine_path, engine_kwargs) -> None:
        llm = LLM(model=self.model_path, **engine_kwargs)
        llm.save(engine_path)
        return llm

    @modal.enter()
    def enter(self):
        from huggingface_hub import snapshot_download
        from transformers import AutoTokenizer

        self.model_path = MODELS_PATH / MODEL_ID

        print("downloading base model if necessary")
        snapshot_download(
            MODEL_ID,
            local_dir=self.model_path,
            ignore_patterns=["*.pt", "*.bin"],  # using safetensors
            revision=MODEL_REVISION,
        )
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

        if self.mode == "fast":
            engine_kwargs = {
                "quant_config": get_quant_config(),
                "calib_config": get_calib_config(),
                "build_config": get_build_config(),
                "speculative_config": get_speculative_config(),
                "tensor_parallel_size": torch.cuda.device_count(),
            }
        else:
            engine_kwargs = {
                "tensor_parallel_size": torch.cuda.device_count(),
            }

        self.sampling_params = SamplingParams(
            temperature=0.8,
            top_p=0.95,
            max_tokens=1024,  # max generated tokens
            lookahead_config=engine_kwargs.get("speculative_config"),
        )

        engine_path = self.model_path / "trtllm_engine" / self.mode
        if not os.path.exists(engine_path):
            print(f"building new engine at {engine_path}")
            self.llm = self.build_engine(engine_path, engine_kwargs)
        else:
            print(f"loading engine from {engine_path}")
            self.llm = LLM(model=engine_path, **engine_kwargs)

    @modal.method()
    def generate(self, prompt) -> dict:
        start_time = time.perf_counter()
        text = self.text_from_prompt(prompt)
        output = self.llm.generate(text, self.sampling_params)
        latency_ms = (time.perf_counter() - start_time) * 1000

        return output.outputs[0].text, latency_ms

    @modal.method()
    async def generate_async(self, prompt):
        text = self.text_from_prompt(prompt)
        async for output in self.llm.generate_async(
            text, self.sampling_params, streaming=True
        ):
            yield output.outputs[0].text_diff

    def text_from_prompt(self, prompt):
        SYSTEM_PROMPT = (
            "You are a helpful, harmless, and honest AI assistant created by Meta."
        )

        if isinstance(prompt, str):
            prompt = [{"role": "user", "content": prompt}]

        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + prompt

        return self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )

    @modal.method()
    def boot(self):
        pass  # no-op to start up containers

    @modal.exit()
    def shutdown(self):
        self.llm.shutdown()
        del self.llm

@app.local_entrypoint()
def main(mode: str = "fast"):
    prompts = [
        "What atoms are in water?",
        "Which F1 team won in 2011?",
        "What is 12 * 9?",
        "Python function to print odd numbers between 1 and 10. Answer with code only.",
        "What is the capital of California?",
        "What's the tallest building in new york city?",
        "What year did the European Union form?",
        "How old was Geoff Hinton in 2022?",
        "Where is Berkeley?",
        "Are greyhounds or poodles faster?",
    ]

    print(f"🏎️  creating container with mode={mode}")
    model = Model(mode=mode)

    print("🏎️  cold booting container")
    model.boot.remote()

    print_queue = []
    latencies_ms = []
    for prompt in prompts:
        generated_text, latency_ms = model.generate.remote(prompt)

        print_queue.append((prompt, generated_text, latency_ms))
        latencies_ms.append(latency_ms)

    time.sleep(3)  # allow remote prints to clear
    for prompt, generated_text, latency_ms in print_queue:
        print(f"Processed prompt in {latency_ms:.2f}ms")
        print(f"Prompt: {prompt}")
        print(f"Generated Text: {generated_text}")
        print("🏎️ " * 20)

    p50 = sorted(latencies_ms)[int(len(latencies_ms) * 0.5) - 1]
    p90 = sorted(latencies_ms)[int(len(latencies_ms) * 0.9) - 1]
    print(f"🏎️  mode={mode} inference latency (p50, p90): ({p50:.2f}ms, {p90:.2f}ms)")


if __name__ == "__main__":
    import sys

    try:
        Model = modal.Cls.from_name("trtllm-sandbox", "Model")
        print("🏎️  connecting to model")
        model = Model(mode=sys.argv[1] if len(sys.argv) > 1 else "fast")
        model.boot.remote()
    except modal.exception.NotFoundError as e:
        raise SystemError("Deploy this app first with modal deploy") from e

    print("🏎️  starting chat. exit with :q, ctrl+C, or ctrl+D")
    try:
        prompt = []
        while (nxt := input("🏎️  > ")) != ":q":
            prompt.append({"role": "user", "content": nxt})
            resp = ""
            for out in model.generate_async.remote_gen(prompt):
                print(out, end="", flush=True)
                resp += out
            print("\n")
            prompt.append({"role": "assistant", "content": resp})
    except KeyboardInterrupt:
        pass
    except SystemExit:
        pass
    finally:
        print("\n")
        sys.exit(0)
