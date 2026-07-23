# E-HUB — Spec thay đổi UI (chỉ giao diện)

Dự án: Entrepreneurship-Hub (cổng sinh viên môn EXE, FPTU Đà Nẵng).

## Ràng buộc bắt buộc

**Chỉ thay đổi giao diện. Không đổi bất kỳ logic nào.**

Được phép động vào:
- CSS, class, style, token màu/font/spacing
- Cấu trúc markup và thứ tự phần tử trong template
- Nội dung chữ hiển thị (label, tiêu đề, mô tả)
- Tạo component thuần trình bày (nhận props, render, không tính toán)

Không được động vào:
- API call, query, cách lấy và tính dữ liệu
- Điều kiện hiển thị, state, routing, xác thực, phân quyền
- Bất kỳ hàm nào biến đổi dữ liệu
- Schema, model, migration

Nếu gặp chỗ muốn sửa nhưng buộc phải đổi logic thì **dừng lại và báo**, đừng tự sửa. Xem mục 8 để biết những chỗ đã biết trước là như vậy.

---

## 1. Mục tiêu

Chuyển từ giao diện "SaaS gradient" sang **calm dashboard**: nền trung tính, viền mảnh thay đổ bóng, một màu accent duy nhất dùng tiết chế. Đây là công cụ sinh viên mở hằng ngày để xem deadline và nộp bài, nên ưu tiên độ rõ ràng hơn ấn tượng thị giác.

---

## 2. Design token

Định nghĩa tập trung một chỗ (CSS variables hoặc theme config), không hardcode màu trong component.

### Màu

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--bg-page` | `#FAFAF9` | Nền trang |
| `--bg-surface` | `#FFFFFF` | Nền card, panel |
| `--bg-subtle` | `#F5F5F4` | Nền thẻ thống kê, vùng nhấn nhẹ |
| `--border` | `#E7E5E4` | Viền mặc định 1px |
| `--border-strong` | `#D6D3D1` | Viền hover, divider đậm |
| `--text-primary` | `#1C1917` | Nội dung chính |
| `--text-secondary` | `#57534E` | Mô tả, phụ đề |
| `--text-muted` | `#A8A29E` | Placeholder, metadata |
| `--accent` | Cam FPT (~`#F37021`) | Nút chính, tab active, progress |
| `--accent-hover` | Cam đậm hơn 1 stop | Trạng thái hover |
| `--accent-bg` | Cam nhạt ~8% opacity | Nền badge, nền tab active |

**Lấy hex cam chính xác từ brand guideline FPT**, đừng đoán.

Màu trạng thái — chỉ dùng cho trạng thái, không dùng trang trí. Map vào đúng các trạng thái **đã tồn tại**, không tạo trạng thái mới:

| Trạng thái | Nền | Chữ |
|---|---|---|
| Thành công (đã duyệt, đã chấm) | `#ECFDF5` | `#065F46` |
| Cảnh báo (chưa thiết lập, chờ xử lý) | `#FFFBEB` | `#92400E` |
| Lỗi (chưa đạt) | `#FEF2F2` | `#991B1B` |
| Trung tính | `#F5F5F4` | `#57534E` |

Bỏ toàn bộ gradient. Bỏ toàn bộ `box-shadow` trừ focus ring.

### Typography

- Một font family duy nhất, hỗ trợ tiếng Việt tốt: Be Vietnam Pro hoặc Inter.
- **Chỉ hai weight: 400 và 500.** Bỏ 600/700.
- Thang cỡ: `22px` (h1) / `18px` (h2) / `16px` (h3) / `14px` (body) / `13px` (label, metadata) / `12px` (badge).
- Bỏ ALL CAPS ở label. Các label `TÊN NHÓM`, `MENTOR`, `LỚP / MÔN HỌC`, `TIẾN ĐỘ`, `CẦN XỬ LÝ`, `NHÓM`, `KẾT QUẢ` chuyển về sentence case, 13px, màu `--text-secondary`.
- Line-height 1.5 body, 1.3 heading.

### Layout

