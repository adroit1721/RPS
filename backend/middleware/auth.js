const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        console.log(`Auth 403: Role ${decoded.role} not in allowed roles: ${roles} for path ${req.originalUrl}`);
        return res.status(403).json({ msg: 'Access denied' });
      }
      next();
    } catch (err) {
      res.status(401).json({ msg: 'Token invalid' });
    }
  };
};

module.exports = auth;
