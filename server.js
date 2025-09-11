require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware JSON et cookies
app.use(express.json());
app.use(cookieParser());

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
// Middleware visitorId
// ===========================
app.use((req, res, next) => {
  if (!req.cookies.visitorId) {
    const visitorId = uuidv4();
    res.cookie('visitorId', visitorId, { 
      maxAge: 365*24*60*60*1000, // 1 an
      httpOnly: true,             // sécurité
      sameSite: 'Lax'             // prévention CSRF
    });
  }
  next();
});

// ===========================
// Routes
// ===========================
app.use('/users', usersRoutes);

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
