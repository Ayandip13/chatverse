import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './src/models';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatting-platform');
  const user = await User.findById('698305fbc3585f8653922718');
  console.log('Raw user doc from MongoDB:', user);
  await mongoose.disconnect();
}
check();
