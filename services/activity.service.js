const ActivityLog = require("../models/ActivityLog.model");

/**
 * Activity Log Service
 * Provides methods to record and retrieve activity logs
 */

const recordActivity = async ({
  userId,
  actionType,
  entityType,
  entityId,
  description,
  metadata = {},
}) => {
  try {
    const log = await ActivityLog.create({
      userId,
      actionType,
      entityType,
      entityId,
      description,
      metadata,
    });
    return log;
  } catch (error) {
    console.error("Error recording activity log:", error);
  }
};

const getLogs = async (query = {}, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .populate("userId", "fullName email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(query),
  ]);

  return {
    logs,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
};

module.exports = { recordActivity, getLogs };
