import 'dotenv/config';
import http from 'http';
import app from '@/app';
import envConfig from '@/config/env.config';
import connectDB from '@/config/db.config';
import logger from '@/config/logger.config';
import { initializeSocket } from '@/sockets';

const PORT = envConfig.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${envConfig.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error(error as Error, 'Failed to start server:');
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);