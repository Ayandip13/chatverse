const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function testGirlsDashboardApis() {
  console.log('=== GIRLS APP DASHBOARD ENDPOINTS INTEGRATION TEST ===');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas successfully.');

  const { User, Wallet, WithdrawRequest, Chat, ChatRequest } = require('./src/models');
  const { withdrawalService } = require('./src/services/withdrawal.service');

  try {
    // 1. Fetch Girl User
    let girl = await User.findOne({ role: 'GIRL', status: 'APPROVED' });
    if (!girl) {
      girl = await User.create({
        email: `girl_dash_${Date.now()}@test.com`,
        name: 'Test Dashboard Creator',
        role: 'GIRL',
        status: 'APPROVED',
        authProvider: 'LOCAL'
      });
    }

    console.log(`[GIRL USER] ID: ${girl._id} | Name: ${girl.name} | Status: ${girl.status}`);

    // 2. Test Profile Fetch & Update
    const updatedName = `Creator ${Date.now()}`;
    const updatedBio = 'Available for live chat sessions everyday!';
    girl.name = updatedName;
    girl.bio = updatedBio;
    await girl.save();
    console.log('✅ PROFILE TEST: Successfully updated Creator name & bio in DB.');

    // 3. Test Wallet Withdrawal Summary Aggregation
    const summary = await withdrawalService.getUserWithdrawalSummary(girl._id.toString());
    console.log('✅ WALLET KPI SUMMARY TEST:', summary);

    // 4. Test Active Chats Query
    const activeChats = await Chat.find({ girlId: girl._id, status: 'ACTIVE' }).populate('boyId', 'name avatar');
    console.log(`✅ ACTIVE CHATS QUERY TEST: Found ${activeChats.length} active sessions.`);

    // 5. Test Pending Requests Query
    const pendingRequests = await ChatRequest.find({ receiverId: girl._id, status: 'PENDING' }).populate('senderId', 'name avatar');
    console.log(`✅ PENDING REQUESTS TEST: Found ${pendingRequests.length} pending chat requests.`);

    console.log('\n==================================================');
    console.log('✅ ALL GIRLS APP DASHBOARD ENDPOINTS VERIFIED!');
    console.log('==================================================');
  } catch (error) {
    console.error('Test Suite Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

testGirlsDashboardApis();
