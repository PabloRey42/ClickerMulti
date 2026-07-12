import { ConfettiBurst } from "./ConfettiBurst";

export function LeagueVictoryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <ConfettiBurst />

      <div className="league-victory-pop relative z-10 mx-4 flex max-w-sm flex-col items-center gap-3 rounded-3xl border-[3px] border-gold-light bg-gradient-to-b from-panel-light to-panel px-8 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        <span className="text-6xl">🏆</span>
        <h2 className="text-2xl font-black uppercase tracking-wide text-gold-light">Bravo !</h2>
        <p className="text-sm font-semibold text-panel-foreground/80">
          Tu as vaincu tout le roster de la Ligue ! Rang supérieur débloqué et point de compétence gagné.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 rounded-full border-[3px] border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-6 py-3 text-sm font-black uppercase tracking-wide text-panel shadow-[0_6px_0_var(--gold-deep),0_10px_20px_rgba(0,0,0,0.5)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_var(--gold-deep)]"
        >
          Retour à la Ligue
        </button>
      </div>
    </div>
  );
}
