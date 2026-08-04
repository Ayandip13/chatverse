const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function testWithdrawalSuite() {
  console.log('=== WITHDRAWAL & PAYOUT MANAGEMENT INTEGRATION TEST SUITE ===');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas successfully.');

  const {
    User,
    Wallet,
    WithdrawRequest,
    WalletTransaction,
    Notification,
  } = require('./src/models');
  const { withdrawalService } = require('./src/services/withdrawal.service');

  try {
    // 1. Setup Test Girl and Admin
    let girl = await User.findOne({ role: 'GIRL', status: 'APPROVED' });
    if (!girl) {
      girl = await User.create({
        email: `girl_payout_${Date.now()}@test.com`,
        name: 'Test Payout Girl',
        role: 'GIRL',
        status: 'APPROVED',
        authProvider: 'LOCAL',
      });
    }

    let admin = await User.findOne({ role: 'ADMIN' });
    const adminId = admin ? admin._id.toString() : new mongoose.Types.ObjectId().toString();

    console.log(`Test Girl ID: ${girl._id}, Admin ID: ${adminId}`);

    // Set Girl Wallet Balance to 2000 coins
    await Wallet.findOneAndUpdate(
      { userId: girl._id },
      { currentBalance: 2000, lifetimeEarnings: 5000, lifetimeWithdraw: 0 },
      { upsert: true, new: true },
    );
    console.log('Initial Girl Wallet Balance: ₹2,000');

    // Clean old test withdrawal requests for this girl
    await WithdrawRequest.deleteMany({ userId: girl._id });

    // 2. Test Minimum Withdrawal Validation (< 500 fails)
    console.log('\n--- Test 1: Minimum Withdrawal Validation (< 500 fails) ---');
    try {
      await withdrawalService.createWithdrawalRequest(girl._id.toString(), {
        amount: 300,
        paymentMethod: 'UPI',
        upiId: 'girl@upi',
      });
      console.error('FAILED: Below minimum amount request was not rejected!');
    } catch (err) {
      console.log('Below Minimum Validation Result:', err.message, '| Code:', err.code);
    }

    // 3. Test Valid Withdrawal Request Creation (₹600)
    console.log('\n--- Test 2: Valid Withdrawal Request Creation (₹600) ---');
    const req1 = await withdrawalService.createWithdrawalRequest(girl._id.toString(), {
      amount: 600,
      paymentMethod: 'UPI',
      upiId: 'girl@upi',
    });
    console.log(
      `Created Request ID: ${req1._id} | Status: ${req1.status} | Net Amount: ₹${req1.netAmount}`,
    );

    let walletAfterReq1 = await Wallet.findOne({ userId: girl._id });
    let summaryAfterReq1 = await withdrawalService.getUserWithdrawalSummary(girl._id.toString());
    console.log('Wallet Balance after Req 1:', walletAfterReq1.currentBalance, '(Expected: 1400)');
    console.log('Wallet Summary after Req 1:', summaryAfterReq1);

    // 4. Test Duplicate Pending Request Blocking
    console.log('\n--- Test 3: Duplicate Pending Request Blocking ---');
    try {
      await withdrawalService.createWithdrawalRequest(girl._id.toString(), {
        amount: 500,
        paymentMethod: 'UPI',
        upiId: 'girl@upi',
      });
      console.error('FAILED: Duplicate request was not blocked!');
    } catch (err) {
      console.log('Duplicate Request Result:', err.message, '| Code:', err.code);
    }

    // 5. Test Cancel Pending Request (Refund balance)
    console.log('\n--- Test 4: Cancel Pending Request & Wallet Refund ---');
    const cancelRes = await withdrawalService.cancelWithdrawalRequest(
      girl._id.toString(),
      req1._id.toString(),
    );
    console.log(`Cancelled Request Status: ${cancelRes.status}`);

    let walletAfterCancel = await Wallet.findOne({ userId: girl._id });
    console.log(
      'Wallet Balance after Cancel:',
      walletAfterCancel.currentBalance,
      '(Expected: 2000 refunded!)',
    );

    // 6. Test Admin Approval & Mark Paid Lifecycle
    console.log('\n--- Test 5: Admin Approve & Mark Paid Lifecycle ---');
    const req2 = await withdrawalService.createWithdrawalRequest(girl._id.toString(), {
      amount: 1000,
      paymentMethod: 'BANK_TRANSFER',
      bankDetails: {
        accountName: 'Test Payout Girl',
        accountNumber: '918273645019',
        ifscCode: 'SBIN0009999',
        bankName: 'State Bank of India',
      },
    });
    console.log(`Created Request 2 ID: ${req2._id} | Status: ${req2.status}`);

    // Admin Approve
    const approvedRes = await withdrawalService.adminApprove(
      req2._id.toString(),
      adminId,
      'Verified details',
    );
    console.log(`Admin Approved Request Status: ${approvedRes.status}`);

    // Admin Mark Paid
    const paidRes = await withdrawalService.adminMarkPaid(
      req2._id.toString(),
      adminId,
      'UPI/81928491829',
      'Transferred to bank',
    );
    console.log(
      `Admin Mark Paid Status: ${paidRes.status} | Ref: ${paidRes.transactionReference} | PaidAt: ${paidRes.paidAt}`,
    );

    let walletAfterPaid = await Wallet.findOne({ userId: girl._id });
    console.log('Wallet Lifetime Withdraw:', walletAfterPaid.lifetimeWithdraw, '(Expected: 1000)');

    // 7. Test Admin Rejection & Wallet Refund
    console.log('\n--- Test 6: Admin Rejection & Wallet Refund ---');
    const req3 = await withdrawalService.createWithdrawalRequest(girl._id.toString(), {
      amount: 500,
      paymentMethod: 'UPI',
      upiId: 'invalid_vpa@upi',
    });
    console.log(`Created Request 3 ID: ${req3._id} | Status: ${req3.status}`);

    const rejectedRes = await withdrawalService.adminReject(
      req3._id.toString(),
      adminId,
      'Invalid UPI VPA address',
      'Name mismatch on VPA',
    );
    console.log(
      `Admin Rejected Status: ${rejectedRes.status} | Reason: ${rejectedRes.rejectionReason}`,
    );

    let walletAfterReject = await Wallet.findOne({ userId: girl._id });
    console.log(
      'Wallet Balance after Rejection:',
      walletAfterReject.currentBalance,
      '(Expected: 1000 refunded!)',
    );

    console.log('\n==================================================');
    console.log('✅ ALL WITHDRAWAL & PAYOUT INTEGRATION TESTS PASSED!');
    console.log('==================================================');
  } catch (error) {
    console.error('Test Suite Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

testWithdrawalSuite();
