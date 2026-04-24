# Phân tích kỹ thuật upload tài liệu lên MinIO (Entrepreneurship-Hub)

## 1) Phạm vi phân tích

Tài liệu này phân tích luồng upload tài liệu trong `ehub-server/app`, tập trung vào:

- Cấu hình và kết nối MinIO: `app/config/minio.js`, `app/loaders/minio.loader.js`
- Abstraction lưu trữ: `app/core/services/storage.service.js`
- Luồng upload checkpoint: `app/modules/checkpoint/*`
- Luồng upload assignment: `app/modules/assignment/*`
- Cơ chế dọn dẹp upload dang dở: `app/core/workers/uploadCleanup.worker.js`

---

## 2) Kiến trúc upload hiện tại

### 2.1 Thành phần chính

- **MinIO client singleton** được tạo trong `minio.loader.js`; boot-time có kiểm tra kết nối bằng `listBuckets`.
- **Storage service** (`createStorageService`) cung cấp các hàm:
  - `init`, `save`, `remove`, `getUrl`
  - `generatePresignedPutUrl` (direct upload)
  - `statObject`, `listObjects` (xác minh/debug)
- **Checkpoint service** có 2 kiểu upload:
  - Kiểu 1: upload qua backend bằng `multer.memoryStorage()` và `storageService.save`
  - Kiểu 2: client upload trực tiếp MinIO qua presigned URL (`initiateUpload` + `confirmUpload`)
- **Upload cleanup worker** quét session hết hạn, xóa object mồ côi và bản ghi pending.

### 2.2 Hai luồng upload hiện đang tồn tại

#### A. Luồng upload qua backend (relay)

1. `POST /checkpoints/:id/submit` nhận `files` (multer memory).
2. Service tạo/cập nhật submission.
3. Xóa bản ghi file cũ trong DB.
4. Mỗi file được `save` vào MinIO theo key dạng:
   - `checkpoint_{id}/class_{id}/group_{id}/{timestamp}_{originalName}`
5. Sinh URL bằng `getUrl` rồi ghi DB.

#### B. Luồng direct upload (được thiết kế tối ưu hơn)

1. `POST /checkpoints/:id/upload` gửi metadata file (`name`, `size`, `type`).
2. Backend validate số lượng/kích thước, tạo `upload_session`.
3. Sinh `presignedPutObject` cho từng file với key chuẩn hóa:
   - `SUBJECT/CLASS/checkpoints/{cp}/groups/{group}/submissions/{submission}/{uuid}.{ext}`
4. Client upload trực tiếp lên MinIO.
5. `POST /checkpoints/:id/confirm-upload` để backend:
   - kiểm tra session
   - `statObject` từng file + retry
   - cập nhật `upload_status`, `etag`, `file_url`
   - finalize session `completed`.

---

## 3) Ưu điểm hiện tại

- **Đã có abstraction storage** nên không khóa cứng vào MinIO ở tầng nghiệp vụ.
- **Có direct upload bằng presigned URL**, giúp giảm tải API server cho file lớn/nhiều file.
- **Có bước confirm server-side**, tránh tin tưởng hoàn toàn client khi báo upload xong.
- **Có worker dọn session hết hạn**, giảm rác object và rác metadata.
- **Phân quyền nghiệp vụ tương đối rõ** (student/lecturer/admin) trong checkpoint flow.
- **Object key có phân cấp domain** ở luồng presigned (subject/class/checkpoint/group/submission), thuận tiện audit và lifecycle.

---

## 4) Nhược điểm và rủi ro kỹ thuật

## 4.1 Tính nhất quán API / code smell

- `assignment.service.js` gọi `storageService.uploadFile(...)` nhưng `storage.service.js` không có hàm này (chỉ có `save`).
  - Rủi ro: lỗi runtime tại endpoint upload assignment.
- Cấu hình `storageConfig.driver` mặc định là `local`, nhưng `createStorageService` lại mặc định `minio` nếu không truyền config.
  - Rủi ro: hành vi runtime phụ thuộc env theo cách khó đoán; dễ lệch giữa môi trường.

## 4.2 Hiệu năng và khả năng scale

- Luồng `submit` dùng `multer.memoryStorage()`:
  - giữ toàn bộ file trong RAM trước khi đẩy MinIO -> nguy cơ tăng memory footprint, OOM khi concurrent cao.
- `confirmUpload` đang verify tuần tự từng file, mỗi file retry bằng vòng lặp đồng bộ.
  - Khi số file lớn sẽ tăng latency confirm.
- Trong `getStudentCheckpoints`, URL từng file được gọi tuần tự `await` trong vòng lặp.
  - Dễ gây N+1 call và làm response chậm.

## 4.3 Tính toàn vẹn dữ liệu

- Khi resubmit:
  - DB xóa file cũ (`deleteSubmissionFiles`) trước khi chắc chắn object cũ trên MinIO được xóa.
  - Có thể sinh orphan object (DB mất tham chiếu nhưng object còn tồn tại).
- Chưa thấy transaction bao trùm toàn bộ các bước DB critical của `initiateUpload/confirmUpload`.
  - Có thể dẫn tới trạng thái trung gian khi lỗi giữa chừng.

## 4.4 Bảo mật và kiểm soát nội dung

