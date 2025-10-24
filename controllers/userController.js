const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');

// Création d'un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, address } = req.body;
    const result = await AuthService.register(email, password);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password, res);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Récupération de l'utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

    const profile = await AuthService.getProfile(req.user);
    if (!profile) return res.status(404).json({ error: 'Utilisateur introuvable' });

    return res.json(profile);
  } catch (err) {
    console.error('Erreur getMe:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Déconnexion de l'utilisateur
exports.logoutUser = (req, res) => {
  try {
    AuthService.logout(res);
    res.json({ message: 'Déconnecté avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Erreur getAllUsers:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await UserService.updateUser(req.params.id, req.body, req.user);
    res.json({ message: 'Utilisateur mis à jour', user: updatedUser });
  } catch (err) {
    console.error('Erreur updateUser:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await UserService.deleteUser(req.params.id, req.user);
    res.json({ message: 'Utilisateur supprimé', user: deletedUser });
  } catch (err) {
    console.error('Erreur deleteUser:', err);
    res.status(400).json({ error: err.message });
  }
};