const activityService = require("../services/activity.service");

/**
 * Activity Controller
 * Handles fetching activity logs for admin and project timelines
 */

const getAllLogs = async (req, res) => {
  const { page, limit, userId, actionType, entityType } = req.query;
  const query = {};
  if (userId) query.userId = userId;
  if (actionType) query.actionType = actionType;
  if (entityType) query.entityType = entityType;

  const result = await activityService.getLogs(query, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

const getProjectTimeline = async (req, res) => {
  const { projectId } = req.params;
  const { page, limit } = req.query;

  const result = await activityService.getLogs(
    { entityId: projectId, entityType: "Project" },
    {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    }
  );

  // Also include task logs related to this project
  // In a more complex setup, we'd query logs where metadata.projectId === projectId
  
  res.status(200).json({
    success: true,
    ...result,
  });
};

module.exports = { getAllLogs, getProjectTimeline };
