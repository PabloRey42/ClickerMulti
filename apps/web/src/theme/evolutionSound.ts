/** No evolution jingle asset exists, so this synthesizes the whole ~7s reveal's audio with
 * the Web Audio API — same idiom as shinySound.ts/electricSound.ts. A slow rising "charging"
 * drone during the silhouette build-up, a bright double-flash chime at each whiteout, and a
 * triumphant major fanfare at the final reveal. All notes are scheduled up front against
 * `ctx.currentTime` offsets (matching the existing sound helpers' idiom) so this stays a
 * single fire-and-forget call. */
export function playEvolutionSound(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();

    // Charging drone: a slowly rising sawtooth under the first silhouette build-up.
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sawtooth";
    drone.frequency.setValueAtTime(110, ctx.currentTime);
    drone.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 2.1);
    droneGain.gain.setValueAtTime(0, ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.0);
    droneGain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2.1);
    droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.3);
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);
    drone.start(ctx.currentTime);
    drone.stop(ctx.currentTime + 2.3);

    // First whiteout chime (silhouette locked in).
    const chime1 = ctx.currentTime + 2.2;
    [1318.5, 1568].forEach((freq, i) => {
      const startAt = chime1 + i * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.22, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.4);
    });

    // Second charging drone during the new-form silhouette build-up.
    const drone2 = ctx.createOscillator();
    const drone2Gain = ctx.createGain();
    drone2.type = "sawtooth";
    const drone2Start = ctx.currentTime + 2.5;
    drone2.frequency.setValueAtTime(150, drone2Start);
    drone2.frequency.exponentialRampToValueAtTime(440, drone2Start + 2.0);
    drone2Gain.gain.setValueAtTime(0, drone2Start);
    drone2Gain.gain.linearRampToValueAtTime(0.12, drone2Start + 1.0);
    drone2Gain.gain.linearRampToValueAtTime(0.2, drone2Start + 2.0);
    drone2Gain.gain.linearRampToValueAtTime(0, drone2Start + 2.2);
    drone2.connect(drone2Gain);
    drone2Gain.connect(ctx.destination);
    drone2.start(drone2Start);
    drone2.stop(drone2Start + 2.2);

    // Final reveal: a big bright major fanfare.
    const fanfareStart = ctx.currentTime + 4.6;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    const noteDuration = 0.18;
    notes.forEach((freq, i) => {
      const startAt = fanfareStart + i * noteDuration * 0.9;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i < 3 ? "triangle" : "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.28, startAt + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + noteDuration * 3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + noteDuration * 3.2);
    });

    setTimeout(() => ctx.close(), 8000);
  } catch {
    // Audio is a nice-to-have — never let it break the evolution reveal itself.
  }
}
