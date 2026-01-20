import socket
import subprocess
from typing import Any

import modal

MINUTES = 60  # seconds
API_PORT = 8000

app = modal.App("gpt-oss-inference")

# Build transformers image with GPT-OSS dependencies
transformers_image = (
    modal.Image.from_registry("nvidia/cuda:12.4.0-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])
    .pip_install(
        "transformers[serving]>=4.52.0",
        "kernels",
        "torch",
        "accelerate",
        "huggingface-hub",
    )
)

MODEL_NAME = "openai/gpt-oss-20b"

hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)

with transformers_image.imports():
    import requests


def wait_ready(proc: subprocess.Popen):
    """Wait for the server to be ready."""
    import time
    max_wait = 600  # 10 minutes
    start = time.time()
    while time.time() - start < max_wait:
        try:
            socket.create_connection(("localhost", API_PORT), timeout=1).close()
            return
        except OSError:
            if proc.poll() is not None:
                raise RuntimeError(f"Server exited with {proc.returncode}")
            time.sleep(1)
    raise RuntimeError("Server startup timed out")


def warmup():
    """Send warmup requests to the server."""
    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 16,
    }

    for _ in range(2):
        requests.post(
            f"http://localhost:{API_PORT}/v1/chat/completions",
            json=payload,
            timeout=300,
        ).raise_for_status()


@app.cls(
    image=transformers_image,
    gpu="T4:1",
    scaledown_window=15 * MINUTES,
    timeout=20 * MINUTES,  # Longer timeout for model download
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
    },
    enable_memory_snapshot=True,
)
@modal.concurrent(max_inputs=8)
class GptOssServer:
    @modal.enter(snap=True)
    def start(self):
        # transformers serve command - it loads model on first request
        cmd = [
            "transformers",
            "serve",
            "--host",
            "0.0.0.0",
            "--port",
            str(API_PORT),
        ]

        print("Starting server:", *cmd)

        self.server_proc = subprocess.Popen(cmd)

        wait_ready(self.server_proc)

        warmup()

    @modal.web_server(port=API_PORT, startup_timeout=20 * MINUTES)
    def serve(self):
        pass

    @modal.exit()
    def stop(self):
        self.server_proc.terminate()
