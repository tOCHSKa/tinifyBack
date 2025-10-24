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

    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },

    compressionCount: {
      type: Number,
      default: 0,
    },

    lastLogin: {
      type: Date,
    },

    // ✅ Champs optionnels (non obligatoires RGPD)
    firstName: {
      type: String,
      trim: true,
      default: null,
    },
    lastName: {
      type: String,
      trim: true,
      default: null,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Numéro de téléphone invalide'],
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    entreprise: {
      type: String,
      trim: true,
      default: null,
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
