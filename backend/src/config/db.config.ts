import mongoose from 'mongoose';
import dns from 'dns';
import envConfig from './env.config';
import logger from './logger.config';

// Connection event listeners
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB Cluster');
});

mongoose.connection.on('error', (err) => {
  logger.error(err, 'Mongoose default connection error:');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose connection disconnected');
});

const maskUri = (uri: string): string => {
  return uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
};

const diagnoseConnectionError = async (uri: string, err: any) => {
  logger.error(`[DB DIAGNOSTIC] Failed to connect using URI: ${maskUri(uri)}`);
  logger.error(`[DB DIAGNOSTIC] Error Name: ${err.name}`);
  logger.error(`[DB DIAGNOSTIC] Error Message: ${err.message}`);

  if (err.reason) {
    logger.error(`[DB DIAGNOSTIC] Topology Type: ${err.reason.type}`);
    if (err.reason.servers) {
      for (const [address, server] of err.reason.servers.entries()) {
        const serverErr = server.error ? server.error.message : 'No server-level error reported';
        logger.error(`[DB DIAGNOSTIC] Shard Server (${address}): ${serverErr}`);
      }
    }
  }

  if (uri.startsWith('mongodb+srv://')) {
    try {
      const match = uri.match(/mongodb\+srv:\/\/(?:.*@)?([^/?#]+)/);
      if (match && match[1]) {
        const hostname = match[1];
        logger.info(`[DB DIAGNOSTIC] Checking DNS SRV resolution for _mongodb._tcp.${hostname}...`);
        const addresses = await new Promise<any[]>((resolve, reject) => {
          dns.resolveSrv(`_mongodb._tcp.${hostname}`, (srvErr, addrs) => {
            if (srvErr) reject(srvErr);
            else resolve(addrs);
          });
        }).catch((dnsErr) => {
          logger.error(`[DB DIAGNOSTIC] DNS SRV Lookup FAILED: ${dnsErr.message}`);
          return null;
        });

        if (addresses && addresses.length > 0) {
          logger.info(`[DB DIAGNOSTIC] DNS SRV Lookup SUCCESS. Found ${addresses.length} Atlas hosts.`);
        }
      }
    } catch (dErr: any) {
      logger.error(`[DB DIAGNOSTIC] Diagnostic check error: ${dErr.message}`);
    }
  }
};

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = envConfig.MONGO_URI;
    logger.info(`Connecting to MongoDB at ${maskUri(mongoUri)}...`);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    logger.info(`MongoDB Connected: Host=${conn.connection.host}, DB=${conn.connection.name}`);
  } catch (error: any) {
    await diagnoseConnectionError(envConfig.MONGO_URI, error);
    process.exit(1);
  }
};

export default connectDB;