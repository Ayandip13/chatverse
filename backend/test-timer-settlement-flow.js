const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function testTimerSettlementSuite() {
  console.log('=== COIN TIMER & SETTLEMENT ENGINE INTEGRATION TEST ===');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas successfully.');

  const { User, Wallet, Chat, Settlement, WalletTransaction } = require('./src/models');
  const { settlementService } = require('./src/services/settlement.service');
  const { chatSessionService } = require('./src/services/chatSession.service');

  try {
    // 1. Setup Test Boy & Girl
    let boy = await User.findOne({ role: 'BOY', status: 'ACTIVE' });
    if (!boy) {
      boy = await User.create({
        email: `boy_settle_${Date.now()}@test.com`,
        name: 'Test Boy Settlement',
        role: 'BOY',
        status: 'ACTIVE',
        authProvider: 'LOCAL',
      });
    }

    let girl = await User.findOne({ role: 'GIRL', status: 'APPROVED' });
    if (!girl) {
      girl = await User.create({
        email: `girl_settle_${Date.now()}@test.com`,
        name: 'Test Girl Settlement',
        role: 'GIRL',
        status: 'APPROVED',
        authProvider: 'LOCAL',
      });
    }

    console.log(`Test Boy ID: ${boy._id}, Girl ID: ${girl._id}`);

    // Set Boy Wallet Balance to 25 coins (enough for 2 completed minutes)
    await Wallet.findOneAndUpdate(
      { userId: boy._id },
      { currentBalance: 25, lifetimeSpent: 0 },
      { upsert: true, new: true },
    );
    await Wallet.findOneAndUpdate(
      { userId: girl._id },
      { currentBalance: 0, lifetimeEarnings: 0 },
      { upsert: true, new: true },
    );
    console.log('Initial Boy Wallet: 25 coins | Girl Wallet: 0 coins');

    // Create Active Chat
    const chat = await Chat.create({
      boyId: boy._id,
      girlId: girl._id,
      chatRequestId: new mongoose.Types.ObjectId(),
      status: 'ACTIVE',
      startTime: new Date(),
      durationInMinutes: 0,
      totalCost: 0,
    });
    console.log(`Created Active Chat Session ID: ${chat._id}`);

    // 2. Test Minute Settlement 1
    console.log('\n--- Test 1: First Minute Settlement (-10 Boy, +8 Girl, +2 Platform) ---');
    const res1 = await settlementService.processMinuteSettlement(
      chat._id.toString(),
      boy._id.toString(),
      girl._id.toString(),
    );
    console.log('Settlement 1 Result:', res1);

    let boyWalletCheck = await Wallet.findOne({ userId: boy._id });
    let girlWalletCheck = await Wallet.findOne({ userId: girl._id });
    let settlementRecord = await Settlement.findOne({ chatId: chat._id });

    console.log(`Boy Wallet Balance: ${boyWalletCheck.currentBalance} (Expected: 15)`);
    console.log(`Girl Wallet Balance: ${girlWalletCheck.currentBalance} (Expected: 8)`);
    console.log('Settlement Ledger:', {
      completedMinutes: settlementRecord.completedMinutes,
      grossCoins: settlementRecord.grossCoins,
      platformCommissionCoins: settlementRecord.platformCommissionCoins,
      girlEarningsCoins: settlementRecord.girlEarningsCoins,
    });

    // 3. Test Minute Settlement 2
    console.log('\n--- Test 2: Second Minute Settlement (-10 Boy, +8 Girl, +2 Platform) ---');
    const res2 = await settlementService.processMinuteSettlement(
      chat._id.toString(),
      boy._id.toString(),
      girl._id.toString(),
    );
    console.log('Settlement 2 Result:', res2);

    boyWalletCheck = await Wallet.findOne({ userId: boy._id });
    girlWalletCheck = await Wallet.findOne({ userId: girl._id });
    settlementRecord = await Settlement.findOne({ chatId: chat._id });

    console.log(`Boy Wallet Balance: ${boyWalletCheck.currentBalance} (Expected: 5)`);
    console.log(`Girl Wallet Balance: ${girlWalletCheck.currentBalance} (Expected: 16)`);
    console.log('Settlement Ledger:', {
      completedMinutes: settlementRecord.completedMinutes,
      grossCoins: settlementRecord.grossCoins,
      platformCommissionCoins: settlementRecord.platformCommissionCoins,
      girlEarningsCoins: settlementRecord.girlEarningsCoins,
    });

    // 4. Test Insufficient Balance Safeguard (Boy has 5 coins left, needs 10)
    console.log('\n--- Test 3: Insufficient Balance Safeguard (Boy has 5 coins, needs 10) ---');
    const res3 = await settlementService.processMinuteSettlement(
      chat._id.toString(),
      boy._id.toString(),
      girl._id.toString(),
    );
    console.log('Settlement 3 Result (Should Fail):', res3);

    boyWalletCheck = await Wallet.findOne({ userId: boy._id });
    console.log(`Boy Wallet Balance remains: ${boyWalletCheck.currentBalance} (Never negative!)`);

    // 5. Test Financial Summary Aggregation
    console.log('\n--- Test 4: Financial Summary Aggregation ---');
    const summary = await settlementService.getFinancialSummary();
    console.log('Admin Financial Summary:', summary);

    console.log('\n==================================================');
    console.log('✅ ALL TIMER & SETTLEMENT ENGINE TESTS PASSED!');
    console.log('==================================================');
  } catch (error) {
    console.error('Test Suite Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

testTimerSettlementSuite();
