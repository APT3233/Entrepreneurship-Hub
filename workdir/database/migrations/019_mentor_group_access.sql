-- Mentor flow completion phase 2: mentor xem được nhóm mình phụ trách (read-only).

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('mentor.group.read', 'Read mentored group detail', 'mentor', 'Mentor xem thành viên, đề tài và tiến độ checkpoint của nhóm mình phụ trách');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code = 'mentor.group.read'
WHERE r.role_code IN ('admin', 'department_head', 'mentor');
