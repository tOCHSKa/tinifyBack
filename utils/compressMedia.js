const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

/**
 * Réduit la taille d'une image ou d'une vidéo
 * @param {string} inputPath - chemin du fichier original
 * @param {string} outputDir - dossier de sortie
 * @returns {Promise<string>} - chemin du fichier compressé
 */
async function compressMedia(inputPath, outputDir) {
  await fs.ensureDir(outputDir);

  const ext = path.extname(inputPath).toLowerCase();
  const filename = path.basename(inputPath, ext);
  const outputPath = path.join(outputDir, `${filename}-compressed${ext}`);

  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    // Compression image
    await sharp(inputPath)
      .resize({ width: 1280 })  // Redimension max largeur (tu peux adapter)
      .jpeg({ quality: 70 })    // Compression JPEG
      .toFile(outputPath);
  } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
    // Compression vidéo
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vcodec libx264',
          '-crf 28',      // compression (plus CRF bas = meilleure qualité)
          '-preset veryfast',
          '-acodec aac',
          '-b:a 128k'
        ])
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject);
    });
  } else {
    // Si type inconnu, copie simplement le fichier
    await fs.copy(inputPath, outputPath);
  }

  return outputPath;
}

module.exports = compressMedia;
