import modal

vllm_image = (
    modal.Image.from_registry("nvidia/cuda:12.4.0-devel-ubuntu22.04", add_python="3.12")
    .uv_pip_install("vllm==0.10.2", "torch==2.8.0")
)

model_cache = modal.Volume.from_name("huggingface-cache", create_if_missing=True)

app = modal.App("vllm-inference")

@app.function(image=vllm_image, gpu="H100", volumes={"/root/.cache/huggingface": model_cache})
@modal.web_server(port=8000)
def serve():
    import subprocess
    cmd = "vllm serve Qwen/Qwen3-8B-FP8 --port 8000"
    subprocess.Popen(cmd)