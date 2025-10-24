// 📦 services/UserService.js
const User = require('../models/User');

class UserService {
  /**
   * 🔍 Récupère tous les utilisateurs (admin only)
   */
  static async getAllUsers() {
    const users = await User.find({}, '-password').lean();
    return users;
  }

  /**
   * @param {string} userId - ID MongoDB de l'utilisateur à supprimer
   * @param {object} requester - Utilisateur connecté (pour validation)
   * @returns {Promise<User>} - Utilisateur supprimé
   * @throws {Error} - Si l'utilisateur n'est pas admin
   * @throws {Error} - Si l'utilisateur n'est pas trouvé
   * Supprime un utilisateur (admin only)
   */
  static async deleteUser(userId, requester) {
    if (requester.role !== 'admin') {
      throw new Error('Accès refusé');
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new Error('Utilisateur introuvable');
    }

    return deletedUser;
  }

  /**
   * ✏️ Met à jour un utilisateur (rôle, infos, etc.)
   * @param {string} userId - ID MongoDB de l'utilisateur à modifier
   * @param {object} data - Données à mettre à jour (par ex. { role })
   * @param {object} requester - Utilisateur connecté (pour validation)
   */
  static async updateUser(userId, data, requester) {
    if (requester.role !== 'admin') {
      throw new Error('Accès refusé');
    }

    if (requester.id === userId && requester.role !== 'superadmin') {
      throw new Error('Impossible de retirer vos propres droits admin.');
    }

    // Validation du rôle si présent
    if (data.role && !['user', 'admin'].includes(data.role)) {
      throw new Error('Rôle invalide');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      data,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      throw new Error('Utilisateur introuvable');
    }

    return updatedUser;
  }
}

module.exports = UserService;
