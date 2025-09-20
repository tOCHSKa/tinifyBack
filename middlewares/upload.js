const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const User = require('../models/User'); // pour récupérer compressionCount depuis Mongo

/**
 * Fabrique d’upload
 * @param {string} type - "images" ou "videos"
 * @param {boolean} multiple - true pour plusieurs fichiers (array), false pour un seul (single)
 */
function createUploader(type, multiple = false, maxFiles = 20) {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const userUUID = req.user?.UUID || req.user?.id;
        if (!userUUID) return cb(new Error('Utilisateur non authentifié'));

        // Récupérer l'utilisateur depuis Mongo pour avoir le compteur à jour
        const user = await User.findOne({ UUID: userUUID });
        if (!user) return cb(new Error('Utilisateur introuvable'));

        const compressedCount = user.compressionCount || 0;
        if (compressedCount >= 20) return cb(new Error('Nombre maximum de compressions atteint'));

        // Chemin attendu : app/uploads/<UUID>/<type>/<compressionCount>
        const uploadPath = path.join(__dirname, '..', 'uploads', userUUID, type, String(compressedCount));
        await fs.ensureDir(uploadPath);

        cb(null, uploadPath);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${unique}${ext}`);
    }
  });

  const uploader = multer({ storage });

  // Retourner le middleware Multer correspondant au type d'upload
  if (multiple) {
    return uploader.array('file', maxFiles); // plusieurs fichiers
  } else {
    return uploader.single('file'); // un seul fichier
  }
}

// Middlewares prêts à l'emploi
const uploadImages = createUploader('images', true, 20); // max 20 fichiers
const uploadVideos = createUploader('videos', false);    // un seul fichier

module.exports = { uploadImages, uploadVideos, createUploader };
