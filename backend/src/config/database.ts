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

    // Run safe tenant migration for existing records without userId
    try {
      const { User } = await import('../models/User');
      const { Customer } = await import('../models/Customer');
      const { Bill } = await import('../models/Bill');
      const { Payment } = await import('../models/Payment');
      const { Reminder } = await import('../models/Reminder');
      const { WhatsAppMessage } = await import('../models/WhatsAppMessage');
      const { ShopSettings } = await import('../models/ShopSettings');

      const primaryUser = await User.findOne().sort({ createdAt: 1 });
      if (primaryUser) {
        const pId = primaryUser._id;
        await Customer.updateMany({ userId: { $exists: false } }, { $set: { userId: pId } });
        await Bill.updateMany({ userId: { $exists: false } }, { $set: { userId: pId } });
        await Payment.updateMany({ userId: { $exists: false } }, { $set: { userId: pId } });
        await Reminder.updateMany({ userId: { $exists: false } }, { $set: { userId: pId } });
        await WhatsAppMessage.updateMany({ userId: { $exists: false } }, { $set: { userId: pId } });
        await ShopSettings.updateMany({ userId: { $exists: false } }, { $set: { userId: pId } });
      }
    } catch (migErr) {
      console.warn('Tenant migration skipped or not needed:', migErr);
    }
  } catch (error) {
    console.error('❌ Initial MongoDB connection failed:', error);
    console.warn('⚠️ Application will continue to run; retry will happen on query or reconnect.');
  }
};
