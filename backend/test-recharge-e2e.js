const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function testRechargeE2E() {
  console.log('=================================================================');
  console.log('=== END-TO-END MOCK RECHARGE FLOW FULL AUDIT & SUITE TEST ===');
  console.log('=================================================================\n');

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas successfully.\n');

  const { User, Wallet, WalletTransaction } = require('./src/models');
  const { walletService } = require('./src/services/wallet.service');

  try {
    // 1. Setup Test Boy User
    let boy = await User.findOne({ role: 'BOY' });
    if (!boy) {
      boy = await User.create({
        email: `boy_e2e_${Date.now()}@test.com`,
        name: 'Test E2E Boy',
        role: 'BOY',
        status: 'ACTIVE',
        authProvider: 'LOCAL',
      });
    }

    console.log(`[USER SETUP] Test Boy ID: ${boy._id}`);

    // Set initial wallet balance to 100
    await Wallet.findOneAndUpdate(
      { userId: boy._id },
      { currentBalance: 100, lifetimeRecharge: 100 },
      { upsert: true, new: true },
    );
    console.log('[INITIAL STATE] Initial Wallet Balance: ₹100 | Lifetime Recharge: ₹100\n');

    // -------------------------------------------------------------
    // TEST 1: "Pay ₹X" Order Creation
    // -------------------------------------------------------------
    console.log('--- TEST 1: Create Recharge Order ("Pay ₹1000") ---');
    const rechargeAmount = 1000;
    const orderPayload = await walletService.createRechargeOrder(
      boy._id.toString(),
      rechargeAmount,
    );
    console.log('Order Payload Returned:', orderPayload);

    const orderId = orderPayload.id || orderPayload.orderId;
    if (!orderId || !orderId.startsWith('order_')) {
      throw new Error('TEST 1 FAILED: Invalid or missing order ID!');
    }
    console.log(`✅ TEST 1 PASSED: Order created successfully with ID: ${orderId}\n`);

    // -------------------------------------------------------------
    // TEST 2: Payment Verification & Balance Credit
    // -------------------------------------------------------------
    console.log('--- TEST 2: Verify Payment & Wallet Credit ---');
    const mockPaymentId = `pay_mock_${Date.now()}`;
    const verifyResult = await walletService.verifyRecharge(
      boy._id.toString(),
      orderId,
      mockPaymentId,
      'mock_signature',
      rechargeAmount,
    );

    console.log('Verify Result Transaction:', {
      _id: verifyResult._id,
      amount: verifyResult.amount,
      type: verifyResult.type,
      description: verifyResult.description,
    });

    if (!verifyResult || verifyResult.amount !== rechargeAmount) {
      throw new Error('TEST 2 FAILED: Payment verification failed or returned wrong amount!');
    }
    console.log('✅ TEST 2 PASSED: Payment verified with zero verification errors.\n');

    // -------------------------------------------------------------
    // TEST 3: Verify Wallet Balance Increased Correctly
    // -------------------------------------------------------------
    console.log('--- TEST 3: Wallet Balance Increase ---');
    const updatedWallet = await Wallet.findOne({ userId: boy._id });
    console.log(`Updated Wallet Balance: ₹${updatedWallet.currentBalance} (Expected: 1100)`);
    console.log(`Updated Lifetime Recharge: ₹${updatedWallet.lifetimeRecharge} (Expected: 1100)`);

    if (updatedWallet.currentBalance !== 1100 || updatedWallet.lifetimeRecharge !== 1100) {
      throw new Error('TEST 3 FAILED: Wallet balance did not update correctly!');
    }
    console.log('✅ TEST 3 PASSED: Wallet balance and lifetime recharge updated accurately.\n');

    // -------------------------------------------------------------
    // TEST 4: Verify Transaction Appears in History
    // -------------------------------------------------------------
    console.log('--- TEST 4: Transaction History Creation ---');
    const historyResult = await walletService.getTransactionHistory(boy._id.toString(), {}, 1, 10);
    const transactions = historyResult.transactions || [];
    console.log(`Fetched ${transactions.length} transactions from history.`);

    const foundTx = transactions.find((t) => t._id.toString() === verifyResult._id.toString());
    if (!foundTx) {
      throw new Error('TEST 4 FAILED: Created transaction did not appear in transaction history!');
    }
    console.log('Found Transaction in History:', {
      _id: foundTx._id,
      type: foundTx.type,
      amount: foundTx.amount,
      description: foundTx.description,
      createdAt: foundTx.createdAt,
    });
    console.log('✅ TEST 4 PASSED: Recharge transaction correctly appears in user history.\n');

    // -------------------------------------------------------------
    // TEST 5: Duplicate Recharge Prevention (Idempotency)
    // -------------------------------------------------------------
    console.log('--- TEST 5: Duplicate Recharge Prevention (Idempotency Check) ---');
    try {
      await walletService.verifyRecharge(
        boy._id.toString(),
        orderId, // Same order ID again!
        `pay_mock_dup_${Date.now()}`,
        'mock_signature',
        rechargeAmount,
      );
      throw new Error('TEST 5 FAILED: Duplicate payment verification was allowed!');
    } catch (err) {
      if (err.code === 'DUPLICATE_PAYMENT' || err.statusCode === 409) {
        console.log('Duplicate Prevention Output:', err.message, '| Code:', err.code);
        console.log(
          '✅ TEST 5 PASSED: Duplicate recharge was correctly blocked (HTTP 409 Conflict).\n',
        );
      } else {
        throw err;
      }
    }

    // Verify balance was NOT double credited
    const finalWallet = await Wallet.findOne({ userId: boy._id });
    if (finalWallet.currentBalance !== 1100) {
      throw new Error('TEST 5 FAILED: Wallet balance was double-credited on duplicate attempt!');
    }

    console.log('=================================================================');
    console.log('🏆 ALL 5 END-TO-END RECHARGE FLOW VERIFICATION TESTS PASSED!');
    console.log('=================================================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas.');
  }
}

testRechargeE2E();
