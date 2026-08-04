const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const email = 'admin@chatverse.com';
    const password = 'Admin@1234';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists in User collection.');
      if (!existingAdmin.password) {
        await User.updateOne(
          { email },
          { $set: { password: hashedPassword, role: 'ADMIN', status: 'ACTIVE' } },
        );
        console.log('Admin updated with password and role.');
      }
    } else {
      await User.create({
        email,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        authProvider: 'LOCAL',
      });
      console.log('Admin seeded successfully in User collection.');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

seedAdmin();
