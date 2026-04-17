import type { ReactNode } from "react";

export function ScrollRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {children}
    </div>
  );
}
