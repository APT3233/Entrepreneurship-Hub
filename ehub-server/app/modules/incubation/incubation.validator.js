import Joi from "joi";

const positiveId = Joi.number().integer().positive();
const optionalText = Joi.string().trim().max(500).allow("", null);
const optionalLongText = Joi.string().trim().max(10000).allow("", null);
const requiredLongText = Joi.string().trim().min(1).max(10000).required();
const optionalUrl = Joi.string().trim().max(500).allow("", null);

export const productStages = ["idea", "prototype", "mvp", "beta", "launched", "revenue", "company"];
export const startupStatuses = ["candidate", "incubating", "active", "on_hold", "graduated", "archived", "rejected"];
export const startupSources = ["module3_selection", "manual_nomination", "showcase", "alumni", "other"];
export const founderRoles = ["founder", "co_founder", "member", "advisor", "alumni_founder"];
export const founderStatuses = ["active", "inactive", "left"];
export const stageStatuses = ["active", "inactive"];
export const entryStatuses = ["active", "on_hold", "completed", "archived"];
export const reviewSourceTypes = ["evaluation_result", "manual", "showcase", "mentor_recommendation", "ai_suggestion"];
export const reviewStatuses = ["pending", "approved", "rejected", "needs_more_info"];
export const documentTypes = ["pitch_deck", "business_plan", "demo_video", "logo", "certificate", "report", "other"];
export const documentVisibilities = ["private", "internal", "public"];
export const milestoneTypes = ["product", "business", "team", "revenue", "funding", "award", "partnership", "legal", "other"];
export const progressUpdateTypes = ["product", "business", "customer", "revenue", "team", "mentor", "market", "legal", "other"];
export const supportNeedTypes = ["business", "technical", "mentor", "funding_connection", "legal_advice", "marketing", "product", "other"];
export const supportPriorities = ["low", "normal", "high", "urgent"];
export const supportStatuses = ["open", "in_progress", "resolved", "cancelled"];
export const supportActivityTypes = ["mentor_session", "workshop", "partner_intro", "investor_intro", "review_meeting", "demo_day", "other"];
export const eventTypes = ["demo_day", "pitching_day", "showcase", "workshop", "networking", "competition", "other"];
export const eventStatuses = ["draft", "published", "completed", "cancelled", "archived"];
export const participantStatuses = ["invited", "confirmed", "presented", "absent", "withdrawn"];
export const judgeTypes = ["lecturer", "mentor", "partner", "investor", "guest"];
export const interestLevels = ["none", "low", "medium", "high", "follow_up"];
export const awardTypes = ["winner", "runner_up", "best_pitch", "best_technology", "best_business_model", "social_impact", "other"];
export const mediaTypes = ["image", "video", "document", "link", "other"];
export const alumniStatuses = ["active", "inactive", "archived"];
export const alumniLinkRoles = ["founder", "co_founder", "member", "advisor", "mentor", "investor", "partner"];
export const alumniLinkStatuses = ["active", "inactive", "past"];
export const partnerTypes = ["company", "incubator", "accelerator", "investor_fund", "angel_investor", "university", "government", "ngo", "community", "other"];
export const partnerStatuses = ["active", "inactive", "archived"];
export const partnerConnectionTypes = ["introduction", "mentoring", "pilot", "customer", "investor_interest", "incubation_program", "partnership", "other"];
export const partnerConnectionStatuses = ["proposed", "contacted", "in_progress", "successful", "rejected", "cancelled"];
export const opportunityTypes = ["incubation_program", "grant", "competition", "workshop", "mentor_session", "pilot_program", "investor_meeting", "other"];
export const opportunityStatuses = ["draft", "open", "closed", "archived"];
export const applicationStatuses = ["interested", "applied", "shortlisted", "accepted", "rejected", "withdrawn"];

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const startupProfileFields = {
  group_id: positiveId.allow(null),
  class_id: positiveId.allow(null),
  semester_id: positiveId.allow(null),
  subject_id: positiveId.allow(null),
  startup_name: Joi.string().trim().max(200).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(220).allow("", null),
  logo_url: optionalUrl,
  tagline: Joi.string().trim().max(255).allow("", null),
  short_description: optionalLongText,
  full_description: optionalLongText,
  problem_statement: optionalLongText,
  solution_description: optionalLongText,
  target_customers: optionalLongText,
  business_model: optionalLongText,
  product_stage: Joi.string().valid(...productStages).default("idea"),
  startup_status: Joi.string().valid(...startupStatuses).default("candidate"),
  category: optionalText,
  industry: Joi.string().trim().max(150).allow("", null),
  technology_tags: Joi.array().items(Joi.string().trim().max(80)).max(30).allow(null),
  website_url: optionalUrl,
  github_url: optionalUrl,
  demo_url: optionalUrl,
  pitch_deck_url: optionalUrl,
  video_url: optionalUrl,
  source: Joi.string().valid(...startupSources).default("manual_nomination"),
  selected_score: Joi.number().min(0).max(1000).allow(null),
  selected_reason: optionalLongText,
  selected_at: Joi.date().iso().allow(null),
  initial_stage_id: positiveId.allow(null),
};

