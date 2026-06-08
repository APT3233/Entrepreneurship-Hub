import { normalizeHistoryRow, normalizeStartupRow, parseJsonValue, toJsonString } from "./incubation.mapper.js";

const pageSql = (limit, offset) => `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

const currentEntryJoin = `
  LEFT JOIN startup_pipeline_entries spe
    ON spe.startup_id = sp.id
   AND spe.exited_at IS NULL
   AND spe.status IN ('active','on_hold')
  LEFT JOIN startup_pipeline_stages st ON st.id = spe.current_stage_id
`;

const startupSelect = `
  sp.*,
  g.group_code, g.group_name, g.topic, g.topic_desc,
  c.class_code, c.class_name, c.lecturer_id,
  sem.semester_code, sem.semester_name,
  sub.subject_code, sub.subject_name,
  selected.full_name AS selected_by_name,
  creator.full_name AS created_by_name,
  spe.id AS pipeline_entry_id,
  spe.current_stage_id,
  spe.previous_stage_id,
  spe.status AS pipeline_status,
  spe.entered_at AS pipeline_entered_at,
  spe.updated_by AS pipeline_updated_by,
  st.code AS current_stage_code,
  st.name AS current_stage_name,
  st.order_index AS current_stage_order,
  (SELECT COUNT(*) FROM startup_founders sf WHERE sf.startup_id = sp.id AND sf.status = 'active') AS founder_count,
  (SELECT COUNT(*) FROM startup_documents sd WHERE sd.startup_id = sp.id AND sd.deleted_at IS NULL) AS document_count,
  (SELECT COUNT(*) FROM startup_milestones sm WHERE sm.startup_id = sp.id AND sm.deleted_at IS NULL) AS milestone_count
`;

const startupFrom = `
  FROM startup_profiles sp
  LEFT JOIN \`groups\` g ON g.id = sp.group_id
  LEFT JOIN classes c ON c.id = sp.class_id
  LEFT JOIN semesters sem ON sem.id = sp.semester_id
  LEFT JOIN subjects sub ON sub.id = sp.subject_id
  LEFT JOIN users selected ON selected.id = sp.selected_by
  LEFT JOIN users creator ON creator.id = sp.created_by
  ${currentEntryJoin}
`;

const cleanReviewRow = (row) => row ? ({
  ...row,
  average_score: row.average_score === null || row.average_score === undefined ? null : Number(row.average_score),
  potential_score: row.potential_score === null || row.potential_score === undefined ? null : Number(row.potential_score),
}) : null;

const normalizeMetricRow = (row) => row ? ({
  ...row,
  users_count: row.users_count === null || row.users_count === undefined ? null : Number(row.users_count),
  customers_count: row.customers_count === null || row.customers_count === undefined ? null : Number(row.customers_count),
  revenue_amount: row.revenue_amount === null || row.revenue_amount === undefined ? null : Number(row.revenue_amount),
  team_size: row.team_size === null || row.team_size === undefined ? null : Number(row.team_size),
  mvp_completed: Boolean(row.mvp_completed),
  market_validated: Boolean(row.market_validated),
  has_demo: Boolean(row.has_demo),
  has_pitch_deck: Boolean(row.has_pitch_deck),
  has_business_model: Boolean(row.has_business_model),
}) : null;

const normalizeEventRow = (row) => row ? ({
  ...row,
  total_startups: Number(row.total_startups || 0),
  total_judges: Number(row.total_judges || 0),
  total_feedbacks: Number(row.total_feedbacks || 0),
}) : null;

const normalizePartnerRow = (row) => row ? ({
  ...row,
  focus_areas: parseJsonValue(row.focus_areas, []),
  connection_count: Number(row.connection_count || 0),
  opportunity_count: Number(row.opportunity_count || 0),
}) : null;

