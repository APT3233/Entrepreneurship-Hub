# Phase 1 — Foundation (27 commits, 5 branches)

Everything else depends on this phase. Build and merge it first. Tokens + shared presentational
components are global; the sidebar/header/modals are shared by all 4 portals.

Back to [overview](00-overview.md).

---

## Branch `mem/quynh/design-tokens` — 7 commits

All tokens centralized in `src/index.css` (Tailwind v4 — use `@theme { ... }` so tokens become
utilities, plus plain `:root` CSS variables where needed). **No hardcoded colors in components.**

| # | Commit message | Change |
|---|---|---|
| 1 | `[tokens] add neutral color palette` | `--bg-page #FAFAF9`, `--bg-surface #FFFFFF`, `--bg-subtle #F5F5F4`, `--border #E7E5E4`, `--border-strong #D6D3D1`, `--text-primary #1C1917`, `--text-secondary #57534E`, `--text-muted #A8A29E`. Set `body` bg → `--bg-page`, text → `--text-primary`. |
| 2 | `[tokens] add FPT accent tokens` | `--accent #F37021` (placeholder — confirm hex, spec §9), `--accent-hover` (1 stop darker), `--accent-bg` (~8% opacity). |
| 3 | `[tokens] add status color pairs` | success `#ECFDF5`/`#065F46`, warning `#FFFBEB`/`#92400E`, danger `#FEF2F2`/`#991B1B`, neutral `#F5F5F4`/`#57534E`. |
| 4 | `[tokens] typography scale + two weights` | Scale 22/18/16/14/13/12; base line-height 1.5 body / 1.3 heading. Keep Inter (already loaded, spec allows Inter). Establish that only weights **400 & 500** are used. |
| 5 | `[tokens] spacing, radius, container` | Spacing 4/8/12/16/24/32; radius `--radius-control 8px`, `--radius-card 12px`; `--content-max 1280px` (centered container utility). |
| 6 | `[tokens] remove gradients and shadows globally` | Strip gradient/`box-shadow` from base/global styles. Keep only focus ring. (Per-screen shadow removal happens in later phases.) |
| 7 | `[tokens] focus ring + reduced motion` | Global `:focus-visible` accent ring utility (never bare `outline: none`); `@media (prefers-reduced-motion: reduce)` disables the `navProgressSlide`/`pageFadeIn` animations already in `index.css`. |

**Verify:** app boots, `body` background is warm off-white, no console errors, `npm run lint` clean.

---

## Branch `mem/quynh/ui-primitives` — 8 commits

New presentational ("dumb") components — props → markup, no fetch/compute/state beyond hover/open.
Location: `src/components/ui/`. Each commit = one component + a short usage example in the file.

| # | Commit message | Component |
|---|---|---|
| 1 | `[ui] add PageHeader` | `components/ui/PageHeader.jsx` — `{ title, description?, actions? }`. h1 22px/500, description 14px secondary, actions right-aligned (wrap on mobile). |
| 2 | `[ui] add EmptyState` | `components/ui/EmptyState.jsx` — `{ icon, title, description, action? }`. Centered, muted text ≥ AA contrast, optional button. |
| 3 | `[ui] add StatusBadge` | `components/ui/StatusBadge.jsx` — `{ status: 'success'\|'warning'\|'danger'\|'neutral', label }`. Color from status token; **caller decides which status** — component never derives it. 12px, sentence case. |
| 4 | `[ui] refactor StatCard to calm style` | Rework `components/ui/Card/StatCard.jsx`: bg `--bg-subtle`, **no border/shadow, no colored icon**. Label 13px secondary on top, value 24px/500 below. Keep `AnimatedNumber`. **Keep `title`/`value` API; keep accepting `icon`/`iconBg`/`iconColor` props but stop rendering them** so existing call sites across portals don't break. |
| 5 | `[ui] add Banner` | `components/ui/Banner.jsx` — `{ variant: 'warning'\|'info', icon?, children }`. Full-width status-tinted strip, 1px border, icon left. |
| 6 | `[ui] add Button variants` | `components/ui/Button/Button.jsx` — `variant: 'accent'\|'ghost'`, sizes 36px (desktop) / 44px (mobile touch). Accent = `--accent` bg; ghost = transparent + border. (Existing `GoogleButton.jsx` stays.) |
| 7 | `[ui] add Card surface` | `components/ui/Card/Card.jsx` — white `--bg-surface`, 1px `--border`, 12px radius, no shadow. Slot children. |
| 8 | `[ui] add Select control base` | `components/ui/filter/Select.jsx` (or restyle existing `DropDown.jsx`) — 36/44px height, token border/radius, focus ring. Presentational shell only; keep any existing option logic untouched. |

