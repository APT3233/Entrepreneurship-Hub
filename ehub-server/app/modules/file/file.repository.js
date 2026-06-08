export const createFileRepository = ({ db }) => {
  const findAssignmentAttachmentsByPath = async (filePath) => {
    const encodedPath = encodeURIComponent(filePath);
    const sql = `
      SELECT a.id AS resource_id, a.class_id, c.lecturer_id, 'assignment_attachment' AS source
      FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND a.attachment_url IS NOT NULL
        AND (INSTR(a.attachment_url, :filePath) > 0 OR INSTR(a.attachment_url, :encodedPath) > 0)
    `;
    const [rows] = await db.execute(sql, { filePath, encodedPath });
    return rows;
  };

  const findCheckpointAttachmentsByPath = async (filePath) => {
    const encodedPath = encodeURIComponent(filePath);
    const sql = `
      SELECT cp.id AS resource_id, cp.class_id, cp.status, c.lecturer_id, 'checkpoint_attachment' AS source
      FROM checkpoints cp
      JOIN classes c ON c.id = cp.class_id
      WHERE cp.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND cp.attachment_url IS NOT NULL
        AND (INSTR(cp.attachment_url, :filePath) > 0 OR INSTR(cp.attachment_url, :encodedPath) > 0)
    `;
    const [rows] = await db.execute(sql, { filePath, encodedPath });
    return rows;
  };

  const findAssignmentSubmissionFilesByPath = async (filePath) => {
    const sql = `
      SELECT
        f.id AS file_id,
        s.assignment_id AS resource_id,
        s.group_id,
        a.class_id,
        c.lecturer_id,
        f.uploaded_by,
        'assignment_submission' AS source
      FROM assignment_submission_files f
      JOIN assignment_submissions s ON s.id = f.submission_id
      JOIN assignments a ON a.id = s.assignment_id
      JOIN classes c ON c.id = a.class_id
      WHERE f.file_path = :filePath
        AND f.is_deleted = 0
        AND a.deleted_at IS NULL
        AND c.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { filePath });
    return rows;
  };

  const findCheckpointSubmissionFilesByPath = async (filePath) => {
    const sql = `
      SELECT
        f.id AS file_id,
        cs.checkpoint_id AS resource_id,
        cs.group_id,
        cp.class_id,
        c.lecturer_id,
        f.uploaded_by,
        f.upload_status,
        'checkpoint_submission' AS source
      FROM checkpoint_submission_files f
      JOIN checkpoint_submissions cs ON cs.id = f.submission_id
      JOIN checkpoints cp ON cp.id = cs.checkpoint_id
      JOIN classes c ON c.id = cp.class_id
      WHERE f.file_path = :filePath
        AND f.is_deleted = 0
        AND (f.upload_status IS NULL OR f.upload_status = 'uploaded')
        AND cp.deleted_at IS NULL
        AND c.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { filePath });
    return rows;
  };

  const findMentorDocumentsByPath = async (filePath) => {
    const sql = `
      SELECT
        md.id AS document_id,
        md.mentor_id,
        md.file_path,
        mp.user_id AS mentor_user_id,
        'mentor_document' AS source
      FROM mentor_documents md
      JOIN mentor_profiles mp ON mp.id = md.mentor_id
      WHERE md.file_path = :filePath
        AND md.deleted_at IS NULL
        AND mp.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { filePath });
    return rows;
  };

  const findStartupDocumentsByPath = async (filePath) => {
    const sql = `
      SELECT
        sd.id AS document_id,
        sd.startup_id,
        sd.file_path,
        sd.visibility,
        sp.class_id,
        c.lecturer_id,
        sf.user_id AS founder_user_id,
        'startup_document' AS source
      FROM startup_documents sd
      JOIN startup_profiles sp ON sp.id = sd.startup_id
      LEFT JOIN classes c ON c.id = sp.class_id
      LEFT JOIN startup_founders sf ON sf.startup_id = sp.id AND sf.status = 'active'
      WHERE sd.file_path = :filePath
        AND sd.deleted_at IS NULL
        AND sp.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { filePath });
    return rows;
  };

  const userHasPermission = async (userId, permissionCode) => {
    const sql = `
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = :userId AND p.permission_code = :permissionCode
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { userId: Number(userId), permissionCode });
    return rows.length > 0;
  };

  const isStudentEnrolledInClass = async (userId, classId) => {
    const sql = `
      SELECT 1
      FROM class_students cs
      JOIN students s ON s.id = cs.student_id
      WHERE s.user_id = :userId
        AND cs.class_id = :classId
        AND cs.status = 'enrolled'
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, {
      userId: Number(userId),
      classId: Number(classId),
    });
    return rows.length > 0;
  };

  const isStudentInGroup = async (userId, groupId) => {
    const sql = `
      SELECT 1
      FROM group_members gm
      JOIN students s ON s.id = gm.student_id
      WHERE s.user_id = :userId
        AND gm.group_id = :groupId
        AND gm.status = 'active'
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, {
      userId: Number(userId),
      groupId: Number(groupId),
    });
    return rows.length > 0;
  };

  return {
    findAssignmentAttachmentsByPath,
    findCheckpointAttachmentsByPath,
    findAssignmentSubmissionFilesByPath,
    findCheckpointSubmissionFilesByPath,
    findMentorDocumentsByPath,
    findStartupDocumentsByPath,
    userHasPermission,
    isStudentEnrolledInClass,
    isStudentInGroup,
  };
};
