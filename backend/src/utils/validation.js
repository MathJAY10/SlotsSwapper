import Joi from 'joi';

export const signupSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const eventSchema = Joi.object({
  title: Joi.string().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  status: Joi.string().valid('BUSY', 'SWAPPABLE').optional()
});

export const swapRequestSchema = Joi.object({
  mySlotId: Joi.string().required(),
  theirSlotId: Joi.string().required()
});

export const swapResponseSchema = Joi.object({
  accept: Joi.boolean().required()
});

export const validate = (data, schema) => {
  const { error, value } = schema.validate(data);
  if (error) throw new Error(error.details[0].message);
  return value;
};