const startupUpdateFields = { ...startupProfileFields };
delete startupUpdateFields.startup_name;
delete startupUpdateFields.initial_stage_id;

export const listStartupsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    semester_id: positiveId.allow("", null),
    subject_id: positiveId.allow("", null),
    class_id: positiveId.allow("", null),
    status: Joi.string().valid("", ...startupStatuses).allow(""),
    product_stage: Joi.string().valid("", ...productStages).allow(""),
    pipeline_stage_id: positiveId.allow("", null),
    source: Joi.string().valid("", ...startupSources).allow(""),
    min_score: Joi.number().min(0).allow("", null),
    max_score: Joi.number().min(0).allow("", null),
  }),
};

export const startupIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const groupIdParamSchema = {
  params: Joi.object({ groupId: positiveId.required() }),
};

export const createStartupSchema = {
  body: Joi.object(startupProfileFields),
};

export const updateStartupSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    ...startupUpdateFields,
    startup_name: Joi.string().trim().max(200),
  }).min(1),
};

export const createStartupFromGroupSchema = {
  params: Joi.object({ groupId: positiveId.required() }),
  body: Joi.object({
    startup_name: Joi.string().trim().max(200).required(),
    slug: startupProfileFields.slug,
    logo_url: optionalUrl,
    tagline: Joi.string().trim().max(255).allow("", null),
    short_description: optionalLongText,
    full_description: optionalLongText,
    problem_statement: optionalLongText,
    solution_description: optionalLongText,
    target_customers: optionalLongText,
    business_model: optionalLongText,
    product_stage: Joi.string().valid(...productStages).default("idea"),
    startup_status: Joi.string().valid(...startupStatuses).default("candidate"),
    category: optionalText,
    industry: Joi.string().trim().max(150).allow("", null),
    technology_tags: Joi.array().items(Joi.string().trim().max(80)).max(30).allow(null),
    website_url: optionalUrl,
    github_url: optionalUrl,
    demo_url: optionalUrl,
    pitch_deck_url: optionalUrl,
    video_url: optionalUrl,
    source: Joi.string().valid(...startupSources).default("module3_selection"),
    selected_score: Joi.number().min(0).max(1000).allow(null),
    selected_reason: requiredLongText,
    initial_stage_id: positiveId.required(),
  }),
};

export const listSelectionReviewsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    status: Joi.string().valid("", ...reviewStatuses).allow(""),
    source_type: Joi.string().valid("", ...reviewSourceTypes).allow(""),
    group_id: positiveId.allow("", null),
    startup_id: positiveId.allow("", null),
  }),
};

export const createSelectionReviewSchema = {
  body: Joi.object({
    group_id: positiveId.allow(null),
    startup_id: positiveId.allow(null),
    source_type: Joi.string().valid(...reviewSourceTypes).default("manual"),
    nomination_reason: requiredLongText,
    support_needed: optionalLongText,
    proposed_stage_id: positiveId.allow(null),
    evaluation_summary: optionalLongText,
    average_score: Joi.number().min(0).max(1000).allow(null),
    potential_score: Joi.number().min(0).max(1000).allow(null),
  }).or("group_id", "startup_id"),
};

export const lecturerNominationSchema = {
  params: Joi.object({ groupId: positiveId.required() }),
  body: Joi.object({
    nomination_reason: requiredLongText,
    source_type: Joi.string().valid("manual", "evaluation_result").default("manual"),
    support_needed: optionalLongText,
    proposed_stage_id: positiveId.allow(null),
    evaluation_summary: optionalLongText,
    average_score: Joi.number().min(0).max(1000).allow(null),
    potential_score: Joi.number().min(0).max(1000).allow(null),
  }),
};

