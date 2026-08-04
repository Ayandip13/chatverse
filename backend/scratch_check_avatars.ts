import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './src/models';

async function checkAvatars() {
  await mongoose.connect(process.env.MONGO_URI!);
  const users = await User.find({}, 'name role email avatar status');
  console.log('Users in DB:');
  users.forEach((u) => console.log(`- ${u.name} (${u.role}, ${u.status}): avatar = "${u.avatar}"`));
  await mongoose.disconnect();
}

checkAvatars();
