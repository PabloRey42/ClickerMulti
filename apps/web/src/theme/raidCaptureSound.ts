/** Same Web Audio idiom as the other synthesized sound effects — a wheel-of-fortune "tick"
 * rhythm (clicks that slow down over ~3.5s, matching RaidCaptureRevealModal.tsx's spin
 * duration) followed by a bright ascending jingle (caught) or a soft descending "not this
 * time" tone (missed) once the wheel actually stops. */
export function playRaidCaptureSound(caught: boolean): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();

    function playClick(startAt: number, gainPeak: number) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 700;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(gainPeak, startAt + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.08);
    }

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

    // Ticking clicks that slow down, like a wheel winding down.
    let t = 0;
    let interval = 0.06;
    while (t < 3.5) {
      playClick(ctx.currentTime + t, 0.12);
      t += interval;
      interval = Math.min(0.4, interval * 1.14);
    }

    const resolveAt = ctx.currentTime + 3.75;
    if (caught) {
      [1046.5, 1318.5, 1568, 2093].forEach((freq, i) => playNote(freq, resolveAt + i * 0.15, 0.4, 0.26, "sine"));
    } else {
      [523.25, 392.0, 293.66].forEach((freq, i) => playNote(freq, resolveAt + i * 0.18, 0.45, 0.18, "triangle"));
    }

    setTimeout(() => ctx.close(), 6200);
  } catch {
    // Audio is a nice-to-have — never let it break the reveal itself.
  }
}
