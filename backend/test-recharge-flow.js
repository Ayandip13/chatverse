const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function testRechargeFlow() {
  console.log('=== SIMULATED RECHARGE FLOW INTEGRATION TEST ===');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas successfully.');

  const { User, Wallet, WalletTransaction } = require('./src/models');
  const { walletService } = require('./src/services/wallet.service');

  try {
    // 1. Fetch or create test boy user
    let boy = await User.findOne({ role: 'BOY' });
    if (!boy) {
      boy = await User.create({
        email: `boy_recharge_${Date.now()}@test.com`,
        name: 'Test Recharge Boy',
        role: 'BOY',
        status: 'ACTIVE',
        authProvider: 'LOCAL'
      });
    }

    console.log(`Test Boy ID: ${boy._id}`);

    // Set initial wallet balance to 100
    let initialWallet = await Wallet.findOneAndUpdate(
      { userId: boy._id },
      { currentBalance: 100, lifetimeRecharge: 100 },
      { upsert: true, new: true }
    );
    console.log(`Initial Wallet Balance: ₹${initialWallet.currentBalance}`);

    // 2. Create Recharge Order
    const rechargeAmount = 500;
    const order = await walletService.createRechargeOrder(boy._id.toString(), rechargeAmount);
    console.log('Created Recharge Order Payload:', order);

    const orderId = order.id || order.orderId;
    if (!orderId) {
      throw new Error('Order creation failed: No order ID returned!');
    }
    console.log(`Extracted Order ID: ${orderId}`);

    // 3. Verify Recharge Payment
    const verifyRes = await walletService.verifyRecharge(
      boy._id.toString(),
      orderId,
      `pay_mock_${Date.now()}`,
      'mock_signature',
      rechargeAmount
    );
    console.log('Verification Transaction Created:', {
      _id: verifyRes._id,
      amount: verifyRes.amount,
      type: verifyRes.type,
      description: verifyRes.description
    });

    // 4. Verify Wallet Balance Updated Correctly
    const updatedWallet = await Wallet.findOne({ userId: boy._id });
    console.log(`Updated Wallet Balance: ₹${updatedWallet.currentBalance} (Expected: 600)`);
    console.log(`Updated Lifetime Recharge: ₹${updatedWallet.lifetimeRecharge} (Expected: 600)`);

    if (updatedWallet.currentBalance === 600) {
      console.log('\n==================================================');
      console.log('✅ RECHARGE FLOW TEST PASSED SUCCESSFULLY!');
      console.log('==================================================');
    } else {
      console.error('❌ FAILED: Balance did not update correctly!');
    }
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

testRechargeFlow();
