const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'Accès refusé : token manquant' });
  
  try {
    const secret = process.env.JWT_SECRET || 'monsecretdev';
    const verified = jwt.verify(token, secret);
    req.user = verified; // on peut récupérer l'id utilisateur par ex.
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = auth;
