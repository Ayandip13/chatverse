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

import path from 'path';

const app: Application = express();

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = envConfig.FRONTEND_URL.split(',').map(u => u.trim());
      if (
        envConfig.FRONTEND_URL === '*' ||
        allowedOrigins.includes('*') ||
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === 'development'
      ) {
        return callback(null, true);
      }
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
  })
);

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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