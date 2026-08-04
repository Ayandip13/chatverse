import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://bookosaurs_db_user:cwqV0FPhgfwGWwgR@cluster0.u2kx0pf.mongodb.net/chatverse?retryWrites=true&w=majority';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection;

    const usersCollection = db.collection('users');

    const adminEmail = 'admin@chatverse.com';
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });

    const hashedPassword = await bcrypt.hash('Admin@1234', 10);

    if (!existingAdmin) {
      await usersCollection.insertOne({
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        name: 'Super Admin',
        authProvider: 'LOCAL',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Admin user created successfully: admin@chatverse.com / Admin@1234');
    } else {
      await usersCollection.updateOne(
        { email: adminEmail },
        { $set: { password: hashedPassword, role: 'ADMIN', status: 'ACTIVE' } },
      );
      console.log('Admin user updated in chatverse database: admin@chatverse.com / Admin@1234');
    }
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
