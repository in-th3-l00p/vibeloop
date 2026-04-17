"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, UserIcon, PencilEdit01Icon, ColorsIcon, Tick02Icon, ArrowTurnBackwardIcon } from "@hugeicons/core-free-icons";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDashboard } from "../dashboard-context";
import { getProfileCard, resolveWelcomeText } from "../lib/theme-utils";
import { rarityColors } from "../lib/constants";
import { profileCardThemes, uiThemes, pageBgPresets, titleColorPresets } from "../data/theme-presets";
import { ActionButton } from "./ui/action-button";
import { SettingsToggle } from "./ui/settings-toggle";

export function Settings() {
  const { openUserProfile } = useClerk();
  const { settings, user, update, reset } = useDashboard();
  const pc = getProfileCard(settings);
  const [description, setDescription] = useState("No description yet.");
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftDesc, setDraftDesc] = useState(description);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ActionButton icon={Settings01Icon} label="Settings" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md !p-0 gap-0 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-white text-sm font-semibold">Settings</DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">Manage your profile and customize your dashboard</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="gap-0 min-h-0 flex flex-col flex-1">
          <TabsList variant="line" className="px-5 pt-3 w-full shrink-0">
            <TabsTrigger value="profile" className="gap-1.5 text-muted-foreground data-active:text-white">
              <HugeiconsIcon icon={UserIcon} size={14} />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-muted-foreground data-active:text-white">
              <HugeiconsIcon icon={ColorsIcon} size={14} />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="overflow-y-auto scrollbar-thin">
            <div className="px-5 pt-4 pb-5 space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] ring-1 ring-white/5 p-3">
                <div className="relative size-10 shrink-0 rounded-full overflow-hidden ring-2 ring-white/20">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt={user.fullName} className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-zinc-700 flex items-center justify-center text-sm font-bold">{user.fullName.charAt(0)}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                  <p className="text-[10px] text-zinc-500 truncate">@{user.username}</p>
                </div>
                <button
                  onClick={() => openUserProfile()}
                  className="cursor-pointer shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground ring-1 ring-border rounded-md px-2.5 py-1.5 bg-card transition-all duration-300 hover:text-white"
                >
                  Edit Profile
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Description</p>
                  {!editingDesc && (
                    <button onClick={() => { setDraftDesc(description); setEditingDesc(true); }} className="cursor-pointer text-zinc-500 hover:text-white transition-colors">
                      <HugeiconsIcon icon={PencilEdit01Icon} size={12} />
                    </button>
                  )}
                </div>
                {editingDesc ? (
                  <div className="space-y-2">
                    <textarea value={draftDesc} onChange={(e) => setDraftDesc(e.target.value.slice(0, 120))} rows={2} className="w-full rounded-lg bg-card ring-1 ring-border px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-white/20 resize-none" placeholder="Tell people about yourself..." autoFocus />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600">{draftDesc.length}/120</span>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingDesc(false)} className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-500 px-2.5 py-1 rounded-md hover:text-white transition-colors">Cancel</button>
                        <button onClick={() => { setDescription(draftDesc || "No description yet."); setEditingDesc(false); }} className="cursor-pointer text-[10px] uppercase tracking-wider text-white bg-white/10 ring-1 ring-border px-2.5 py-1 rounded-md hover:bg-white/15 transition-colors">Save</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground rounded-lg bg-white/[0.03] ring-1 ring-white/5 px-3 py-2.5">{description}</p>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Card Theme</p>
                <p className="text-[10px] text-zinc-600 mb-3">Choose how your profile card looks to everyone</p>
                <div className="space-y-2">
                  {profileCardThemes.map((theme) => {
                    const active = settings.profileCardTheme === theme.id;
                    const rc = rarityColors[theme.rarity];
                    return (
                      <button
                        key={theme.id}
                        onClick={() => update("profileCardTheme", theme.id)}
                        className={`cursor-pointer w-full rounded-xl overflow-hidden transition-all duration-200 ring-1 text-left ${active ? "ring-white/30" : "ring-white/5 hover:ring-white/15"}`}
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5" style={{ backgroundColor: theme.nameBg, borderBottom: `1px solid ${theme.borderColor}` }}>
                          <div className="size-7 rounded-full shrink-0 bg-zinc-700 flex items-center justify-center text-[10px] font-bold" style={{ outline: `2px solid ${theme.avatarRing}`, color: theme.nameColor }}>{user.fullName.charAt(0)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate" style={{ color: theme.nameColor }}>{user.fullName}</p>
                            <p className="text-[9px] truncate" style={{ color: theme.tagColor }}>@{user.username}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-bold" style={{ color: theme.statColor }}>0.00</p>
                            <p className="text-[8px] uppercase" style={{ color: theme.labelColor }}>$VIBE</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-zinc-300">{theme.name}</span>
                            <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full" style={{ color: rc, backgroundColor: `${rc}15` }}>{theme.rarity}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {theme.price > 0 && <span className="text-[9px] text-zinc-500">{theme.price} $VIBE</span>}
                            {active && <HugeiconsIcon icon={Tick02Icon} size={12} className="text-white" strokeWidth={2} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="overflow-y-auto scrollbar-thin">
            <div className="px-5 pt-4 pb-5 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Welcome Title</p>
                <p className="text-[10px] text-zinc-600 mb-3">Use {"{{first_name}}"} or {"{{username}}"} as variables</p>
                <input
                  type="text"
                  value={settings.welcomeText}
                  onChange={(e) => update("welcomeText", e.target.value)}
                  className="w-full rounded-lg bg-card ring-1 ring-border px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-white/20 mb-2"
                  placeholder="Welcome, {{first_name}}"
                />
                <p className="text-[10px] text-zinc-600 mb-2">Preview: <span className="text-muted-foreground">{resolveWelcomeText(settings.welcomeText, { firstName: user.firstName, username: user.username })}</span></p>

                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Title Color</p>
                <div className="flex flex-wrap gap-2">
                  {titleColorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => update("titleColor", preset.value)}
                      className="cursor-pointer relative size-7 rounded-full transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: preset.value,
                        outline: settings.titleColor === preset.value ? `2px solid ${preset.value}` : `1px solid rgba(255,255,255,0.1)`,
                        outlineOffset: settings.titleColor === preset.value ? "2px" : "0",
                        boxShadow: settings.titleColor === preset.value ? `0 0 10px ${preset.value}60` : undefined,
                      }}
                      title={preset.name}
                    >
                      {settings.titleColor === preset.value && (
                        <HugeiconsIcon icon={Tick02Icon} size={10} className="absolute inset-0 m-auto drop-shadow-md" strokeWidth={3} style={{ color: preset.value === "#ffffff" ? "#000" : "#fff" }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Page Background</p>
                <p className="text-[10px] text-zinc-600 mb-3">Set the background color of the dashboard</p>
                <div className="flex flex-wrap gap-2">
                  {pageBgPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => update("pageBg", preset.value)}
                      className={`cursor-pointer flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 ring-1 ${settings.pageBg === preset.value ? "ring-white/30 bg-white/[0.05]" : "ring-white/5 bg-white/[0.02] hover:bg-white/[0.04]"}`}
                    >
                      <div className="size-5 rounded shrink-0 ring-1 ring-border" style={{ backgroundColor: preset.value }} />
                      <span className="text-[10px] text-zinc-300">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">UI Components</p>
                <p className="text-[10px] text-zinc-600 mb-3">Theme for cards, buttons, and panels</p>
                <div className="space-y-1.5">
                  {uiThemes.map((theme, i) => (
                    <button
                      key={theme.name}
                      onClick={() => update("uiTheme", i)}
                      className={`cursor-pointer w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ring-1 ${settings.uiTheme === i ? "ring-white/20 bg-white/[0.05]" : "ring-white/5 bg-white/[0.02] hover:bg-white/[0.04]"}`}
                    >
                      <div className="size-8 rounded-md shrink-0" style={{ backgroundColor: theme.cardBg, boxShadow: `inset 0 0 0 1px ${theme.cardRing}` }} />
                      <span className="text-xs font-medium text-zinc-300 flex-1 text-left">{theme.name}</span>
                      {settings.uiTheme === i && <HugeiconsIcon icon={Tick02Icon} size={14} className="text-white shrink-0" strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2.5">Effects</p>
                <div className="space-y-1">
                  <SettingsToggle label="Glow Effects" description="Neon glows on text, borders, and shadows" checked={settings.glowEffects} onCheckedChange={(v) => update("glowEffects", v)} />
                  <SettingsToggle label="Compact Mode" description="Reduce card sizes and spacing" checked={settings.compactMode} onCheckedChange={(v) => update("compactMode", v)} />
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2.5">Sections</p>
                <div className="space-y-1">
                  {([
                    { key: "showWelcome" as const, label: "Welcome Title" },
                    { key: "showLobby" as const, label: "Lobby" },
                    { key: "showGames" as const, label: "Games" },
                    { key: "showMarketplace" as const, label: "Marketplace" },
                  ]).map((s) => (
                    <SettingsToggle key={s.key} label={s.label} checked={settings[s.key]} onCheckedChange={(v) => update(s.key, v)} />
                  ))}
                </div>
              </div>

              <button
                onClick={reset}
                className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg ring-1 ring-border px-3 py-2.5 text-muted-foreground transition-all duration-300 hover:text-white hover:bg-white/[0.03]"
              >
                <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={14} />
                <span className="text-[11px] uppercase tracking-wider font-medium">Reset to Defaults</span>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
