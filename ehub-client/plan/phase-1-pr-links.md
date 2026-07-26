# Phase 1 — Link tạo Pull Request

Repo: **APT3233/Entrepreneurship-Hub** · Base để merge: **`mem/quynh/redesign-ui`**

Đã push 6 nhánh. `gh` chưa cài nên tạo PR thủ công: bấm link → **"Create pull request"**.
**Merge lần lượt 1 → 5** (các nhánh phụ thuộc nhau). Trước khi merge PR#1, các PR sau sẽ hiển thị gộp commit tokens — merge đúng thứ tự thì tự thu lại.

| # | Nhánh | Tiêu đề PR gợi ý | Link tạo PR |
|---|---|---|---|
| 1 | `design-tokens` | `[tokens] design tokens (màu/typography/spacing/radius)` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/redesign-ui...mem/quynh/design-tokens?expand=1 |
| 2 | `ui-primitives` | `[ui] component tái sử dụng + StatCard calm` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/redesign-ui...mem/quynh/ui-primitives?expand=1 |
| 3 | `sidebar` | `[sidebar] restyle token (giữ pin)` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/redesign-ui...mem/quynh/sidebar?expand=1 |
| 4 | `app-header` | `[header] restyle token + nhãn ngôn ngữ` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/redesign-ui...mem/quynh/app-header?expand=1 |
| 5 | `modals` | `[modal] restyle ConfirmModal + auth + common` | https://github.com/APT3233/Entrepreneurship-Hub/compare/mem/quynh/redesign-ui...mem/quynh/modals?expand=1 |

## Ghi chú
- Base tất cả PR = `mem/quynh/redesign-ui` (không phải `main`).
- Mô tả PR chung: *"UI only, no logic changes — theo ehub-ui-redesign-spec.md. Phase 1 (foundation)."*
- Đừng push `redesign-ui` từ máy local (đang chứa merge tạm); remote sẽ đầy dần qua 5 PR.
- Sau khi merge đủ 5 PR: `redesign-ui` remote có 26 commit Phase 1. Final PR `redesign-ui → main` để dành tới Phase 7.
