const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  UUID: { type: String, unique: true, default: uuidv4 }, // génération automatique
}, { timestamps: true }); // crée automatiquement createdAt et updatedAt

// Hasher le mot de passe avant sauvegarde
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Assurer que le UUID est généré si absent (sécurité supplémentaire)
UserSchema.pre('save', function(next) {
  if (!this.UUID) this.UUID = uuidv4();
  next();
});

module.exports = mongoose.model('User', UserSchema);
