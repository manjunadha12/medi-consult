import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const ids = ['DOC1002', 'DOC1003'];
    for (const id of ids) {
      const user = await User.findOne({ doctorId: id });
      if (user) {
        user.password = 'password123';
        // The pre-save hook will handle hashing
        await user.save();
        console.log(`✅ Password reset for ${id} to: password123`);
      } else {
        console.log(`❌ User ${id} not found`);
      }
    }

    console.log('Operation complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

reset();
