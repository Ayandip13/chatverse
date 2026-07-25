import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './src/models';

const GIRL_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
];

const BOY_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
];

async function seedAvatars() {
  await mongoose.connect(process.env.MONGO_URI!);
  const users = await User.find({});
  let idx = 0;
  for (const u of users) {
    if (!u.avatar || u.avatar.includes('via.placeholder.com') || u.avatar === 'undefined') {
      const isGirl = u.role === 'GIRL';
      const pool = isGirl ? GIRL_AVATARS : BOY_AVATARS;
      const avatarUrl = pool[idx % pool.length];
      u.avatar = avatarUrl;
      await u.save();
      console.log(`Updated ${u.name} (${u.role}) -> ${avatarUrl}`);
      idx++;
    }
  }
  await mongoose.disconnect();
  console.log('Finished seeding DB avatars!');
}

seedAvatars();
