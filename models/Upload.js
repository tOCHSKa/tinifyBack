const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  userUUID: { type: String, required: true },
  type: { type: String, required: true }, // "image" ou "video"
  filenames: { type: [String], required: true }, // fichiers compressés
  sizes: { type: [Number], required: true },     // tailles après compression
  originalSizes: { type: [Number], required: true }, // ✅ tailles avant compression
  paths: { type: [String], required: true },     // chemins des fichiers compressés
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Upload', uploadSchema);
