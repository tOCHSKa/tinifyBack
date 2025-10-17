
/**
 * Upload a file
 */
const Upload = require('../models/Upload');
const User = require('../models/User');
const zipFiles = require('../utils/zipFiles');
const path = require('path');
const compressMedia = require('../utils/compressMedia');
const fs = require('fs/promises');

exports.uploadFile = async (req, res) => {
  try {
    // Vérifie si la requête contient des fichiers
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) return res.status(400).json({ error: 'Aucun fichier fourni' });

    // Récupère l'utilisateur depuis Mongo pour suivre le compteur de compressions
    const user = await User.findOne({ UUID: req.user.UUID });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Dossier de destination : même dossier que le premier fichier
    const destDir = path.dirname(files[0].path);

    // Compression des fichiers (images ou vidéos)
    // compressMedia renvoie le chemin du fichier compressé
    const compressedFiles = await Promise.all(
      files.map(file => compressMedia(file.path, destDir))
    );

    // Création d'un zip à partir des fichiers compressés
    // zipFiles attend un tableau d'objets { path, filename } et un dossier de destination
    const zipPath = await zipFiles(
      compressedFiles.map(filePath => ({ path: filePath, filename: path.basename(filePath) })),
      destDir
    );

    const originalSizes = await Promise.all(
      files.map(f => fs.stat(f.path).then(s => s.size))
    );

    // Mise à jour de Mongo : création d'un document Upload
    const upload = await Upload.create({
      userUUID: user.UUID,
      type: files[0].mimetype.startsWith('video') ? 'video' : 'image', // type global
      filenames: compressedFiles.map(f => path.basename(f)),           // tableau des noms compressés
      sizes: await Promise.all(compressedFiles.map(f => fs.stat(f).then(s => s.size))), // tailles
      paths: compressedFiles,                                          // chemins des fichiers compressés
      compressionNumber: user.compressionCount || 0,                    // numéro de compression
      originalSizes: originalSizes,
    });

    // Incrémenter le compteur de compressions de l'utilisateur
    user.compressionCount = (user.compressionCount || 0) + 1;
    await user.save();

    // Envoi du zip unique au client
    res.download(zipPath, err => {
      if (err) {
        console.error('Erreur lors du téléchargement :', err);
        return;
      }
    });

  } catch (err) {
    // Gestion des erreurs
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};


/**
 * Get all files
 * - Admin : voit tout
 * - User  : ne voit que ses propres fichiers
 */
exports.getFiles = async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { userUUID: req.user.UUID };

    const uploads = await Upload.find(filter);
    res.json(uploads);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Get a single file by ID
 * - Admin : peut voir tous les fichiers
 * - User  : uniquement les siens
 */
exports.getFile = async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: 'Fichier introuvable' });

    if (upload.userUUID !== req.user.UUID && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json(upload);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Delete a file
 * - Supprime le document Mongo
 * - Supprime le fichier sur disque
 */
exports.deleteFile = async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: 'Fichier introuvable' });

    if (upload.userUUID !== req.user.UUID && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Supprime le fichier du système (ignore si déjà manquant)
    await fs.unlink(upload.paths).catch(() => {});

    await upload.deleteOne();
    res.json({ message: 'Fichier supprimé', id: req.params.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
