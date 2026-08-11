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
  phone: Joi.string().optional().allow(''),
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
  title: Joi.string().max(200).optional().allow(''),
  name: Joi.string().optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().min(8).max(20).required(),
  projectType: Joi.string().optional().allow(''),
  businessIndustry: Joi.string().optional().allow(''),
  businessType: Joi.string().optional().allow(''),
  projectGoal: Joi.string().optional().allow(''),
  requiredFeatures: Joi.array().items(Joi.string()).optional(),
  designRequirement: Joi.string().optional().allow(''),
  budget: Joi.number().min(0).optional().allow(null, 0),
  timeline: Joi.string().optional().allow(''),
  additionalServices: Joi.array().items(Joi.string()).optional(),
  description: Joi.string().max(5000).optional().allow(''),
  priority: Joi.string().optional().allow(''),
  techStack: Joi.array().items(Joi.string()).optional(),
  userId: Joi.string().optional().allow(''),
  submittedAt: Joi.string().optional().allow(''),
}).unknown(true);

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
