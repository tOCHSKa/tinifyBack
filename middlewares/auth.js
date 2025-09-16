// middleware/auth.js
const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token manquant' })

  try {
    const secret = process.env.JWT_SECRET || 'monsecretdev'
    const verified = jwt.verify(token, secret)
    req.user = verified
    next()
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' })
  }
}

module.exports = auth

