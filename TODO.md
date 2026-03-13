[] 
[] 1. Invitation flow (nên dùng)
Khi lecturer enroll sinh viên:

Nếu sinh viên chưa có user_id:
Tạo user (username = email, password tạm hoặc null).
Gửi email mời với link kích hoạt (magic link hoặc token).
Sinh viên click link → đặt mật khẩu → kích hoạt tài khoản.
Cập nhật students.user_id = user vừa tạo.
Ưu điểm: Bảo mật, sinh viên tự đặt mật khẩu.

2. Tự tạo tài khoản khi enroll
Khi enroll:

Nếu sinh viên chưa có user_id:
Tạo user với mật khẩu mặc định (vd: student_code hoặc random).
Gửi email thông báo: “Bạn đã được thêm vào lớp, mật khẩu tạm: xxx, vui lòng đổi mật khẩu khi đăng nhập lần đầu.”
Cập nhật students.user_id.
Ưu điểm: Đơn giản, sinh viên vào được ngay.
Nhược điểm: Mật khẩu tạm có thể bị lộ qua email.

3. Self-registration (sinh viên tự đăng ký)
Thêm màn hình “Đăng ký tài khoản sinh viên”:

Sinh viên nhập student_code + email.
Backend kiểm tra:
Có trong students không.
Email khớp với bản ghi student.
Nếu hợp lệ → cho phép tạo mật khẩu và tạo user.
Cập nhật students.user_id.
Ưu điểm: Không cần gửi email, sinh viên chủ động.
Nhược điểm: Cần xác thực chặt (email, OTP, v.v.).

4. Import + gửi invite hàng loạt
Khi import danh sách sinh viên:

Tạo user cho từng sinh viên (hoặc chỉ tạo khi enroll).
Gửi email invite hàng loạt với link kích hoạt.
Đề xuất triển khai
Nên kết hợp 1 + 3:

Invitation khi enroll

Khi lecturer enroll sinh viên chưa có tài khoản → tạo user + gửi email invite (link kích hoạt + đặt mật khẩu).
Self-registration

Màn hình “Đăng ký tài khoản” cho sinh viên: nhập student_code + email → xác thực → tạo mật khẩu.
EventBus

Emit event ENROLLMENT_ADDED khi enroll → listener xử lý tạo user + gửi email (theo rule1).
Nếu bạn chọn một trong các hướng trên, tôi có thể đề xuất chi tiết API, schema và flow code cụ thể cho backend hiện tại.