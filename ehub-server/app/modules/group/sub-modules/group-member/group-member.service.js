import {
  NotFound,
  AlreadyExists,
  BadRequest,
  Conflict,
} from "app/core/errors/errorFactory.js";

export const createGroupMemberService = ({
  groupMemberRepository,
  groupRepository,
  studentRepository,
}) => {
  /**
   * List members of a group
   */
  const getByGroup = async (groupId) => {
    const group = await groupRepository.findById(groupId);
    if (!group) throw NotFound("Group");
    return groupMemberRepository.findByGroup(groupId);
  };

  /**
   * Add a student to a group
   */
  const addMember = async (groupId, data) => {
    const { student_id, role = "member" } = data;

    const group = await groupRepository.findById(groupId);
    if (!group) throw NotFound("Group");

    const student = await studentRepository.findById(student_id);
    if (!student) throw NotFound("Student");

    // Check if student is already in this group
    const existing = await groupMemberRepository.findByGroupAndStudent(
      groupId,
      student_id,
    );
    if (existing) throw AlreadyExists("Group member");

    // Check if student is already in another group in the same class
    const existingInClass = await groupMemberRepository.findStudentGroupInClass(
      student_id,
      group.class_id,
    );
    if (existingInClass) {
      throw Conflict(
        `Student is already in group "${existingInClass.group_name}" (${existingInClass.group_code}) in this class`,
      );
    }

    // Check max members
    const currentCount =
      await groupMemberRepository.countActiveByGroup(groupId);
    if (currentCount >= group.max_members) {
      throw BadRequest(`Group is full — max ${group.max_members} members`);
    }

    return groupMemberRepository.create({
      group_id: groupId,
      student_id,
      role,
      status: "active",
    });
  };

  /**
   * Remove a student from a group
   */
  const removeMember = async (groupId, studentId) => {
    const membership = await groupMemberRepository.findByGroupAndStudent(
      groupId,
      studentId,
    );
    if (!membership) throw NotFound("Group member");

    return groupMemberRepository.hardDelete(membership.id);
  };

  return { getByGroup, addMember, removeMember };
};
