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
import { CommandDialog, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ActionButton } from "./ui/action-button";
import { playerNames } from "../data/mock-players";

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
      <ActionButton icon={Search01Icon} label="Search" onClick={() => setOpen(true)} />

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search for players, lobbies, and actions">
        <Command>
          <CommandInput placeholder="Search players, lobbies, actions..." />
          <CommandList className="max-h-80">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem><HugeiconsIcon icon={GameController01Icon} size={16} /><span>Create New Lobby</span></CommandItem>
              <CommandItem><HugeiconsIcon icon={UserAdd01Icon} size={16} /><span>Add Friend</span></CommandItem>
            </CommandGroup>
            <CommandGroup heading="Navigation">
              <CommandItem><HugeiconsIcon icon={UserGroupIcon} size={16} /><span>Friends</span></CommandItem>
              <CommandItem><HugeiconsIcon icon={ChartBarIncreasingIcon} size={16} /><span>Stats</span></CommandItem>
              <CommandItem><HugeiconsIcon icon={Settings01Icon} size={16} /><span>Settings</span></CommandItem>
              <CommandItem><HugeiconsIcon icon={Logout03Icon} size={16} /><span>Sign Out</span></CommandItem>
            </CommandGroup>
            <CommandGroup heading="Players">
              {playerNames.map((name) => (
                <CommandItem key={name}>
                  <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{name[0]}</span>
                  <span>{name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="border-t border-border px-3 py-2 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <span><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Ctrl K</kbd> to toggle</span>
            <span><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Esc</kbd> to close</span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
