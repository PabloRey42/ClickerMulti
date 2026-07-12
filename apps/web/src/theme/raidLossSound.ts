/** Same Web Audio idiom as the other synthesized sound effects — a somber descending minor
 * phrase for when the raid timer runs out, deliberately understated compared to the victory
 * fanfare (a loss shouldn't feel as "produced" as a win). */
export function playRaidLossSound(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();

    function playNote(freq: number, startAt: number, duration: number, gainPeak: number, type: OscillatorType) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(gainPeak, startAt + duration * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.05);
    }

    // Descending minor phrase — the boss shrugging the attack off.
    const notes = [392.0, 349.23, 293.66, 246.94]; // G4 F4 D4 B3
    notes.forEach((freq, i) => playNote(freq, ctx.currentTime + i * 0.32, 0.6, 0.18, "triangle"));
    // Low closing thud.
    playNote(98, ctx.currentTime + notes.length * 0.32, 0.8, 0.22, "sine");

    setTimeout(() => ctx.close(), 2600);
  } catch {
    // Audio is a nice-to-have — never let it break the loss reveal itself.
  }
}
