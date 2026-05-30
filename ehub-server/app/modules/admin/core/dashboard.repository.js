export const createAdminDashboardRepository = ({ db }) => {
  const countOne = async (sql, params = {}) => {
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.total || 0);
  };

  const getDashboardStats = async () => {
    const [
      totalUsers,
      totalLecturers,
      totalStudents,
      totalClasses,
      totalGroups,
      pendingClassInvites,
      pendingGroupInvites,
      pendingCheckpointGrades,
      pendingAssignmentGrades,
    ] = await Promise.all([
      countOne("SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL"),
      countOne(`
        SELECT COUNT(DISTINCT u.id) AS total
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.deleted_at IS NULL AND r.role_code = 'lecturer'
      `),
      countOne(`
        SELECT COUNT(DISTINCT u.id) AS total
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.deleted_at IS NULL AND r.role_code = 'student'
      `),
      countOne("SELECT COUNT(*) AS total FROM classes WHERE deleted_at IS NULL"),
      countOne("SELECT COUNT(*) AS total FROM `groups` WHERE deleted_at IS NULL"),
      countOne("SELECT COUNT(*) AS total FROM class_invites WHERE used = 0 AND expires_at >= NOW()"),
      countOne("SELECT COUNT(*) AS total FROM group_invites WHERE status = 'pending' AND expires_at >= NOW()"),
      countOne(`
        SELECT COUNT(*) AS total
        FROM checkpoint_submissions cs
        JOIN checkpoints cp ON cp.id = cs.checkpoint_id
        WHERE cp.deleted_at IS NULL
          AND cs.status IN ('submitted', 'resubmitted')
          AND cs.score IS NULL
      `),
      countOne(`
        SELECT COUNT(*) AS total
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id
        WHERE a.deleted_at IS NULL
          AND s.status IN ('submitted', 'resubmitted')
          AND s.score IS NULL
      `),
    ]);

    return {
      totalUsers,
      totalLecturers,
      totalStudents,
      totalClasses,
      totalGroups,
      pendingInvites: pendingClassInvites + pendingGroupInvites,
      needGrading: pendingCheckpointGrades + pendingAssignmentGrades,
    };
  };

  return { getDashboardStats };
};
