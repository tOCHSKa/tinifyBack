require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// Middleware pour gérer l'identifiant unique dans les cookies
app.use((req, res, next) => {
  if (!req.cookies.visitorId) {
    const visitorId = uuidv4();
    res.cookie('visitorId', visitorId, { maxAge: 365*24*60*60*1000 }); // 1 an
  }
  next();
});

// Routes
app.use('/users', usersRoutes);

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connecté à MongoDB');
    app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
  })
  .catch(err => console.error(err));
