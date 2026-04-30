const activityService = require("../services/activity.service");

/**
 * Activity Logger Middleware
 * Automatically logs successful write operations (POST, PATCH, DELETE)
 */

const activityLogger = (req, res, next) => {
  // Store the original send method to intercept it
  const originalSend = res.send;

  res.send = function (data) {
    // Check if the request was successful and it's a write operation
    if (res.statusCode >= 200 && res.statusCode < 300 && 
        ["POST", "PATCH", "DELETE"].includes(req.method)) {
      
      const userId = req.user?._id;
      if (userId) {
        let actionType = "UPDATE";
        if (req.method === "POST") actionType = "CREATE";
        if (req.method === "DELETE") actionType = "DELETE";

        // Determine entity type based on URL
        let entityType = "User";
        if (req.originalUrl.includes("/admin/projects")) entityType = "Project";
        if (req.originalUrl.includes("/admin/tasks")) entityType = "Task";
        if (req.originalUrl.includes("/admin/requirements")) entityType = "Requirement";
        if (req.originalUrl.includes("/chat")) entityType = "Deliverable"; // Adjust as needed
        if (req.originalUrl.includes("/auth")) entityType = "Auth";

        // Record activity in background
        activityService.recordActivity({
          userId,
          actionType,
          entityType,
          entityId: req.params.id || req.body.projectId || req.body.requirementId,
          description: `${actionType} operation on ${entityType} at ${req.originalUrl}`,
          metadata: {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode
          }
        }).catch(err => console.error("Error auto-logging activity:", err));
      }
    }

    // Call the original send method
    return originalSend.apply(res, arguments);
  };

  next();
};

module.exports = activityLogger;
