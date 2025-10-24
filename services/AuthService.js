// 📦 services/AuthService.js
const User = require('../models/User');
const TokenService = require('./TokenService');

class AuthService {
  /**
   * 🔑 Login utilisateur
   */
  static async login(email, password, res) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Email ou mot de passe incorrect');

    // Vérifie si le compte est verrouillé
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new Error(`Compte verrouillé. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`);
    }

    // Vérifie le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();
        throw new Error('Compte verrouillé après plusieurs tentatives. Réessayez dans 15 minutes.');
      }
      await user.save();
      throw new Error(`Email ou mot de passe incorrect. Tentative ${user.failedAttempts}/5.`);
    }

    // Succès → reset compteurs
    user.failedAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Création du cookie JWT
    const payload = { UUID: user.UUID, email: user.email, role: user.role };
    const token = TokenService.generateCookie(res, payload);

    return {
      message: 'Connexion réussie',
      user: {
        UUID: user.UUID,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * 📝 Enregistrement utilisateur
   */
  static async register(email, password) {
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Cet email est déjà utilisé.');

    const newUser = new User({ email, password });
    await newUser.save();

    return {
      message: 'Utilisateur créé avec succès',
      user: { UUID: newUser.UUID, email: newUser.email, role: newUser.role },
    };
  }

  /**
   * 🚪 Déconnexion utilisateur
   */
  static logout(res) {
    TokenService.clearCookie(res);
  }

    static async getProfile(identifier) {
        const uuid = typeof identifier === 'string' ? identifier : identifier?.UUID;
        if (!uuid) return null;

        // Récupérer l'utilisateur et exclure le password
        const user = await User.findOne({ UUID: uuid }).select('-password').lean();
        if (!user) return null;

        // Calcul / fallback du plan
        const planValue = user.role === 'admin' ? 'Non défini' : (user.plan || 'free');

        return {
        UUID: user.UUID,
        email: user.email,
        role: user.role,
        plan: planValue,
        compressionCount: user.compressionCount || 0,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        phoneNumber: user.phoneNumber || null,
        address: user.address || null,
        lastLogin: user.lastLogin || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
  }
}

module.exports = AuthService;
