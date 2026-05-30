/**
 * @typedef {Object} AdminSubject
 * @property {number} id
 * @property {string} subject_code
 * @property {string} subject_name
 * @property {string|null} subject_name_en
 * @property {number} credits
 * @property {"active"|"inactive"} status
 */

/**
 * @typedef {Object} AdminSemester
 * @property {number} id
 * @property {string} semester_code
 * @property {string} semester_name
 * @property {number} year
 * @property {string} start_date
 * @property {string} end_date
 * @property {"upcoming"|"ongoing"|"completed"} status
 */

/**
 * @typedef {Object} AdminClass
 * @property {number} id
 * @property {number} subject_id
 * @property {number} semester_id
 * @property {string} class_code
 * @property {string|null} class_name
 * @property {number|null} lecturer_id
 * @property {"draft"|"active"|"completed"|"archived"} status
 */

export {};
