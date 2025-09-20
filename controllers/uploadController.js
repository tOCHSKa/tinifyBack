
/**
 * Upload a file
 */
const Upload = require('../models/Upload');
const User = require('../models/User');

exports.uploadFile = async (req, res) => {
  try {
    // Vérifie si c'est un upload multiple (req.files) ou unique (req.file)
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Récupérer l'utilisateur depuis Mongo pour mettre à jour compressionCount
    const user = await User.findOne({ UUID: req.user.UUID });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Tableaux de chemins, noms et tailles
    const paths = files.map(file => file.path);
    const filenames = files.map(file => file.filename);
    const sizes = files.map(file => file.size);

    // Création d'un seul document Upload
    const upload = await Upload.create({
      userUUID: user.UUID,
      type: files[0].mimetype.startsWith('video') ? 'video' : 'image',
      filenames,
      sizes,
      paths,
      compressionNumber: user.compressionCount // optionnel : pour tracer la compression
    });

    // Incrémenter le compteur de compressions
    user.compressionCount = (user.compressionCount || 0) + 1;
    await user.save();

    res.json({ message: 'Fichiers téléchargés avec succès', upload });
  } catch (err) {
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
    await fs.unlink(upload.path).catch(() => {});

    await upload.deleteOne();
    res.json({ message: 'Fichier supprimé', id: req.params.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
