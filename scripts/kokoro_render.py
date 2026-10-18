"""Render dialogue lines to mp3 with Kokoro. Called by scripts/render-voices.mjs.

Usage: python3 kokoro_render.py jobs.json <model dir> <out dir>
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


def main():
    jobs_path, model_dir, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(jobs_path, encoding="utf-8") as f:
        jobs = json.load(f)
    os.makedirs(out_dir, exist_ok=True)
    kokoro = Kokoro(os.path.join(model_dir, "kokoro-v1.0.int8.onnx"), os.path.join(model_dir, "voices-v1.0.bin"))

    with tempfile.TemporaryDirectory() as tmp:
        for job in jobs:
            samples, rate = kokoro.create(job["text"], voice=job["voice"], speed=job["speed"], lang="en-us")
            # a breath of silence at the start, like a line connecting
            pad = np.zeros(int(rate * 0.18), dtype=samples.dtype)
            wav = os.path.join(tmp, job["id"] + ".wav")
            sf.write(wav, np.concatenate([pad, samples]), rate)
            mp3 = os.path.join(out_dir, job["id"] + ".mp3")
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", "24000", "-b:a", "48k", mp3],
                check=True,
            )
            print(f"  {job['id']}  {job['voice']:<11} {len(samples) / rate:5.1f}s  {job['text'][:60]}")


if __name__ == "__main__":
    main()
