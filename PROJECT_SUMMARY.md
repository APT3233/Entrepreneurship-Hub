# Tổng kết Dự án E-HUB (Entrepreneurship Hub)

## 1. Khái quát Dự án
**E-HUB (Entrepreneurship Hub)** là một dự án chiến lược của Bộ môn Khởi nghiệp (Entrepreneurship Department) tại Đại học FPT. Mục tiêu chính là xây dựng một hệ thống kỹ thuật số tập trung để quản lý, lưu trữ và khai thác dữ liệu cho tất cả các hoạt động học thuật liên quan đến khởi nghiệp.

Hệ thống hướng tới việc thay thế các quy trình quản lý thủ công qua file Excel rời rạc bằng một nền tảng hiện đại, có phân quyền rõ ràng, đảm bảo tính nhất quán và khả năng kế thừa dữ liệu qua các học kỳ.

---

## 2. Các Module và Chức năng chính

### Module 1: Quản lý cốt lõi (Core Management)
Đây là nền tảng của toàn bộ hệ thống, tập trung vào việc quản lý dữ liệu gốc:
*   **Quản lý Thực thể:** Học phần (EXE101, EXE201), Học kỳ (Spring, Summer, Fall), Lớp học, Sinh viên và Nhóm.
*   **Phân quyền (RBAC):** Hệ thống phân quyền chi tiết cho Admin, Trưởng bộ môn, Giảng viên và Sinh viên.
*   **Quản lý Enrollment:** Giảng viên có thể thêm sinh viên vào lớp thủ công hoặc import hàng loạt từ file Excel.
*   **Quản lý Nhóm:** Hỗ trợ chia nhóm trong lớp, chỉ định trưởng nhóm và quản lý thành viên.
*   **Nhật ký hệ thống (Audit Logs):** Ghi lại mọi thao tác thay đổi dữ liệu để đảm bảo tính minh bạch.

### Module 2: Dự án và Dữ liệu (Project & Data)
Tập trung vào việc lưu trữ sản phẩm của sinh viên:
*   **Project Space:** Mỗi nhóm sinh viên có một không gian riêng để lưu trữ thông tin dự án startup.
*   **Quản lý Checkpoint:** Hệ thống quản lý các mốc nộp bài (assignments) theo tiến độ môn học.
*   **Lưu trữ vĩnh viễn:** Toàn bộ bài nộp, tài liệu dự án được lưu trữ tập trung, phục vụ việc tra cứu và đánh giá chất lượng sau này.

---

## 3. Tiến độ thực hiện (Cập nhật 20/04/2026)

### Đã hoàn thành (Backend & Database)
*   ✅ **Thiết kế Database:** Hoàn thiện schema cho Module 1 với 15 bảng lõi (Users, Roles, Permissions, Classes, Students, Groups, Audit Logs...).
*   ✅ **Hệ thống API Core:** Triển khai các module backend cho Auth, User, Class, Group, Semester, Subject, Student.
*   ✅ **Cơ sở hạ tầng:** Thiết lập Cloudflare Tunnel, tích hợp Google Login, hệ thống gửi Email thông báo.

### Đang triển khai (Frontend - React)
*   🟡 **Giao diện Giảng viên (Lecture):** Đang xây dựng Dashboard, quản lý lớp học, quản lý nhóm và danh sách sinh viên.
*   🟡 **Giao diện Sinh viên (Student):** Triển khai tính năng xem nhóm và tham gia dự án.
*   🟡 **Module chấm điểm (Grading):** Đang trong giai đoạn phát triển ban đầu.

### Kế hoạch tiếp theo (TODO)
*   🚀 **Luồng Invitation:** Tự động gửi email mời sinh viên kích hoạt tài khoản khi được add vào lớp.
*   🚀 **Self-registration:** Cho phép sinh viên tự đăng ký tài khoản dựa trên mã số sinh viên và email đã có trong hệ thống.
*   🚀 **Import/Export nâng cao:** Tối ưu hóa bộ công cụ xử lý file Excel để giảm tải công việc cho giảng viên.

---

## 4. Công nghệ sử dụng
*   **Backend:** Node.js, Express.js.
*   **Frontend:** React.js (Vite).
*   **Database:** MySQL.
*   **DevOps/Infra:** Cloudflare, Docker.
