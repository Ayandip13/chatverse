import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User, Wallet, ChatRequest } from './src/models';
import { chatRequestService } from './src/services/chatRequest.service';

async function testSendRequest() {
  await mongoose.connect(process.env.MONGO_URI!);
  
  const boy = await User.findOne({ role: 'BOY', status: 'ACTIVE' });
  const girl = await User.findOne({ role: 'GIRL', status: 'APPROVED' });

  console.log(`Boy: ${boy?.name} (${boy?._id}), Girl: ${girl?.name} (${girl?._id})`);

  if (boy && girl) {
    // Ensure wallet balance > 10
    await Wallet.findOneAndUpdate(
      { userId: boy._id },
      { currentBalance: 100 },
      { upsert: true, new: true }
    );

    // Clear old pending requests
    await ChatRequest.deleteMany({ senderId: boy._id, receiverId: girl._id });

    try {
      const res = await chatRequestService.sendRequest(boy._id.toString(), girl._id.toString());
      console.log('Successfully sent chat request! Result:', res);
    } catch (err: any) {
      console.log('Send request result message:', err.message, '| Code:', err.code, '| Status:', err.statusCode);
    }
  }

  await mongoose.disconnect();
}

testSendRequest();