- Bo góc: `8px` cho control, `12px` cho card. Bỏ các giá trị 16–24px.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32.
- Chiều cao control: 36px desktop, 44px mobile.
- Content max-width 1280px, căn giữa.

---

## 3. Component trình bày cần tạo

Toàn bộ là component "câm": nhận props, render ra markup. Không fetch, không tính toán, không giữ state ngoài UI state thuần (hover, open/close của tooltip).

### `<PageHeader title description actions? />`
Dùng ở mọi trang. Mentoring, Startup, Opportunities hiện không có tiêu đề, nhảy thẳng vào bảng.

### `<EmptyState icon title description action? />`
Thay cho dòng chữ xám hiện tại. **Điều kiện hiển thị empty đã có sẵn trong code — giữ nguyên điều kiện đó, chỉ đổi thứ được render ra.**

Nội dung:

| Trang | Tiêu đề | Mô tả | Nút |
|---|---|---|---|
| Mentoring | Đặt buổi mentoring đầu tiên | Chọn khung giờ trống của mentor để đăng ký buổi trao đổi. | Xem lịch mentor |
| Startup | Chưa có hồ sơ startup | Tạo hồ sơ để theo dõi sản phẩm và pipeline của nhóm. | Tạo hồ sơ startup |
| Opportunities | Chưa có cơ hội nào đang mở | Các cuộc thi, chương trình ươm tạo và kết nối đối tác sẽ hiện ở đây khi được mở. | — |

Nút trong EmptyState trỏ tới đúng route đã có sẵn, không tạo route mới.

### `<StatCard label value suffix? />`
Nền `--bg-subtle`, không viền, không shadow. Label 13px trên, số 24px weight 500 dưới. Grid `repeat(auto-fit, minmax(140px, 1fr))`, gap 12px. Bỏ icon tròn màu — nó không mang thông tin.

### `<StatusBadge status label />`
`status` là một trong `success | warning | danger | neutral`. Thay cho các pill đang tự style rời rạc: `CHƯA ĐẠT`, `ĐANG MỞ`, `ĐÃ CHẤM`, `Nhóm đã được xác nhận`. Việc trạng thái nào map sang màu nào do nơi gọi truyền vào, component không tự suy ra.

---

## 4. Thay đổi theo màn hình

### 4.1 Đăng nhập

> **Cập nhật:** Bản triển khai cuối khác hướng "nền phẳng" ban đầu — theo yêu cầu trực tiếp của
> người dùng, giữ **ảnh campus full-screen + liquid glass**. Mô tả dưới đây là thiết kế đang chạy.

- **Bố cục split-screen** (desktop `lg`): ảnh campus (`background-fpt.jpeg`) phủ **full màn hình** (`bg-cover`),
  lớp gradient tối chỉ ở góc dưới-trái (`from-black/60 … to-transparent`) để chữ brand đọc được mà ảnh vẫn sáng.
  Nửa trái là khối brand (logo E-HUB + headline), nửa phải là form. Mobile: ẩn ảnh brand trái, form căn giữa.
- **Headline brand** (trái): "Cổng / khởi nghiệp / sinh viên FPT" cỡ hero (`text-5xl lg:text-6xl`, `font-black`),
  trắng tương phản cao + 1 dòng gradient cam nhấn ("khởi nghiệp"), drop-shadow tách nền.
- **Card = liquid glass**: nền bán trong (`rgba(255,255,255,.18)`) + `backdrop-filter: blur(28px) saturate(160%)`,
  viền sáng mảnh + highlight mép trên (`inset`), bo 26px. Có fallback nền đặc khi trình duyệt không hỗ trợ backdrop-filter.
- **Nút "Đăng nhập với Google" nằm trên** form MSSV/mật khẩu (chỉ đổi thứ tự markup, không đụng handler/luồng xác thực);
  ngăn cách bằng divider "hoặc".
- Giữ nguyên tab Student / Lecturer và toàn bộ logic. Tab active dùng `--accent-bg` + chữ `--accent`, bỏ shadow.
- **Toàn form đồng bộ accent cam FPT**: nút submit `--accent`, link/checkbox/focus-ring theo `--accent`.
- **Input glass**: nền trắng bán trong, focus đổi viền sang `--accent`; đã khử nền autofill của Chrome
  (`-webkit-autofill` box-shadow inset trong suốt) để không tạo "hộp trong".

