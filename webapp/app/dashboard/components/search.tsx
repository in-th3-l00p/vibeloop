"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, GameController01Icon, ShoppingBag02Icon } from "@hugeicons/core-free-icons";
import { CommandDialog, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ActionButton } from "./ui/action-button";
import { GameDialog } from "./game-dialog";
import { ProductDialog } from "./product-dialog";
import { StatusDot } from "./ui/status-indicator";
import { friendsList } from "../data/mock-players";
import { games } from "../data/mock-games";
import { marketplaceItems } from "../data/mock-marketplace";
import { rarityColors } from "../lib/constants";
import type { Game, MarketplaceItem } from "../types";

export function Search() {
  const [open, setOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

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

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search games, players, and marketplace items">
        <Command>
          <CommandInput placeholder="Search games, players, items..." />
          <CommandList className="max-h-80">
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Games">
              {games.map((game) => (
                <CommandItem key={game.name} onSelect={() => { setOpen(false); setSelectedGame(game); }}>
                  <span className="text-base leading-none">{game.emoji}</span>
                  <span className="flex-1">{game.name}</span>
                  <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full" style={{ color: game.accent, backgroundColor: `${game.accent}15` }}>{game.tag}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Players">
              {friendsList.map((friend) => (
                <CommandItem key={friend.tag} keywords={[friend.name, friend.tag]}>
                  <div className="relative shrink-0">
                    <div className="size-5 rounded-full overflow-hidden">
                      <Image src="/background.png" alt={friend.name} fill className="object-cover" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5"><StatusDot status={friend.status} /></span>
                  </div>
                  <span className="flex-1" style={{ color: friend.status === "offline" ? undefined : friend.accent }}>{friend.name}</span>
                  <span className="text-[9px] text-muted-foreground">@{friend.tag}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Marketplace">
              {marketplaceItems.map((item) => {
                const rc = rarityColors[item.rarity];
                return (
                  <CommandItem key={item.slug} onSelect={() => { setOpen(false); setSelectedItem(item); }} keywords={[item.name, item.type, item.rarity]}>
                    <div className="size-5 rounded shrink-0 opacity-70" style={{ background: item.gradient }} />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full" style={{ color: rc, backgroundColor: `${rc}15` }}>{item.rarity}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="border-t border-border px-3 py-2 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <span><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Ctrl K</kbd> to toggle</span>
            <span><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Esc</kbd> to close</span>
          </div>
        </Command>
      </CommandDialog>

      {selectedGame && (
        <GameDialog game={selectedGame} open={!!selectedGame} onOpenChange={(v) => { if (!v) setSelectedGame(null); }} />
      )}
      {selectedItem && (
        <ProductDialog item={selectedItem} open={!!selectedItem} onOpenChange={(v) => { if (!v) setSelectedItem(null); }} />
      )}
    </>
  );
}
