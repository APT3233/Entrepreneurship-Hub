# Phase 4 — Lecture portal (13 commits, 6 branches)

Depends on Phase 1. The spec doesn't detail lecturer screens, so each branch **applies the same
token/component system** — no logic. Back to [overview](00-overview.md).

Page groups: `src/pages/lecture/{dashboard,classes,assignments,grading,groups,analytics,schedule,evaluation,mentoring,incubation}`.

## Per-branch pattern (do this on every screen)

1. Backgrounds/borders/radius/text → Phase 1 tokens; remove gradients & shadows.
2. Ad-hoc status pills → `<StatusBadge>` (caller passes the existing status).
3. Add `<PageHeader>` where a screen jumps straight into content.
4. Empty/zero states → `<EmptyState>` (reuse existing empty condition).
5. Stat tiles → refactored `<StatCard>`; cards → `<Card>`; filters → standard `Select`.
6. **No data/query/routing/permission changes.**

## Branches & commits

| Branch | Commits | Focus |
|---|---|---|
| `mem/quynh/lecture-dashboard` | 3 | 1 header+layout tokens · 2 StatCards · 3 recent-classes/overview cards + badges (`components/ui/lecture/*`) |
| `mem/quynh/lecture-classes` | 2 | 1 list/table tokens + PageHeader · 2 StatusBadge + EmptyState |
| `mem/quynh/lecture-assignments` | 2 | 1 card/table tokens + PageHeader · 2 StatusBadge + filter selects |
| `mem/quynh/lecture-grading` | 2 | 1 grading overview tokens + PageHeader · 2 StatusBadge + EmptyState |
| `mem/quynh/lecture-groups` | 2 | 1 group cards/table tokens · 2 StatusBadge + EmptyState |
| `mem/quynh/lecture-analytics-schedule` | 2 | 1 analytics cards/charts container tokens · 2 schedule tokens + EmptyState |

(Evaluation / mentoring / incubation lecturer sub-pages fold into the nearest branch above where they share a screen; if any needs its own pass, add a `mem/quynh/lecture-<name>` branch and keep the phase total ≈13.)

## Verify

- Each touched lecturer screen at 1280 / 768 / 390px; same data/routes/permissions.
- No gradient/shadow (except focus ring); badges via `<StatusBadge>`.
- **13 commits** recorded.

Next: [Phase 5 — Mentor](05-mentor.md).
