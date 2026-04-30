/**
 * Joi validation middleware factory
 * Usage: validate(schema)  →  validates req.body
 */
const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message).join("; ");
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};

// ── Reusable Joi Schemas ───────────────────────────────────────────────────

const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("client", "developer").default("client"),
  developerType: Joi.string()
    .valid("web", "app", "ai", "designer", "")
    .optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const requirementSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(5000).required(),
  budget: Joi.number().min(0).required(),
  priority: Joi.string().valid("Low", "Medium", "High", "Extreme").optional(),
  techStack: Joi.array().items(Joi.string()).optional(),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().optional().allow(''),
});

const taskUpdateSchema = Joi.object({
  status: Joi.string()
    .valid("Not Started", "In Progress", "Completed")
    .required(),
});

const messageSchema = Joi.object({
  receiverId: Joi.string().required(),
  content: Joi.string().max(5000).required(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  requirementSchema,
  taskUpdateSchema,
  messageSchema,
};
