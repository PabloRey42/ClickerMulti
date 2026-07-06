/** No shiny jingle asset exists, so this synthesizes a short bright ascending chime with
 * the Web Audio API instead of shipping/loading an audio file. */
export function playShinySound(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [1046.5, 1318.5, 1568, 2093]; // C6, E6, G6, C7 — bright major arpeggio
    const noteDuration = 0.16;

    notes.forEach((freq, i) => {
      const startAt = ctx.currentTime + i * noteDuration;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;

      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.25, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + noteDuration * 1.8);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + noteDuration * 2);
    });

    const totalDurationMs = notes.length * noteDuration * 2 * 1000 + 200;
    setTimeout(() => ctx.close(), totalDurationMs);
  } catch {
    // Audio is a nice-to-have — never let it break the shiny reveal itself.
  }
}
