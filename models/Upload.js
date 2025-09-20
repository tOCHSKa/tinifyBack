const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  userUUID: { type: String, required: true },
  type: { type: String, required: true }, // "image" ou "video"
  filenames: { type: [String], required: true }, // tableau de noms
  sizes: { type: [Number], required: true },     // tableau de tailles
  paths: { type: [String], required: true },     // tableau de chemins
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Upload', uploadSchema);
