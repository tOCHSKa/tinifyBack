const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Création d'un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Ajout explicite du rôle
    const user = new User({
      email,
      password,
      role: 'user',
    });

    await user.save();

    res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Génération du token
    const secret = process.env.JWT_SECRET || 'monsecretdev';
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      secret,
      { expiresIn: '1h' }
    );

    // ✅ Envoyer le token dans un cookie
    res.cookie('token', token, {
      httpOnly: true,               // protégé contre l'accès JS
      secure: process.env.NODE_ENV === 'production', // true si HTTPS
      sameSite: 'lax',              // 'none' + secure:true si front/back domaines différents
      maxAge: 60 * 60 * 1000        // 1h
    });

    // Optionnel : renvoyer des infos publiques (jamais le token)
    res.json({
      message: 'Connexion réussie',
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Récupération de tous les utilisateurs
exports.getAllUsers = async (req, res) => {

  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });

  try {
    const users = await User.find().lean(); // .lean() => objets JS simples
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupération de l'utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' })

    // renvoie email et rôle
    const { email, role } = req.user
    res.json({ email, role })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

exports.logoutUser = (req, res) => {
  try {
    // Supprimer le cookie côté serveur
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // seulement en prod
      sameSite: 'strict'
    })

    return res.json({ message: 'Déconnecté avec succès' })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la déconnexion' })
  }
}