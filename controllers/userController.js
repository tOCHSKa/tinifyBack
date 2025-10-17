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

    const token = jwt.sign(
      { UUID: user.UUID, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'monsecretdev',
      { expiresIn: '1h' }
    );

    user.lastLogin = new Date();
    await user.save();

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000
    });

    res.json({
      message: 'Connexion réussie',
      user: { UUID: user.UUID, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Erreur loginUser:', err);
    res.status(500).json({ error: 'Erreur serveur' });
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
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const planValue =
      req.user.role === 'admin'
        ? 'Non défini'
        : req.user.plan || 'free' // fallback pour un user normal

    res.json({
      email: req.user.email,
      role: req.user.role,
      plan: planValue,
      compressionCount: req.user.compressionCount || 0,
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
}


// Déconnexion de l'utilisateur
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

// Mise à jour d'un utilisateur
exports.updateUser = async (req, res) => {
  // Vérifier que le demandeur est admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    const { role } = req.body;

    // Validation du rôle
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    // Mise à jour
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true } // renvoie l'utilisateur mis à jour
    );

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Masquer le mot de passe avant réponse
    user.password = undefined;

    res.json({ message: 'Utilisateur mis à jour', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
