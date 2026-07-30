require('dotenv').config();
const mongoose = require('mongoose');

async function wipeDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Wiping all collections...');
    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    for (let collection of collections) {
      console.log(`Dropping collection: ${collection.collectionName}`);
      await collection.drop();
    }
    
    console.log('Database wiped successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error wiping database:', err);
    process.exit(1);
  }
}

wipeDatabase();