- Validate MIME/type chủ yếu dựa metadata đầu vào từ client (đặc biệt luồng presigned).
  - Có thể bị spoof MIME.
- Chưa thấy scan malware/virus trước khi publish đường dẫn tải.
- URL tải file dựa presigned GET ngắn hạn là tốt, nhưng nếu lưu thẳng `file_url` vào DB thì có thể stale nhanh (hết hạn).

## 4.5 Vận hành và quan sát

- `confirmUpload` có gọi `listObjects()` để debug toàn bucket trong flow request.
  - Không tối ưu ở production (overhead + noisy log).
- Worker cleanup theo chu kỳ cứng 1 giờ, chưa thấy jitter/backoff hoặc metric giám sát chi tiết.

---

## 5) Đánh giá bài toán upload MinIO trong hệ thống này

### 5.1 Mức độ phù hợp hiện tại

- Với hệ thống LMS/team submission như hiện tại, chọn MinIO + presigned upload là **hợp lý** và có tiềm năng scale tốt.
- Thiết kế đã đi đúng hướng khi tách:
  - metadata + kiểm soát quyền ở backend
  - stream dữ liệu file đi trực tiếp object storage

### 5.2 Điểm nghẽn chính cần xử lý sớm

1. Sửa mismatch API `uploadFile` vs `save`.
2. Chuẩn hóa config driver (`local`/`minio`) để tránh behavior mơ hồ.
3. Giảm phụ thuộc `multer.memoryStorage` cho route có nguy cơ tải lớn.
4. Tăng tính atomic cho DB updates và cleanup object cũ.

---

## 6) Đề xuất cải tiến tối ưu hơn (khuyến nghị)

## 6.1 Kiến trúc target (khuyến nghị)

- **Ưu tiên một chuẩn duy nhất cho file lớn**: Direct-to-MinIO với presigned URL.
- **Backend chỉ làm control plane**:
  - xác thực quyền
  - cấp upload ticket/session
  - verify object + finalize metadata
- **Object storage làm data plane**:
  - client upload trực tiếp
  - hỗ trợ multipart upload khi file lớn

## 6.2 Cải tiến ngắn hạn (quick wins, 1-2 sprint)

1. **Fix lỗi runtime**
   - Đổi `storageService.uploadFile(...)` -> `storageService.save(...)` hoặc bổ sung alias `uploadFile`.
2. **Chuẩn hóa config**
   - Dùng thống nhất `STORAGE_DRIVER=minio|local`.
   - Truyền config rõ ràng vào `createStorageService`.
3. **Giới hạn upload chặt hơn**
   - Áp limit file size/count ngay từ middleware cho route relay.
   - Reject extension/mime không thuộc allowlist theo checkpoint policy.
4. **Tối ưu confirm**
   - Verify file theo batch song song có giới hạn (p-limit), thay vì tuần tự.
5. **Bỏ debug nặng trong request path**
   - Không `listObjects()` toàn bucket trong `confirmUpload` ở production.

## 6.3 Cải tiến trung hạn (3-5 sprint)

1. **Atomicity và idempotency**
   - Dùng transaction cho các bước DB critical (`create session`, `add pending files`, `finalize`).
   - Thêm idempotency key cho `confirmUpload`.
2. **TTL policy + object lifecycle**
   - Prefix tạm (`tmp/`) cho object chưa confirm.
   - Worker/lifecycle rule tự dọn `tmp/*` quá hạn.
3. **Bảo mật nội dung**
   - Tích hợp malware scanning async (ClamAV/queue worker).
   - Chỉ expose file sau khi scan pass.
4. **Quan sát hệ thống**
   - Metric: upload success rate, confirm latency, orphan cleanup count, retry count.
   - Structured logs với correlation id/session id.

## 6.4 Cải tiến dài hạn (scale lớn)

1. **Multipart upload chuẩn S3/MinIO**
   - Dành cho file lớn, mạng không ổn định.
2. **Event-driven finalize**
   - Dùng MinIO event notification (object created) + queue để giảm polling/confirm sync.
3. **Signed download on-demand**
   - Không lưu URL đã ký cố định trong DB; chỉ lưu `object_key`, sinh URL khi cần.

---

## 7) Mẫu quy trình tối ưu đề xuất

1. Client gọi `initiateUpload(filesMeta)` -> nhận `sessionId`, danh sách presigned URL.
2. Client upload trực tiếp MinIO (multipart nếu > ngưỡng).
3. Client gọi `completeUpload(sessionId, uploadedParts/etag)`.
4. Backend verify nhanh (head/stat), cập nhật DB trong transaction.
5. Backend phát event `submission.upload.completed`.
6. Worker hậu xử lý (scan, thumbnail, indexing, notification).

---

## 8) Kết luận

Giải pháp hiện tại đã có nền tảng tốt (đặc biệt direct upload + session confirm), nhưng vẫn tồn tại một số điểm có thể gây lỗi runtime, giảm hiệu năng và tạo dữ liệu mồ côi.  
Hướng tối ưu nhất cho bài toán này là chuyển trọng tâm sang **direct upload chuẩn hóa + finalize idempotent + quan sát/cleanup tốt**, đồng thời giữ backend ở vai trò điều phối và kiểm soát nghiệp vụ.

