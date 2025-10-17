const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { uploadImages, uploadVideos } = require('../middlewares/upload');
const uploadController = require('../controllers/uploadController');

// Upload une image
router.post('/image', auth, uploadImages, uploadController.uploadFile);

// Upload une vidéo
router.post('/video', auth, uploadVideos, uploadController.uploadFile);

// Get all files
router.get('/files', auth, uploadController.getFiles);

// Get a file
router.get('/files/:id', auth, uploadController.getFile);

// Delete a file
router.delete('/files/:id', auth, uploadController.deleteFile);

module.exports = router;
