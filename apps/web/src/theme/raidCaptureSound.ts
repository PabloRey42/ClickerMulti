/** Same Web Audio idiom as shinySound.ts. A short suspense tick-tock (sparse low blips)
 * always plays first, then either a bright ascending jingle (caught) or a soft descending
 * "not this time" tone (missed) — one function so RaidCaptureRevealModal only needs a single
 * call site regardless of the roll's outcome. */
export function playRaidCaptureSound(caught: boolean): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();

    function playNote(freq: number, startAt: number, duration: number, gainPeak: number, type: OscillatorType) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(gainPeak, startAt + duration * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.05);
    }

    // Suspense tick-tock.
    [0, 0.35, 0.7, 1.0].forEach((offset, i) => {
      playNote(440 + i * 20, ctx.currentTime + offset, 0.12, 0.12, "sine");
    });

    const resolveAt = ctx.currentTime + 1.3;
    if (caught) {
      [1046.5, 1318.5, 1568, 2093].forEach((freq, i) => playNote(freq, resolveAt + i * 0.15, 0.4, 0.26, "sine"));
    } else {
      [523.25, 392.0, 293.66].forEach((freq, i) => playNote(freq, resolveAt + i * 0.18, 0.45, 0.18, "triangle"));
    }

    setTimeout(() => ctx.close(), 3000);
  } catch {
    // Audio is a nice-to-have — never let it break the reveal itself.
  }
}
