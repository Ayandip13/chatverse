const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatting-platform')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find a pending girl
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const girl = await User.findOne({ role: 'GIRL', status: 'PENDING' });
    console.log('Pending Girl:', girl);

    if (!girl) {
      console.log('No pending girl found. Searching for any girl...');
      const anyGirl = await User.findOne({ role: 'GIRL' });
      console.log('Any Girl:', anyGirl);
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('DB Error:', err);
  });
