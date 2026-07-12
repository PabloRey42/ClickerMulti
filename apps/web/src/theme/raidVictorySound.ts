/** No boss-defeat jingle asset exists, so this synthesizes the whole victory sting with the
 * Web Audio API — same idiom as evolutionSound.ts/shinySound.ts (sine/triangle notes only,
 * no sawtooth/continuous drone). Deliberately the biggest sound in the game: a deep impact
 * thud (the boss going down), a triumphant rising fanfare, and a wide sparkle shimmer on top. */
export function playRaidVictorySound(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();

    function playNote(freq: number, startAt: number, duration: number, gainPeak: number, type: OscillatorType) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(gainPeak, startAt + duration * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.05);
    }

    // Deep impact thud — the boss collapsing.
    playNote(55, ctx.currentTime, 0.5, 0.35, "sine");
    playNote(82.5, ctx.currentTime + 0.05, 0.45, 0.2, "triangle");

    // Rising triumphant fanfare (wide brass-like triad chords).
    const fanfareStart = ctx.currentTime + 0.55;
    const chords = [
      [261.63, 329.63, 392.0], // C4 E4 G4
      [293.66, 369.99, 440.0], // D4 F#4 A4
      [349.23, 440.0, 523.25], // F4 A4 C5
      [392.0, 493.88, 587.33], // G4 B4 D5
      [523.25, 659.25, 783.99], // C5 E5 G5 — the big final chord
    ];
    chords.forEach((chord, i) => {
      const startAt = fanfareStart + i * 0.28;
      const duration = i === chords.length - 1 ? 1.1 : 0.32;
      chord.forEach((freq) => playNote(freq, startAt, duration, 0.16, i < 3 ? "triangle" : "sine"));
    });

    // Wide sparkle shimmer over the final chord.
    const shimmerStart = fanfareStart + (chords.length - 1) * 0.28 + 0.1;
    const shimmer = [1046.5, 1318.5, 1568, 2093, 2637];
    shimmer.forEach((freq, i) => playNote(freq, shimmerStart + i * 0.09, 0.5, 0.09, "sine"));

    setTimeout(() => ctx.close(), 3200);
  } catch {
    // Audio is a nice-to-have — never let it break the victory reveal itself.
  }
}
