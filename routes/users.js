const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');

// Route POST pour créer un utilisateur
router.post('/', userController.createUser);

// Authentification basique
router.post('/login', userController.loginUser);

// Récupération sécurisée de tous les utilisateurs 
router.get('/', auth, userController.getAllUsers);

// Récupération de l'utilisateur connecté
router.get('/me', auth, userController.getMe);

// Deconnexion de l'utilisateur
router.post('/logout', auth, userController.logoutUser);

// Mise à jour d'un utilisateur
router.put('/:id', auth, userController.updateUser);

module.exports = router;
