// BPM per BGM track, measured offline with librosa (scripts/analyze_tracks.py).
// The game's beat clock is driven from these so the rhythm actually matches the
// song playing — far more reliable than live FFT kick detection. One obvious
// half-time misdetection (coldrain 60 → 120) was octave-corrected; the rest are
// each song's natural tempo (varied on purpose, per stage/song).
export const TRACK_BPM: Record<string, number> = {
  "boss_electric.ogg": 89,
  "oga1_anti_matter.ogg": 78,
  "oga1_caves.ogg": 108,
  "oga1_currents.ogg": 118,
  "oga1_experiment_g.ogg": 118,
  "oga1_simulation.ogg": 118,
  "oga1_space_collisions.ogg": 118,
  "oga1_test_subject.ogg": 118,
  "oga1_tribal_chaos.ogg": 118,
  "oga1_wicked.ogg": 103,
  "oga_15k.mp3": 162,
  "oga_casino_120.ogg": 118,
  "oga_chill_100.ogg": 99,
  "oga_jumping_110.ogg": 112,
  "oga_moonlight.mp3": 108,
  "oga_synth_remix.ogg": 172,
  "oga_synth_remix_lo.ogg": 172,
  "oga_welcome_110.ogg": 108,
  "stage1_awaken.ogg": 162,
  "stage1_breach.mp3": 118,
  "stage2_coldrain.mp3": 120,
  "stage2_pulse.ogg": 162,
  "stage3_factory.ogg": 129,
  "stage3_overdrive.ogg": 103,
  "stage4_chaos.ogg": 118,
};

// Match by trailing filename so a full element.src or a "/audio/x.ogg" path works.
export function bpmForUrl(url: string): number {
  for (const name in TRACK_BPM) {
    if (url.endsWith(name)) return TRACK_BPM[name];
  }
  return 0;
}
