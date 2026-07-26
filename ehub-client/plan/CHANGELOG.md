# CHANGELOG — E-HUB Client UI Redesign

Theo dõi trạng thái từng phase của [kế hoạch redesign](00-overview.md).
Base tích hợp: `mem/quynh/redesign-ui`.

| Phase | Nội dung | Nhánh | Trạng thái |
|---|---|---|---|
| 1 | [Foundation](01-foundation.md) — tokens, ui-primitives, sidebar, app-header, modals | design-tokens, ui-primitives, sidebar, app-header, modals | ✅ Hoàn thành |
| 2 | [Auth](02-auth.md) — login | login | ✅ Hoàn thành |
| 3 | [Student](03-student.md) | dashboard, groups, assignments, mentoring, startup, opportunities | ✅ Hoàn thành (chưa merge) |
| 4 | [Lecture](04-lecture.md) | dashboard, classes, assignments, grading, groups, analytics-schedule | ✅ Hoàn thành (chưa merge) |
| 5 | [Mentor](05-mentor.md) | `mem/quynh/mentor-admin` (gộp) | ✅ Hoàn thành (chưa merge) |
| 6 | [Admin](06-admin.md) | `mem/quynh/mentor-admin` (gộp) | 🚧 Lớp component dùng chung + dashboard xong; còn chrome trang lẻ |
| 7 | Integration — final PR `redesign-ui → main` | redesign-ui | ⬜ Chưa làm |

## Chi tiết

### Phase 1 — Foundation ✅
5 nhánh đã merge vào `redesign-ui`: `design-tokens`, `ui-primitives`, `sidebar`, `app-header`, `modals`.
Tokens màu/typography/spacing/radius, component tái sử dụng + StatCard, restyle sidebar/header/modals.

### Phase 2 — Auth ✅
Nhánh `login` đã merge (commit `cea1585`). Login redesign theo yêu cầu người dùng:
ảnh campus full-screen + liquid-glass card, Google-first, đồng bộ accent cam FPT. Không đổi luồng auth.

### Phase 3 — Student ✅ (đã code, **chưa push/merge** — chờ xác nhận)
6 nhánh, **26 commit**, tách off `mem/quynh/redesign-ui`. UI only, lint sạch, build OK.

| Nhánh | Commit | Nội dung |
|---|---|---|
| `student-dashboard` | 7 | Gradient card → `<Card>`; tên+StatusBadge 1 dòng; metadata 13px + nút chi tiết; cảnh báo đề tài → `<Banner>`; 4 StatCard chuẩn; bỏ scroll list thành viên; tooltip nút Zalo. |
| `student-groups` | 5 | Nút "Yêu cầu đổi" ghost; đổi nhãn (Lĩnh vực/Đề tài/Lớp) sentence-case; giá trị rỗng muted; card trạng thái dùng `<StatusBadge>`; normalize card token. |
| `student-assignments` | 5 | AssignmentCard token; StatusBadge trạng thái; điểm 18px lên đầu; nút "Nộp bài ngay" accent 40px; chuẩn hóa control `Dropdown` (dùng chung). |
| `student-mentoring` | 3 | `<PageHeader>`; `<EmptyState>`; dịch header bảng. |
| `student-startup` | 3 | `<PageHeader>`; `<EmptyState>`; header `Pipeline` → "Giai đoạn" (vi.js). |
| `student-opportunities` | 3 | `<PageHeader>`; `<EmptyState>`; nhãn menu "Opportunities" → "Cơ hội". |

