# Phase 3 — Student portal (29 commits, 7 branches)

The spec's core (§4.2–4.6, §5). Depends on Phase 1. Back to [overview](00-overview.md).

> **UI only.** Reuse the exact existing empty/disabled conditions — change only what is rendered.
> Numbers, labels' data, routes, and gating stay identical.

---

## Branch `mem/quynh/student-dashboard` — 7 commits
Files: `src/pages/student/index.jsx` + `src/components/ui/student/*`. Spec §4.2.

| # | Commit message | Change |
|---|---|---|
| 1 | `[student-dash] replace gradient project card` | Purple gradient "Dự án hiện tại" card → white bordered `<Card>`. |
| 2 | `[student-dash] group name + status on one row` | Group name and `<StatusBadge>` on the same line. |
| 3 | `[student-dash] metadata line + detail button` | Metadata (mentor · lớp · lĩnh vực) 13px secondary; "Chi tiết nhóm" button on the right. |
| 4 | `[student-dash] extract topic warning to banner` | Move "Đề tài dự án chưa được thiết lập…" out of the card into a `<Banner variant="warning">` directly below. Same text. |
| 5 | `[student-dash] standard StatCards` | The 4 stats → refactored `<StatCard>`. Same numbers/labels. |
| 6 | `[student-dash] natural member list height` | Remove nested scroll inside the small frame; let the list grow with member count. |
| 7 | `[student-dash] Zalo button tooltip` | Keep the disabled "Nhóm Zalo" button; add explanatory `title`/tooltip. **Confirm the disable reason first (spec §9)** so the text is accurate. |

---

## Branch `mem/quynh/student-groups` — 5 commits
Files: `src/pages/student/groups`. Spec §4.3.

| # | Commit message | Change |
|---|---|---|
| 1 | `[student-groups] ghost change-request buttons` | The three "Request đổi" buttons → small ghost buttons, relabel "Yêu cầu đổi". Keep all three + behavior. |
| 2 | `[student-groups] relabel fields` | `CATEGORIES`→"Lĩnh vực", `TOPIC`→"Đề tài", `LỚP / MÔN HỌC`→"Lớp", `TÊN NHÓM`→"Tên nhóm", `MENTOR`→"Mentor". Sentence case, 13px, secondary. |
| 3 | `[student-groups] muted empty values` | "Chưa xác định" / "Chưa có đề tài" → `--text-muted`. Color only, keep the strings. |
| 4 | `[student-groups] status card uses StatusBadge` | "Trạng thái nhóm" card: remove inner tinted block, use `<StatusBadge>` + normal text. |
| 5 | `[student-groups] card token normalize` | 1px border, 12px radius, no shadow. |

---

## Branch `mem/quynh/student-assignments` — 5 commits
Files: `src/pages/student/assignments`. Spec §4.4.

| # | Commit message | Change |
|---|---|---|
| 1 | `[student-asgn] card token normalize` | 1px border, no shadow. |
| 2 | `[student-asgn] StatusBadge for status` | Replace ad-hoc pill with `<StatusBadge>`; keep the state values passed in (`ĐANG MỞ`, `ĐÃ CHẤM`). |
| 3 | `[student-asgn] emphasize score` | Score "8/10" → 18px/500, moved to the top-right row next to the badge. |
| 4 | `[student-asgn] accent submit button` | "Nộp bài ngay" → accent `<Button>`, 40px height. |
| 5 | `[student-asgn] normalize filter selects` | Year/term/class selects → standard control style. **Keep filter logic.** |

---

## Branch `mem/quynh/student-mentoring` — 4 commits
Files: `src/pages/student/mentoring`. Spec §4.5.

| # | Commit message | Change |
|---|---|---|
| 1 | `[student-mentoring] add PageHeader` | `<PageHeader>` at top. |
| 2 | `[student-mentoring] EmptyState` | "Đặt buổi mentoring đầu tiên" / "Chọn khung giờ trống…" / button "Xem lịch mentor" (existing route). Reuse existing empty condition. |
| 3 | `[student-mentoring] translate table headers` | Title/Group/Mentor/Scheduled/Status/Type → Tiêu đề/Nhóm/Mentor/Thời gian/Trạng thái/Loại. |
| 4 | `[student-mentoring] overflow wrapper + hide empty header` | `overflow-x:auto` wrapper; suppress table header when empty **only if doable without logic** — else leave the table and swap the middle text for EmptyState. |

---

## Branch `mem/quynh/student-startup` — 3 commits
Files: `src/pages/student/startup-profile`. Spec §4.5.

| # | Commit message | Change |
|---|---|---|
| 1 | `[student-startup] add PageHeader` | `<PageHeader>`. |
| 2 | `[student-startup] EmptyState` | "Chưa có hồ sơ startup" / "Tạo hồ sơ để theo dõi…" / button "Tạo hồ sơ startup" (existing route). |
| 3 | `[student-startup] translate Pipeline header` | Table header `Pipeline` → "Giai đoạn". Keep other startup headers. |

---

## Branch `mem/quynh/student-opportunities` — 3 commits
Route `/student/ecosystem/opportunities` — locate the page component (not under `pages/student/` top level; search `ecosystem`/`opportunities`). Spec §4.5.

| # | Commit message | Change |
|---|---|---|
| 1 | `[student-opps] add PageHeader` | `<PageHeader>`. |
| 2 | `[student-opps] EmptyState` | "Chưa có cơ hội nào đang mở" / "Các cuộc thi, chương trình ươm tạo… sẽ hiện ở đây khi được mở." No button. |
| 3 | `[student-opps] menu label "Cơ hội"` | Sidebar/menu label Opportunities → "Cơ hội". |

---

## Branch `mem/quynh/student-i18n` — 2 commits
File: `src/locales/vi.js` (edit **in place**, no i18n refactor — spec §5). i18n consolidation deferred (§8.7).

| # | Commit message | Change |
|---|---|---|
| 1 | `[i18n] fix Vietnamese display strings` | Categories→Lĩnh vực, Topic→Đề tài, Request đổi→Yêu cầu đổi, Opportunities(menu)→Cơ hội, mentoring/startup empty strings per EmptyState, table headers per §5. Keep "Mentoring", "Startup", "Checkpoint" as-is. |
| 2 | `[i18n] language label + English sweep` | Confirm "Tiếng Việt" label; scan student flows for leftover English display strings and translate in place. |

## Verify (whole phase)

- Each screen at 1280 / 768 / 390 / 360px.
- Same numbers/data/routes as before; empty & disabled conditions unchanged.
- No gradient project card; warning is a separate banner; badges via `<StatusBadge>`.
- **29 commits** recorded.

Next: [Phase 4 — Lecture](04-lecture.md).