export const reviewSelectionSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    review_status: Joi.string().valid("approved", "rejected", "needs_more_info").required(),
    review_note: optionalLongText,
    startup_name: Joi.string().trim().max(200),
    product_stage: Joi.string().valid(...productStages),
    startup_status: Joi.string().valid(...startupStatuses),
    initial_stage_id: positiveId.allow(null),
  }),
};

export const listStagesSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    status: Joi.string().valid("", ...stageStatuses).allow(""),
  }),
};

export const createStageSchema = {
  body: Joi.object({
    code: Joi.string().trim().lowercase().pattern(/^[a-z0-9_]+$/).max(80).required(),
    name: Joi.string().trim().max(150).required(),
    description: optionalLongText,
    order_index: Joi.number().integer().min(0).default(0),
    is_final: Joi.boolean().truthy(1).falsy(0).default(false),
    status: Joi.string().valid(...stageStatuses).default("active"),
  }),
};

export const updateStageSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    code: Joi.string().trim().lowercase().pattern(/^[a-z0-9_]+$/).max(80),
    name: Joi.string().trim().max(150),
    description: optionalLongText,
    order_index: Joi.number().integer().min(0),
    is_final: Joi.boolean().truthy(1).falsy(0),
    status: Joi.string().valid(...stageStatuses),
  }).min(1),
};

export const updateStartupStageSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    stage_id: positiveId.required(),
    status: Joi.string().valid(...entryStatuses).default("active"),
    action: Joi.string().valid("moved", "on_hold", "resumed", "graduated", "archived", "rejected").default("moved"),
    reason: optionalLongText,
  }),
};

const uploadFileSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  size: Joi.number().integer().min(1).required(),
  type: Joi.string().trim().max(100).allow("").default("application/octet-stream"),
});

export const initiateDocumentUploadSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    document_type: Joi.string().valid(...documentTypes).default("other"),
    visibility: Joi.string().valid(...documentVisibilities).default("internal"),
    file: uploadFileSchema.required(),
  }),
};

export const confirmDocumentUploadSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ upload_token: Joi.string().required() }),
};

export const deleteDocumentSchema = {
  params: Joi.object({ id: positiveId.required(), documentId: positiveId.required() }),
};

export const milestoneIdParamSchema = {
  params: Joi.object({ id: positiveId.required(), milestoneId: positiveId.required() }),
};

export const createMilestoneSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    title: Joi.string().trim().max(200).required(),
    description: optionalLongText,
    milestone_type: Joi.string().valid(...milestoneTypes).default("other"),
    milestone_date: Joi.date().iso().required(),
    evidence_url: optionalUrl,
  }),
};

export const updateMilestoneSchema = {
  params: Joi.object({ id: positiveId.required(), milestoneId: positiveId.required() }),
  body: Joi.object({
    title: Joi.string().trim().max(200),
    description: optionalLongText,
    milestone_type: Joi.string().valid(...milestoneTypes),
    milestone_date: Joi.date().iso(),
    evidence_url: optionalUrl,
  }).min(1),
};

export const listProgressSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({
    ...paginationQuery,
    update_type: Joi.string().valid("", ...progressUpdateTypes).allow(""),
    visibility: Joi.string().valid("", ...documentVisibilities).allow(""),
  }),
};

export const createProgressSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    update_title: Joi.string().trim().max(200).required(),
    update_content: requiredLongText,
    update_type: Joi.string().valid(...progressUpdateTypes).default("other"),
    progress_date: Joi.date().iso().required(),
    visibility: Joi.string().valid(...documentVisibilities).default("internal"),
  }),
};

export const updateProgressSchema = {
  params: Joi.object({ id: positiveId.required(), progressId: positiveId.required() }),
  body: Joi.object({
    update_title: Joi.string().trim().max(200),
    update_content: optionalLongText,
    update_type: Joi.string().valid(...progressUpdateTypes),
    progress_date: Joi.date().iso(),
    visibility: Joi.string().valid(...documentVisibilities),
  }).min(1),
};

export const progressIdParamSchema = {
  params: Joi.object({ id: positiveId.required(), progressId: positiveId.required() }),
};

export const listMetricsSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({ ...paginationQuery }),
};

export const createMetricsSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    snapshot_date: Joi.date().iso().required(),
    product_stage: Joi.string().valid(...productStages).default("idea"),
    users_count: Joi.number().integer().min(0).allow(null),
    customers_count: Joi.number().integer().min(0).allow(null),
    revenue_amount: Joi.number().min(0).allow(null),
    revenue_currency: Joi.string().trim().uppercase().max(10).default("VND"),
    team_size: Joi.number().integer().min(0).allow(null),
    mvp_completed: Joi.boolean().truthy(1).falsy(0).default(false),
    market_validated: Joi.boolean().truthy(1).falsy(0).default(false),
    has_demo: Joi.boolean().truthy(1).falsy(0).default(false),
    has_pitch_deck: Joi.boolean().truthy(1).falsy(0).default(false),
    has_business_model: Joi.boolean().truthy(1).falsy(0).default(false),
    note: optionalLongText,
  }),
};

