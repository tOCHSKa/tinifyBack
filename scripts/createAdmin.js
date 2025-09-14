// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

async function createAdminUser() {
  try {
    if (!adminEmail || !adminPassword) {
        throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans .env');
      }
      
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log('⚠️  Admin déjà existant');
      return;
    }

    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin créé avec succès');
  } catch (err) {
    console.error('❌ Erreur lors de la création de l’admin :', err);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = createAdminUser;
