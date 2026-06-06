CREATE TABLE IF NOT EXISTS lecturer_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    department VARCHAR(150) NULL,
    academic_title VARCHAR(100) NULL,
    specialization VARCHAR(255) NULL,
    office_location VARCHAR(255) NULL,
    contact_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_lecturer_profile_user (user_id),
    CONSTRAINT fk_lecturer_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('core.lecturer.read', 'View lecturers', 'core', 'View lecturer management data'),
('core.lecturer.create', 'Create lecturers', 'core', 'Create lecturer accounts'),
('core.lecturer.update', 'Update lecturers', 'core', 'Update lecturer account and profile data'),
('core.lecturer.assign_class', 'Assign lecturer to class', 'core', 'Assign or change primary lecturer of a class'),
('core.lecturer.view_workload', 'View lecturer workload', 'core', 'View lecturer workload and grading progress'),
('core.lecturer.view_activity', 'View lecturer activity', 'core', 'View lecturer audit and API activity'),
('core.lecturer.export', 'Export lecturers', 'core', 'Export lecturer management data'),
('core.lecturer.delete', 'Delete lecturers', 'core', 'Delete lecturer accounts that are not assigned to any class');
