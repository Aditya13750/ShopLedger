import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopledger';
    
    mongoose.connection.on('connected', () => {
      console.log('✅ Connected to MongoDB successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.error('❌ Initial MongoDB connection failed:', error);
    console.warn('⚠️ Application will continue to run; retry will happen on query or reconnect.');
  }
};
