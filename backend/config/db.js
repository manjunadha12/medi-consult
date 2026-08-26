import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('[DATABASE] Attempting to connect to Neural Cloud Node...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Fail after 5 seconds instead of 10
      connectTimeoutMS: 10000,
    });
    console.log(`[DATABASE] Success: Synchronized with ${conn.connection.host}`);
    console.log(`[DATABASE] Active Node: ${conn.connection.name}`); // Display DB Name for verification
  } catch (error) {
    console.error(`[DATABASE ERROR] Failed to connect: ${error.message}`);
    console.error('PRO-TIP: Make sure you have whitelisted 0.0.0.0/0 in MongoDB Atlas.');
    // process.exit(1); // Do not exit to prevent ECONNREFUSED on proxy
  }
};

export default connectDB;
