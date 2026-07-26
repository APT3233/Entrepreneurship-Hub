# Phase 5 — Mentor portal (1 nhánh gộp)

Depends on Phase 1. Same token/component pattern, no logic. Back to [overview](00-overview.md).

> **Cập nhật cách làm:** Phase 5 **và** Phase 6 gộp chung vào **một nhánh duy nhất
> `mem/quynh/mentor-admin`** (tách off `mem/quynh/redesign-ui`), thay cho 5 + 6 nhánh nhỏ ban đầu.
> Mỗi màn hình vẫn là commit atomic riêng, chỉ khác là không tách nhánh theo màn.

Page groups: `src/pages/mentor/{dashboard,sessions,availability,startups,documents,profile,assignments}`
(+ `src/pages/mentoring/SessionDetailPage.jsx`).

## Pattern (mỗi màn hình)

Same as [Phase 4](04-lecture.md#per-branch-pattern-do-this-on-every-screen): tokens, `<StatusBadge>`,
`<PageHeader>`, `<EmptyState>`, `<StatCard>`/`<Card>`, standard `Select`. **No data/logic changes.**

## Màn hình (mentor)

Nhánh: **`mem/quynh/mentor-admin`** (chung với Phase 6).

| Màn | Focus |
|---|---|
| `mentor/dashboard` | header+layout tokens + StatCards · overview cards + StatusBadge |
| `mentor/sessions` (+ `mentoring/SessionDetailPage.jsx`) | list/table tokens + PageHeader · StatusBadge + EmptyState |
| `mentor/availability` | grid/calendar tokens + PageHeader · controls + EmptyState |
| `mentor/startups` | list/table tokens + PageHeader · StatusBadge + EmptyState |
| `mentor/profile` + `mentor/documents` + `mentor/assignments` | profile/docs/assignments card tokens + StatusBadge/EmptyState |

## Verify

- Each touched mentor screen at 1280 / 768 / 390px; same data/routes/permissions.
- No gradient/shadow (except focus ring); badges via `<StatusBadge>`.

Next: [Phase 6 — Admin](06-admin.md) (cùng nhánh `mem/quynh/mentor-admin`).
