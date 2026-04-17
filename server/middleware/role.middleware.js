const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(`[AUTH] Checking role. User role: '${req.user?.role}', Required roles: ${roles}`);
    if (!roles.includes(req.user.role)) {
      console.log(`[AUTH] 403 Forbidden Triggered!`);
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this API` 
      });
    }
    next();
  };
};

module.exports = { authorize };
