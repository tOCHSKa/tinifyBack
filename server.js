require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const usersRoutes = require('./routes/users');
const rateLimit = require('express-rate-limit');
const createAdminUser = require('./scripts/createAdmin');
const User = require('./models/User');
const uploadRoutes = require('./routes/upload');
// const path = require('path');
// const fs = require('fs-extra');
// const multer = require('multer');
const startCleanupJob = require('./jobs/cleanupUploads');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware JSON et cookies
app.use(express.json());
app.use(cookieParser());
// app.use(express.static('public'));

const cors = require('cors');

const corsOptions = {
  origin: ['http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
// ===========================
// Rate Limiter Global
// ===========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop de requêtes depuis cette IP, réessayez plus tard"
  }
});
app.use(limiter);

// ===========================
// Routes
// ===========================
app.use('/users', usersRoutes);
app.use('/uploads', uploadRoutes);

// Lancer le job de nettoyage
startCleanupJob();

// app.get('/users', async (req, res) => {
//   try {
//     const users = await User.find().select('-password -__v');
//     res.json({ users });
//   } catch (err) {
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
// });

// ===========================
// Connexion à MongoDB
// ===========================
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log('Connecté à MongoDB');
  app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
})
.catch(err => console.error('Erreur MongoDB :', err));

