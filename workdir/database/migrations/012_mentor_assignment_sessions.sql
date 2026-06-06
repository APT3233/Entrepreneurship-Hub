-- Module 4 Phases 3-4: manual mentor assignment workflow and mentoring sessions.

CREATE TABLE IF NOT EXISTS mentor_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    semester_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED NULL,
    approved_by BIGINT UNSIGNED NULL,
    assignment_type ENUM('primary','supporting','business','technical') NOT NULL DEFAULT 'primary',
    status ENUM('proposed','pending_mentor','active','rejected','cancelled','completed') NOT NULL DEFAULT 'pending_mentor',
    start_date DATE NULL,
    end_date DATE NULL,
    expected_sessions INT UNSIGNED NULL,
    note TEXT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    active_primary_group_key BIGINT UNSIGNED GENERATED ALWAYS AS (
      CASE WHEN deleted_at IS NULL AND status = 'active' AND assignment_type = 'primary' THEN group_id ELSE NULL END
    ) STORED,
    open_mentor_group_key VARCHAR(80) GENERATED ALWAYS AS (
      CASE WHEN deleted_at IS NULL AND status IN ('proposed','pending_mentor','active') THEN CONCAT(group_id, ':', mentor_id) ELSE NULL END
    ) STORED,
    UNIQUE KEY uk_mentor_assignment_active_primary (active_primary_group_key),
    UNIQUE KEY uk_mentor_assignment_open_pair (open_mentor_group_key),
    INDEX idx_mentor_assignment_mentor (mentor_id),
    INDEX idx_mentor_assignment_group (group_id),
    INDEX idx_mentor_assignment_class (class_id),
    INDEX idx_mentor_assignment_semester (semester_id),
    INDEX idx_mentor_assignment_subject (subject_id),
    INDEX idx_mentor_assignment_status (status),
    INDEX idx_mentor_assignment_type (assignment_type),
    CONSTRAINT fk_mentor_assignment_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_mentor_assignment_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_mentor_assignment_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_assignment_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    requested_by BIGINT UNSIGNED NULL,
    requested_role ENUM('business','technical','any') NOT NULL DEFAULT 'any',
    requested_expertise JSON NULL,
    problem_statement TEXT NULL,
    support_needed TEXT NOT NULL,
    priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    status ENUM('open','matched','closed','cancelled') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    closed_at TIMESTAMP NULL,
    INDEX idx_mentor_request_group (group_id),
    INDEX idx_mentor_request_status_priority (status, priority),
    INDEX idx_mentor_request_requested_by (requested_by),
    CONSTRAINT fk_mentor_request_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_request_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_assignment_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT UNSIGNED NOT NULL,
    action ENUM('proposed','approved','rejected','activated','cancelled','completed','changed') NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    actor_id BIGINT UNSIGNED NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_mentor_history_assignment (assignment_id),
    INDEX idx_mentor_history_actor (actor_id),
    CONSTRAINT fk_mentor_history_assignment FOREIGN KEY (assignment_id) REFERENCES mentor_assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_history_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT UNSIGNED NOT NULL,
    mentor_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    semester_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    session_type ENUM('online','offline','hybrid') NOT NULL DEFAULT 'online',
    meeting_link VARCHAR(500) NULL,
    location VARCHAR(255) NULL,
    scheduled_start_at DATETIME NOT NULL,
    scheduled_end_at DATETIME NOT NULL,
    actual_start_at DATETIME NULL,
    actual_end_at DATETIME NULL,
    duration_minutes INT UNSIGNED NULL,
    status ENUM('scheduled','completed','cancelled','no_show','rescheduled') NOT NULL DEFAULT 'scheduled',
    created_by BIGINT UNSIGNED NULL,
    cancelled_by BIGINT UNSIGNED NULL,
    cancellation_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_mentoring_session_assignment (assignment_id),
    INDEX idx_mentoring_session_mentor (mentor_id),
    INDEX idx_mentoring_session_group (group_id),
    INDEX idx_mentoring_session_class (class_id),
    INDEX idx_mentoring_session_status_time (status, scheduled_start_at),
    CONSTRAINT fk_mentoring_session_assignment FOREIGN KEY (assignment_id) REFERENCES mentor_assignments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_mentoring_session_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_mentoring_session_scheduled_time CHECK (scheduled_start_at < scheduled_end_at),
    CONSTRAINT chk_mentoring_session_actual_time CHECK (actual_start_at IS NULL OR actual_end_at IS NULL OR actual_start_at <= actual_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_session_attendees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    student_id BIGINT UNSIGNED NULL,
    mentor_id BIGINT UNSIGNED NULL,
    attendee_type ENUM('mentor','student','lecturer','guest') NOT NULL,
    attendance_status ENUM('invited','attended','absent','late') NOT NULL DEFAULT 'invited',
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_session_attendee_session (session_id),
    INDEX idx_session_attendee_user (user_id),
    INDEX idx_session_attendee_student (student_id),
    INDEX idx_session_attendee_mentor (mentor_id),
    CONSTRAINT fk_session_attendee_session FOREIGN KEY (session_id) REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_attendee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_session_attendee_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT fk_session_attendee_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_session_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NULL,
    note_type ENUM('mentor_note','student_note','lecturer_note','private_admin_note') NOT NULL DEFAULT 'mentor_note',
    content TEXT NOT NULL,
    visibility ENUM('private_to_author','internal','shared_with_group','shared_with_mentor') NOT NULL DEFAULT 'internal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_session_note_session (session_id),
    INDEX idx_session_note_author (author_id),
    CONSTRAINT fk_session_note_session FOREIGN KEY (session_id) REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_note_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_feedbacks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    assignment_id BIGINT UNSIGNED NOT NULL,
    from_user_id BIGINT UNSIGNED NULL,
    from_role ENUM('mentor','student','lecturer','admin') NOT NULL,
    target_type ENUM('mentor','group','session') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NULL,
    feedback TEXT NULL,
    strengths TEXT NULL,
    improvements TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_mentoring_feedback_once (session_id, from_user_id, target_type, target_id),
    INDEX idx_mentoring_feedback_session (session_id),
    INDEX idx_mentoring_feedback_assignment (assignment_id),
    INDEX idx_mentoring_feedback_from_user (from_user_id),
    CONSTRAINT fk_mentoring_feedback_session FOREIGN KEY (session_id) REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentoring_feedback_assignment FOREIGN KEY (assignment_id) REFERENCES mentor_assignments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_feedback_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_mentoring_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_action_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    assigned_to_user_id BIGINT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    due_date DATE NULL,
    status ENUM('open','in_progress','done','cancelled') NOT NULL DEFAULT 'open',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_action_item_session (session_id),
    INDEX idx_action_item_group (group_id),
    INDEX idx_action_item_status (status),
    CONSTRAINT fk_action_item_session FOREIGN KEY (session_id) REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_action_item_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_action_item_assignee FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_action_item_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('mentor.assignment.read', 'Read mentor assignments', 'mentor', 'Read mentor assignment workflow data'),
('mentor.assignment.create', 'Create mentor assignments', 'mentor', 'Assign mentors manually to groups'),
('mentor.assignment.update', 'Update mentor assignments', 'mentor', 'Update mentor assignment metadata'),
('mentor.assignment.approve', 'Approve mentor assignments', 'mentor', 'Approve or activate mentor assignments'),
('mentor.assignment.cancel', 'Cancel mentor assignments', 'mentor', 'Cancel mentor assignments'),
('mentor.assignment.complete', 'Complete mentor assignments', 'mentor', 'Complete mentor assignments'),
('mentor.assignment.request', 'Request mentor assignment', 'mentor', 'Request mentor support for a group'),
('mentor.assignment.respond', 'Respond to assignment', 'mentor', 'Mentor accepts or declines assignments'),
('mentor.session.read', 'Read mentoring sessions', 'mentor', 'Read mentoring sessions'),
('mentor.session.create', 'Create mentoring sessions', 'mentor', 'Create mentoring sessions'),
('mentor.session.update', 'Update mentoring sessions', 'mentor', 'Update mentoring sessions'),
('mentor.session.status', 'Change mentoring session status', 'mentor', 'Change mentoring session status'),
('mentor.feedback.manage', 'Manage mentoring feedback', 'mentor', 'Create and read mentoring feedback'),
('mentor.action_item.manage', 'Manage mentoring action items', 'mentor', 'Create and update mentoring action items');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'mentor'
WHERE r.role_code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.assignment.read', 'mentor.assignment.create', 'mentor.assignment.update',
  'mentor.assignment.approve', 'mentor.assignment.cancel', 'mentor.assignment.complete',
  'mentor.assignment.request', 'mentor.session.read', 'mentor.feedback.manage',
  'mentor.action_item.manage'
) WHERE r.role_code = 'department_head';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.assignment.read', 'mentor.assignment.request', 'mentor.session.read',
  'mentor.feedback.manage', 'mentor.action_item.manage'
) WHERE r.role_code = 'lecturer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.assignment.read', 'mentor.assignment.respond', 'mentor.session.read',
  'mentor.session.create', 'mentor.session.update', 'mentor.session.status',
  'mentor.feedback.manage', 'mentor.action_item.manage'
) WHERE r.role_code = 'mentor';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.session.read', 'mentor.feedback.manage', 'mentor.action_item.manage'
) WHERE r.role_code = 'student';