### 4.2 Trang chủ

- **Bỏ card gradient tím** của "Dự án hiện tại". Thay bằng card trắng viền mảnh. Bố cục: tên nhóm + StatusBadge cùng một dòng, dòng metadata phụ (mentor · lớp · lĩnh vực) 13px màu secondary, nút "Chi tiết nhóm" bên phải.
- **Tách dòng cảnh báo ra khỏi card.** Câu "Đề tài dự án chưa được thiết lập..." hiện chìm trong nền tím. Đưa xuống thành banner riêng ngay dưới card, nền `warning`, có icon. Nội dung chữ giữ nguyên, chỉ đổi chỗ đặt và cách trình bày.
- 4 StatCard: dùng component chuẩn, giữ nguyên số liệu và nhãn đang có.
- Danh sách thành viên: bỏ scroll lồng trong khung nhỏ, cho khung cao tự nhiên theo số thành viên.
- Nút "Nhóm Zalo" đang disabled: giữ nguyên trạng thái disabled, chỉ thêm `title`/tooltip giải thích. Nếu chưa rõ lý do disable thì để nguyên và báo lại.

### 4.3 Nhóm

- Ba nút "Request đổi" giữ nguyên cả ba và giữ nguyên hành vi. Chỉ restyle thành nút ghost nhỏ, và đổi chữ thành "Yêu cầu đổi".
- Đổi label hiển thị: `CATEGORIES` → "Lĩnh vực", `TOPIC` → "Đề tài", `LỚP / MÔN HỌC` → "Lớp", `TÊN NHÓM` → "Tên nhóm", `MENTOR` → "Mentor".
- Giá trị rỗng ("Chưa xác định", "Chưa có đề tài") đổi sang màu `--text-muted` để phân biệt với dữ liệu thật. Chỉ đổi màu, giữ nguyên chuỗi.
- Card "Trạng thái nhóm": bỏ nền xanh nhạt của khối bên trong, dùng StatusBadge + text thường.

### 4.4 Bài tập

- Card bài tập: chuẩn hoá theo token, bỏ shadow, viền 1px.
- Badge trạng thái dùng StatusBadge, giữ nguyên trạng thái đang được truyền vào (`ĐANG MỞ`, `ĐÃ CHẤM`).
- Điểm số "8/10" tăng cỡ lên 18px weight 500, đưa lên cùng hàng với badge ở góc trên phải card cho dễ quét mắt.
- Nút "Nộp bài ngay": dùng `--accent`, chiều cao 40px.
- Ba ô select năm/kỳ/lớp: chuẩn hoá style, giữ nguyên logic filter.

### 4.5 Mentoring / Startup / Opportunities

- Thêm `<PageHeader>` cho cả ba trang.
- Thay phần rỗng bằng `<EmptyState>`, dùng lại đúng điều kiện rỗng đang có.
- Khi rỗng thì không render header của bảng. Nếu chỗ này trong code không tách được mà không đụng logic thì để nguyên bảng và chỉ thay dòng chữ giữa bảng bằng EmptyState.
- Bỏ khoảng trắng chết: bảng đang kéo full width với một dòng duy nhất.

### 4.6 Sidebar

- **Chốt một trạng thái mặc định duy nhất** thay vì lúc thu lúc mở như hiện tại. Khuyến nghị: mở rộng ở ≥1280px, thu gọn dưới đó, off-canvas trên mobile. Thuần CSS breakpoint, không lưu lựa chọn (lưu là logic).
- **Icon Mentoring và Opportunities đang gần như giống hệt nhau** (đều là hình bắt tay). Đổi một trong hai: Mentoring → icon lịch hẹn hoặc người dạy, Opportunities → icon ngôi sao hoặc loa.
- Mục "Trạng thái" và "Lịch dạy" đang xám mờ: giữ nguyên trạng thái disabled, thêm tooltip. Không tự ý ẩn (ẩn là đổi điều kiện hiển thị).
- Khi thu gọn, mọi icon phải có tooltip.

