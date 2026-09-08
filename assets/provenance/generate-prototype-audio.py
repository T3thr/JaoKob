"""Reproduce original Sprint 3 prototype audio with Python 3 + ffmpeg/libmp3lame.

No sampled recording, existing composition, voice, or external audio is used.
Run from repository root. Audio is mono 44.1 kHz; BGM/ambience each loop at 8 s.
The source PCM loops are periodic; LAME/Xing gapless metadata preserves their
sample length in capable decoders. Listening/browser-loop acceptance is separate.
Trace: CR-0003 D2/D4, NAR-IP-001/003/004. Generated for JaoKob by Codex, 2026-09-07.
"""
from array import array
from math import cos, exp, pi, sin
from pathlib import Path
from random import Random
import subprocess
import tempfile
import wave

RATE = 44100
LENGTH = 8 * RATE
ROOT = Path(__file__).resolve().parents[1]


def encode(name, values):
    pcm = array("h", (round(max(-1, min(1, sample)) * 32767) for sample in values))
    with tempfile.TemporaryDirectory() as directory:
        source = Path(directory) / "source.wav"
        with wave.open(str(source), "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            wav.writeframes(pcm.tobytes())
        destination = ROOT / "audio" / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                        "-map_metadata", "-1", "-c:a", "libmp3lame", "-b:a", "96k",
                        "-write_xing", "1", str(destination)], check=True)


music = [0.0] * LENGTH
# Quiet sustained, integer-period pad under four sparse hand-authored tones.
for i in range(LENGTH):
    t = i / RATE
    breathing = 0.6 + 0.4 * sin(pi * t / 8) ** 2
    music[i] = breathing * sum(0.016 * sin(2 * pi * hz * t) for hz in (131, 196, 262))
for beat, hz in enumerate((262, 330, 392, 294)):
    for j in range(2 * RATE):
        t = j / RATE
        envelope = sin(pi * t / 2) ** 2 * exp(-1.3 * t)
        music[beat * 2 * RATE + j] += 0.13 * envelope * (sin(2 * pi * hz * t) + 0.18 * sin(4 * pi * hz * t))
encode("bgm/act1-peaceful-stream.mp3", music)

rng = Random(20260907)
ambience = [0.0] * LENGTH
# Circularly placed soft drops have no splice at the buffer boundary.
for _ in range(18):
    start, pitch = rng.randrange(LENGTH), rng.uniform(520, 860)
    for j in range(int(0.25 * RATE)):
        t = j / RATE
        envelope = (1 - exp(-100 * t)) * exp(-23 * t)
        ambience[(start + j) % LENGTH] += 0.075 * envelope * sin(2 * pi * (pitch * t - 180 * t * t))
# Smooth periodic micro-ripple bed; no harsh white-noise component.
for i in range(LENGTH):
    t = i / RATE
    ambience[i] += 0.006 * sum(sin(2 * pi * hz * t + phase) for hz, phase in ((79, 0), (113, 1), (149, 2)))
encode("ambience/morning-dew-drops.mp3", ambience)

click = []
for i in range(int(0.12 * RATE)):
    t = i / RATE
    envelope = sin(pi * t / 0.12) ** 2 * exp(-55 * t)
    click.append(0.22 * envelope * (sin(2 * pi * 430 * t) + 0.25 * sin(2 * pi * 710 * t)))
encode("sfx/decision-soft-click.mp3", click)
