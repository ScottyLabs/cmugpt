# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: Copyright contributors to the vLLM project

import argparse
import concurrent.futures
import time
from concurrent.futures import ThreadPoolExecutor

from openai import OpenAI

# Modify OpenAI's API key and API base to use the API server.
openai_api_key = "EMPTY"
openai_api_base = "https://ops-5--vllm-inference-serve.modal.run/v1"


def parse_args():
    parser = argparse.ArgumentParser(description="Client for vLLM API server")
    parser.add_argument(
        "--stream", action="store_true", help="Enable streaming response"
    )
    return parser.parse_args()


def main(args):
    client = OpenAI(
        # defaults to os.environ.get("OPENAI_API_KEY")
        api_key=openai_api_key,
        base_url=openai_api_base,
    )

    models = client.models.list(timeout=600)
    model = models.data[0].id
    # If streaming requested, keep original single-stream behavior.
    if args.stream:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "A robot may not injure a human being"}],
            stream=True,
        )

        print("-" * 50)
        print("Completion results (streaming):")
        for c in completion:
            # streaming yields deltas
            try:
                print(c.choices[0].delta.content, end="", flush=True)
            except Exception:
                # fallback if message is present instead of delta
                try:
                    print(c.choices[0].message.content, end="", flush=True)
                except Exception:
                    pass
        print("\n" + "-" * 50)
        return

    # Non-streaming: send 100 requests in parallel
    def worker(idx):
        try:
            thread_client = OpenAI(api_key=openai_api_key, base_url=openai_api_base)
            start_time = time.perf_counter()
            completion = thread_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "A robot may not injure a human being"}],
                stream=False,
            )
            end_time = time.perf_counter()
            return (idx, completion, end_time - start_time)
        except Exception as e:
            return (idx, e, 0)

    NUM_REQUESTS = 10
    print(f"Sending {NUM_REQUESTS} requests in parallel...")

    results = []
    with ThreadPoolExecutor(max_workers=min(100, NUM_REQUESTS)) as ex:
        futures = [ex.submit(worker, i) for i in range(NUM_REQUESTS)]
        for fut in concurrent.futures.as_completed(futures):
            results.append(fut.result())

    print("-" * 50)
    print("Parallel completion results (showing id, latency, and a short summary):")
    latencies = []
    for idx, res, lat in sorted(results, key=lambda x: x[0]):
        if isinstance(res, Exception):
            print(f"#{idx}: ERROR: {res}")
        else:
            latencies.append(lat)
            # Print a compact summary to avoid huge dumps
            try:
                # Try to show the text content if available
                text = None
                if hasattr(res, "choices") and res.choices:
                    choice = res.choices[0]
                    # prefer message content, else delta or the object repr
                    text = getattr(choice, "message", None)
                    if text and hasattr(text, "content"):
                        text = text.content
                    else:
                        # fallback to stringifying choice
                        text = str(choice)[:100]
                if not text:
                    text = str(res)[:100]
                print(f"#{idx} ({lat:.2f}s): {text[:100]}...")
            except Exception:
                print(f"#{idx} ({lat:.2f}s): <unprintable result>")
    
    if latencies:
        avg_lat = sum(latencies) / len(latencies)
        print("-" * 50)
        print(f"Average Latency: {avg_lat:.2f}s")
    print("-" * 50)


if __name__ == "__main__":
    args = parse_args()
    main(args)