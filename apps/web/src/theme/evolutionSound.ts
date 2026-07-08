/** No evolution jingle asset exists, so this synthesizes the whole ~7s reveal's audio with
 * the Web Audio API — same idiom as shinySound.ts/electricSound.ts. Two ascending "magic
 * charging" twinkle arpeggios (sine bells, accelerating), a bright double-flash chime at
 * each whiteout, and a triumphant fanfare with a sparkle shimmer on top at the final reveal.
 * Deliberately built entirely from sine/triangle notes, no sawtooth/continuous pitch-rising
 * drone — an earlier version used a rising sawtooth oscillator for the charging phase, which
 * reads as a siren/alarm rather than anything Pokémon-like; short bell-like notes evoke the
 * real games' evolution jingle far better. All notes are scheduled up front against
 * `ctx.currentTime` offsets (matching the existing sound helpers' idiom) so this stays a
 * single fire-and-forget call. */
export function playEvolutionSound(): void {
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

    /** A twinkling arpeggio that climbs through `scale` and speeds up as it goes — the
     * "charging magic" build-up, replacing the old rising-drone approach. */
    function playTwinkleBuildUp(scale: number[], startAt: number, totalDuration: number, gainPeak: number) {
      let t = 0;
      let noteDur = 0.32;
      let idx = 0;
      while (t < totalDuration) {
        playNote(scale[idx % scale.length], startAt + t, noteDur, gainPeak, "sine");
        t += noteDur * 0.68;
        noteDur = Math.max(0.09, noteDur * 0.91);
        idx++;
      }
    }

    // Phase 1: first silhouette build-up — a bright pentatonic-ish climb (C5 D5 E5 G5 A5 C6 D6).
    const scale1 = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
    playTwinkleBuildUp(scale1, ctx.currentTime, 2.1, 0.15);

    // First whiteout chime (silhouette locked in).
    const chime1 = ctx.currentTime + 2.2;
    [1318.5, 1568].forEach((freq, i) => playNote(freq, chime1 + i * 0.05, 0.35, 0.22, "sine"));

    // Phase 2: second build-up (new form emerging) — same shape, shifted up for distinction.
    const scale2 = scale1.map((f) => f * 1.19);
    playTwinkleBuildUp(scale2, ctx.currentTime + 2.5, 1.9, 0.17);

    // Final reveal: a warm triumphant fanfare...
    const fanfareStart = ctx.currentTime + 4.6;
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    fanfareNotes.forEach((freq, i) => playNote(freq, fanfareStart + i * 0.16, 0.5, 0.26, i < 3 ? "triangle" : "sine"));
    // ...topped with a quick high sparkle shimmer.
    const shimmer = [1568, 1760, 2093, 2349];
    shimmer.forEach((freq, i) => playNote(freq, fanfareStart + 0.5 + i * 0.07, 0.3, 0.1, "sine"));

    setTimeout(() => ctx.close(), 8000);
  } catch {
    // Audio is a nice-to-have — never let it break the evolution reveal itself.
  }
}
