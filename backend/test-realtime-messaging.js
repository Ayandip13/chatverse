const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function testRealtimeMessaging() {
  console.log('===========================================================');
  console.log('=== REAL-TIME MESSAGING MODULE INTEGRATION SUITE TEST ===');
  console.log('===========================================================\n');

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas successfully.\n');

  const { User, Chat, Message } = require('./src/models');
  const { messageService } = require('./src/services/message.service');

  try {
    // 1. Setup Test Active Chat
    let boy = await User.findOne({ role: 'BOY' });
    let girl = await User.findOne({ role: 'GIRL' });

    if (!boy || !girl) {
      throw new Error('Boy or Girl test user missing!');
    }

    let activeChat = await Chat.findOne({ status: 'ACTIVE' });
    if (!activeChat) {
      activeChat = await Chat.create({
        boyId: boy._id,
        girlId: girl._id,
        chatRequestId: new mongoose.Types.ObjectId(),
        status: 'ACTIVE',
        startTime: new Date(),
        durationInMinutes: 0,
        totalCost: 0,
      });
    }

    console.log(
      `[ACTIVE CHAT SETUP] ID: ${activeChat._id} | Boy: ${boy._id} | Girl: ${girl._id}\n`,
    );

    // -------------------------------------------------------------
    // TEST 1: Standard Text Message
    // -------------------------------------------------------------
    console.log('--- TEST 1: Standard Text Message ---');
    const msg1 = await messageService.validateAndSaveMessage(
      activeChat._id.toString(),
      boy._id.toString(),
      'Hello! How are you today? 😊',
    );
    console.log('Saved Message 1:', {
      _id: msg1._id,
      content: msg1.content,
      senderId: msg1.senderId,
    });
    if (!msg1 || msg1.content !== 'Hello! How are you today? 😊') {
      throw new Error('TEST 1 FAILED: Standard text message failed!');
    }
    console.log('✅ TEST 1 PASSED: Text & emoji message stored successfully.\n');

    // -------------------------------------------------------------
    // TEST 2: Image Sharing Message ([IMAGE]:url)
    // -------------------------------------------------------------
    console.log('--- TEST 2: Image Message ([IMAGE]:url) ---');
    const imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
    const msg2 = await messageService.validateAndSaveMessage(
      activeChat._id.toString(),
      girl._id.toString(),
      `[IMAGE]:${imageUrl}`,
    );
    console.log('Saved Message 2 (Image):', { _id: msg2._id, content: msg2.content });
    if (!msg2 || !msg2.content.startsWith('[IMAGE]:')) {
      throw new Error('TEST 2 FAILED: Image message failed!');
    }
    console.log(
      '✅ TEST 2 PASSED: Image URL message correctly bypassed regex blocklist & saved.\n',
    );

    // -------------------------------------------------------------
    // TEST 3: Quote Reply Message ([REPLY:quote]:body)
    // -------------------------------------------------------------
    console.log('--- TEST 3: Quote Reply Message ([REPLY:quote]:body) ---');
    const msg3 = await messageService.validateAndSaveMessage(
      activeChat._id.toString(),
      boy._id.toString(),
      '[REPLY:Hello! How are you today?]:I am doing great!',
    );
    console.log('Saved Message 3 (Reply):', { _id: msg3._id, content: msg3.content });
    if (!msg3 || !msg3.content.startsWith('[REPLY:')) {
      throw new Error('TEST 3 FAILED: Quote reply message failed!');
    }
    console.log('✅ TEST 3 PASSED: Quote reply message saved with parent quote structure.\n');

    // -------------------------------------------------------------
    // TEST 4: Blocked Content Enforcement (Unformatted External Link)
    // -------------------------------------------------------------
    console.log('--- TEST 4: Blocked Content Enforcement (External URL) ---');
    try {
      await messageService.validateAndSaveMessage(
        activeChat._id.toString(),
        boy._id.toString(),
        'Check out my site http://spam-website.com',
      );
      throw new Error('TEST 4 FAILED: External link was not blocked!');
    } catch (err) {
      if (err.code === 'BLOCKED_CONTENT' || err.statusCode === 403) {
        console.log('Blocked Content Output:', err.message, '| Code:', err.code);
        console.log(
          '✅ TEST 4 PASSED: Unformatted external link correctly blocked (HTTP 403 Forbidden).\n',
        );
      } else {
        throw err;
      }
    }

    console.log('===========================================================');
    console.log('🏆 ALL 4 REAL-TIME MESSAGING INTEGRATION TESTS PASSED!');
    console.log('===========================================================');
  } catch (error) {
    console.error('Test Suite Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas.');
  }
}

testRealtimeMessaging();
