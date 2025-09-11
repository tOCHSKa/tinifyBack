const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');

// Route POST pour créer un utilisateur
router.post('/', userController.createUser);

// Authentification basique
router.post('/login', userController.loginUser);

// Récupération sécurisée de tous les utilisateurs 
router.get('/', auth, userController.getAllUsers);

module.exports = router;
