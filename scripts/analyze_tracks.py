import os, json, sys, warnings
warnings.filterwarnings("ignore")
import librosa
import numpy as np

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
out = {}
files = [f for f in os.listdir(AUDIO_DIR) if f.lower().endswith((".ogg", ".mp3"))]
for f in sorted(files):
    path = os.path.join(AUDIO_DIR, f)
    try:
        y, sr = librosa.load(path, sr=22050, mono=True, duration=60)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        tempo = float(np.atleast_1d(tempo)[0])
        # onset strength → rhythmic density proxy
        onset = librosa.onset.onset_strength(y=y, sr=sr)
        # fraction of frames above mean*1.3 = how busy/syncopated
        density = float(np.mean(onset > (np.mean(onset) * 1.3)))
        out[f] = {"bpm": round(tempo, 1), "beats": int(len(beats)), "density": round(density, 3)}
        print(f"{f:34s} bpm={tempo:6.1f}  density={density:.3f}")
    except Exception as e:
        out[f] = {"error": str(e)}
        print(f"{f:34s} ERROR {e}")
with open(os.path.join(os.path.dirname(__file__), "track_analysis.json"), "w") as fh:
    json.dump(out, fh, indent=2)
print("\nWROTE scripts/track_analysis.json")
