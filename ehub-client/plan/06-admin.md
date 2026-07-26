# Phase 6 — Admin portal (1 nhánh gộp)

Depends on Phase 1. Same token/component pattern, no logic. Back to [overview](00-overview.md).

> **Cập nhật cách làm:** Phase 6 gộp chung nhánh với Phase 5 vào **`mem/quynh/mentor-admin`**
> (tách off `mem/quynh/redesign-ui`). Mỗi màn hình vẫn là commit atomic riêng.

Page groups: `src/pages/admin/{dashboard,academic,access-control,student-group,mentor-management,
mentor-matching,mentor-workflow,mentor-analytics,evaluation-ops,analytics,project-submission,
lecturer-management,incubation,profile}` (+ `admin/components`, `admin/shared`).

## Per-branch pattern

Same as [Phase 4](04-lecture.md#per-branch-pattern-do-this-on-every-screen): tokens, `<StatusBadge>`,
`<PageHeader>`, `<EmptyState>`, `<StatCard>`/`<Card>`, standard `Select`. Admin has the most tables —
prioritize consistent table headers, row density, and status badges. **No data/logic changes.**

## Màn hình (admin)

Nhánh: **`mem/quynh/mentor-admin`** (chung với Phase 5). Mỗi nhóm 1 commit atomic.

| Nhóm màn | Focus |
|---|---|
| `admin/dashboard` | header+layout tokens + StatCards · overview cards + StatusBadge |
| `admin/academic` (semesters / subjects / classes) | table tokens + PageHeader + StatusBadge/EmptyState |
| `admin/access-control` (users / roles / permissions / settings / ai-settings) | table tokens + PageHeader + StatusBadge |
| `admin/student-group` | group tables tokens + PageHeader · StatusBadge + EmptyState |
| `admin/mentor-management` + `mentor-analytics` | tables/cards tokens + StatusBadge |
| `admin/evaluation-ops` + `analytics` | tokens + PageHeader · analytics cards + EmptyState |

(Lecturer-management / incubation / profile admin sub-pages fold vào nhóm gần nhất; chỉ xử lý riêng khi
một màn thực sự cần.)

## Verify

- Each touched admin screen at 1280 / 768 / 390px; same data/routes/permissions.
- Tables: consistent token headers, `overflow-x:auto` on mobile, badges via `<StatusBadge>`.
- No gradient/shadow (except focus ring).

## Phase 7 — Integration & final PR

Các nhánh phase (gồm `mem/quynh/mentor-admin` cho Phase 5+6) được PR vào nhánh tích hợp
**`mem/quynh/redesign-ui`**. Once every phase is merged there:

1. Run full verification (all portals, 1280 / 768 / 390 / 360px, `npm run lint`) on `redesign-ui`.
2. Open **one final PR `mem/quynh/redesign-ui → main`** titled "Redesign UI — calm dashboard".
3. Merge into `main` after confirmation — **do not squash**, keep the ~99 atomic commits in history.

See the [overview integration section](00-overview.md#integration--final-pr-phase-7) for exact commands.