export const listSupportNeedsSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({
    ...paginationQuery,
    need_type: Joi.string().valid("", ...supportNeedTypes).allow(""),
    priority: Joi.string().valid("", ...supportPriorities).allow(""),
    status: Joi.string().valid("", ...supportStatuses).allow(""),
  }),
};

export const createSupportNeedSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    need_type: Joi.string().valid(...supportNeedTypes).default("other"),
    title: Joi.string().trim().max(200).required(),
    description: requiredLongText,
    priority: Joi.string().valid(...supportPriorities).default("normal"),
    assigned_to: positiveId.allow(null),
  }),
};

export const updateSupportNeedStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    status: Joi.string().valid(...supportStatuses).required(),
    assigned_to: positiveId.allow(null),
  }),
};

export const listSupportActivitiesSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({
    ...paginationQuery,
    activity_type: Joi.string().valid("", ...supportActivityTypes).allow(""),
  }),
};

export const createSupportActivitySchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    support_need_id: positiveId.allow(null),
    activity_type: Joi.string().valid(...supportActivityTypes).default("other"),
    title: Joi.string().trim().max(200).required(),
    description: optionalLongText,
    activity_date: Joi.date().iso().required(),
    related_mentor_id: positiveId.allow(null),
    related_partner_id: positiveId.allow(null),
  }),
};

export const studentStartupIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const listEventsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    event_type: Joi.string().valid("", ...eventTypes).allow(""),
    status: Joi.string().valid("", ...eventStatuses).allow(""),
    visibility: Joi.string().valid("", ...documentVisibilities).allow(""),
    date_from: Joi.date().iso().allow("", null),
    date_to: Joi.date().iso().allow("", null),
  }),
};

export const eventIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const createEventSchema = {
  body: Joi.object({
    event_code: Joi.string().trim().max(80).allow("", null),
    event_name: Joi.string().trim().max(200).required(),
    event_type: Joi.string().valid(...eventTypes).default("other"),
    description: optionalLongText,
    start_at: Joi.date().iso().required(),
    end_at: Joi.date().iso().allow(null),
    location: Joi.string().trim().max(255).allow("", null),
    meeting_link: optionalUrl,
    visibility: Joi.string().valid(...documentVisibilities).default("internal"),
    status: Joi.string().valid(...eventStatuses).default("draft"),
  }),
};

export const updateEventSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    event_code: Joi.string().trim().max(80).allow("", null),
    event_name: Joi.string().trim().max(200),
    event_type: Joi.string().valid(...eventTypes),
    description: optionalLongText,
    start_at: Joi.date().iso(),
    end_at: Joi.date().iso().allow(null),
    location: Joi.string().trim().max(255).allow("", null),
    meeting_link: optionalUrl,
    visibility: Joi.string().valid(...documentVisibilities),
    status: Joi.string().valid(...eventStatuses),
  }).min(1),
};

export const updateEventStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ status: Joi.string().valid(...eventStatuses).required() }),
};

export const listEventStartupsSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({
    ...paginationQuery,
    participation_status: Joi.string().valid("", ...participantStatuses).allow(""),
  }),
};

export const addEventStartupSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    startup_id: positiveId.required(),
    pitch_order: Joi.number().integer().min(0).allow(null),
    booth_location: Joi.string().trim().max(150).allow("", null),
    participation_status: Joi.string().valid(...participantStatuses).default("invited"),
    pitch_deck_url: optionalUrl,
    demo_url: optionalUrl,
    note: optionalLongText,
  }),
};

export const deleteEventStartupSchema = {
  params: Joi.object({ id: positiveId.required(), startupId: positiveId.required() }),
};

export const listEventJudgesSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({ ...paginationQuery }),
};

export const addEventJudgeSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    user_id: positiveId.allow(null),
    mentor_id: positiveId.allow(null),
    full_name: Joi.string().trim().max(150).required(),
    email: Joi.string().trim().email().max(150).allow("", null),
    organization: Joi.string().trim().max(255).allow("", null),
    role_title: Joi.string().trim().max(150).allow("", null),
    judge_type: Joi.string().valid(...judgeTypes).default("guest"),
  }),
};