**Verify:** render each in an isolated route or the existing StatCard demo; confirm styling only, no data behavior.

---

## Branch `mem/quynh/sidebar` — 6 commits

File: `src/components/layout/AppSidebar.jsx`. Icons: `layouts/student/index.jsx:36,38` currently uses
`Handshake` for **both** Mentoring and Opportunities.

> **⚠ Confirm before commit 1:** the sidebar currently persists collapse via `localStorage("sidebar_pinned")`
> + `pinned`/`hovered` state. Spec §4.6 says replace this with a **single pure-CSS breakpoint default**
> and §8.6 defers real persistence. This is the one sanctioned removal of existing UI state. If treating
> this as "logic" is a concern, stop and confirm before doing commit 1.

| # | Commit message | Change |
|---|---|---|
| 1 | `[sidebar] single CSS breakpoint state` | Replace pin/hover toggle with CSS: expanded ≥1280px, collapsed below, off-canvas on mobile. Remove `pinned`/`localStorage`/`hovered`. Keep nav item rendering + `isNavItemActive` logic intact. |
| 2 | `[sidebar] token restyle` | Border/`--bg-surface`, active item uses `--accent` + `--accent-bg`, remove shadows. |
| 3 | `[sidebar] tooltips when collapsed` | Every icon gets a title/tooltip in collapsed state. |
| 4 | `[sidebar] distinct Mentoring/Opportunities icons` | Change one icon (e.g. Mentoring → `CalendarClock`/`GraduationCap`, Opportunities → `Star`/`Megaphone`). Update `layouts/student/index.jsx` icon imports only. |
| 5 | `[sidebar] tooltip on disabled items` | "Trạng thái" / "Lịch dạy" keep `disabled`; add explanatory tooltip. Do not hide (hiding = condition change). |
| 6 | `[sidebar] mobile off-canvas + touch targets` | Off-canvas transition, backdrop, ≥44px touch targets. |

**Verify:** at 1280 / 768 / 390px the sidebar has exactly one default state per breakpoint; nav still routes; disabled items still disabled.

---

## Branch `mem/quynh/app-header` — 3 commits

File: `src/components/layout/AppHeader.jsx` (+ `components/layout/LanguageSwitcher.jsx`).

| # | Commit message | Change |
|---|---|---|
| 1 | `[header] token restyle` | Border/surface/text tokens, remove shadow, avatar + name spacing per scale. |
| 2 | `[header] language label to full name` | In `LanguageSwitcher`, change display label "VN VI" → "Tiếng Việt". **Keep the switch mechanism/handler unchanged** — string only. |
| 3 | `[header] responsive spacing + touch targets` | ≥44px targets, tidy wrap on mobile. |

**Verify:** header renders on all portals; language toggle still switches locale; profile/logout still work.

---

## Branch `mem/quynh/modals` — 3 commits

| # | Commit message | Change |
|---|---|---|
| 1 | `[modal] restyle ConfirmModal` | `components/modal/ConfirmModal.jsx` — 1px border over shadow, 12px radius, accent primary button, token colors. Keep props/behavior (`color` prop still accepted). |
| 2 | `[modal] restyle auth modals` | `components/modal/auth/*` — token restyle only. |
| 3 | `[modal] restyle common modals` | `components/modal/common/*` — token restyle only. |

**Verify:** open logout confirm from a portal layout; open one auth + one common modal; behavior unchanged, styling calm.

---

## Phase 1 done when

- All 5 branches PR'd and merged into the integration branch `mem/quynh/redesign-ui` (not `main`).
- Tokens exist centrally; primitives importable; sidebar/header/modals use tokens.
- `npm run lint` clean; app compiles at every commit; no gradients/shadows (except focus ring) on shared shell.
- **27 commits** recorded.

Next: [Phase 2 — Auth](02-auth.md).
