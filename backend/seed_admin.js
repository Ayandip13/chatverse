const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  tokenVersion: { type: Number, default: 0 },
});

const Admin = mongoose.model('Admin', adminSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const email = 'admin@chatverse.com';
    const password = 'Admin@1234';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists.');
    } else {
      await Admin.create({
        email,
        password: hashedPassword,
        name: 'Super Admin',
      });
      console.log('Admin seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

seedAdmin();
