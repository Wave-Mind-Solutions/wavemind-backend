/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Supports BOTH calling styles:
 *   roleMiddleware("admin")
 *   roleMiddleware("admin", "developer")
 *   roleMiddleware(["admin", "developer"])
 */
const roleMiddleware = (...args) => {
  // Flatten: if caller passes an array as first arg, unwrap it
  const allowedRoles = args.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
