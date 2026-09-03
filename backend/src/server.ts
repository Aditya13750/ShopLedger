import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';
import { initReminderCron } from './jobs/reminderJob';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start background scheduled reminder runner
    initReminderCron();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 ShopLedger Backend server running on port ${PORT}`);
      console.log(`📡 Health check available at http://localhost:${PORT}/health`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const handleShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
