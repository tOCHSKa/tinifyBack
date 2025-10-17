// utils/zipFiles.js
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

/**
 * Crée une archive zip contenant une liste de fichiers.
 * @param {Array<{ path: string, filename: string }>} files  Fichiers à inclure
 * @param {string} destDir  Dossier de sortie pour l’archive
 * @returns {Promise<string>} Chemin absolu du zip créé
 */
async function zipFiles(files, destDir) {
  const zipName = `compress-${Date.now()}.zip`;
  const zipPath = path.join(destDir, zipName);

  await fs.ensureDir(destDir);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    files.forEach(f => archive.file(f.path, { name: f.filename }));
    archive.finalize();
  });

  return zipPath;
}

module.exports = zipFiles;
