const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Création d'un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Authentification
exports.loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
      }
    
      // Générer le token
      const secret = process.env.JWT_SECRET || 'monsecretdev';
      const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });
    
      res.json({ token });  
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
};

// Récupération de tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().lean(); // .lean() => objets JS simples
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
