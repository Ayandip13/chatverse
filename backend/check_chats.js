require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const chats = await db.collection('chats').find({}).toArray();
  console.log(JSON.stringify(chats, null, 2));
  process.exit(0);
}

run();