export const deleteEventJudgeSchema = {
  params: Joi.object({ id: positiveId.required(), judgeId: positiveId.required() }),
};

export const listEventFeedbacksSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({
    ...paginationQuery,
    startup_id: positiveId.allow("", null),
  }),
};

export const createEventFeedbackSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    startup_id: positiveId.required(),
    judge_id: positiveId.allow(null),
    rating: Joi.number().integer().min(1).max(5).allow(null),
    feedback: optionalLongText,
    strengths: optionalLongText,
    improvements: optionalLongText,
    interest_level: Joi.string().valid(...interestLevels).default("none"),
  }),
};

export const listAwardsSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({ ...paginationQuery }),
};

export const createAwardSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    event_id: positiveId.allow(null),
    award_name: Joi.string().trim().max(200).required(),
    award_type: Joi.string().valid(...awardTypes).default("other"),
    description: optionalLongText,
    awarded_at: Joi.date().iso().required(),
    evidence_url: optionalUrl,
  }),
};

export const listEventMediaSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({
    ...paginationQuery,
    media_type: Joi.string().valid("", ...mediaTypes).allow(""),
    visibility: Joi.string().valid("", ...documentVisibilities).allow(""),
  }),
};

export const createEventMediaSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    startup_id: positiveId.allow(null),
    media_type: Joi.string().valid(...mediaTypes).default("other"),
    title: Joi.string().trim().max(200).allow("", null),
    file_url: optionalUrl,
    external_url: optionalUrl,
    visibility: Joi.string().valid(...documentVisibilities).default("internal"),
  }).or("file_url", "external_url"),
};

const alumniFields = {
  user_id: positiveId.allow(null),
  student_id: positiveId.allow(null),
  full_name: Joi.string().trim().max(150).required(),
  email: Joi.string().trim().email().max(150).allow("", null),
  phone: Joi.string().trim().max(20).allow("", null),
  graduation_year: Joi.number().integer().min(1900).max(2200).allow(null),
  major: Joi.string().trim().max(150).allow("", null),
  campus: Joi.string().trim().max(100).allow("", null),
  current_position: Joi.string().trim().max(150).allow("", null),
  current_company: Joi.string().trim().max(255).allow("", null),
  linkedin_url: optionalUrl,
  bio: optionalLongText,
  status: Joi.string().valid(...alumniStatuses).default("active"),
  startup_links: Joi.array().items(Joi.object({
    startup_id: positiveId.required(),
    role: Joi.string().valid(...alumniLinkRoles).default("founder"),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().allow(null),
    status: Joi.string().valid(...alumniLinkStatuses).default("active"),
    note: optionalLongText,
  })).max(50),
};

export const listAlumniSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    status: Joi.string().valid("", ...alumniStatuses).allow(""),
    graduation_year: Joi.number().integer().min(1900).max(2200).allow("", null),
  }),
};

export const alumniIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const createAlumniSchema = {
  body: Joi.object(alumniFields),
};

export const updateAlumniSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ ...alumniFields, full_name: Joi.string().trim().max(150) }).min(1),
};

const partnerFields = {
  partner_name: Joi.string().trim().max(200).required(),
  partner_type: Joi.string().valid(...partnerTypes).default("other"),
  contact_person: Joi.string().trim().max(150).allow("", null),
  contact_email: Joi.string().trim().email().max(150).allow("", null),
  contact_phone: Joi.string().trim().max(20).allow("", null),
  website_url: optionalUrl,
  description: optionalLongText,
  focus_areas: Joi.array().items(Joi.string().trim().max(80)).max(50).allow(null),
  status: Joi.string().valid(...partnerStatuses).default("active"),
  visibility: Joi.string().valid(...documentVisibilities).default("internal"),
};

export const listPartnersSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    partner_type: Joi.string().valid("", ...partnerTypes).allow(""),
    status: Joi.string().valid("", ...partnerStatuses).allow(""),
    visibility: Joi.string().valid("", ...documentVisibilities).allow(""),
  }),
};

export const partnerIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const createPartnerSchema = {
  body: Joi.object(partnerFields),
};

export const updatePartnerSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ ...partnerFields, partner_name: Joi.string().trim().max(200) }).min(1),
};

export const listStartupPartnersSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({
    ...paginationQuery,
    status: Joi.string().valid("", ...partnerConnectionStatuses).allow(""),
    connection_type: Joi.string().valid("", ...partnerConnectionTypes).allow(""),
  }),
};

