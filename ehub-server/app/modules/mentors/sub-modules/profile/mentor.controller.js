import { sendCreated, sendNoContent, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createMentorController = ({ mentorService }) => {
  const listMentors = catchAsync(async (req, res) => {
    const result = await mentorService.listMentors(req.query);
    return sendPaginated(res, { ...result, message: "Mentors retrieved successfully" });
  });

  const createMentor = catchAsync(async (req, res) => {
    const data = await mentorService.createMentor(req.body, req.user);
    return sendCreated(res, { data, message: "Mentor created successfully" });
  });

  const getMentor = catchAsync(async (req, res) => {
    const data = await mentorService.getMentor(req.params.id);
    return sendSuccess(res, { data, message: "Mentor retrieved successfully" });
  });

  const updateMentor = catchAsync(async (req, res) => {
    const data = await mentorService.updateMentor(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Mentor updated successfully" });
  });

  const updateMentorStatus = catchAsync(async (req, res) => {
    const data = await mentorService.updateMentorStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "Mentor status updated successfully" });
  });

  const deleteMentor = catchAsync(async (req, res) => {
    await mentorService.deleteMentor(req.params.id, req.user);
    return sendNoContent(res);
  });

  const listExpertiseAreas = catchAsync(async (req, res) => {
    const result = await mentorService.listExpertiseAreas(req.query);
    return sendPaginated(res, { ...result, message: "Mentor expertise areas retrieved successfully" });
  });

  const createExpertiseArea = catchAsync(async (req, res) => {
    const data = await mentorService.createExpertiseArea(req.body, req.user);
    return sendCreated(res, { data, message: "Mentor expertise area created successfully" });
  });

  const updateExpertiseArea = catchAsync(async (req, res) => {
    const data = await mentorService.updateExpertiseArea(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Mentor expertise area updated successfully" });
  });

  const deleteExpertiseArea = catchAsync(async (req, res) => {
    await mentorService.deleteExpertiseArea(req.params.id, req.user);
    return sendNoContent(res);
  });

  const getMentorExpertise = catchAsync(async (req, res) => {
    const data = await mentorService.getMentorExpertise(req.params.id);
    return sendSuccess(res, { data, message: "Mentor expertise retrieved successfully" });
  });

  const replaceMentorExpertise = catchAsync(async (req, res) => {
    const data = await mentorService.replaceMentorExpertise(req.params.id, req.body.items, req.user);
    return sendSuccess(res, { data, message: "Mentor expertise updated successfully" });
  });

  const getMentorAvailability = catchAsync(async (req, res) => {
    const data = await mentorService.getMentorAvailability(req.params.id);
    return sendSuccess(res, { data, message: "Mentor availability retrieved successfully" });
  });

  const replaceMentorAvailability = catchAsync(async (req, res) => {
    const data = await mentorService.replaceMentorAvailability(req.params.id, req.body.items, req.user);
    return sendSuccess(res, { data, message: "Mentor availability updated successfully" });
  });

  const listMentorDocuments = catchAsync(async (req, res) => {
    const data = await mentorService.getMentorDocuments(req.params.id);
    return sendSuccess(res, { data, message: "Mentor documents retrieved successfully" });
  });

  const listAllDocuments = catchAsync(async (req, res) => {
    const result = await mentorService.listAllDocuments(req.query);
    return sendPaginated(res, { ...result, message: "Mentor documents retrieved successfully" });
  });

  const initiateMentorDocumentUpload = catchAsync(async (req, res) => {
    const data = await mentorService.initiateDocumentUpload(req.params.id, req.body.file, req.body.document_type, req.user);
    return sendSuccess(res, { data, message: "Mentor document upload initialized" });
  });

  const confirmMentorDocumentUpload = catchAsync(async (req, res) => {
    const data = await mentorService.confirmDocumentUpload(req.params.id, req.body.upload_token, req.user);
    return sendCreated(res, { data, message: "Mentor document uploaded successfully" });
  });

  const deleteMentorDocument = catchAsync(async (req, res) => {
    await mentorService.deleteDocument(req.params.id, req.params.documentId, req.user);
    return sendNoContent(res);
  });

  const getMyProfile = catchAsync(async (req, res) => {
    const data = await mentorService.getMyProfile(req.user);
    return sendSuccess(res, { data, message: "Mentor profile retrieved successfully" });
  });

  const updateMyProfile = catchAsync(async (req, res) => {
    const data = await mentorService.updateMyProfile(req.body, req.user);
    return sendSuccess(res, { data, message: "Mentor profile updated successfully" });
  });

  const getMyExpertise = catchAsync(async (req, res) => {
    const data = await mentorService.getMyExpertise(req.user);
    return sendSuccess(res, { data, message: "Mentor expertise retrieved successfully" });
  });

  const replaceMyExpertise = catchAsync(async (req, res) => {
    const data = await mentorService.replaceMyExpertise(req.body.items, req.user);
    return sendSuccess(res, { data, message: "Mentor expertise updated successfully" });
  });

  const getMyAvailability = catchAsync(async (req, res) => {
    const data = await mentorService.getMyAvailability(req.user);
    return sendSuccess(res, { data, message: "Mentor availability retrieved successfully" });
  });

  const replaceMyAvailability = catchAsync(async (req, res) => {
    const data = await mentorService.replaceMyAvailability(req.body.items, req.user);
    return sendSuccess(res, { data, message: "Mentor availability updated successfully" });
  });

  const getMyDocuments = catchAsync(async (req, res) => {
    const data = await mentorService.getMyDocuments(req.user);
    return sendSuccess(res, { data, message: "Mentor documents retrieved successfully" });
  });

  const initiateMyDocumentUpload = catchAsync(async (req, res) => {
    const data = await mentorService.initiateMyDocumentUpload(req.body.file, req.body.document_type, req.user);
    return sendSuccess(res, { data, message: "Mentor document upload initialized" });
  });

  const confirmMyDocumentUpload = catchAsync(async (req, res) => {
    const data = await mentorService.confirmMyDocumentUpload(req.body.upload_token, req.user);
    return sendCreated(res, { data, message: "Mentor document uploaded successfully" });
  });

  const deleteMyDocument = catchAsync(async (req, res) => {
    await mentorService.deleteMyDocument(req.params.documentId, req.user);
    return sendNoContent(res);
  });

  return {
    listMentors,
    createMentor,
    getMentor,
    updateMentor,
    updateMentorStatus,
    deleteMentor,
    listExpertiseAreas,
    createExpertiseArea,
    updateExpertiseArea,
    deleteExpertiseArea,
    getMentorExpertise,
    replaceMentorExpertise,
    getMentorAvailability,
    replaceMentorAvailability,
    listMentorDocuments,
    listAllDocuments,
    initiateMentorDocumentUpload,
    confirmMentorDocumentUpload,
    deleteMentorDocument,
    getMyProfile,
    updateMyProfile,
    getMyExpertise,
    replaceMyExpertise,
    getMyAvailability,
    replaceMyAvailability,
    getMyDocuments,
    initiateMyDocumentUpload,
    confirmMyDocumentUpload,
    deleteMyDocument,
  };
};
