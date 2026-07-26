# E-HUB Client — UI Redesign Plan (Overview)

Redesign the `ehub-client` UI to the **"calm dashboard"** direction defined in
[`ehub-ui-redesign-spec.md`](../ehub-ui-redesign-spec.md), delivered as **~98 genuine atomic commits**
organized into small review branches.

## Goals

1. Replace the current "SaaS gradient" look (inline Tailwind defaults, gradients, shadows) with a
   token-driven neutral UI: one FPT-orange accent used sparingly, thin borders instead of shadows,
   two font weights (400/500), no gradients.
2. Apply the system consistently across all **4 portals**: admin / lecture / mentor / student.
3. Produce **~98 atomic commits** across **28 review branches** — each screen/change reviewable on its own.

## Hard constraints (UI only — no logic changes)

From the spec. **Do not violate.**

| Allowed | Not allowed |
|---|---|
| CSS / classes / tokens | API calls, queries, data derivation |
| Markup structure & element order | Display conditions, state, routing |
| Display strings (labels/titles) | Auth, permissions |
| New **presentational** components (props → markup) | Schema, models, migrations |

If a UI task appears to require a logic change → **stop and report**. Known-deferred items are in spec §8
(see [bottom of this file](#deferred--not-in-this-pass)).

## Reuse existing code

- `src/components/ui/Card/StatCard.jsx` — refactor, don't recreate.
- `src/components/layout/AppHeader.jsx`, `src/components/layout/AppSidebar.jsx`.
- `src/components/modal/ConfirmModal.jsx`.
- Tokens live centrally in `src/index.css` (Tailwind v4 `@theme` / CSS variables) — no hardcoded colors in components.

## Branch & commit conventions

- **Integration branch: `mem/quynh/redesign-ui`** (created off `main`). It is the **base branch** for
  every phase branch and collects all 28 phase branches. It is *not* merged to `main` until the very end.
- Phase branch names: **`mem/quynh/<screen-or-change>`**, each **branched off `mem/quynh/redesign-ui`**
  (not `main`) and **PR'd back into `mem/quynh/redesign-ui`**.
- One **atomic** commit per logical change; **app compiles after every commit**.
- Foundation branches first (later work depends on tokens/components). After merging a phase branch,
  pull `redesign-ui` before branching the next one, so dependencies are present.
- Nothing pushed without explicit confirmation. Author = current git config.

Step 0 (once, before Phase 1):
```
git switch main && git pull
git switch -c mem/quynh/redesign-ui       # integration branch
git push -u origin mem/quynh/redesign-ui  # only after confirmation
```

Per phase-branch loop:
```
git switch mem/quynh/redesign-ui && git pull   # latest integration state
git switch -c mem/quynh/<name>                 # branch off integration, NOT main
# ... atomic commits ...
npm run lint                                   # clean
git push -u origin mem/quynh/<name>            # only after confirmation
gh pr create --base mem/quynh/redesign-ui --head mem/quynh/<name>   # PR into integration branch
```

## Phases & commit budget

| Phase | File | Branches | Commits |
|---|---|---|---|
| 1. Foundation | [`01-foundation.md`](01-foundation.md) | design-tokens, ui-primitives, sidebar, app-header, modals | 27 |
| 2. Auth | [`02-auth.md`](02-auth.md) | login | 5 |
| 3. Student | [`03-student.md`](03-student.md) | dashboard, groups, assignments, mentoring, startup, opportunities, i18n | 29 |
| 4. Lecture | [`04-lecture.md`](04-lecture.md) | dashboard, classes, assignments, grading, groups, analytics-schedule | 13 |
| 5. Mentor | [`05-mentor.md`](05-mentor.md) | **gộp chung nhánh `mentor-admin`** | — |
| 6. Admin | [`06-admin.md`](06-admin.md) | **gộp chung nhánh `mentor-admin`** | — |
| 7. Integration | [below](#integration--final-pr-phase-7) | `redesign-ui` (base) → final PR to `main` | 0 (merges only) |

> **Cập nhật cách làm (Phase 5 + 6):** gộp vào **một nhánh duy nhất `mem/quynh/mentor-admin`**
> (tách off `redesign-ui`) thay cho 11 nhánh nhỏ. Vẫn commit atomic theo từng màn hình.

Granularity is genuinely atomic, not padded.

## Integration & final PR (Phase 7)

All work flows through `mem/quynh/redesign-ui`; `main` only sees the change once, at the end.

```
mem/quynh/design-tokens ─┐
mem/quynh/ui-primitives ─┤
mem/quynh/sidebar ───────┤   PR (--base redesign-ui)
...  (all 28 branches)   ├────────────────────────────►  mem/quynh/redesign-ui  ──PR──►  main
mem/quynh/admin-*  ──────┘                                                        (final)
```

1. Each of the 28 phase branches → its own PR into `mem/quynh/redesign-ui` (review per screen), merged in order.
2. After all 6 phases are merged into `redesign-ui`, run the full [verification](#verification-every-branch-before-push) on the whole branch.
3. Open **one final PR: `mem/quynh/redesign-ui → main`** containing the entire redesign (~99 commits):
   ```
   git switch mem/quynh/redesign-ui && git pull
   gh pr create --base main --head mem/quynh/redesign-ui \
     --title "Redesign UI — calm dashboard" \
     --body  "Full UI redesign per ehub-ui-redesign-spec.md across all 4 portals. UI only, no logic changes."
   ```
4. Merge the final PR into `main` only after confirmation. Preserve history (merge commit or rebase — do
   **not** squash, so the ~99 atomic commits remain in `main`'s history).

## Must confirm before coding (spec §9)

- Exact **FPT orange hex** + permission to use FPT branding. Until confirmed, `--accent: #F37021`
  placeholder in one token file (swappable in one edit).
- Reason the "Nhóm Zalo" button is disabled (to write an accurate tooltip).
- Dark mode: not needed this pass.

## Verification (every branch, before push)

- `npm run dev`, check affected screens at **1280 / 768 / 390 / 360 px** (spec §6).
- `npm run lint` clean.
- **No behavior change**: same data, routes, auth/permission gating, empty/disabled conditions.
- Focus ring visible on interactive elements; text contrast ≥ 4.5:1 (spec §7); `prefers-reduced-motion` respected.
- No gradients / no `box-shadow` (except focus ring) on touched screens.

## Deferred — NOT in this pass (spec §8)

Conflicting dashboard vs group numbers · true Google-first auth (domain restriction, MSSV from email) ·
overdue-badge date logic · relative timestamps · merging the 3 change-request buttons into one modal ·
sidebar-state persistence to localStorage · i18n string consolidation.
