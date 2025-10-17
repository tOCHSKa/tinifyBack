// jobs/cleanupUploadsFilesOnly.js
const path = require('path');
const fsExtra = require('fs-extra');
const cron = require('node-cron');
const Upload = require('../models/Upload');

/**
 * Cron job : supprime uniquement les fichiers/dossiers physiques
 * sans toucher aux documents Mongo
 */
function startCleanupFilesOnlyJob() {
  // Job toutes les minutes
  cron.schedule('* * * * *', async () => {
    console.log('[CRON FILES ONLY] Vérification des Uploads pour nettoyage physique…');

    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h
      console.log('[CRON FILES ONLY] Cutoff :', cutoff.toISOString());

      // Récupère les documents avec createdAt < 24h
      const oldDocs = await Upload.find({ createdAt: { $lt: cutoff } });

      if (oldDocs.length === 0) {
        console.log('[CRON FILES ONLY] Aucun fichier à supprimer');
        return;
      }

      for (const doc of oldDocs) {
        try {
          // Supprime chaque fichier physique
          for (const filePath of doc.paths) {
            if (await fsExtra.pathExists(filePath)) {
              await fsExtra.remove(filePath);
              console.log(`[CRON FILES ONLY] Fichier supprimé : ${filePath}`);
            }
          }

          // Supprime le dossier utilisateur uniquement s'il est vide
          const userDir = path.join(__dirname, '..', 'uploads', doc.userUUID);
          if (await fsExtra.pathExists(userDir)) {
            const contents = await fsExtra.readdir(userDir);
            if (contents.length === 0) {
              await fsExtra.remove(userDir);
              console.log(`[CRON FILES ONLY] Dossier utilisateur supprimé : ${userDir}`);
            }
          }

        } catch (innerErr) {
          console.error(`[CRON FILES ONLY] Erreur sur upload ${doc._id}:`, innerErr);
        }
      }

      console.log('[CRON FILES ONLY] Nettoyage physique terminé');
    } catch (err) {
      console.error('[CRON FILES ONLY] Erreur globale :', err);
    }
  });
}

module.exports = startCleanupFilesOnlyJob;
