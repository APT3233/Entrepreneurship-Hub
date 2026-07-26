# Phase 8 — i18n Coverage (làm SAU redesign)

Đợt **riêng, sau khi redesign xong** (Phase 1–7 đã merge). Đây **KHÔNG phải "UI only"** — là refactor
rút chuỗi hardcode ra locale, nên tách hẳn khỏi các branch redesign. Back to [overview](00-overview.md).

## Bối cảnh

i18n **đã hoạt động thật**: `react-i18next` + `TranslationContext.jsx`, 2 bộ locale `src/locales/vi.js` &
`en.js`, `LanguageSwitcher` (VI/EN, lưu `localStorage.ehub_lang`). Vấn đề: **độ phủ chưa đều** — nhiều màn
(đặc biệt luồng student) **hardcode chuỗi** thay vì gọi `t()`, và bản **EN thiếu/không khớp**.

## Mục tiêu

1. Mọi **chuỗi hiển thị cho người dùng** đi qua `t()` (label, tiêu đề, empty state, header bảng, nút, tooltip, menu).
2. **EN parity**: mỗi key VI có bản EN tương ứng.
3. Đổi ngôn ngữ VI↔EN không còn chuỗi VI lọt (leak) và không lộ raw key.

## Tại sao làm SAU redesign (không làm bây giờ)

- Redesign đang viết lại đúng những JSX chứa chuỗi → làm i18n trước = sửa 2 lần + xung đột rebase.
- Redesign còn đổi nhãn / gộp / dời chuỗi → markup chưa chốt.
- Hiển thị **VI đã đúng** sau redesign → i18n chủ yếu bù **EN + bảo trì**, không chặn ship.

## Điều kiện tiên quyết

- Phase 1–7 redesign đã merge vào `main` (markup cuối, ổn định).
- Base branch: nhánh tích hợp mới **`mem/quynh/i18n-coverage`** (off `main` sau redesign).

## Không đụng (giữ nguyên)

- Logic, data, route, gating, schema.
- Chuỗi log/`console.error`, comment code, message backend.
- **Danh từ riêng / thuật ngữ giữ nguyên cả 2 ngôn ngữ**: `FPT`, `Zalo`, `Google`, `Startup`, `Mentoring`,
  `Checkpoint`, `Pipeline` (khi là thuật ngữ), tên sản phẩm.
- Wording VI hiện tại là **nguồn chuẩn** (đừng đổi chữ, chỉ chuyển vào locale).

## Quy ước key

- Tái dùng namespace sẵn có trong `vi.js`: `common.*`, `student.*`, `lecturer.*`, `mentor.*`, `admin.*`.
- Không tạo cây key song song. Chuỗi dùng chung → `common.*`.
- Thêm key mới ở **cả** `vi.js` và `en.js`, cùng đường dẫn key.

## Quy trình mỗi màn (lặp lại)

1. **Audit**: quét chuỗi hardcode trong component (JSX text, label/title/placeholder/emptyText literal).
2. Thêm key vào `vi.js` (chuỗi VI hiện tại) và `en.js` (bản dịch EN).
3. Thay literal trong component bằng `t("...")`.
4. Verify: đổi sang **EN** đi hết màn (không còn VI leak); đổi lại **VI** (không lộ raw key).

## Nhánh & commit budget (dự kiến — tinh chỉnh khi làm)

Mỗi nhánh off `mem/quynh/i18n-coverage`, PR về lại nhánh đó; cuối cùng 1 PR `i18n-coverage → main`.

| Nhánh | Phạm vi | Ước commit |
|---|---|---|
| `i18n-common` | Chuỗi dùng chung: header/sidebar labels ("Mentoring", "Startup", "Cơ hội"…), nút, empty/loading, table primitives (AdminTable, Dropdown), PageHeader/EmptyState/Banner text truyền vào. | 4–6 |
| `i18n-student` | dashboard (chào/stat/"Lối tắt nhanh"/thành viên), groups (InfoField/status), assignments (AssignmentCard, CheckpointCard, tab "Bài tập (Assignments)"→bỏ EN kép), mentoring/startup/opportunities (PageHeader + EmptyState đã hardcode VI). | 6–8 |
| `i18n-lecture` | Sidebar (`analytics`,`mentoring` để nguyên tên?), dashboard/classes/assignments/grading/groups còn hardcode. | 4–6 |
| `i18n-mentor` | dashboard/sessions/availability/startups/profile-docs. | 3–5 |
| `i18n-admin` | Các bảng/panel còn hardcode; nhiều chỗ đã dùng `t()` nên ít. | 3–5 |
| `i18n-en-fill` | Rà `en.js` cho các key vừa thêm còn thiếu/để tạm; đọc lại toàn bộ bản EN. | 2–4 |

## Hotspot đã biết (từ Phase 3)

- `layouts/student/index.jsx`: label `"Mentoring"`, `"Startup"`, `"Cơ hội"` hardcode.
- `components/ui/student/StudentDashboardOverview.jsx`: **toàn bộ** VI hardcode (chào, stat label, "Lối tắt nhanh", "Thành viên", "Nhóm Zalo"…).
- `components/ui/student/StudentGroupOverviewSection.jsx`: nhãn/khối trạng thái hardcode.
- `pages/student/assignments/*`: AssignmentCard, CheckpointCard, tab `"Bài tập (Assignments)"` / `"Mốc quan trọng (Checkpoints)"` (EN trong ngoặc — bỏ hoặc chuyển key).
- `pages/student/mentoring|startup-profile`: `<PageHeader>` + `<EmptyState>` VI hardcode (thêm ở Phase 3); `emptyText="No mentoring sessions"` (EN sót).
- `pages/student/startup-profile/index.jsx`: description PageHeader hardcode.

## Chống tái phát (tuỳ chọn)

- Cân nhắc bật rule ESLint `react/jsx-no-literals` (hoặc script grep CI) để chặn literal JSX mới lọt vào.
- Không bắt buộc; nếu bật thì whitelist danh từ riêng ở trên.

## Verify (toàn đợt)

- Đi từng portal ở **EN**: không còn chuỗi VI leak; không raw key.
- Đi lại **VI**: khớp wording cũ.
- `npm run lint` sạch, `npm run build` OK.
- Đổi ngôn ngữ khi đang ở mỗi màn → cập nhật ngay (đã có `useCallback` rebind theo `language`).

## Cần xác nhận trước khi làm

- **Bản dịch EN** do tôi soạn nháp → cần người review (thuật ngữ học vụ FPT).
- Có bật ESLint `jsx-no-literals` không (chống tái phát) hay chỉ làm coverage một lần.
- Có cần EN cho cả **admin/lecture/mentor** hay chỉ ưu tiên **student** trước.
