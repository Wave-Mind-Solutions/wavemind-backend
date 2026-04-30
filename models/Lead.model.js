/**
 * WaveMind Solutions – Lead Model
 * Stores chatbot-collected prospect data for follow-up
 */

const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    contact: {
      type: String,
      required: [true, 'Contact (email or phone) is required'],
      trim: true,
      maxlength: [200, 'Contact must not exceed 200 characters'],
    },
    requirement: {
      type: String,
      required: [true, 'Requirement description is required'],
      trim: true,
      minlength: [5, 'Requirement must be at least 5 characters'],
      maxlength: [2000, 'Requirement must not exceed 2000 characters'],
    },
    source: {
      type: String,
      default: 'chatbot',
      enum: ['chatbot', 'contact-form', 'referral', 'other'],
    },
    status: {
      type: String,
      default: 'new',
      enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    collection: 'leads',
  }
);

// Index for efficient admin queries
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1 });

module.exports = mongoose.model('Lead', leadSchema);
