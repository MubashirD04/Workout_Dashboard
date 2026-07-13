# UI Redesign Guide

Reference for anyone (human or AI) restyling the Fitness Dashboard frontend.
Covers where every visual token lives, what's centralized vs. scattered, and
a recommended order of operations for a full visual pass.

---

## 1. Where the shared tokens live

Everything starts in **`client/src/index.css`**, inside the `@theme` block.
Tailwind v4 reads this block and generates utility classes from it — so
editing a value here changes every usage of the matching utility across the
whole app.

```css
@theme {
  --color-primary: #f97316;
  --color-primary-hover: #ea580c;
  --color-primary-glow: rgba(249, 115, 22, 0.5);

  --color-slate-850: #1e293b;
  --color-slate-900: #0f172a;
  --color-slate-950: #020617;

  --color-surface: rgba(30, 41, 59, 0.7);
  --color-surface-light: rgba(51, 65, 85, 0.7);

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --shadow-glow-sm: 0 0 8px rgba(249, 115, 22, 0.35);
  --shadow-glow: 0 0 15px rgba(249, 115, 22, 0.3);
  --shadow-glow-lg: 0 0 30px rgba(249, 115, 22, 0.4);
}
```

Below the `@theme` block, `@layer utilities` defines the app's signature
classes: `.glass-card`, `.glass-card-hover`, `.text-glow`. These are used
almost everywhere (cards, charts, sidebar, topbar), so they're the highest-
leverage place to make a change land app-wide.

---

## 2. Border radius

**There is no `--radius` token today.** Radius is set per-utility-class,
scattered across files, using Tailwind's default scale
(`rounded-sm` → `rounded-3xl`, `rounded-full`).

| Source | Class used | What it controls |
|---|---|---|
| `index.css` → `.glass-card` | `rounded-2xl` | Every card, chart panel, the sidebar, and the topbar |
| `components/ui/Button.tsx` | `rounded-md` (sm) / `rounded-lg` (md) / `rounded-xl` (lg) | All buttons, per size |
| `components/ui/Input.tsx` | `rounded-lg` | All form inputs |
| Page files (`WorkoutLog.tsx`, `CardioTracker.tsx`, `NutritionTracker.tsx`, `ProgressPhotos.tsx`, `ConsistencyHeatmap.tsx`) | inline `rounded-xl`, `rounded-lg`, `rounded-full`, `rounded-sm` | One-off buttons, pills, dropdown menus, heatmap cells |

### Option A — fastest, biggest impact
Change `.glass-card`'s `rounded-2xl` to something smaller (`rounded-lg`,
`rounded-xl`). Since nearly every panel in the app uses this class, this
alone tightens most of the UI in one edit.

### Option B — proper global fix
Redefine Tailwind's own radius scale inside `@theme`, so every `rounded-*`
utility app-wide (not just `.glass-card`) shrinks together:

```css
@theme {
  /* ...existing tokens... */
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.25rem;
}
```

This is the closest thing to a single "radius knob" — do this if you want
buttons, inputs, and cards to all shrink in proportion without editing each
component.

### Known bypasses — things Option A/B will *not* fix

- **`FloatingChat.tsx`** doesn't use Tailwind for its shell — it's styled
  with inline `style={{ borderRadius: '1rem' }}` (and `'50%'`, `'0.5rem'`)
  throughout. Any radius change there has to be edited by hand in that file.
