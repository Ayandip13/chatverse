import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://bookosaurs_db_user:cwqV0FPhgfwGWwgR@cluster0.u2kx0pf.mongodb.net/';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.useDb('test'); // Use the DB connection mongoose provides

    // Using raw collection to avoid Model initialization issues outside the app
    const usersCollection = db.collection('users');

    const adminEmail = 'admin@chatverse.com';
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);
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
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);
      await usersCollection.updateOne({ email: adminEmail }, { $set: { password: hashedPassword, role: 'ADMIN', status: 'ACTIVE' } });
      console.log('Admin user updated: admin@chatverse.com / Admin@1234');
    }
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedAdmin();
