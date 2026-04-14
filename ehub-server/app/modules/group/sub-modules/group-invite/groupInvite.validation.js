import Joi from "joi";

const tokenHex64 = Joi.string().length(64).hex().required();

export const groupInviteTokenParams = {
  params: Joi.object({
    token: tokenHex64,
  }),
};

export const groupInviteReportSchema = {
  body: Joi.object({
    issue_type: Joi.string().valid("group_name", "category", "topic", "member", "other").required(),
    description: Joi.string().trim().max(2000).required(),
  }),
};
