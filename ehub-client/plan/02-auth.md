# Phase 2 — Auth ✅ (nhánh `mem/quynh/login`)

Depends on Phase 1 (tokens, `Button`, `Card`). Back to [overview](00-overview.md).

File: `src/pages/auth/loginPage.jsx`. Spec §4.1.

> **No auth-flow changes.** Toàn bộ handler, tab Student/Lecturer logic, và luồng xác thực **không đổi**.
> Mọi thay đổi chỉ là markup + style.

## Diễn tiến

Ban đầu làm theo 5 commit "nền phẳng" như plan gốc. Sau đó **người dùng yêu cầu trực tiếp đổi hướng**:
giữ ảnh campus + liquid glass → phần lớn commit sau là redesign theo yêu cầu đó (ghi đè spec §4.1 "nền phẳng").
Spec §4.1 đã được cập nhật cho khớp thiết kế cuối.

### 5 commit đầu (theo plan gốc)

| # | Commit | Change |
|---|--------|--------|
| 1 | `[login] flat background` | Bỏ ảnh nền blur → nền phẳng. *(về sau bị ghi đè)* |
| 2 | `[login] Google button first (markup order)` | Chuyển nút Google lên trên form. Chỉ đổi DOM order. |
| 3 | `[login] add "hoặc" divider` | Divider "hoặc" giữa Google và form. |
| 4 | `[login] restyle Student/Lecturer tabs` | Tab active `--accent-bg` + `--accent`, bỏ shadow. Giữ logic. |
| 5 | `[login] card border over shadow` | Card 400px, bo 12px, viền thay shadow. *(về sau đổi sang glass)* |

### Redesign theo yêu cầu người dùng (ghi đè spec cũ)

| Commit | Change |
|--------|--------|
| `split-screen layout, restore campus image` | Khôi phục ảnh campus, bố cục split-screen (brand trái / form phải). |
| `full-screen background + liquid-glass form card` | Ảnh phủ full màn, form thành thẻ kính mờ. |
| `stronger liquid-glass card + translucent inputs` | Nền glass trong hơn, blur+saturate mạnh, viền sáng + inset highlight; input bán trong. |
| `swap background to clean campus photo` | Đổi ảnh sang `background-fpt.jpeg` (sạch, không chữ). |
| `lighten background overlay to keep photo bright` | Overlay chỉ tối góc dưới-trái, giữ ảnh sáng + text-shadow chữ brand. |
| `unify form to accent color + clearer glass inputs` | Đồng bộ toàn form về accent cam (submit/link/checkbox/focus); input rõ hơn. |
| `brand headline: bigger + orange gradient` → `enlarge to hero scale` | Headline brand cỡ hero. |
| `fix input double-border + refine headline` | Headline trắng + 1 dòng cam nhấn (bỏ in hoa); reset viền input. |
| `neutralize Chrome autofill box on glass inputs` | Khử nền autofill của Chrome (thủ phạm "hộp trong" ở input). |

## Kết quả (thiết kế đang chạy)

- Ảnh campus full-screen + split-screen; mobile ẩn ảnh brand, form căn giữa.
- Card = **liquid glass** (blur + saturate + viền sáng + inset highlight, fallback nền đặc).
- Google-first, divider "hoặc", form MSSV/mật khẩu; toàn form đồng bộ **accent cam FPT**.
- Headline brand cỡ hero (trắng + 1 dòng gradient cam).
- Input glass, focus viền accent, đã khử hộp autofill.

## Verify

- `npm run dev` → `/login` ở 1280 / 768 / 390 / 360px.
- Google trên form; divider "hoặc"; tab vẫn switch; login vẫn submit (không đổi hành vi submit).
- Không cuộn dọc trên desktop; ảnh sáng; input là một khung duy nhất kể cả khi Chrome autofill.

Next: [Phase 3 — Student](03-student.md).