- **Recharts internals** — bar corners (`WorkoutMaxWeightChart.tsx`'s
  `<Bar radius={[0, 4, 4, 0]} />`) and pie geometry
  (`MacroDonutChart.tsx`'s `innerRadius`/`outerRadius`) are chart-library
  props, not CSS. They live in each chart component and need separate edits.
- **`Input.tsx` overrides may silently lose.** Several pages pass a second
  radius class via `className`, e.g. `NutritionTracker.tsx`:
  `className="text-2xl font-bold rounded-xl px-4 py-3 ..."` on top of
  `Input.tsx`'s own base `rounded-lg`. Both are single classes with equal
  CSS specificity, so which one wins depends on Tailwind's generated
  stylesheet order, not the order they appear in your JSX — it's not
  reliable. If you need a specific input's radius to differ from the
  global default, either edit `Input.tsx` directly or force it with
  `!rounded-md`.

---

## 3. Color

- **Brand/accent color**: `--color-primary` and `--color-primary-hover` in
  `index.css`. Changing these updates `Button.tsx`'s primary variant, all
  `text-primary`/`bg-primary`/`border-primary` usage, and `.text-glow`.
- **Dark background scale**: `--color-slate-850/900/950` plus Tailwind's
  built-in slate scale (`slate-800`, `slate-400`, etc., used directly in
  many components without a custom token).
- **Bypasses**: the recharts-based components (`VolumeLineChart.tsx`,
  `AthleteRadarChart.tsx`, `CardioProgressChart.tsx`,
  `WorkoutMaxWeightChart.tsx`, `MacroDonutChart.tsx`) hardcode hex colors
  directly in chart props (`stroke="#F97316"`, `fill="#60A5FA"`, gradient
  `stopColor`s, tooltip `contentStyle` backgrounds like `#0f172a`). These
  don't read from `@theme` at all — a full recolor means editing each chart
  file individually. `FloatingChat.tsx` also hardcodes its gradient
  (`linear-gradient(135deg, #f97316, #ea580c)`) inline rather than
  referencing `--color-primary`.

---

## 4. Typography

`--font-sans` in `index.css` sets the app-wide font (currently "Inter",
loaded as a system/generic fallback stack — there's no `<link>` or
`@font-face` actually importing Inter, so confirm it's available or add a
web font import if you change this). Font sizes and weights are set
per-element with Tailwind utilities (`text-xl font-bold`, `text-[10px]
font-bold uppercase tracking-widest` for the small eyebrow labels used
throughout, etc.) — there's no type-scale token system, so a font-size
pass means touching each component.

---

## 5. Shadows / glow

`--shadow-glow-sm`, `--shadow-glow`, `--shadow-glow-lg` in `index.css`
control the orange glow used on the active sidebar item, primary buttons,
and hover states. All three are derived from the same
`rgba(249, 115, 22, ...)` — if you change `--color-primary`, update these
to match or the glow will look mismatched against the new brand color.

---

## 6. Component-level style locations

| Component | File | Owns |
|---|---|---|
| Cards | `components/ui/Card.tsx` | Just wires `className` onto `.glass-card` — no independent styling |
| Buttons | `components/ui/Button.tsx` | `variants` (primary/secondary/danger/ghost) and `sizes` objects — edit here to change all buttons of a given kind at once |
| Inputs | `components/ui/Input.tsx` | Base input styling, label styling |
| Sidebar + topbar | `components/DashboardLayout.tsx` | Nav active/inactive states, breadcrumb pattern, brand mark |
| Floating chat | `components/FloatingChat.tsx` | Fully inline-styled, separate from the rest of the design system (see bypass note above) |

Page-level files (`pages/WorkoutLog.tsx`, `pages/CardioTracker.tsx`, etc.)
mix `Card`/`Button`/`Input` with a lot of one-off `className` styling
(pills, dropdowns, stat rows) rather than pulling from shared components —
worth knowing before assuming a design-system change will reach everything.

---

## 7. Recommended order for a full redesign

1. **Tokens first**: lock in color, radius, and shadow values in
   `index.css`'s `@theme` block. This is the cheapest lever and affects the
   most surface area.
2. **Shared components second**: `Card.tsx`, `Button.tsx`, `Input.tsx`,
   `DashboardLayout.tsx`. These are reused everywhere, so fixing them
   propagates the new look broadly.
3. **Bypasses third**: `FloatingChat.tsx` inline styles and the recharts
   color/radius props in each chart file — these need manual edits no
   matter what you change in step 1.
4. **Page sweeps last**: go page by page (`WorkoutLog`, `CardioTracker`,
   `BodyMetrics`, `NutritionTracker`, `ProgressPhotos`, `Admin/AdminPanel`,
   `Trainer/ClientsView`) for one-off `className` styling that doesn't
   route through the shared components — pills, dropdown menus, table
   rows, stat cards.

---

## 8. Quick checklist for a radius-only pass

- [ ] Decide: single global override (`--radius-*` in `@theme`) vs. just
      `.glass-card`'s `rounded-2xl`
- [ ] `Button.tsx` — sizes object, three radius values
- [ ] `Input.tsx` — base `rounded-lg`
- [ ] `FloatingChat.tsx` — inline `borderRadius` values (bypasses Tailwind entirely)
- [ ] Chart components — `Bar radius`, `Pie innerRadius/outerRadius` if you want the charts themselves to match
- [ ] Spot-check pages with inline radius overrides on `Input` (e.g. `NutritionTracker.tsx`, `BodyMetrics.tsx`, `CardioTracker.tsx`) since cascade order isn't guaranteed
