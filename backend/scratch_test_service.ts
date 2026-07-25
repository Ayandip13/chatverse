import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { verificationService } from './src/services/verification.service';

async function run() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Connecting to:', uri ? uri.substring(0, 30) + '...' : 'undefined');
    await mongoose.connect(uri!);
    console.log('Connected to MongoDB');

    // Find a pending girl
    const { User } = await import('./src/models');
    const pendingGirl = await User.findOne({ role: 'GIRL', status: 'PENDING' });
    console.log('Found pending girl:', pendingGirl ? pendingGirl._id : 'None');

    if (!pendingGirl) {
      console.log('No pending girl to test approval on.');
      return;
    }

    const adminId = 'mock_admin_id'; // This is what admin.controller.ts passes if req.admin.adminId isn't present, or let's test what happens with mock_admin_id vs valid ObjectId!
    console.log('Testing updateUserStatus with adminId:', adminId);

    const result = await verificationService.updateUserStatus(
      pendingGirl._id.toString(),
      'APPROVED',
      adminId,
      'Approved for testing'
    );

    console.log('Success result:', result);
  } catch (err: any) {
    console.error('EXCEPTIONAL ERROR THROWN:');
    console.error(err);
    if (err.errors) {
      console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
    }
  } finally {
    await mongoose.disconnect();
  }
}

run();
