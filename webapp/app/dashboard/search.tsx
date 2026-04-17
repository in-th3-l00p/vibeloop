"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  GameController01Icon,
  UserGroupIcon,
  ChartBarIncreasingIcon,
  Settings01Icon,
  UserAdd01Icon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";

export function Search() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer flex flex-col items-center gap-2 rounded-lg bg-zinc-900/80 ring-1 ring-white/10 py-4 text-zinc-400 shadow-[0_0_12px_rgba(255,255,255,0.04)] transition-all duration-300 hover:bg-zinc-800/80 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.12)]"
      >
        <HugeiconsIcon icon={Search01Icon} size={22} />
        <span className="text-[11px] uppercase tracking-wider">Search</span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search for players, lobbies, and actions"
      >
        <Command className="bg-zinc-950 text-white [&_[cmdk-group-heading]]:text-zinc-500">
          <CommandInput placeholder="Search players, lobbies, actions..." />
          <CommandList className="max-h-80">
            <CommandEmpty className="text-zinc-500">No results found.</CommandEmpty>

            <CommandGroup heading="Actions">
              <CommandItem className="text-zinc-300 data-selected:bg-white/5 data-selected:text-white">
                <HugeiconsIcon icon={GameController01Icon} size={16} className="text-zinc-500" />
                <span>Create New Lobby</span>
              </CommandItem>
              <CommandItem className="text-zinc-300 data-selected:bg-white/5 data-selected:text-white">
                <HugeiconsIcon icon={UserAdd01Icon} size={16} className="text-zinc-500" />
                <span>Add Friend</span>
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Navigation">
              <CommandItem className="text-zinc-300 data-selected:bg-white/5 data-selected:text-white">
                <HugeiconsIcon icon={UserGroupIcon} size={16} className="text-zinc-500" />
                <span>Friends</span>
              </CommandItem>
              <CommandItem className="text-zinc-300 data-selected:bg-white/5 data-selected:text-white">
                <HugeiconsIcon icon={ChartBarIncreasingIcon} size={16} className="text-zinc-500" />
                <span>Stats</span>
              </CommandItem>
              <CommandItem className="text-zinc-300 data-selected:bg-white/5 data-selected:text-white">
                <HugeiconsIcon icon={Settings01Icon} size={16} className="text-zinc-500" />
                <span>Settings</span>
              </CommandItem>
              <CommandItem className="text-zinc-300 data-selected:bg-white/5 data-selected:text-white">
                <HugeiconsIcon icon={Logout03Icon} size={16} className="text-zinc-500" />
                <span>Sign Out</span>
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Players">
              {["xViper", "NovaKid", "GhostRacer", "ZenithX", "LunaWolf"].map(
                (name) => (
                  <CommandItem
                    key={name}
                    className="text-zinc-300 data-selected:bg-white/5 data-selected:text-white"
                  >
                    <span className="size-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                      {name[0]}
                    </span>
                    <span>{name}</span>
                  </CommandItem>
                )
              )}
            </CommandGroup>
          </CommandList>

          <div className="border-t border-white/10 px-3 py-2 flex items-center justify-end gap-3 text-[10px] text-zinc-600">
            <span>
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400 font-mono">Ctrl K</kbd>{" "}
              to toggle
            </span>
            <span>
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400 font-mono">Esc</kbd>{" "}
              to close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