export const createStartupPartnerSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    partner_id: positiveId.required(),
    connection_type: Joi.string().valid(...partnerConnectionTypes).default("introduction"),
    status: Joi.string().valid(...partnerConnectionStatuses).default("proposed"),
    contact_date: Joi.date().iso().allow(null),
    follow_up_date: Joi.date().iso().allow(null),
    note: optionalLongText,
    outcome: optionalLongText,
  }),
};

export const updatePartnerConnectionStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    status: Joi.string().valid(...partnerConnectionStatuses).required(),
    follow_up_date: Joi.date().iso().allow(null),
    outcome: optionalLongText,
    note: optionalLongText,
  }),
};

const opportunityFields = {
  partner_id: positiveId.allow(null),
  opportunity_type: Joi.string().valid(...opportunityTypes).default("other"),
  title: Joi.string().trim().max(200).required(),
  description: optionalLongText,
  eligibility: optionalLongText,
  deadline: Joi.date().iso().allow(null),
  external_url: optionalUrl,
  status: Joi.string().valid(...opportunityStatuses).default("draft"),
  visibility: Joi.string().valid(...documentVisibilities).default("internal"),
};

export const listOpportunitiesSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    partner_id: positiveId.allow("", null),
    opportunity_type: Joi.string().valid("", ...opportunityTypes).allow(""),
    status: Joi.string().valid("", ...opportunityStatuses).allow(""),
    visibility: Joi.string().valid("", ...documentVisibilities).allow(""),
  }),
};

export const opportunityIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const createOpportunitySchema = {
  body: Joi.object(opportunityFields),
};

export const updateOpportunitySchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ ...opportunityFields, title: Joi.string().trim().max(200) }).min(1),
};

export const updateOpportunityStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ status: Joi.string().valid(...opportunityStatuses).required() }),
};

export const applyOpportunitySchema = {
  params: Joi.object({ id: positiveId.required(), opportunityId: positiveId.required() }),
  body: Joi.object({
    application_status: Joi.string().valid("interested", "applied").default("interested"),
    application_note: optionalLongText,
  }),
};

export const listStartupOpportunitiesSchema = {
  params: Joi.object({ id: positiveId.required() }),
  query: Joi.object({ ...paginationQuery }),
};

export const updateApplicationStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    application_status: Joi.string().valid(...applicationStatuses).required(),
    result_note: optionalLongText,
  }),
};

export const analyticsQuerySchema = {
  query: Joi.object({
    semester_id: positiveId.allow("", null),
    subject_id: positiveId.allow("", null),
    class_id: positiveId.allow("", null),
    category: optionalText,
    stage_id: positiveId.allow("", null),
    startup_status: Joi.string().valid("", ...startupStatuses).allow(""),
    product_stage: Joi.string().valid("", ...productStages).allow(""),
    date_from: Joi.date().iso().allow("", null),
    date_to: Joi.date().iso().allow("", null),
  }),
};

export const reportsQuerySchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    semester_id: positiveId.allow("", null),
    subject_id: positiveId.allow("", null),
    class_id: positiveId.allow("", null),
    category: optionalText,
    stage_id: positiveId.allow("", null),
    startup_status: Joi.string().valid("", ...startupStatuses).allow(""),
    product_stage: Joi.string().valid("", ...productStages).allow(""),
    date_from: Joi.date().iso().allow("", null),
    date_to: Joi.date().iso().allow("", null),
  }),
};

export const reportStartupIdSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const updateFounderStartupSchema = {
  params: Joi.object({ startupId: positiveId.required() }),
  body: Joi.object({
    startup_name: Joi.string().trim().max(200),
    logo_url: optionalUrl,
    tagline: Joi.string().trim().max(255).allow("", null),
    short_description: optionalLongText,
    full_description: optionalLongText,
    problem_statement: optionalLongText,
    solution_description: optionalLongText,
    target_customers: optionalLongText,
    business_model: optionalLongText,
    product_stage: Joi.string().valid(...productStages),
    category: optionalText,
    industry: Joi.string().trim().max(150).allow("", null),
    technology_tags: Joi.array().items(Joi.string().trim().max(80)).max(30).allow(null),
    website_url: optionalUrl,
    github_url: optionalUrl,
    demo_url: optionalUrl,
    pitch_deck_url: optionalUrl,
    video_url: optionalUrl,
  }).min(1),
};

export const founderStartupIdParamSchema = {
  params: Joi.object({ startupId: positiveId.required() }),
};
