require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('Using URI:', process.env.MONGO_URI.replace(/:([^:/@]+)@/, ':****@')); // Hide password in logs

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  keepAlive: true,
  keepAliveInitialDelay: 300000
})
.then(() => {
  console.log('Successfully connected to MongoDB!');
  console.log('Connection state:', mongoose.connection.readyState);
  console.log('Host:', mongoose.connection.host);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  if (err.name === 'MongoServerSelectionError') {
    console.error('Could not connect to any MongoDB server.');
    console.error('Please check:');
    console.error('1. Network connectivity');
    console.error('2. MongoDB Atlas whitelist settings');
    console.error('3. Database user credentials');
  }
})
.finally(() => {
  setTimeout(() => {
    mongoose.connection.close();
    process.exit(0);
  }, 1000);
});
