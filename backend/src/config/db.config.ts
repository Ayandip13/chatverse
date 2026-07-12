import mongoose from 'mongoose';
import envConfig from './env.config';
import logger from './logger.config';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(envConfig.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(error as Error, 'Error connecting to MongoDB:');
    process.exit(1);
  }
};

export default connectDB;