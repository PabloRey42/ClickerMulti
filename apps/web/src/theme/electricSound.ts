/** No zap/power-up asset exists, so this synthesizes the Dynavolt easter egg's sound with
 * the Web Audio API instead — same idiom as shinySound.ts. A harsh buzzing shock burst
 * followed by a rising electric power-up arpeggio. */
export function playElectricShockSound(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();

    // Buzzy shock burst: a sawtooth oscillator jittering rapidly between two harsh
    // frequencies, like a jolt of current.
    const buzz = ctx.createOscillator();
    const buzzGain = ctx.createGain();
    buzz.type = "sawtooth";
    buzzGain.gain.setValueAtTime(0.2, ctx.currentTime);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    buzz.connect(buzzGain);
    buzzGain.connect(ctx.destination);
    for (let t = 0; t < 0.5; t += 0.04) {
      buzz.frequency.setValueAtTime(t % 0.08 < 0.04 ? 90 : 220, ctx.currentTime + t);
    }
    buzz.start(ctx.currentTime);
    buzz.stop(ctx.currentTime + 0.5);

    // Rising electric power-up arpeggio once the shock settles.
    const notes = [392, 587.3, 784, 1174.7]; // G4, D5, G5, D6
    const noteDuration = 0.13;
    const arpeggioStart = ctx.currentTime + 0.55;

    notes.forEach((freq, i) => {
      const startAt = arpeggioStart + i * noteDuration;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = freq;

      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.18, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + noteDuration * 1.8);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + noteDuration * 2);
    });

    const totalDurationMs = (0.55 + notes.length * noteDuration * 2) * 1000 + 200;
    setTimeout(() => ctx.close(), totalDurationMs);
  } catch {
    // Audio is a nice-to-have — never let it break the reveal itself.
  }
}
