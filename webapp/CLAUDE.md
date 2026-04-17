@AGENTS.md

# Vibeloop — Project Guide

## Stack

- **Next.js 16** (App Router, Turbopack) — read `node_modules/next/dist/docs/` before writing code
- **React 19** with Server Components by default, `"use client"` where needed
- **Tailwind CSS v4** with `@theme inline` in `globals.css` — utility classes resolve through CSS custom properties
- **shadcn/ui** (Radix primitives) — components in `components/ui/`, themed via CSS variables
- **Clerk** for auth — `@clerk/nextjs` v7, `ClerkProvider` in root layout
- **motion** (motion.dev) for animations — import from `motion/react`
- **Hugeicons** for icons — `@hugeicons/react` + `@hugeicons/core-free-icons`
- **pnpm** as package manager

## Commands

- `pnpm dev` — start dev server
- `pnpm build` or `npx next build` — production build (always run after changes to verify)
- `pnpm lint` — eslint

## Theming

The app uses shadcn's CSS variable theming system. **This is the single source of truth.**

- CSS variables are defined in `globals.css` under `:root` and `.dark` selectors using **oklch** color space
- The `@theme inline` block in `globals.css` maps `--variable` → `--color-variable` for Tailwind
- UI themes live in `app/dashboard/data/theme-presets.ts` as `CssVarTheme` objects — each is a complete set of shadcn CSS variables (`--background`, `--card`, `--border`, `--primary`, `--muted-foreground`, etc.)
- The shell (`dashboard-shell.tsx`) applies the active theme by setting CSS vars on `document.documentElement` via `useEffect` — this ensures portaled components (dialogs, sheets, commands) inherit the theme
- **Never hardcode colors** on shadcn surfaces — use semantic classes (`bg-card`, `text-muted-foreground`, `ring-border`, `bg-primary`, etc.)
- Profile card themes are a separate system (cosmetic items) with inline styles — see `ProfileCardTheme` type

### Adding a new UI theme

Add an entry to `uiThemes` in `data/theme-presets.ts`. Define all 18 CSS variables using oklch values. It will appear in settings automatically.

## Dashboard Architecture

```
app/dashboard/
├── page.tsx                    — Server entry (renders DashboardSections)
├── layout.tsx                  — Server layout (wraps all /dashboard/* routes in DashboardShell)
├── dashboard-context.tsx       — React context: settings state, user info, localStorage persistence
├── dashboard-shell.tsx         — Client provider: context + font context + CSS var application
├── dashboard-sections.tsx      — Client orchestrator: conditional section rendering
├── types.ts                    — All shared TypeScript interfaces
├── lib/
│   ├── constants.ts            — Shared constants (rarityColors)
│   └── theme-utils.ts          — getProfileCard, getActiveTheme, resolveWelcomeText
├── data/
│   ├── theme-presets.ts        — UI themes (CssVarTheme[]), profile card themes, title color presets
│   ├── mock-players.ts         — Player/friend/message data (single source for all components)
│   ├── mock-games.ts           — Game definitions + stats
│   └── mock-marketplace.ts     — Marketplace items
├── components/
│   ├── ui/                     — Shared dashboard UI primitives
│   │   ├── action-button.tsx   — Icon+label card button (used by quick actions)
│   │   ├── section-header.tsx  — Title + optional action link/button
│   │   ├── scroll-row.tsx      — Horizontal scroll container
│   │   ├── status-indicator.tsx— StatusDot + StatusLabel (unified for all statuses)
│   │   ├── settings-toggle.tsx — Label + Switch row
│   │   └── motion-primitives.tsx — motion.dev wrappers (FadeUp, PresenceBlock, etc.)
│   ├── search.tsx              — Command palette (Ctrl+K)
│   ├── stats.tsx               — Stats dialog
│   ├── settings.tsx            — Settings dialog (profile + appearance tabs)
│   ├── friends.tsx             — Friends sheet
│   ├── invite-dialog.tsx       — Lobby invite dialog
│   ├── player-dialog.tsx       — Player profile dialog
│   ├── game-card.tsx           — Game card (compact/default/large)
│   ├── game-dialog.tsx         — Game detail dialog
│   ├── item-card.tsx           — Marketplace item card (compact/default/large)
│   └── product-dialog.tsx      — Marketplace product dialog
├── sections/
│   ├── welcome.tsx             — Welcome title (uses font context)
│   ├── profile-card.tsx        — Profile card (uses profileCardTheme)
│   ├── quick-actions.tsx       — 4-button grid (Search, Stats, Settings, Friends)
│   ├── lobby.tsx               — Lobby section with player cards + chat sheet
│   ├── games.tsx               — Games scroll row
│   └── marketplace.tsx         — Marketplace scroll row
├── games/
│   └── page.tsx                — /dashboard/games — full games listing with filters
└── marketplace/
    └── page.tsx                — /dashboard/marketplace — full marketplace with filters
```

## Key Patterns

### No prop drilling for user data
User info (`username`, `fullName`, `imageUrl`, `firstName`) is in context. Access via `useDashboard().user`.

### Settings are in context + localStorage
`useDashboard().settings` returns `DashboardSettings`. Update with `update("key", value)`. Persisted under `vibeloop-dashboard` localStorage key.

### Dialog pattern (cards → dialogs)
Cards (`GameCard`, `ItemCard`) are pure visual buttons with an `onClick` prop. The **parent** manages selected state and renders a single dialog outside the scroll container. This avoids portal issues with `overflow` containers.

```tsx
const [selected, setSelected] = useState<Game | null>(null);
return (
  <>
    <ScrollRow>
      {games.map(g => <GameCard key={g.name} game={g} onClick={() => setSelected(g)} />)}
    </ScrollRow>
    {selected && <GameDialog game={selected} open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }} />}
  </>
);
```

### Portals and theming
Radix portals (Dialog, Sheet, Command) render on `document.body`. The shell applies CSS vars on `document.documentElement` so portaled content inherits the theme. Never use a wrapper `<div>` for CSS var overrides.

### Mock data is centralized
All mock data is in `data/`. Player names are shared across search, friends, and lobby from a single source. When replacing with real data, swap the imports in `data/` files.

### Animation
motion.dev (`motion/react`) is available. Shared primitives are in `components/ui/motion-primitives.tsx`. Use `motion.button`/`motion.div` for hover/tap feedback. Avoid spreading `React.ButtonHTMLAttributes` onto `motion.button` (causes `onDrag` type conflict) — pass specific props instead. Always respect `prefers-reduced-motion` (handled in `globals.css`).

## Adding a New Section

1. Create `sections/my-section.tsx` — client component, read settings from `useDashboard()`
2. Add mock data to `data/` if needed
3. Add to `dashboard-sections.tsx` orchestrator
4. If togglable, add a boolean to `DashboardSettings` in `types.ts` and defaults in `dashboard-context.tsx`

## Adding a New Dialog

1. Create `components/my-dialog.tsx` with `open` + `onOpenChange` props
2. Use shadcn `Dialog`/`DialogContent` — styling inherits from theme automatically
3. Wire it from the parent using the selected-state pattern above
4. If searchable, add an `onSelect` handler in `components/search.tsx`

## Fonts

- `Gelasio` — body font (`font-sans`)
- `Geist Mono` — monospace (`font-mono`)
- `Italianno` — handwritten/script (`font-script`), used for welcome title. Access class via `useFont()` from `dashboard-shell.tsx`
