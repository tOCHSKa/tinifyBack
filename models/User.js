const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    UUID: { type: String, unique: true, default: uuidv4 },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    /**
     * Abonnement / plan
     * - free : gratuit
     * - premium : abonnement payant
     */
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },

    /**
     * Suivi des compressions
     * Pour limiter ou facturer les utilisations, on peut stocker :
     * - nombre d'images ou vidéos compressées
     */
    compressionCount: {
      type: Number,
      default: 0,
    },

    /**
     * Dernière connexion
     * Permet de savoir quand l’utilisateur s’est connecté pour la dernière fois
     */
    lastLogin: {
      type: Date
    },
  },
  { timestamps: true }
);

// 🔑 Hash du mot de passe si modifié
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 🆔 Génération du UUID si absent
UserSchema.pre('save', function (next) {
  if (!this.UUID) this.UUID = uuidv4();
  next();
});

// ✅ Méthode utilitaire pour comparer les mots de passe
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
