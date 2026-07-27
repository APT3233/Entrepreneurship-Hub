-- Mentor flow completion phase 3: điểm danh buổi mentoring + giảng viên tự xếp lịch cho nhóm mình.

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('mentor.attendance.manage', 'Manage mentoring attendance', 'mentor', 'Chốt điểm danh người tham dự buổi mentoring');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code = 'mentor.attendance.manage'
WHERE r.role_code IN ('admin', 'department_head', 'lecturer', 'mentor');

-- Giảng viên trước đây chỉ có mentor.session.read; nay được tự tạo và điều chỉnh buổi mentoring cho nhóm mình.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.session.create', 'mentor.session.update', 'mentor.session.status'
) WHERE r.role_code = 'lecturer';
