import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User, Admin } from './src/models';

async function checkAdmins() {
  await mongoose.connect(process.env.MONGO_URI!);
  const adminUsers = await User.find({ role: 'ADMIN' });
  const admins = await Admin.find({});
  console.log('User admins:', adminUsers);
  console.log('Admin collection admins:', admins);
  await mongoose.disconnect();
}

checkAdmins();
