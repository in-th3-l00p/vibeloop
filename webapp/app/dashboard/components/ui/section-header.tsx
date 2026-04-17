export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
      {action && (
        <button
          onClick={onAction}
          className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white"
        >
          {action}
        </button>
      )}
    </div>
  );
}
