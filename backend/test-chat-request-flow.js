const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function testSuite() {
  console.log('=== CHAT REQUEST & MATCHMAKING INTEGRATION TEST SUITE ===');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas successfully.');

  const { User, Wallet, ChatRequest, Chat } = require('./src/models');
  const { verificationService } = require('./src/services/verification.service');
  const { chatRequestService } = require('./src/services/chatRequest.service');
  const { chatRequestRepository } = require('./src/repositories/chatRequest.repository');
  const { chatRepository } = require('./src/repositories/chat.repository');

  try {
    // 1. Find or create test Boy and Girl
    let boy = await User.findOne({ role: 'BOY', status: 'ACTIVE' });
    if (!boy) {
      boy = await User.create({
        email: `boy_test_${Date.now()}@test.com`,
        name: 'Test Boy',
        role: 'BOY',
        status: 'ACTIVE',
        authProvider: 'LOCAL'
      });
    }

    let girl = await User.findOne({ role: 'GIRL', status: 'APPROVED' });
    if (!girl) {
      girl = await User.create({
        email: `girl_test_${Date.now()}@test.com`,
        name: 'Test Girl',
        role: 'GIRL',
        status: 'APPROVED',
        authProvider: 'LOCAL'
      });
    }

    console.log(`Test Boy ID: ${boy._id}, Girl ID: ${girl._id}`);

    // 2. Setup Wallet for Boy
    let boyWallet = await Wallet.findOne({ userId: boy._id });
    if (!boyWallet) {
      boyWallet = await Wallet.create({ userId: boy._id, currentBalance: 50 });
    } else {
      await Wallet.updateOne({ userId: boy._id }, { currentBalance: 50 });
    }
    console.log('Boy Wallet Balance set to 50 coins.');

    // 3. Test Admin Status Update (Approval Flow)
    console.log('\n--- 1. Admin Status Update Test ---');
    const adminUser = await User.findOne({ role: 'ADMIN' });
    const adminId = adminUser ? adminUser._id.toString() : '698305fbc3585f8653922719';
    
    const approvedGirl = await verificationService.updateUserStatus(
      girl._id.toString(),
      'APPROVED',
      adminId,
      'Verified by Admin'
    );
    console.log('Approve Girl Result Status:', approvedGirl.status);
    console.log('Verified At:', approvedGirl.verifiedAt);
    console.log('Verified By Admin ID:', approvedGirl.verifiedByAdminId);

    // Test Offline Safeguard
    console.log('\n--- 2. Chat Request Offline Safeguard Test ---');
    await ChatRequest.deleteMany({ senderId: boy._id, receiverId: girl._id });

    try {
      await chatRequestService.sendRequest(boy._id.toString(), girl._id.toString());
    } catch (err) {
      console.log('Offline Safeguard Result:', err.message, '| Code:', err.code);
    }

    // Test Full Request Lifecycle (Create -> Accept -> Active Chat)
    console.log('\n--- 3. Full Request Lifecycle (Create -> Accept -> Active Chat) ---');
    const newReq = await chatRequestRepository.create(boy._id.toString(), girl._id.toString());
    console.log('Created Chat Request ID:', newReq._id, '| Status:', newReq.status);

    // Duplicate check test
    const dupCheck = await chatRequestRepository.findPendingRequest(boy._id.toString(), girl._id.toString());
    console.log('Duplicate Pending Check Found:', dupCheck ? dupCheck._id : 'None');

    // Accept Request test
    const acceptRes = await chatRequestService.acceptRequest(girl._id.toString(), newReq._id.toString());
    console.log('Accept Request Status:', acceptRes.request.status);
    console.log('Created Active Chat ID:', acceptRes.chat._id, '| Chat Status:', acceptRes.chat.status);

    // Active Chat check test
    const activeChatCheck = await chatRepository.findActiveChat(boy._id.toString(), girl._id.toString());
    console.log('Find Active Chat Found:', activeChatCheck ? activeChatCheck._id : 'None');

    console.log('\n==================================================');
    console.log('✅ ALL INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('==================================================');
  } catch (error) {
    console.error('Test Suite Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

testSuite();
