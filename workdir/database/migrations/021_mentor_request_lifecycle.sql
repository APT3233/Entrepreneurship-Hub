-- Mentor flow completion phase 5: liên thông yêu cầu mentor của giảng viên với yêu cầu matching,
-- để không phải mô tả lại nhu cầu hai lần và truy được nguồn gốc của một matching request.

ALTER TABLE mentor_matching_requests
  ADD COLUMN source_assignment_request_id BIGINT UNSIGNED NULL AFTER requested_by,
  ADD INDEX idx_matching_source_request (source_assignment_request_id),
  ADD CONSTRAINT fk_matching_source_request
    FOREIGN KEY (source_assignment_request_id) REFERENCES mentor_assignment_requests(id) ON DELETE SET NULL;
