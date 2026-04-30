/**
 * API Response Helpers
 * Consistent response format across the entire API
 */

/**
 * Send a success response
 * @param {import("express").Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} data
 * @param {object} meta  – optional pagination or extra meta info
 */
const successResponse = (res, statusCode = 200, message = "Success", data = null, meta = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response
 * @param {import("express").Response} res
 * @param {number} statusCode
 * @param {string} message
 */
const errorResponse = (res, statusCode = 500, message = "Internal Server Error") =>
  res.status(statusCode).json({ success: false, message });

/**
 * Create a custom error with a status code (to be thrown in async routes)
 * @param {string} message
 * @param {number} statusCode
 */
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { successResponse, errorResponse, createError };
