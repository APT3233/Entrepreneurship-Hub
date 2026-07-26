# Phase 3 — Link tạo Pull Request

Repo: **APT3233/Entrepreneurship-Hub** · Nhánh gộp: **`mem/quynh/phase-3-student`** (đã push).

`gh` chưa cài nên tạo PR thủ công: bấm link → **"Create pull request"**.
6 nhánh **độc lập theo từng màn hình** (đụng file khác nhau) → merge **thứ tự nào cũng được**.

Base tất cả PR = **`mem/quynh/phase-3-student`** (KHÔNG phải `redesign-ui`).

| # | Nhánh | Commit | Tiêu đề PR gợi ý | Link tạo PR |
|---|---|---|---|---|
| 1 | `student-dashboard` | 7 | `[student-dash] calm dashboard (Card/Banner/StatCard/StatusBadge)` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/phase-3-student...mem/quynh/student-dashboard?expand=1 |
| 2 | `student-groups` | 5 | `[student-groups] restyle token + StatusBadge + relabel` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/phase-3-student...mem/quynh/student-groups?expand=1 |
| 3 | `student-assignments` | 5 | `[student-asgn] card token + StatusBadge + accent submit + Dropdown` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/phase-3-student...mem/quynh/student-assignments?expand=1 |
| 4 | `student-mentoring` | 3 | `[student-mentoring] PageHeader + EmptyState + dịch header` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/phase-3-student...mem/quynh/student-mentoring?expand=1 |
| 5 | `student-startup` | 3 | `[student-startup] PageHeader + EmptyState + Giai đoạn` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/phase-3-student...mem/quynh/student-startup?expand=1 |
| 6 | `student-opportunities` | 3 | `[student-opps] PageHeader + EmptyState + menu "Cơ hội"` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/phase-3-student...mem/quynh/student-opportunities?expand=1 |

## Ghi chú
- Mô tả PR chung: *"UI only, no logic changes — theo ehub-ui-redesign-spec.md. Phase 3 (student)."*
- Sau khi merge đủ 6 PR vào `phase-3-student` → tạo **1 PR gộp**: `phase-3-student → redesign-ui`
  (link: https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/redesign-ui...mem/quynh/phase-3-student?expand=1).
- `redesign-ui → main` để dành tới Phase 7 (integration cuối).
- 26 commit tổng. Đừng push `phase-3-student` từ local sau khi remote đã merge (tránh lệch).
