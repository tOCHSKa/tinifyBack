const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Création d'un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis.' });
    }

    // Vérifie si un utilisateur existe déjà avec cet email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà.' });
    }

    // Création du nouvel utilisateur
    const user = new User({
      email,
      password,
      role: 'user',
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phoneNumber || null,
      address: address || null,
    });

    await user.save();

    // ✅ Réponse minimaliste et sécurisée
    res.status(201).json({ success: true });
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

    // res.cookie('token', token, {
    //   httpOnly: true,
    //   secure: isProd,
    //   sameSite: isProd ? 'none' : 'lax',
    //   maxAge: 60 * 60 * 1000
    // });

    res.cookie('token', token, { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', maxAge: 3600000 });
    console.log(res.getHeader('Set-Cookie'));

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
    const users = await User.find({}, '-password').lean();
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
        UUID: req.user.UUID,
        email: req.user.email,
        role: req.user.role,
        plan: planValue,
        compressionCount: req.user.compressionCount || 0,
      });

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
}


// Déconnexion de l'utilisateur
exports.logoutUser = (req, res) => {
  try {

    const isProd = process.env.NODE_ENV === 'production';
    // Supprimer le cookie côté serveur
      res.clearCookie('token', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax'
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

  if (req.user.id === req.params.id && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Impossible de retirer vos propres droits admin.' });
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
