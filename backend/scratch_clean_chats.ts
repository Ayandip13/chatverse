import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { ChatRequest, Chat } from './src/models';

async function clean() {
  await mongoose.connect(process.env.MONGO_URI!);
  await ChatRequest.deleteMany({});
  await Chat.deleteMany({});
  console.log('Cleaned up test chat requests and active chats.');
  await mongoose.disconnect();
}

clean();
