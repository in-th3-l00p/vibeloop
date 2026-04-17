type Status = "online" | "in-game" | "offline" | "ready" | "idle";

const dotColors: Record<Status, string> = {
  online: "#34d399",
  ready: "#34d399",
  "in-game": "#fbbf24",
  idle: "#fbbf24",
  offline: "#71717a",
};

const labelClasses: Record<Status, string> = {
  online: "text-emerald-400",
  ready: "text-emerald-400",
  "in-game": "text-amber-400",
  idle: "text-amber-400",
  offline: "text-zinc-600",
};

const labelText: Record<Status, string> = {
  online: "online",
  ready: "ready",
  "in-game": "In Game",
  idle: "idle",
  offline: "offline",
};

export function StatusDot({ status, size = "sm" }: { status: Status; size?: "sm" | "md" }) {
  const color = dotColors[status];
  const isActive = status !== "offline";
  return (
    <span
      className={`${size === "sm" ? "size-1.5" : "size-2"} rounded-full shrink-0`}
      style={{
        backgroundColor: color,
        boxShadow: isActive ? `0 0 6px ${color}80` : undefined,
      }}
    />
  );
}

export function StatusLabel({ status }: { status: Status }) {
  return (
    <span className={`text-[9px] uppercase tracking-wider font-medium ${labelClasses[status]}`}>
      {labelText[status]}
    </span>
  );
}
