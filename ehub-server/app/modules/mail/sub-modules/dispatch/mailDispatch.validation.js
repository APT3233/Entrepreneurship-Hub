import Joi from "joi";

export const mailDispatchPublicIdSchema = {
  params: Joi.object({
    publicId: Joi.string()
      .length(36)
      .pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      .required(),
  }),
};