export const createIncubationRepository = ({ db }) => {
  const startupWhere = (query = {}) => {
    const params = {};
    const where = ["sp.deleted_at IS NULL"];
    if (query.search) {
      where.push("(sp.startup_name LIKE :search OR sp.category LIKE :search OR sp.industry LIKE :search OR g.topic LIKE :search OR g.group_name LIKE :search)");
      params.search = `%${query.search}%`;
    }
    if (query.semesterId) { where.push("sp.semester_id = :semesterId"); params.semesterId = Number(query.semesterId); }
    if (query.subjectId) { where.push("sp.subject_id = :subjectId"); params.subjectId = Number(query.subjectId); }
    if (query.classId) { where.push("sp.class_id = :classId"); params.classId = Number(query.classId); }
    if (query.status) { where.push("sp.startup_status = :status"); params.status = query.status; }
    if (query.productStage) { where.push("sp.product_stage = :productStage"); params.productStage = query.productStage; }
    if (query.pipelineStageId) { where.push("spe.current_stage_id = :pipelineStageId"); params.pipelineStageId = Number(query.pipelineStageId); }
    if (query.source) { where.push("sp.source = :source"); params.source = query.source; }
    if (query.minScore !== null && query.minScore !== undefined && query.minScore !== "") { where.push("COALESCE(sp.selected_score, 0) >= :minScore"); params.minScore = Number(query.minScore); }
    if (query.maxScore !== null && query.maxScore !== undefined && query.maxScore !== "") { where.push("COALESCE(sp.selected_score, 0) <= :maxScore"); params.maxScore = Number(query.maxScore); }
    if (query.lecturerId) { where.push("c.lecturer_id = :lecturerId"); params.lecturerId = Number(query.lecturerId); }
    if (query.founderUserId) {
      where.push(`EXISTS (
        SELECT 1 FROM startup_founders sf
        WHERE sf.startup_id = sp.id AND sf.user_id = :founderUserId AND sf.status = 'active'
      )`);
      params.founderUserId = Number(query.founderUserId);
    }
    return { whereSql: where.join(" AND "), params };
  };

  const listStartups = async (query) => {
    const { whereSql, params } = startupWhere(query);
    const [rows] = await db.execute(
      `SELECT ${startupSelect} ${startupFrom} WHERE ${whereSql} ORDER BY sp.updated_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total ${startupFrom} WHERE ${whereSql}`, params);
    return { rows: rows.map(normalizeStartupRow), total: Number(totalRows[0]?.total || 0) };
  };

  const findStartupById = async (id, includeDeleted = false) => {
    const [rows] = await db.execute(
      `SELECT ${startupSelect} ${startupFrom} WHERE sp.id = :id ${includeDeleted ? "" : "AND sp.deleted_at IS NULL"} LIMIT 1`,
      { id: Number(id) },
    );
    return normalizeStartupRow(rows[0]);
  };

  const findStartupBySlug = async (slug, excludeId = null) => {
    const params = { slug };
    let sql = "SELECT id FROM startup_profiles WHERE slug = :slug AND deleted_at IS NULL";
    if (excludeId) { sql += " AND id <> :excludeId"; params.excludeId = Number(excludeId); }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const findActiveStartupByGroup = async (groupId, excludeId = null) => {
    const params = { groupId: Number(groupId) };
    let sql = "SELECT id FROM startup_profiles WHERE group_id = :groupId AND deleted_at IS NULL AND startup_status NOT IN ('archived','rejected')";
    if (excludeId) { sql += " AND id <> :excludeId"; params.excludeId = Number(excludeId); }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const findGroupContext = async (groupId) => {
    const [rows] = await db.execute(
      `
        SELECT g.*, c.id AS class_id, c.class_code, c.class_name, c.lecturer_id, c.semester_id, c.subject_id,
               sem.semester_code, sem.semester_name, sub.subject_code, sub.subject_name,
               ROUND(AVG(CASE WHEN es.status IN ('submitted','confirmed') AND es.is_official = 1 THEN es.total_score END), 2) AS average_score,
               GROUP_CONCAT(DISTINCT CASE WHEN es.status IN ('submitted','confirmed') AND es.overall_feedback IS NOT NULL THEN es.overall_feedback END SEPARATOR '\n---\n') AS feedback_summary
        FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id AND c.deleted_at IS NULL
        JOIN semesters sem ON sem.id = c.semester_id
        JOIN subjects sub ON sub.id = c.subject_id
        LEFT JOIN evaluation_sessions es ON es.group_id = g.id
        WHERE g.id = :groupId AND g.deleted_at IS NULL
        GROUP BY g.id, c.id, sem.id, sub.id
        LIMIT 1
      `,
      { groupId: Number(groupId) },
    );
    return rows[0] ? { ...rows[0], average_score: rows[0].average_score === null ? null : Number(rows[0].average_score) } : null;
  };

  const listGroupMembers = async (groupId) => {
    const [rows] = await db.execute(
      `
        SELECT gm.id AS group_member_id, gm.role AS group_role, gm.joined_at,
               s.id AS student_id, s.user_id, s.full_name, s.email, s.phone
        FROM group_members gm
        JOIN students s ON s.id = gm.student_id AND s.deleted_at IS NULL
        WHERE gm.group_id = :groupId AND gm.status = 'active'
        ORDER BY gm.role = 'leader' DESC, gm.joined_at ASC
      `,
      { groupId: Number(groupId) },
    );
    return rows;
  };

  const createStartup = async (data, conn = db) => {
    const [result] = await conn.execute(
      `
        INSERT INTO startup_profiles
          (group_id, class_id, semester_id, subject_id, startup_name, slug, logo_url, tagline,
           short_description, full_description, problem_statement, solution_description, target_customers,
           business_model, product_stage, startup_status, category, industry, technology_tags,
           website_url, github_url, demo_url, pitch_deck_url, video_url, source, selected_score,
           selected_reason, selected_by, selected_at, created_by)
        VALUES
          (:group_id, :class_id, :semester_id, :subject_id, :startup_name, :slug, :logo_url, :tagline,
           :short_description, :full_description, :problem_statement, :solution_description, :target_customers,
           :business_model, :product_stage, :startup_status, :category, :industry, :technology_tags,
           :website_url, :github_url, :demo_url, :pitch_deck_url, :video_url, :source, :selected_score,
           :selected_reason, :selected_by, :selected_at, :created_by)
      `,
      { ...data, technology_tags: toJsonString(data.technology_tags) },
    );
    return result.insertId;
  };

  const updateStartup = async (id, data, conn = db) => {
    const payload = { ...data };
    if (Object.prototype.hasOwnProperty.call(payload, "technology_tags")) payload.technology_tags = toJsonString(payload.technology_tags);
    const keys = Object.keys(payload);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await conn.execute(
      `UPDATE startup_profiles SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`,
      { ...payload, id: Number(id) },
    );
  };

  const softDeleteStartup = async (id) => {
    await db.execute("UPDATE startup_profiles SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const createFounders = async (startupId, founders, conn = db) => {
    for (const founder of founders || []) {
      await conn.execute(
        `INSERT INTO startup_founders
          (startup_id, student_id, user_id, full_name, email, phone, role_title, founder_role, contribution, joined_at, status)
         VALUES (:startup_id, :student_id, :user_id, :full_name, :email, :phone, :role_title, :founder_role, :contribution, :joined_at, :status)`,
        { ...founder, startup_id: Number(startupId) },
      );
    }
  };

  const listFounders = async (startupId) => {
    const [rows] = await db.execute(
      `SELECT sf.*, s.student_code, u.username AS user_username
       FROM startup_founders sf
       LEFT JOIN students s ON s.id = sf.student_id
       LEFT JOIN users u ON u.id = sf.user_id
       WHERE sf.startup_id = :startupId
       ORDER BY sf.status = 'active' DESC, sf.founder_role, sf.full_name`,
      { startupId: Number(startupId) },
    );
    return rows;
  };

  const userIsFounder = async (startupId, userId) => {
    const [rows] = await db.execute(
      `SELECT 1 FROM startup_founders WHERE startup_id = :startupId AND user_id = :userId AND status = 'active' LIMIT 1`,
      { startupId: Number(startupId), userId: Number(userId) },
    );
    return rows.length > 0;
  };

  const stageWhere = (query = {}) => {
    const params = {};
    const where = ["1 = 1"];
    if (query.search) { where.push("(code LIKE :search OR name LIKE :search OR description LIKE :search)"); params.search = `%${query.search}%`; }
    if (query.status) { where.push("status = :status"); params.status = query.status; }
    return { whereSql: where.join(" AND "), params };
  };

  const listStages = async (query) => {
    const { whereSql, params } = stageWhere(query);
    const [rows] = await db.execute(
      `SELECT s.*, (SELECT COUNT(*) FROM startup_pipeline_entries spe WHERE spe.current_stage_id = s.id OR spe.previous_stage_id = s.id) AS usage_count
       FROM startup_pipeline_stages s WHERE ${whereSql} ORDER BY s.order_index ASC, s.name ASC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM startup_pipeline_stages WHERE ${whereSql}`, params);
    return { rows: rows.map((row) => ({ ...row, usage_count: Number(row.usage_count || 0) })), total: Number(totalRows[0]?.total || 0) };
  };

  const listAllActiveStages = async () => {
    const [rows] = await db.execute("SELECT * FROM startup_pipeline_stages WHERE status = 'active' ORDER BY order_index ASC, name ASC");
    return rows;
  };

  const findStageById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM startup_pipeline_stages WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const findStageByCode = async (code, excludeId = null) => {
    const params = { code };
    let sql = "SELECT * FROM startup_pipeline_stages WHERE code = :code";
    if (excludeId) { sql += " AND id <> :excludeId"; params.excludeId = Number(excludeId); }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const createStage = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_pipeline_stages (code, name, description, order_index, is_final, status)
       VALUES (:code, :name, :description, :order_index, :is_final, :status)`,
      data,
    );
    return result.insertId;
  };

  const updateStage = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE startup_pipeline_stages SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, { ...data, id: Number(id) });
  };

  const findCurrentPipelineEntry = async (startupId) => {
    const [rows] = await db.execute(
      `SELECT spe.*, st.code AS current_stage_code, st.name AS current_stage_name
       FROM startup_pipeline_entries spe JOIN startup_pipeline_stages st ON st.id = spe.current_stage_id
       WHERE spe.startup_id = :startupId AND spe.exited_at IS NULL AND spe.status IN ('active','on_hold') LIMIT 1`,
      { startupId: Number(startupId) },
    );
    return rows[0] || null;
  };

  const createPipelineEntry = async (data, conn = db) => {
    const [result] = await conn.execute(
      `INSERT INTO startup_pipeline_entries
        (startup_id, current_stage_id, previous_stage_id, status, entered_at, note, updated_by)
       VALUES (:startup_id, :current_stage_id, :previous_stage_id, :status, :entered_at, :note, :updated_by)`,
      data,
    );
    return result.insertId;
  };

  const updatePipelineEntry = async (id, data, conn = db) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await conn.execute(`UPDATE startup_pipeline_entries SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, { ...data, id: Number(id) });
  };

  const insertPipelineHistory = async (data, conn = db) => {
    await conn.execute(
      `INSERT INTO startup_pipeline_history
        (startup_id, from_stage_id, to_stage_id, action, reason, actor_id, old_values, new_values)
       VALUES (:startup_id, :from_stage_id, :to_stage_id, :action, :reason, :actor_id, :old_values, :new_values)`,
      {
        startup_id: Number(data.startup_id),
        from_stage_id: data.from_stage_id || null,
        to_stage_id: Number(data.to_stage_id),
        action: data.action,
        reason: data.reason || null,
        actor_id: data.actor_id || null,
        old_values: toJsonString(data.old_values),
        new_values: toJsonString(data.new_values),
      },
    );
  };

  const listPipelineHistory = async (startupId) => {
    const [rows] = await db.execute(
      `SELECT sph.*, from_stage.name AS from_stage_name, to_stage.name AS to_stage_name,
              actor.full_name AS actor_name, actor.email AS actor_email
       FROM startup_pipeline_history sph
       LEFT JOIN startup_pipeline_stages from_stage ON from_stage.id = sph.from_stage_id
       JOIN startup_pipeline_stages to_stage ON to_stage.id = sph.to_stage_id
       LEFT JOIN users actor ON actor.id = sph.actor_id
       WHERE sph.startup_id = :startupId ORDER BY sph.created_at DESC`,
      { startupId: Number(startupId) },
    );
    return rows.map(normalizeHistoryRow);
  };

  const reviewWhere = (query = {}) => {
    const params = {};
    const where = ["1 = 1"];
    if (query.search) {
      where.push("(g.group_name LIKE :search OR g.topic LIKE :search OR sp.startup_name LIKE :search OR sr.nomination_reason LIKE :search)");
      params.search = `%${query.search}%`;
    }
    if (query.status) { where.push("sr.review_status = :status"); params.status = query.status; }
    if (query.sourceType) { where.push("sr.source_type = :sourceType"); params.sourceType = query.sourceType; }
    if (query.groupId) { where.push("sr.group_id = :groupId"); params.groupId = Number(query.groupId); }
    if (query.startupId) { where.push("sr.startup_id = :startupId"); params.startupId = Number(query.startupId); }
    if (query.lecturerId) { where.push("c.lecturer_id = :lecturerId"); params.lecturerId = Number(query.lecturerId); }
    return { whereSql: where.join(" AND "), params };
  };

  const reviewSelect = `
    sr.*, g.group_code, g.group_name, g.topic, g.category,
    c.class_code, c.class_name, c.lecturer_id,
    sem.semester_code, sub.subject_code,
    sp.startup_name,
    stage.name AS proposed_stage_name,
    nominator.full_name AS nominated_by_name,
    reviewer.full_name AS reviewed_by_name
  `;

  const reviewFrom = `
    FROM startup_selection_reviews sr
    LEFT JOIN \`groups\` g ON g.id = sr.group_id
    LEFT JOIN classes c ON c.id = g.class_id
    LEFT JOIN semesters sem ON sem.id = c.semester_id
    LEFT JOIN subjects sub ON sub.id = c.subject_id
    LEFT JOIN startup_profiles sp ON sp.id = sr.startup_id
    LEFT JOIN startup_pipeline_stages stage ON stage.id = sr.proposed_stage_id
    LEFT JOIN users nominator ON nominator.id = sr.nominated_by
    LEFT JOIN users reviewer ON reviewer.id = sr.reviewed_by
  `;

  const listSelectionReviews = async (query) => {
    const { whereSql, params } = reviewWhere(query);
    const [rows] = await db.execute(
      `SELECT ${reviewSelect} ${reviewFrom} WHERE ${whereSql} ORDER BY sr.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total ${reviewFrom} WHERE ${whereSql}`, params);
    return { rows: rows.map(cleanReviewRow), total: Number(totalRows[0]?.total || 0) };
  };

  const findSelectionReviewById = async (id) => {
    const [rows] = await db.execute(`SELECT ${reviewSelect} ${reviewFrom} WHERE sr.id = :id LIMIT 1`, { id: Number(id) });
    return cleanReviewRow(rows[0]);
  };

  const createSelectionReview = async (data, conn = db) => {
    const [result] = await conn.execute(
      `INSERT INTO startup_selection_reviews
        (group_id, startup_id, nominated_by, source_type, nomination_reason, support_needed, proposed_stage_id,
         evaluation_summary, average_score, potential_score)
       VALUES (:group_id, :startup_id, :nominated_by, :source_type, :nomination_reason, :support_needed, :proposed_stage_id,
         :evaluation_summary, :average_score, :potential_score)`,
      data,
    );
    return result.insertId;
  };

  const updateSelectionReview = async (id, data, conn = db) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await conn.execute(`UPDATE startup_selection_reviews SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, { ...data, id: Number(id) });
  };

  const listDocuments = async (startupId) => {
    const [rows] = await db.execute(
      `SELECT sd.*, u.full_name AS uploaded_by_name
       FROM startup_documents sd LEFT JOIN users u ON u.id = sd.uploaded_by
       WHERE sd.startup_id = :startupId AND sd.deleted_at IS NULL ORDER BY sd.created_at DESC`,
      { startupId: Number(startupId) },
    );
    return rows;
  };

  const createDocument = async (data, conn = db) => {
    const [result] = await conn.execute(
      `INSERT INTO startup_documents
        (startup_id, document_type, file_name, file_url, file_path, mime_type, file_size, uploaded_by, visibility)
       VALUES (:startup_id, :document_type, :file_name, :file_url, :file_path, :mime_type, :file_size, :uploaded_by, :visibility)`,
      data,
    );
    return result.insertId;
  };

  const findDocumentById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM startup_documents WHERE id = :id AND deleted_at IS NULL LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const softDeleteDocument = async (id) => {
    await db.execute("UPDATE startup_documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const listMilestones = async (startupId) => {
    const [rows] = await db.execute(
      `SELECT sm.*, u.full_name AS created_by_name
       FROM startup_milestones sm LEFT JOIN users u ON u.id = sm.created_by
       WHERE sm.startup_id = :startupId AND sm.deleted_at IS NULL ORDER BY sm.milestone_date DESC, sm.created_at DESC`,
      { startupId: Number(startupId) },
    );
    return rows;
  };

  const createMilestone = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_milestones (startup_id, title, description, milestone_type, milestone_date, evidence_url, created_by)
       VALUES (:startup_id, :title, :description, :milestone_type, :milestone_date, :evidence_url, :created_by)`,
      data,
    );
    return result.insertId;
  };

  const findMilestoneById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM startup_milestones WHERE id = :id AND deleted_at IS NULL LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const updateMilestone = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE startup_milestones SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`, { ...data, id: Number(id) });
  };

  const softDeleteMilestone = async (id) => {
    await db.execute("UPDATE startup_milestones SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const progressWhere = (startupId, query = {}) => {
    const params = { startupId: Number(startupId) };
    const where = ["spu.startup_id = :startupId", "spu.deleted_at IS NULL"];
    if (query.updateType) { where.push("spu.update_type = :updateType"); params.updateType = query.updateType; }
    if (query.visibility) { where.push("spu.visibility = :visibility"); params.visibility = query.visibility; }
    if (query.excludePrivate) where.push("spu.visibility <> 'private'");
    return { whereSql: where.join(" AND "), params };
  };

  const listProgress = async (startupId, query) => {
    const { whereSql, params } = progressWhere(startupId, query);
    const [rows] = await db.execute(
      `SELECT spu.*, u.full_name AS created_by_name
       FROM startup_progress_updates spu LEFT JOIN users u ON u.id = spu.created_by
       WHERE ${whereSql} ORDER BY spu.progress_date DESC, spu.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM startup_progress_updates spu WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findProgressById = async (id) => {
    const [rows] = await db.execute(
      `SELECT spu.*, u.full_name AS created_by_name
       FROM startup_progress_updates spu LEFT JOIN users u ON u.id = spu.created_by
       WHERE spu.id = :id AND spu.deleted_at IS NULL LIMIT 1`,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const createProgress = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_progress_updates
        (startup_id, update_title, update_content, update_type, progress_date, visibility, created_by)
       VALUES (:startup_id, :update_title, :update_content, :update_type, :progress_date, :visibility, :created_by)`,
      data,
    );
    return result.insertId;
  };

  const updateProgress = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE startup_progress_updates SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`, { ...data, id: Number(id) });
  };

  const softDeleteProgress = async (id) => {
    await db.execute("UPDATE startup_progress_updates SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const listMetrics = async (startupId, query) => {
    const params = { startupId: Number(startupId) };
    const [rows] = await db.execute(
      `SELECT sms.*, u.full_name AS created_by_name
       FROM startup_metrics_snapshots sms LEFT JOIN users u ON u.id = sms.created_by
       WHERE sms.startup_id = :startupId ORDER BY sms.snapshot_date DESC, sms.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute("SELECT COUNT(*) AS total FROM startup_metrics_snapshots WHERE startup_id = :startupId", params);
    return { rows: rows.map(normalizeMetricRow), total: Number(totalRows[0]?.total || 0) };
  };

  const createMetrics = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_metrics_snapshots
        (startup_id, snapshot_date, product_stage, users_count, customers_count, revenue_amount, revenue_currency,
         team_size, mvp_completed, market_validated, has_demo, has_pitch_deck, has_business_model, note, created_by)
       VALUES (:startup_id, :snapshot_date, :product_stage, :users_count, :customers_count, :revenue_amount, :revenue_currency,
         :team_size, :mvp_completed, :market_validated, :has_demo, :has_pitch_deck, :has_business_model, :note, :created_by)`,
      data,
    );
    return result.insertId;
  };

  const findMetricsById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM startup_metrics_snapshots WHERE id = :id LIMIT 1", { id: Number(id) });
    return normalizeMetricRow(rows[0]);
  };

  const supportNeedWhere = (startupId, query = {}) => {
    const params = { startupId: Number(startupId) };
    const where = ["ssn.startup_id = :startupId"];
    if (query.needType) { where.push("ssn.need_type = :needType"); params.needType = query.needType; }
    if (query.priority) { where.push("ssn.priority = :priority"); params.priority = query.priority; }
    if (query.status) { where.push("ssn.status = :status"); params.status = query.status; }
    return { whereSql: where.join(" AND "), params };
  };

  const listSupportNeeds = async (startupId, query) => {
    const { whereSql, params } = supportNeedWhere(startupId, query);
    const [rows] = await db.execute(
      `SELECT ssn.*, requester.full_name AS requested_by_name, assignee.full_name AS assigned_to_name
       FROM startup_support_needs ssn
       LEFT JOIN users requester ON requester.id = ssn.requested_by
       LEFT JOIN users assignee ON assignee.id = ssn.assigned_to
       WHERE ${whereSql}
       ORDER BY FIELD(ssn.priority, 'urgent','high','normal','low'), ssn.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM startup_support_needs ssn WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findSupportNeedById = async (id) => {
    const [rows] = await db.execute(
      `SELECT ssn.*, requester.full_name AS requested_by_name, assignee.full_name AS assigned_to_name
       FROM startup_support_needs ssn
       LEFT JOIN users requester ON requester.id = ssn.requested_by
       LEFT JOIN users assignee ON assignee.id = ssn.assigned_to
       WHERE ssn.id = :id LIMIT 1`,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const createSupportNeed = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_support_needs
        (startup_id, need_type, title, description, priority, status, requested_by, assigned_to)
       VALUES (:startup_id, :need_type, :title, :description, :priority, :status, :requested_by, :assigned_to)`,
      data,
    );
    return result.insertId;
  };

  const updateSupportNeed = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE startup_support_needs SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, { ...data, id: Number(id) });
  };

  const supportActivityWhere = (startupId, query = {}) => {
    const params = { startupId: Number(startupId) };
    const where = ["ssa.startup_id = :startupId"];
    if (query.activityType) { where.push("ssa.activity_type = :activityType"); params.activityType = query.activityType; }
    return { whereSql: where.join(" AND "), params };
  };

  const listSupportActivities = async (startupId, query) => {
    const { whereSql, params } = supportActivityWhere(startupId, query);
    const [rows] = await db.execute(
      `SELECT ssa.*, ssn.title AS support_need_title, mp.full_name AS related_mentor_name, creator.full_name AS created_by_name
       FROM startup_support_activities ssa
       LEFT JOIN startup_support_needs ssn ON ssn.id = ssa.support_need_id
       LEFT JOIN mentor_profiles mp ON mp.id = ssa.related_mentor_id
       LEFT JOIN users creator ON creator.id = ssa.created_by
       WHERE ${whereSql} ORDER BY ssa.activity_date DESC, ssa.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM startup_support_activities ssa WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const createSupportActivity = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_support_activities
        (startup_id, support_need_id, activity_type, title, description, activity_date, related_mentor_id, related_partner_id, created_by)
       VALUES (:startup_id, :support_need_id, :activity_type, :title, :description, :activity_date, :related_mentor_id, :related_partner_id, :created_by)`,
      data,
    );
    return result.insertId;
  };

  const findSupportActivityById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM startup_support_activities WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const eventSelect = `
    ee.*,
    creator.full_name AS created_by_name,
    (SELECT COUNT(*) FROM event_startup_participants esp WHERE esp.event_id = ee.id) AS total_startups,
    (SELECT COUNT(*) FROM event_judges ej WHERE ej.event_id = ee.id) AS total_judges,
    (SELECT COUNT(*) FROM event_feedbacks ef WHERE ef.event_id = ee.id) AS total_feedbacks
  `;

  const eventFrom = "FROM ecosystem_events ee LEFT JOIN users creator ON creator.id = ee.created_by";

  const eventWhere = (query = {}) => {
    const params = {};
    const where = ["ee.deleted_at IS NULL"];
    if (query.search) { where.push("(ee.event_name LIKE :search OR ee.event_code LIKE :search OR ee.location LIKE :search)"); params.search = `%${query.search}%`; }
    if (query.eventType) { where.push("ee.event_type = :eventType"); params.eventType = query.eventType; }
    if (query.status) { where.push("ee.status = :status"); params.status = query.status; }
    if (query.visibility) { where.push("ee.visibility = :visibility"); params.visibility = query.visibility; }
    if (query.dateFrom) { where.push("ee.start_at >= :dateFrom"); params.dateFrom = query.dateFrom; }
    if (query.dateTo) { where.push("ee.start_at <= :dateTo"); params.dateTo = query.dateTo; }
    return { whereSql: where.join(" AND "), params };
  };

  const listEvents = async (query) => {
    const { whereSql, params } = eventWhere(query);
    const [rows] = await db.execute(
      `SELECT ${eventSelect} ${eventFrom} WHERE ${whereSql} ORDER BY ee.start_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total ${eventFrom} WHERE ${whereSql}`, params);
    return { rows: rows.map(normalizeEventRow), total: Number(totalRows[0]?.total || 0) };
  };

  const findEventById = async (id, includeDeleted = false) => {
    const [rows] = await db.execute(
      `SELECT ${eventSelect} ${eventFrom} WHERE ee.id = :id ${includeDeleted ? "" : "AND ee.deleted_at IS NULL"} LIMIT 1`,
      { id: Number(id) },
    );
    return normalizeEventRow(rows[0]);
  };

  const findEventByCode = async (eventCode, excludeId = null) => {
    const params = { eventCode };
    let sql = "SELECT id FROM ecosystem_events WHERE event_code = :eventCode AND deleted_at IS NULL";
    if (excludeId) { sql += " AND id <> :excludeId"; params.excludeId = Number(excludeId); }
    const [rows] = await db.execute(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  };

  const createEvent = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO ecosystem_events
        (event_code, event_name, event_type, description, start_at, end_at, location, meeting_link, visibility, status, created_by)
       VALUES (:event_code, :event_name, :event_type, :description, :start_at, :end_at, :location, :meeting_link, :visibility, :status, :created_by)`,
      data,
    );
    return result.insertId;
  };

  const updateEvent = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE ecosystem_events SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`, { ...data, id: Number(id) });
  };

  const softDeleteEvent = async (id) => {
    await db.execute("UPDATE ecosystem_events SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const listEventStartups = async (eventId, query) => {
    const params = { eventId: Number(eventId) };
    const where = ["esp.event_id = :eventId"];
    if (query.participationStatus) { where.push("esp.participation_status = :participationStatus"); params.participationStatus = query.participationStatus; }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `SELECT esp.*, sp.startup_name, sp.logo_url, sp.category, sp.industry, sp.product_stage, sp.startup_status, sp.tagline
       FROM event_startup_participants esp JOIN startup_profiles sp ON sp.id = esp.startup_id
       WHERE ${whereSql} ORDER BY esp.pitch_order IS NULL, esp.pitch_order ASC, sp.startup_name ASC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM event_startup_participants esp WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findEventStartup = async (eventId, startupId) => {
    const [rows] = await db.execute("SELECT * FROM event_startup_participants WHERE event_id = :eventId AND startup_id = :startupId LIMIT 1", { eventId: Number(eventId), startupId: Number(startupId) });
    return rows[0] || null;
  };

  const addEventStartup = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO event_startup_participants
        (event_id, startup_id, pitch_order, booth_location, participation_status, pitch_deck_url, demo_url, note)
       VALUES (:event_id, :startup_id, :pitch_order, :booth_location, :participation_status, :pitch_deck_url, :demo_url, :note)`,
      data,
    );
    return result.insertId;
  };

  const deleteEventStartup = async (eventId, startupId) => {
    await db.execute("DELETE FROM event_startup_participants WHERE event_id = :eventId AND startup_id = :startupId", { eventId: Number(eventId), startupId: Number(startupId) });
  };

  const listEventJudges = async (eventId, query) => {
    const params = { eventId: Number(eventId) };
    const [rows] = await db.execute(
      `SELECT ej.*, u.full_name AS user_name, mp.full_name AS mentor_name
       FROM event_judges ej
       LEFT JOIN users u ON u.id = ej.user_id
       LEFT JOIN mentor_profiles mp ON mp.id = ej.mentor_id
       WHERE ej.event_id = :eventId ORDER BY ej.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute("SELECT COUNT(*) AS total FROM event_judges WHERE event_id = :eventId", params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const findEventJudgeById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM event_judges WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const addEventJudge = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO event_judges (event_id, user_id, mentor_id, full_name, email, organization, role_title, judge_type)
       VALUES (:event_id, :user_id, :mentor_id, :full_name, :email, :organization, :role_title, :judge_type)`,
      data,
    );
    return result.insertId;
  };

  const deleteEventJudge = async (eventId, judgeId) => {
    await db.execute("DELETE FROM event_judges WHERE event_id = :eventId AND id = :judgeId", { eventId: Number(eventId), judgeId: Number(judgeId) });
  };

  const listEventFeedbacks = async (eventId, query) => {
    const params = { eventId: Number(eventId) };
    const where = ["ef.event_id = :eventId"];
    if (query.startupId) { where.push("ef.startup_id = :startupId"); params.startupId = Number(query.startupId); }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `SELECT ef.*, sp.startup_name, ej.full_name AS judge_name, u.full_name AS from_user_name
       FROM event_feedbacks ef
       JOIN startup_profiles sp ON sp.id = ef.startup_id
       LEFT JOIN event_judges ej ON ej.id = ef.judge_id
       LEFT JOIN users u ON u.id = ef.from_user_id
       WHERE ${whereSql} ORDER BY ef.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM event_feedbacks ef WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const createEventFeedback = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO event_feedbacks
        (event_id, startup_id, judge_id, from_user_id, rating, feedback, strengths, improvements, interest_level)
       VALUES (:event_id, :startup_id, :judge_id, :from_user_id, :rating, :feedback, :strengths, :improvements, :interest_level)`,
      data,
    );
    return result.insertId;
  };

  const findEventFeedbackById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM event_feedbacks WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const listAwards = async (startupId, query) => {
    const params = { startupId: Number(startupId) };
    const [rows] = await db.execute(
      `SELECT sa.*, ee.event_name, creator.full_name AS created_by_name
       FROM startup_awards sa
       LEFT JOIN ecosystem_events ee ON ee.id = sa.event_id
       LEFT JOIN users creator ON creator.id = sa.created_by
       WHERE sa.startup_id = :startupId ORDER BY sa.awarded_at DESC, sa.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute("SELECT COUNT(*) AS total FROM startup_awards WHERE startup_id = :startupId", params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const createAward = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_awards (startup_id, event_id, award_name, award_type, description, awarded_at, evidence_url, created_by)
       VALUES (:startup_id, :event_id, :award_name, :award_type, :description, :awarded_at, :evidence_url, :created_by)`,
      data,
    );
    return result.insertId;
  };

  const findAwardById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM startup_awards WHERE id = :id LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const listEventMedia = async (eventId, query) => {
    const params = { eventId: Number(eventId) };
    const where = ["em.event_id = :eventId", "em.deleted_at IS NULL"];
    if (query.mediaType) { where.push("em.media_type = :mediaType"); params.mediaType = query.mediaType; }
    if (query.visibility) { where.push("em.visibility = :visibility"); params.visibility = query.visibility; }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `SELECT em.*, sp.startup_name, uploader.full_name AS uploaded_by_name
       FROM event_media em
       LEFT JOIN startup_profiles sp ON sp.id = em.startup_id
       LEFT JOIN users uploader ON uploader.id = em.uploaded_by
       WHERE ${whereSql} ORDER BY em.created_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM event_media em WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const createEventMedia = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO event_media (event_id, startup_id, media_type, title, file_url, external_url, visibility, uploaded_by)
       VALUES (:event_id, :startup_id, :media_type, :title, :file_url, :external_url, :visibility, :uploaded_by)`,
      data,
    );
    return result.insertId;
  };

  const findEventMediaById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM event_media WHERE id = :id AND deleted_at IS NULL LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const mentorCanAccessStartup = async (startupId, userId) => {
    const [rows] = await db.execute(
      `SELECT 1
       FROM startup_profiles sp
       JOIN mentor_assignments ma ON ma.group_id = sp.group_id AND ma.status = 'active' AND ma.deleted_at IS NULL
       JOIN mentor_profiles mp ON mp.id = ma.mentor_id AND mp.user_id = :userId AND mp.deleted_at IS NULL
       WHERE sp.id = :startupId AND sp.deleted_at IS NULL LIMIT 1`,
      { startupId: Number(startupId), userId: Number(userId) },
    );
    return rows.length > 0;
  };

  const alumniWhere = (query = {}) => {
    const params = {};
    const where = ["sap.deleted_at IS NULL"];
    if (query.search) { where.push("(sap.full_name LIKE :search OR sap.email LIKE :search OR sap.current_company LIKE :search OR sap.major LIKE :search)"); params.search = `%${query.search}%`; }
    if (query.status) { where.push("sap.status = :status"); params.status = query.status; }
    if (query.graduationYear) { where.push("sap.graduation_year = :graduationYear"); params.graduationYear = Number(query.graduationYear); }
    return { whereSql: where.join(" AND "), params };
  };

  const listAlumni = async (query) => {
    const { whereSql, params } = alumniWhere(query);
    const [rows] = await db.execute(
      `SELECT sap.*, (SELECT COUNT(*) FROM alumni_startup_links asl WHERE asl.alumni_id = sap.id) AS linked_startups
       FROM startup_alumni_profiles sap WHERE ${whereSql}
       ORDER BY sap.updated_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM startup_alumni_profiles sap WHERE ${whereSql}`, params);
    return { rows: rows.map((row) => ({ ...row, linked_startups: Number(row.linked_startups || 0) })), total: Number(totalRows[0]?.total || 0) };
  };

  const findAlumniById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM startup_alumni_profiles WHERE id = :id AND deleted_at IS NULL LIMIT 1", { id: Number(id) });
    return rows[0] || null;
  };

  const createAlumni = async (data, conn = db) => {
    const [result] = await conn.execute(
      `INSERT INTO startup_alumni_profiles
        (user_id, student_id, full_name, email, phone, graduation_year, major, campus, current_position,
         current_company, linkedin_url, bio, status)
       VALUES (:user_id, :student_id, :full_name, :email, :phone, :graduation_year, :major, :campus,
         :current_position, :current_company, :linkedin_url, :bio, :status)`,
      data,
    );
    return result.insertId;
  };

  const updateAlumni = async (id, data, conn = db) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await conn.execute(`UPDATE startup_alumni_profiles SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`, { ...data, id: Number(id) });
  };

  const softDeleteAlumni = async (id) => {
    await db.execute("UPDATE startup_alumni_profiles SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const listAlumniLinks = async (alumniId) => {
    const [rows] = await db.execute(
      `SELECT asl.*, sp.startup_name, sp.startup_status, sp.product_stage, sp.category
       FROM alumni_startup_links asl JOIN startup_profiles sp ON sp.id = asl.startup_id
       WHERE asl.alumni_id = :alumniId ORDER BY asl.status = 'active' DESC, sp.startup_name ASC`,
      { alumniId: Number(alumniId) },
    );
    return rows;
  };

  const replaceAlumniLinks = async (alumniId, links = [], conn = db) => {
    await conn.execute("DELETE FROM alumni_startup_links WHERE alumni_id = :alumniId", { alumniId: Number(alumniId) });
    for (const link of links) {
      await conn.execute(
        `INSERT INTO alumni_startup_links (alumni_id, startup_id, role, start_date, end_date, status, note)
         VALUES (:alumni_id, :startup_id, :role, :start_date, :end_date, :status, :note)`,
        { ...link, alumni_id: Number(alumniId) },
      );
    }
  };

  const partnerWhere = (query = {}) => {
    const params = {};
    const where = ["ep.deleted_at IS NULL"];
    if (query.search) { where.push("(ep.partner_name LIKE :search OR ep.contact_person LIKE :search OR ep.description LIKE :search)"); params.search = `%${query.search}%`; }
    if (query.partnerType) { where.push("ep.partner_type = :partnerType"); params.partnerType = query.partnerType; }
    if (query.status) { where.push("ep.status = :status"); params.status = query.status; }
    if (query.visibility) { where.push("ep.visibility = :visibility"); params.visibility = query.visibility; }
    if (query.allowedVisibility) { where.push("ep.visibility IN ('public','internal')"); }
    return { whereSql: where.join(" AND "), params };
  };

  const partnerSelect = `
    ep.*, creator.full_name AS created_by_name,
    (SELECT COUNT(*) FROM startup_partner_connections spc WHERE spc.partner_id = ep.id) AS connection_count,
    (SELECT COUNT(*) FROM ecosystem_opportunities eo WHERE eo.partner_id = ep.id) AS opportunity_count
  `;

  const partnerFrom = "FROM ecosystem_partners ep LEFT JOIN users creator ON creator.id = ep.created_by";

  const listPartners = async (query) => {
    const { whereSql, params } = partnerWhere(query);
    const [rows] = await db.execute(
      `SELECT ${partnerSelect} ${partnerFrom} WHERE ${whereSql} ORDER BY ep.updated_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total ${partnerFrom} WHERE ${whereSql}`, params);
    return { rows: rows.map(normalizePartnerRow), total: Number(totalRows[0]?.total || 0) };
  };

  const findPartnerById = async (id) => {
    const [rows] = await db.execute(`SELECT ${partnerSelect} ${partnerFrom} WHERE ep.id = :id AND ep.deleted_at IS NULL LIMIT 1`, { id: Number(id) });
    return normalizePartnerRow(rows[0]);
  };

  const createPartner = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO ecosystem_partners
        (partner_name, partner_type, contact_person, contact_email, contact_phone, website_url,
         description, focus_areas, status, visibility, created_by)
       VALUES (:partner_name, :partner_type, :contact_person, :contact_email, :contact_phone, :website_url,
         :description, :focus_areas, :status, :visibility, :created_by)`,
      { ...data, focus_areas: toJsonString(data.focus_areas) },
    );
    return result.insertId;
  };

  const updatePartner = async (id, data) => {
    const payload = { ...data };
    if (Object.prototype.hasOwnProperty.call(payload, "focus_areas")) payload.focus_areas = toJsonString(payload.focus_areas);
    const keys = Object.keys(payload);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE ecosystem_partners SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL`, { ...payload, id: Number(id) });
  };

  const softDeletePartner = async (id) => {
    await db.execute("UPDATE ecosystem_partners SET deleted_at = CURRENT_TIMESTAMP, status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL", { id: Number(id) });
  };

  const listStartupPartnerConnections = async (startupId, query) => {
    const params = { startupId: Number(startupId) };
    const where = ["spc.startup_id = :startupId"];
    if (query.status) { where.push("spc.status = :status"); params.status = query.status; }
    if (query.connectionType) { where.push("spc.connection_type = :connectionType"); params.connectionType = query.connectionType; }
    const whereSql = where.join(" AND ");
    const [rows] = await db.execute(
      `SELECT spc.*, ep.partner_name, ep.partner_type, ep.website_url, ep.visibility, introducer.full_name AS introduced_by_name
       FROM startup_partner_connections spc
       JOIN ecosystem_partners ep ON ep.id = spc.partner_id AND ep.deleted_at IS NULL
       LEFT JOIN users introducer ON introducer.id = spc.introduced_by
       WHERE ${whereSql} ORDER BY spc.updated_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM startup_partner_connections spc WHERE ${whereSql}`, params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const createStartupPartnerConnection = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_partner_connections
        (startup_id, partner_id, connection_type, status, introduced_by, contact_date, follow_up_date, note, outcome)
       VALUES (:startup_id, :partner_id, :connection_type, :status, :introduced_by, :contact_date, :follow_up_date, :note, :outcome)`,
      data,
    );
    return result.insertId;
  };

  const findPartnerConnectionById = async (id) => {
    const [rows] = await db.execute(
      `SELECT spc.*, ep.partner_name, ep.partner_type, sp.startup_name
       FROM startup_partner_connections spc
       JOIN ecosystem_partners ep ON ep.id = spc.partner_id
       JOIN startup_profiles sp ON sp.id = spc.startup_id
       WHERE spc.id = :id LIMIT 1`,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const updatePartnerConnection = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE startup_partner_connections SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, { ...data, id: Number(id) });
  };

  const opportunityWhere = (query = {}) => {
    const params = {};
    const where = ["1 = 1"];
    if (query.search) { where.push("(eo.title LIKE :search OR eo.description LIKE :search OR ep.partner_name LIKE :search)"); params.search = `%${query.search}%`; }
    if (query.partnerId) { where.push("eo.partner_id = :partnerId"); params.partnerId = Number(query.partnerId); }
    if (query.opportunityType) { where.push("eo.opportunity_type = :opportunityType"); params.opportunityType = query.opportunityType; }
    if (query.status) { where.push("eo.status = :status"); params.status = query.status; }
    if (query.visibility) { where.push("eo.visibility = :visibility"); params.visibility = query.visibility; }
    if (query.studentVisible) { where.push("eo.status = 'open' AND eo.visibility IN ('internal','public')"); }
    return { whereSql: where.join(" AND "), params };
  };

  const opportunitySelect = `
    eo.*, ep.partner_name, ep.partner_type, creator.full_name AS created_by_name,
    (SELECT COUNT(*) FROM startup_opportunity_applications soa WHERE soa.opportunity_id = eo.id) AS application_count
  `;

  const opportunityFrom = "FROM ecosystem_opportunities eo LEFT JOIN ecosystem_partners ep ON ep.id = eo.partner_id LEFT JOIN users creator ON creator.id = eo.created_by";

  const listOpportunities = async (query) => {
    const { whereSql, params } = opportunityWhere(query);
    const [rows] = await db.execute(
      `SELECT ${opportunitySelect} ${opportunityFrom} WHERE ${whereSql} ORDER BY eo.updated_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total ${opportunityFrom} WHERE ${whereSql}`, params);
    return { rows: rows.map((row) => ({ ...row, application_count: Number(row.application_count || 0) })), total: Number(totalRows[0]?.total || 0) };
  };

  const findOpportunityById = async (id) => {
    const [rows] = await db.execute(`SELECT ${opportunitySelect} ${opportunityFrom} WHERE eo.id = :id LIMIT 1`, { id: Number(id) });
    return rows[0] ? { ...rows[0], application_count: Number(rows[0].application_count || 0) } : null;
  };

  const createOpportunity = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO ecosystem_opportunities
        (partner_id, opportunity_type, title, description, eligibility, deadline, external_url, status, visibility, created_by)
       VALUES (:partner_id, :opportunity_type, :title, :description, :eligibility, :deadline, :external_url, :status, :visibility, :created_by)`,
      data,
    );
    return result.insertId;
  };

  const updateOpportunity = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE ecosystem_opportunities SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, { ...data, id: Number(id) });
  };

  const findOpportunityApplication = async (startupId, opportunityId) => {
    const [rows] = await db.execute(
      `SELECT soa.*, sp.startup_name, eo.title AS opportunity_title
       FROM startup_opportunity_applications soa
       JOIN startup_profiles sp ON sp.id = soa.startup_id
       JOIN ecosystem_opportunities eo ON eo.id = soa.opportunity_id
       WHERE soa.startup_id = :startupId AND soa.opportunity_id = :opportunityId LIMIT 1`,
      { startupId: Number(startupId), opportunityId: Number(opportunityId) },
    );
    return rows[0] || null;
  };

  const createOpportunityApplication = async (data) => {
    const [result] = await db.execute(
      `INSERT INTO startup_opportunity_applications
        (startup_id, opportunity_id, applied_by, application_status, application_note, submitted_at)
       VALUES (:startup_id, :opportunity_id, :applied_by, :application_status, :application_note, :submitted_at)`,
      data,
    );
    return result.insertId;
  };

  const findOpportunityApplicationById = async (id) => {
    const [rows] = await db.execute(
      `SELECT soa.*, sp.startup_name, eo.title AS opportunity_title
       FROM startup_opportunity_applications soa
       JOIN startup_profiles sp ON sp.id = soa.startup_id
       JOIN ecosystem_opportunities eo ON eo.id = soa.opportunity_id
       WHERE soa.id = :id LIMIT 1`,
      { id: Number(id) },
    );
    return rows[0] || null;
  };

  const updateOpportunityApplication = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return;
    const setSql = keys.map((key) => `${key} = :${key}`).join(", ");
    await db.execute(`UPDATE startup_opportunity_applications SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE id = :id`, { ...data, id: Number(id) });
  };

  const listStartupOpportunityApplications = async (startupId, query) => {
    const params = { startupId: Number(startupId) };
    const [rows] = await db.execute(
      `SELECT soa.*, eo.title, eo.opportunity_type, eo.deadline, eo.visibility, ep.partner_name
       FROM startup_opportunity_applications soa
       JOIN ecosystem_opportunities eo ON eo.id = soa.opportunity_id
       LEFT JOIN ecosystem_partners ep ON ep.id = eo.partner_id
       WHERE soa.startup_id = :startupId ORDER BY soa.updated_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute("SELECT COUNT(*) AS total FROM startup_opportunity_applications WHERE startup_id = :startupId", params);
    return { rows, total: Number(totalRows[0]?.total || 0) };
  };

  const analyticsWhere = (query = {}, alias = "sp") => {
    const params = {};
    const where = [`${alias}.deleted_at IS NULL`];
    if (query.semesterId) { where.push(`${alias}.semester_id = :semesterId`); params.semesterId = Number(query.semesterId); }
    if (query.subjectId) { where.push(`${alias}.subject_id = :subjectId`); params.subjectId = Number(query.subjectId); }
    if (query.classId) { where.push(`${alias}.class_id = :classId`); params.classId = Number(query.classId); }
    if (query.category) { where.push(`${alias}.category = :category`); params.category = query.category; }
    if (query.startupStatus) { where.push(`${alias}.startup_status = :startupStatus`); params.startupStatus = query.startupStatus; }
    if (query.productStage) { where.push(`${alias}.product_stage = :productStage`); params.productStage = query.productStage; }
    if (query.stageId) {
      where.push(`EXISTS (SELECT 1 FROM startup_pipeline_entries spef WHERE spef.startup_id = ${alias}.id AND spef.exited_at IS NULL AND spef.current_stage_id = :stageId)`);
      params.stageId = Number(query.stageId);
    }
    if (query.dateFrom) { where.push(`${alias}.created_at >= :dateFrom`); params.dateFrom = query.dateFrom; }
    if (query.dateTo) { where.push(`${alias}.created_at <= :dateTo`); params.dateTo = query.dateTo; }
    if (query.lecturerId) {
      where.push(`EXISTS (SELECT 1 FROM classes cf WHERE cf.id = ${alias}.class_id AND cf.lecturer_id = :lecturerId)`);
      params.lecturerId = Number(query.lecturerId);
    }
    return { whereSql: where.join(" AND "), params };
  };

  const countScalar = async (sql, params = {}) => {
    const [rows] = await db.execute(sql, params);
    return Number(rows[0]?.value || 0);
  };

  const getAnalyticsOverview = async (query = {}) => {
    const { whereSql, params } = analyticsWhere(query, "sp");
    const [cardsRows] = await db.execute(
      `SELECT
         COUNT(*) AS total_startups,
         SUM(sp.startup_status = 'active') AS active_startups,
         SUM(sp.startup_status = 'incubating') AS incubating_startups,
         SUM(sp.startup_status = 'graduated') AS graduated_startups,
         SUM(sp.startup_status = 'archived') AS archived_startups,
         SUM(sp.product_stage IN ('mvp','beta','launched','revenue','company')) AS startups_with_mvp,
         SUM(sp.product_stage IN ('revenue','company')) AS startups_with_revenue,
         SUM(sp.product_stage = 'company') AS startups_with_company_registered,
         SUM(EXISTS (SELECT 1 FROM mentor_assignments ma WHERE ma.group_id = sp.group_id AND ma.status = 'active' AND ma.deleted_at IS NULL)) AS startups_connected_to_mentors,
         SUM(EXISTS (SELECT 1 FROM startup_partner_connections spc WHERE spc.startup_id = sp.id AND spc.status IN ('contacted','in_progress','successful'))) AS startups_connected_to_partners
       FROM startup_profiles sp WHERE ${whereSql}`,
      params,
    );
    const totalGroups = await countScalar("SELECT COUNT(*) AS value FROM `groups` WHERE deleted_at IS NULL");
    const groupStartups = await countScalar(`SELECT COUNT(DISTINCT sp.group_id) AS value FROM startup_profiles sp WHERE ${whereSql} AND sp.group_id IS NOT NULL`, params);
    const [byStage] = await db.execute(
      `SELECT st.id, st.code, st.name, COUNT(sp.id) AS total
       FROM startup_pipeline_stages st
       LEFT JOIN startup_pipeline_entries spe ON spe.current_stage_id = st.id AND spe.exited_at IS NULL
       LEFT JOIN startup_profiles sp ON sp.id = spe.startup_id AND ${whereSql}
       GROUP BY st.id, st.code, st.name, st.order_index ORDER BY st.order_index ASC`,
      params,
    );
    const [byCategory] = await db.execute(`SELECT COALESCE(sp.category, 'uncategorized') AS category, COUNT(*) AS total FROM startup_profiles sp WHERE ${whereSql} GROUP BY COALESCE(sp.category, 'uncategorized') ORDER BY total DESC LIMIT 20`, params);
    const cards = cardsRows[0] || {};
    return {
      cards: Object.fromEntries(Object.entries(cards).map(([key, value]) => [key, Number(value || 0)])),
      conversion_rate: totalGroups ? Number(((groupStartups / totalGroups) * 100).toFixed(2)) : 0,
      startups_by_stage: byStage.map((row) => ({ ...row, total: Number(row.total || 0) })),
      startups_by_category: byCategory.map((row) => ({ ...row, total: Number(row.total || 0) })),
    };
  };

  const getPipelineAnalytics = async (query = {}) => {
    const { whereSql, params } = analyticsWhere(query, "sp");
    const [byStage] = await db.execute(
      `SELECT st.id, st.code, st.name, COUNT(sp.id) AS total, ROUND(AVG(DATEDIFF(COALESCE(spe.exited_at, NOW()), spe.entered_at)), 1) AS avg_days_in_stage
       FROM startup_pipeline_stages st
       LEFT JOIN startup_pipeline_entries spe ON spe.current_stage_id = st.id
       LEFT JOIN startup_profiles sp ON sp.id = spe.startup_id AND ${whereSql}
       GROUP BY st.id, st.code, st.name, st.order_index ORDER BY st.order_index ASC`,
      params,
    );
    const [stuck] = await db.execute(
      `SELECT sp.id, sp.startup_name, sp.startup_status, st.name AS current_stage_name, spe.entered_at, DATEDIFF(NOW(), spe.entered_at) AS days_in_stage
       FROM startup_profiles sp
       JOIN startup_pipeline_entries spe ON spe.startup_id = sp.id AND spe.exited_at IS NULL
       JOIN startup_pipeline_stages st ON st.id = spe.current_stage_id
       WHERE ${whereSql} AND DATEDIFF(NOW(), spe.entered_at) >= 60
       ORDER BY days_in_stage DESC LIMIT 50`,
      params,
    );
    const [timeline] = await db.execute(
      `SELECT DATE(sph.created_at) AS date, sph.action, COUNT(*) AS total
       FROM startup_pipeline_history sph JOIN startup_profiles sp ON sp.id = sph.startup_id
       WHERE ${whereSql} GROUP BY DATE(sph.created_at), sph.action ORDER BY date DESC LIMIT 90`,
      params,
    );
    return {
      stages: byStage.map((row) => ({ ...row, total: Number(row.total || 0), avg_days_in_stage: row.avg_days_in_stage === null ? null : Number(row.avg_days_in_stage) })),
      stuck_startups: stuck.map((row) => ({ ...row, days_in_stage: Number(row.days_in_stage || 0) })),
      timeline: timeline.map((row) => ({ ...row, total: Number(row.total || 0) })),
    };
  };

  const getProgressAnalytics = async (query = {}) => {
    const { whereSql, params } = analyticsWhere(query, "sp");
    const [stageDistribution] = await db.execute(`SELECT sp.product_stage, COUNT(*) AS total FROM startup_profiles sp WHERE ${whereSql} GROUP BY sp.product_stage`, params);
    const [latestMetrics] = await db.execute(
      `SELECT
         SUM(lm.mvp_completed = 1) AS mvp_completed,
         SUM(lm.market_validated = 1) AS market_validated,
         SUM(COALESCE(lm.revenue_amount, 0) > 0) AS revenue_reported,
         ROUND(AVG(lm.team_size), 1) AS avg_team_size
       FROM startup_profiles sp
       LEFT JOIN startup_metrics_snapshots lm ON lm.id = (SELECT sms.id FROM startup_metrics_snapshots sms WHERE sms.startup_id = sp.id ORDER BY sms.snapshot_date DESC, sms.id DESC LIMIT 1)
       WHERE ${whereSql}`,
      params,
    );
    const [milestones] = await db.execute(
      `SELECT sm.milestone_type, COUNT(*) AS total
       FROM startup_milestones sm JOIN startup_profiles sp ON sp.id = sm.startup_id
       WHERE sm.deleted_at IS NULL AND ${whereSql} GROUP BY sm.milestone_type`,
      params,
    );
    const [updates] = await db.execute(
      `SELECT spu.update_type, COUNT(*) AS total
       FROM startup_progress_updates spu JOIN startup_profiles sp ON sp.id = spu.startup_id
       WHERE spu.deleted_at IS NULL AND ${whereSql} GROUP BY spu.update_type`,
      params,
    );
    return {
      product_stage_distribution: stageDistribution.map((row) => ({ ...row, total: Number(row.total || 0) })),
      latest_metrics: Object.fromEntries(Object.entries(latestMetrics[0] || {}).map(([key, value]) => [key, value === null ? null : Number(value || 0)])),
      milestones_by_type: milestones.map((row) => ({ ...row, total: Number(row.total || 0) })),
      progress_updates_by_type: updates.map((row) => ({ ...row, total: Number(row.total || 0) })),
    };
  };

  const getEventAnalytics = async (query = {}) => {
    const [cards] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM ecosystem_events WHERE deleted_at IS NULL) AS total_events,
         (SELECT COUNT(DISTINCT startup_id) FROM event_startup_participants) AS startups_participated,
         (SELECT COUNT(*) FROM event_feedbacks) AS feedback_count,
         (SELECT ROUND(AVG(rating), 2) FROM event_feedbacks WHERE rating IS NOT NULL) AS average_judge_rating`
    );
    const [awards] = await db.execute("SELECT award_type, COUNT(*) AS total FROM startup_awards GROUP BY award_type ORDER BY total DESC");
    const [interest] = await db.execute("SELECT interest_level, COUNT(*) AS total FROM event_feedbacks GROUP BY interest_level ORDER BY total DESC");
    return {
      cards: Object.fromEntries(Object.entries(cards[0] || {}).map(([key, value]) => [key, value === null ? null : Number(value || 0)])),
      awards_by_category: awards.map((row) => ({ ...row, total: Number(row.total || 0) })),
      interest_levels: interest.map((row) => ({ ...row, total: Number(row.total || 0) })),
    };
  };

  const getAlumniPartnerAnalytics = async () => {
    const [cards] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM startup_alumni_profiles WHERE deleted_at IS NULL AND status = 'active') AS total_alumni_founders,
         (SELECT COUNT(DISTINCT startup_id) FROM alumni_startup_links WHERE status = 'active') AS alumni_linked_startups,
         (SELECT COUNT(*) FROM startup_partner_connections WHERE status IN ('contacted','in_progress','successful')) AS active_partner_connections,
         (SELECT COUNT(*) FROM startup_opportunity_applications) AS opportunity_applications,
         (SELECT COUNT(*) FROM startup_opportunity_applications WHERE application_status = 'accepted') AS accepted_opportunities`
    );
    const [partnersByType] = await db.execute("SELECT partner_type, COUNT(*) AS total FROM ecosystem_partners WHERE deleted_at IS NULL GROUP BY partner_type ORDER BY total DESC");
    return {
      cards: Object.fromEntries(Object.entries(cards[0] || {}).map(([key, value]) => [key, Number(value || 0)])),
      partners_by_type: partnersByType.map((row) => ({ ...row, total: Number(row.total || 0) })),
    };
  };

  const getEcosystemHealth = async (query = {}) => {
    const { whereSql, params } = analyticsWhere(query, "sp");
    const [rows] = await db.execute(
      `SELECT sp.id AS startup_id, sp.startup_name, 'no_progress_update' AS issue_type, 'high' AS severity,
              'No progress update in the last 60 days' AS reason, 'Ask founder for a progress update' AS suggested_action,
              MAX(spu.progress_date) AS last_activity
       FROM startup_profiles sp LEFT JOIN startup_progress_updates spu ON spu.startup_id = sp.id AND spu.deleted_at IS NULL
       WHERE ${whereSql} GROUP BY sp.id HAVING last_activity IS NULL OR last_activity < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
       UNION ALL
       SELECT sp.id, sp.startup_name, 'no_partner_connection', 'medium', 'Startup has no partner connection', 'Review partner fit and introduce when ready', NULL
       FROM startup_profiles sp WHERE ${whereSql} AND sp.product_stage IN ('mvp','beta','launched','revenue','company')
         AND NOT EXISTS (SELECT 1 FROM startup_partner_connections spc WHERE spc.startup_id = sp.id)
       UNION ALL
       SELECT sp.id, sp.startup_name, 'follow_up_overdue', 'high', 'Partner connection follow-up date is overdue', 'Follow up with partner or record outcome', spc.follow_up_date
       FROM startup_profiles sp JOIN startup_partner_connections spc ON spc.startup_id = sp.id
       WHERE ${whereSql} AND spc.follow_up_date < CURDATE() AND spc.status IN ('proposed','contacted','in_progress')
       LIMIT 200`,
      params,
    );
    return rows;
  };

  const listStartupReports = async (query = {}) => {
    const { whereSql, params } = analyticsWhere(query, "sp");
    const reportWhere = [whereSql];
    if (query.search) {
      reportWhere.push("(sp.startup_name LIKE :search OR sp.category LIKE :search OR c.class_code LIKE :search)");
      params.search = `%${query.search}%`;
    }
    const finalWhere = reportWhere.join(" AND ");
    const [rows] = await db.execute(
      `SELECT sp.id, sp.startup_name, sp.category, sp.product_stage, sp.startup_status, sp.selected_score,
              c.class_code, sem.semester_code, st.name AS current_stage_name,
              (SELECT COUNT(*) FROM startup_founders sf WHERE sf.startup_id = sp.id AND sf.status = 'active') AS founder_count,
              (SELECT COUNT(*) FROM startup_milestones sm WHERE sm.startup_id = sp.id AND sm.deleted_at IS NULL) AS milestone_count,
              (SELECT COUNT(*) FROM event_startup_participants esp WHERE esp.startup_id = sp.id) AS events_joined,
              (SELECT COUNT(*) FROM startup_awards sa WHERE sa.startup_id = sp.id) AS awards_count,
              (SELECT COUNT(*) FROM startup_partner_connections spc WHERE spc.startup_id = sp.id) AS partner_connections
       FROM startup_profiles sp
       LEFT JOIN classes c ON c.id = sp.class_id
       LEFT JOIN semesters sem ON sem.id = sp.semester_id
       LEFT JOIN startup_pipeline_entries spe ON spe.startup_id = sp.id AND spe.exited_at IS NULL
       LEFT JOIN startup_pipeline_stages st ON st.id = spe.current_stage_id
       WHERE ${finalWhere} ORDER BY sp.updated_at DESC ${pageSql(query.limit, query.offset)}`,
      params,
    );
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM startup_profiles sp LEFT JOIN classes c ON c.id = sp.class_id WHERE ${finalWhere}`, params);
    return { rows: rows.map((row) => ({
      ...row,
      selected_score: row.selected_score === null ? null : Number(row.selected_score),
      founder_count: Number(row.founder_count || 0),
      milestone_count: Number(row.milestone_count || 0),
      events_joined: Number(row.events_joined || 0),
      awards_count: Number(row.awards_count || 0),
      partner_connections: Number(row.partner_connections || 0),
    })), total: Number(totalRows[0]?.total || 0) };
  };

  const getStartupActivity = async (startupId) => {
    const [rows] = await db.execute(
      `SELECT al.id, al.action, al.table_name, al.record_id, al.title, al.old_values, al.new_values,
              al.created_at, u.full_name AS user_name, u.email AS user_email
       FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
       WHERE al.record_id = :startupId
         AND al.table_name IN ('startup_profiles','startup_selection_reviews','startup_pipeline_entries','startup_pipeline_history','startup_documents','startup_milestones','startup_progress_updates','startup_metrics_snapshots','startup_support_needs','startup_support_activities','event_startup_participants','event_feedbacks','startup_awards','event_media','startup_partner_connections','startup_opportunity_applications')
       ORDER BY al.created_at DESC LIMIT 50`,
      { startupId: Number(startupId) },
    );
    return rows.map(normalizeHistoryRow);
  };

  const userOwnsClass = async (userId, classId) => {
    const [rows] = await db.execute("SELECT 1 FROM classes WHERE id = :classId AND lecturer_id = :userId AND deleted_at IS NULL LIMIT 1", { classId: Number(classId), userId: Number(userId) });
    return rows.length > 0;
  };

  const normalizeStoredStartup = (startup) => startup ? ({ ...startup, technology_tags: parseJsonValue(startup.technology_tags, []) }) : null;

  return {
    listStartups,
    findStartupById,
    findStartupBySlug,
    findActiveStartupByGroup,
    findGroupContext,
    listGroupMembers,
    createStartup,
    updateStartup,
    softDeleteStartup,
    createFounders,
    listFounders,
    userIsFounder,
    listStages,
    listAllActiveStages,
    findStageById,
    findStageByCode,
    createStage,
    updateStage,
    findCurrentPipelineEntry,
    createPipelineEntry,
    updatePipelineEntry,
    insertPipelineHistory,
    listPipelineHistory,
    listSelectionReviews,
    findSelectionReviewById,
    createSelectionReview,
    updateSelectionReview,
    listDocuments,
    createDocument,
    findDocumentById,
    softDeleteDocument,
    listMilestones,
    createMilestone,
    findMilestoneById,
    updateMilestone,
    softDeleteMilestone,
    listProgress,
    findProgressById,
    createProgress,
    updateProgress,
    softDeleteProgress,
    listMetrics,
    createMetrics,
    findMetricsById,
    listSupportNeeds,
    findSupportNeedById,
    createSupportNeed,
    updateSupportNeed,
    listSupportActivities,
    createSupportActivity,
    findSupportActivityById,
    listEvents,
    findEventById,
    findEventByCode,
    createEvent,
    updateEvent,
    softDeleteEvent,
    listEventStartups,
    findEventStartup,
    addEventStartup,
    deleteEventStartup,
    listEventJudges,
    findEventJudgeById,
    addEventJudge,
    deleteEventJudge,
    listEventFeedbacks,
    createEventFeedback,
    findEventFeedbackById,
    listAwards,
    createAward,
    findAwardById,
    listEventMedia,
    createEventMedia,
    findEventMediaById,
    mentorCanAccessStartup,
    listAlumni,
    findAlumniById,
    createAlumni,
    updateAlumni,
    softDeleteAlumni,
    listAlumniLinks,
    replaceAlumniLinks,
    listPartners,
    findPartnerById,
    createPartner,
    updatePartner,
    softDeletePartner,
    listStartupPartnerConnections,
    createStartupPartnerConnection,
    findPartnerConnectionById,
    updatePartnerConnection,
    listOpportunities,
    findOpportunityById,
    createOpportunity,
    updateOpportunity,
    findOpportunityApplication,
    createOpportunityApplication,
    findOpportunityApplicationById,
    updateOpportunityApplication,
    listStartupOpportunityApplications,
    getAnalyticsOverview,
    getPipelineAnalytics,
    getProgressAnalytics,
    getEventAnalytics,
    getAlumniPartnerAnalytics,
    getEcosystemHealth,
    listStartupReports,
    getStartupActivity,
    userOwnsClass,
    normalizeStoredStartup,
  };
};
