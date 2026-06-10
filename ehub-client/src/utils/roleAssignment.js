export const STUDENT_ROLE_CODE = "student";
export const MENTOR_ROLE_CODE = "mentor";
export const STAFF_ROLE_CODES = ["lecturer", "admin"];

export function isStaffRoleCode(roleCode) {
  return STAFF_ROLE_CODES.includes(roleCode);
}

/** Linked to students table and/or currently has student role. */
export function isStudentAccount(user) {
  if (!user) return false;
  return Boolean(user.is_student_goc) || (user.roles || []).includes(STUDENT_ROLE_CODE);
}

/** Linked to lecturer_profiles and/or currently has lecturer/admin role. */
export function isStaffAccount(user) {
  if (!user) return false;
  return (
    Boolean(user.is_lecturer_goc) ||
    (user.roles || []).some((role) => STAFF_ROLE_CODES.includes(role))
  );
}

export function canAssignRoleToUser(user, roleCode) {
  if (!user) return true;
  if ((isStaffRoleCode(roleCode) || roleCode === MENTOR_ROLE_CODE) && isStudentAccount(user)) return false;
  if (roleCode === STUDENT_ROLE_CODE && isStaffAccount(user)) return false;
  if (roleCode === STUDENT_ROLE_CODE && (user.roles || []).includes(MENTOR_ROLE_CODE)) return false;
  return true;
}

export function applyRoleToggle(currentRoles, roleCode) {
  let next = currentRoles.includes(roleCode)
    ? currentRoles.filter((item) => item !== roleCode)
    : [...currentRoles, roleCode];

  if (roleCode === STUDENT_ROLE_CODE && next.includes(STUDENT_ROLE_CODE)) {
    next = next.filter((item) => !STAFF_ROLE_CODES.includes(item) && item !== MENTOR_ROLE_CODE);
  } else if ((isStaffRoleCode(roleCode) || roleCode === MENTOR_ROLE_CODE) && next.includes(roleCode)) {
    next = next.filter((item) => item !== STUDENT_ROLE_CODE);
  }

  return next;
}

export function getRoleAssignmentError(roles, user, t) {
  const hasStudent = roles.includes(STUDENT_ROLE_CODE);
  const hasStaff = roles.some(isStaffRoleCode);
  const hasMentor = roles.includes(MENTOR_ROLE_CODE);

  if (hasStudent && (hasStaff || hasMentor)) {
    return t("admin.errors.roleMixed");
  }

  if (user && isStudentAccount(user) && (hasStaff || hasMentor)) {
    return t("admin.errors.roleStudentCannotStaff");
  }

  if (user && isStaffAccount(user) && hasStudent) {
    return t("admin.errors.roleStaffCannotStudent");
  }

  return null;
}
