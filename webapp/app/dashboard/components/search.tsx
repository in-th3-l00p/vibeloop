"use client";

import { useEffect, useState, useMemo, useDeferredValue } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { CommandDialog, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ActionButton } from "./ui/action-button";
import { GameDialog } from "./game-dialog";
import { ProductDialog } from "./product-dialog";
import { PlayerDialog } from "./player-dialog";
import { useUserSearch } from "@/hooks/use-user-search";
import { useGames } from "@/hooks/use-games";
import { useMarketplace } from "@/hooks/use-marketplace";
import { rarityColors } from "../lib/constants";
import { getProfileCardById } from "../lib/theme-utils";
import type { Game, MarketplaceItem, Player } from "../types";
import type { Id } from "@/convex/_generated/dataModel";

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function Search() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; userId: Id<"users"> } | null>(null);

  const deferredQuery = useDeferredValue(inputValue);
  const { results: userResults, isLoading: searchLoading } = useUserSearch(deferredQuery);
  const { games } = useGames();
  const { items: marketplaceItems } = useMarketplace();

  const q = inputValue.trim().toLowerCase();

  const filteredGames = useMemo(
    () => q ? games.filter((g) => matchesQuery(g.name, q) || matchesQuery(g.tag, q)) : games,
    [q, games],
  );

  const filteredItems = useMemo(
    () => q ? marketplaceItems.filter((i) => matchesQuery(i.name, q) || matchesQuery(i.type, q) || matchesQuery(i.rarity, q)) : marketplaceItems,
    [q, marketplaceItems],
  );

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

  useEffect(() => {
    if (!open) setInputValue("");
  }, [open]);

  const hasResults = filteredGames.length > 0 || filteredItems.length > 0 || userResults.length > 0 || searchLoading;

  return (
    <>
      <ActionButton icon={Search01Icon} label="Search" onClick={() => setOpen(true)} />

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search games, players, and marketplace items">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search games, players, items..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList className="max-h-80">
            {!hasResults && q && <CommandEmpty>No results found.</CommandEmpty>}

            {filteredGames.length > 0 && (
              <CommandGroup heading="Games">
                {filteredGames.map((game) => (
                  <CommandItem key={game.name} onSelect={() => { setOpen(false); setSelectedGame(game); }}>
                    <span className="text-base leading-none">{game.emoji}</span>
                    <span className="flex-1">{game.name}</span>
                    <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full" style={{ color: game.accent, backgroundColor: `${game.accent}15` }}>{game.tag}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {q.length > 0 && (
              <CommandGroup heading="Players">
                {searchLoading ? (
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                      <span className="text-xs text-muted-foreground">Searching players...</span>
                    </div>
                  </div>
                ) : userResults.length === 0 ? (
                  <div className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">No players found</span>
                  </div>
                ) : (
                  <>
                    {userResults.map((user) => {
                      const pc = getProfileCardById(user.cardTheme);
                      return (
                        <CommandItem
                          key={user._id}
                          value={`player-${user._id}`}
                          onSelect={() => {
                            setOpen(false);
                            setSelectedPlayer({
                              player: {
                                name: user.username,
                                tag: user.tag,
                                accent: user.accent,
                                bio: user.bio,
                                status: "offline",
                                banner: user.banner,
                              },
                              userId: user._id,
                            });
                          }}
                        >
                          <div className="relative shrink-0">
                            <div className="size-5 rounded-full overflow-hidden" style={{ boxShadow: `0 0 0 1.5px ${pc.avatarRing}` }}>
                              {user.imageUrl ? (
                                <Image src={user.imageUrl} alt={user.username} width={20} height={20} className="object-cover rounded-full" />
                              ) : (
                                <div className="size-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: pc.nameBg, color: pc.nameColor }}>
                                  {user.fullName.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="flex-1" style={{ color: pc.nameColor }}>{user.username}</span>
                          <span className="text-[9px]" style={{ color: pc.tagColor }}>@{user.tag}</span>
                        </CommandItem>
                      );
                    })}
                  </>
                )}
              </CommandGroup>
            )}

            {filteredItems.length > 0 && (
              <CommandGroup heading="Marketplace">
                {filteredItems.map((item) => {
                  const rc = rarityColors[item.rarity];
                  return (
                    <CommandItem key={item.slug} onSelect={() => { setOpen(false); setSelectedItem(item); }}>
                      <div className="size-5 rounded shrink-0 opacity-70" style={{ background: item.gradient }} />
                      <span className="flex-1">{item.name}</span>
                      <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full" style={{ color: rc, backgroundColor: `${rc}15` }}>{item.rarity}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
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
      {selectedPlayer && (
        <PlayerDialog player={selectedPlayer.player} userId={selectedPlayer.userId} open={!!selectedPlayer} onOpenChange={(v) => { if (!v) setSelectedPlayer(null); }} />
      )}
    </>
  );
}
