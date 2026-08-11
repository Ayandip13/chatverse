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

import fs from 'fs';
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
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Fallback for missing avatar uploads
app.use('/uploads/avatars', (_req, res) => {
  const defaultAvatarPath = path.join(uploadsDir, 'avatars', 'default-avatar.svg');
  if (fs.existsSync(defaultAvatarPath)) {
    return res.sendFile(defaultAvatarPath);
  }

  const svgPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#CBD5E1"/>
    <path d="M100 40 C77.9086 40 60 57.9086 60 80 C60 102.091 77.9086 120 100 120 C122.091 120 140 102.091 140 80 C140 57.9086 122.091 40 100 40 Z M40 170 C40 136.863 66.8629 110 100 110 C133.137 110 160 136.863 160 170 Z" fill="#64748B"/>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  return res.status(200).send(svgPlaceholder);
});

// Fallback for other missing uploads
app.use('/uploads', (req, res) => {
  return res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `Resource not found: ${req.originalUrl}`,
    },
  });
});

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