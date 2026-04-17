"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings01Icon,
  UserIcon,
  PencilEdit01Icon,
  ColorsIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const accentPresets = [
  { name: "Purple", value: "#a855f7" },
  { name: "Cyan", value: "#22d3ee" },
  { name: "Orange", value: "#f97316" },
  { name: "Emerald", value: "#34d399" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#fbbf24" },
  { name: "Sky", value: "#38bdf8" },
  { name: "Lavender", value: "#a78bfa" },
];

const cardThemes = [
  { name: "Default", bg: "#18181b", ring: "rgba(255,255,255,0.1)" },
  { name: "Midnight", bg: "#0f172a", ring: "rgba(59,130,246,0.2)" },
  { name: "Ember", bg: "#1c1412", ring: "rgba(249,115,22,0.2)" },
  { name: "Forest", bg: "#0f1a14", ring: "rgba(52,211,153,0.2)" },
  { name: "Void", bg: "#09090b", ring: "rgba(255,255,255,0.05)" },
];

export function Settings({
  username,
  fullName,
  imageUrl,
}: {
  username: string;
  fullName: string;
  imageUrl: string;
}) {
  const { openUserProfile } = useClerk();
  const [description, setDescription] = useState("No description yet.");
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftDesc, setDraftDesc] = useState(description);
  const [accent, setAccent] = useState("#a855f7");
  const [cardTheme, setCardTheme] = useState(0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="cursor-pointer flex flex-col items-center gap-2 rounded-lg bg-zinc-900/80 ring-1 ring-white/10 py-4 text-zinc-400 shadow-[0_0_12px_rgba(255,255,255,0.04)] transition-all duration-300 hover:bg-zinc-800/80 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.12)]">
          <HugeiconsIcon icon={Settings01Icon} size={22} />
          <span className="text-[11px] uppercase tracking-wider">Settings</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 text-white ring-white/10 sm:max-w-md !p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-white text-sm font-semibold">Settings</DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Manage your profile and customize your dashboard
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="gap-0">
          <TabsList variant="line" className="px-5 pt-3 w-full">
            <TabsTrigger value="profile" className="gap-1.5 text-zinc-400 data-active:text-white">
              <HugeiconsIcon icon={UserIcon} size={14} />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-zinc-400 data-active:text-white">
              <HugeiconsIcon icon={ColorsIcon} size={14} />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="px-5 pt-4 pb-5 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] ring-1 ring-white/5 p-3">
                <div className="relative size-10 shrink-0 rounded-full overflow-hidden ring-2 ring-white/20">
                  {imageUrl ? (
                    <img src={imageUrl} alt={fullName} className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-zinc-700 flex items-center justify-center text-sm font-bold">
                      {fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{fullName}</p>
                  <p className="text-[10px] text-zinc-500 truncate">@{username}</p>
                </div>
                <button
                  onClick={() => openUserProfile()}
                  className="cursor-pointer shrink-0 text-[10px] uppercase tracking-wider text-zinc-400 ring-1 ring-white/10 rounded-md px-2.5 py-1.5 bg-zinc-900/80 shadow-[0_0_8px_rgba(255,255,255,0.04)] transition-all duration-300 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.12)]"
                >
                  Edit Profile
                </button>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Description</p>
                  {!editingDesc && (
                    <button
                      onClick={() => {
                        setDraftDesc(description);
                        setEditingDesc(true);
                      }}
                      className="cursor-pointer text-zinc-500 hover:text-white transition-colors"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} size={12} />
                    </button>
                  )}
                </div>
                {editingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      value={draftDesc}
                      onChange={(e) => setDraftDesc(e.target.value.slice(0, 120))}
                      rows={2}
                      className="w-full rounded-lg bg-zinc-900/80 ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-white/20 shadow-[0_0_8px_rgba(255,255,255,0.02)] transition-shadow duration-300 focus:shadow-[0_0_15px_rgba(255,255,255,0.08)] resize-none"
                      placeholder="Tell people about yourself..."
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600">{draftDesc.length}/120</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingDesc(false)}
                          className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-500 px-2.5 py-1 rounded-md hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setDescription(draftDesc || "No description yet.");
                            setEditingDesc(false);
                          }}
                          className="cursor-pointer text-[10px] uppercase tracking-wider text-white bg-white/10 ring-1 ring-white/10 px-2.5 py-1 rounded-md hover:bg-white/15 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 rounded-lg bg-white/[0.03] ring-1 ring-white/5 px-3 py-2.5">
                    {description}
                  </p>
                )}
              </div>

              {/* General Info */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">General</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Member Since", value: "April 2026" },
                    { label: "Games Played", value: "0" },
                    { label: "Rank", value: "Unranked" },
                    { label: "$VIBE Balance", value: "0.00" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-lg bg-white/[0.03] ring-1 ring-white/5 px-3 py-2"
                    >
                      <span className="text-[11px] text-zinc-500">{row.label}</span>
                      <span className="text-xs font-medium text-zinc-300">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="px-5 pt-4 pb-5 space-y-4">
              {/* Accent Color */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2.5">Accent Color</p>
                <div className="flex flex-wrap gap-2">
                  {accentPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setAccent(preset.value)}
                      className="cursor-pointer relative size-8 rounded-full transition-all duration-200 ring-1 ring-white/10 hover:scale-110"
                      style={{
                        backgroundColor: preset.value,
                        boxShadow: accent === preset.value ? `0 0 12px ${preset.value}80` : undefined,
                        outline: accent === preset.value ? `2px solid ${preset.value}` : undefined,
                        outlineOffset: "2px",
                      }}
                      title={preset.name}
                    >
                      {accent === preset.value && (
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          size={14}
                          className="absolute inset-0 m-auto text-white drop-shadow-md"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Theme */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2.5">Card Theme</p>
                <div className="space-y-1.5">
                  {cardThemes.map((theme, i) => (
                    <button
                      key={theme.name}
                      onClick={() => setCardTheme(i)}
                      className={`cursor-pointer w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ring-1 ${
                        cardTheme === i
                          ? "ring-white/20 bg-white/[0.05]"
                          : "ring-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div
                        className="size-8 rounded-md shrink-0"
                        style={{
                          backgroundColor: theme.bg,
                          boxShadow: `inset 0 0 0 1px ${theme.ring}`,
                        }}
                      />
                      <span className="text-xs font-medium text-zinc-300 flex-1 text-left">
                        {theme.name}
                      </span>
                      {cardTheme === i && (
                        <HugeiconsIcon icon={Tick02Icon} size={14} className="text-white shrink-0" strokeWidth={2} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2.5">Preview</p>
                <div
                  className="rounded-xl p-3 ring-1 transition-all duration-300"
                  style={{
                    backgroundColor: cardThemes[cardTheme].bg,
                    boxShadow: `0 0 15px ${accent}15`,
                    outlineColor: cardThemes[cardTheme].ring,
                    borderColor: cardThemes[cardTheme].ring,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-full overflow-hidden"
                      style={{ outline: `2px solid ${accent}`, outlineOffset: "1px" }}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt={fullName} className="size-full object-cover" />
                      ) : (
                        <div
                          className="size-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: `${accent}30`, color: accent }}
                        >
                          {fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-bold truncate"
                        style={{ color: accent, textShadow: `0 0 8px ${accent}60` }}
                      >
                        {fullName}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">@{username}</p>
                    </div>
                    <div
                      className="text-xs font-bold"
                      style={{ color: accent }}
                    >
                      0.00
                      <span className="text-[9px] text-zinc-600 ml-1">$VIBE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