---

## 5. Chữ hiển thị

Sửa **tại chỗ**, không refactor hệ thống i18n, không di chuyển chuỗi sang file khác. Chỉ đổi chuỗi hiển thị ở bản tiếng Việt cho hết tiếng Anh:

- `Categories` → Lĩnh vực
- `Topic` → Đề tài
- `Request đổi` → Yêu cầu đổi
- `Opportunities` (menu) → Cơ hội
- `No mentoring sessions` → theo EmptyState mục 3
- `Chưa có hồ sơ startup liên kết với tài khoản của bạn` → theo EmptyState mục 3
- Header bảng `Title / Group / Mentor / Scheduled / Status / Type` → Tiêu đề / Nhóm / Mentor / Thời gian / Trạng thái / Loại
- Header bảng Startup: `Startup / Sản phẩm / Trạng thái / Pipeline / Cập nhật` → chỉ cần dịch `Pipeline` → Giai đoạn
- `Số dòng/trang` giữ nguyên
- Giữ nguyên "Mentoring", "Startup", "Checkpoint" — là thuật ngữ của môn học, sinh viên quen rồi

Nút chuyển ngôn ngữ đang hiện "VN VI" khó hiểu — đổi nhãn thành "Tiếng Việt", giữ nguyên cơ chế chuyển.

---

## 6. Responsive

Sinh viên phần lớn mở trên điện thoại để xem deadline.

- Breakpoints: 640 / 768 / 1024 / 1280.
- Dưới 768px: sidebar off-canvas, StatCard grid 2 cột, PageHeader actions xuống dòng.
- Bảng ở mobile: cho cuộn ngang trong wrapper `overflow-x: auto`. (Chuyển bảng thành card list cần đổi markup theo dữ liệu — nếu muốn làm thì báo trước.)
- Vùng chạm tối thiểu 44px.
- Kiểm tra ở 390px và 360px.

---

## 7. Chất lượng nền

- Focus ring rõ ràng cho mọi phần tử tương tác. Không dùng `outline: none` trần.
- Tương phản chữ đạt WCAG AA (4.5:1). Chữ xám trên nền xám ở các trang trống hiện không đạt.
- Tôn trọng `prefers-reduced-motion`.

---

## 8. Ngoài phạm vi lần này

Ghi lại để không quên, **không làm trong lần này**:

1. **Số liệu mâu thuẫn.** Dashboard hiển thị "Bài tập nộp 4/5" và "Điểm TB 7.7", trang Nhóm hiển thị "Bài tập đã nộp 0/5" và "Điểm trung bình 0/10" cho cùng một nhóm. Hai chỗ đang lấy khác nguồn, hoặc một bên tính theo cá nhân một bên theo nhóm. Đây là vấn đề nghiêm trọng hơn mọi thứ về giao diện — người dùng thấy hai con số chọi nhau sẽ không tin số nào nữa.
2. **Đăng nhập Google-first thật sự**: giới hạn domain `fpt.edu.vn`, suy MSSV từ email, bỏ tab Student/Lecturer và lấy vai trò từ database. Lần này chỉ đổi được thứ tự hiển thị.
3. **Badge quá hạn**: bài tập hết hạn 21/07 vẫn hiện "ĐANG MỞ" màu xanh. Cần logic so sánh ngày.
4. **Thời gian tương đối** ("còn 2 ngày", "quá hạn 3 ngày") thay cho timestamp tuyệt đối.
5. **Gom 3 nút "Yêu cầu đổi" vào một modal** chỉnh cả ba trường.
6. **Lưu trạng thái sidebar** vào localStorage.
7. **Gom chuỗi vào hệ thống i18n** thay vì hardcode rải rác.

---

## 9. Cần chốt trước khi code

- Hex cam FPT chính xác, và **có được phép dùng logo/nhận diện FPT không** — nếu là đồ án sinh viên chưa được trường bảo trợ chính thức thì nên hỏi giảng viên trước.
- Lý do nút "Nhóm Zalo" đang bị disable, để viết tooltip cho đúng.
- Có cần dark mode không (khuyến nghị: chưa cần).
