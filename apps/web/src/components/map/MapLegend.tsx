export function MapLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] font-bold text-panel-foreground/80">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full border border-panel-foreground/60 ${item.color}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