Điều chỉnh so với plan (được phép "fine-tune, atomic not padded"):
- **mentoring**: 3 thay vì 4 — commit "overflow wrapper + hide empty header" đã thỏa mãn sẵn (AdminTable có `overflow-x-auto` nội bộ; EmptyState swap tránh render header khi rỗng; không sửa AdminTable dùng chung).
- **student-i18n bị bỏ** (0 thay vì 2) — các relabel (Categories/Topic/Request đổi/Opportunities/empty/headers) đều là chuỗi hardcode nên đã sửa inline trong các nhánh trên; chuỗi student trong `vi.js` vốn đã tiếng Việt; nhãn "Tiếng Việt" đã đúng.
- Ngoài ra 1 commit token `[tokens] accent #f26f20` commit thẳng vào `redesign-ui` (dọn thay đổi `index.css` chưa commit).
- 2 EmptyState (mentoring, startup) **không có nút hành động**: student không có route "lịch mentor"/"tạo startup" (startup do admin liên kết) → không bịa route/handler.

### Phase 4 — Lecture ✅ (đã code, **chưa merge** vào `redesign-ui`)
6 nhánh, **13 commit**, tách off `mem/quynh/redesign-ui`. UI only, đúng budget plan.

| Nhánh | Commit | Nội dung |
|---|---|---|
| `lecture-dashboard` | 3 | PageHeader + layout tokens; StatCard bỏ props color-icon; overview cards + StatusBadge tokens. |
| `lecture-classes` | 2 | List page tokens + PageHeader + EmptyState; class detail tokens + StatusBadge. |
| `lecture-assignments` | 2 | PageHeader + tokens + EmptyState + pagination; assignment/checkpoint cards + StatusBadge. |
| `lecture-grading` | 2 | PageHeader + StatCard overview tokens; StatusBadge + submission list tokens. |
| `lecture-groups` | 2 | Group list + card tokens + PageHeader + StatusBadge; group detail + tabs tokens + StatusBadge. |
| `lecture-analytics-schedule` | 2 | Analytics PageHeader + cell tokens; schedule placeholder tokens + EmptyState. |

Các nhánh lecture chưa được PR/merge vào `redesign-ui`.

### Phase 5 + 6 — Mentor & Admin (gộp 1 nhánh `mem/quynh/mentor-admin`)
Thay đổi cách làm: gộp cả hai phase vào **một nhánh duy nhất** thay cho 11 nhánh nhỏ (theo yêu cầu).
Tách off `mem/quynh/redesign-ui`. UI only, build OK sau mỗi commit.

**Phase 5 — Mentor ✅ (chưa merge)**: 8 màn (dashboard, sessions, availability, documents, profile,
assignments, startup detail, session detail) đã calm-token hoá. Vì mentor mượn nhiều component từ admin,
đã restyle luôn: `AdminTable`, admin `StatusBadge` (gom 180 màu → 4 tone token), `mentor-analytics/components`
(Panel/MetricCard/SimpleList), `mentor-workflow/components` (InfoBox/MetricCard), `mentor-management/components`
(MentorHeader/MentorForm/AvailabilityEditor/ExpertiseEditor).

**Phase 6 — Admin 🚧**: xong lớp component dùng chung (lan tỏa khắp mọi bảng/filter/modal/badge/form/panel):
`AdminTable`, `StatusBadge`, `FilterBar`, `SearchInput`, `FormModal`, `ActionButton`, `incubation/components`,
`academic/components/{ActionButton,DetailGrid}` + `admin/dashboard` (StatCard chuẩn). **Còn lại**: chrome cấp
trang (page header, nút "tạo" indigo, hero card gradient) rải ở ~50 file trang admin lẻ — chưa xử lý.

---

## Sau redesign (đã lên plan, làm sau)

- **Phase 8 — i18n Coverage** ([08-i18n-coverage.md](08-i18n-coverage.md)) — rút chuỗi hardcode ra `vi.js`/`en.js`
  + bù bản EN. KHÔNG phải "UI only" → tách riêng, làm sau khi Phase 1–7 merge (markup ổn định). ⬜ Chưa làm.

---

Tiếp theo: **Phase 5 — Mentor** ([05-mentor.md](05-mentor.md)). (Trước đó: merge Phase 4 lecture vào `redesign-ui`.)
