import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import logger from '@/config/logger.config';
import envConfig from '@/config/env.config';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import apiRoutes from '@/routes';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = envConfig.FRONTEND_URL.split(',').map(u => u.trim());
      if (allowedOrigins.indexOf(origin) === -1) {
        // Fallback for local development or wildcards
        if (envConfig.FRONTEND_URL === '*' || allowedOrigins.includes('*')) {
           return callback(null, true);
        }
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Request Logging
app.use(
  pinoHttp({
    logger,
    autoLogging: false,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

// API Routes
app.use('/api/v1', apiRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;