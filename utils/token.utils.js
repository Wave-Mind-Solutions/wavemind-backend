/**
 * Token Utilities
 * JWT generation and verification helpers
 */
const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for a given user ID
 * @param {string} userId
 * @returns {string} JWT token
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * Verify and decode a JWT
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { generateToken, verifyToken };
