// 📦 middleware/auth.js
const { verifyToken } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Token invalide' });

  req.user = decoded;
  next();
};
