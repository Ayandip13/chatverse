const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');

// Helper to create directories recursively
const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Folders to create
const folders = [
  'src/api/health',
  'src/config',
  'src/constants',
  'src/middlewares',
  'src/models',
  'src/repositories',
  'src/routes',
  'src/services',
  'src/sockets',
  'src/types',
  'src/utils',
  'src/validators'
].map(p => path.join(backendDir, p));

folders.forEach(mkDir);

// File contents
const files = {
  'package.json': `{
  "name": "chatverse-backend",
  "version": "1.0.0",
  "description": "Backend for ChatVerse",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon",
    "build": "tsc",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \\"src/**/*.ts\\""
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "compression": "^1.7.4",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.1",
    "morgan": "^1.10.0",
    "pino": "^9.3.2",
    "pino-http": "^10.2.0",
    "pino-pretty": "^11.2.1",
    "socket.io": "^4.7.5",
    "uuid": "^10.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/compression": "^1.7.5",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.14.10",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^7.16.0",
    "@typescript-eslint/parser": "^7.16.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "nodemon": "^3.1.4",
    "prettier": "^3.3.3",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.5.3"
  }
}`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

  'nodemon.json': `{
  "watch": ["src"],
  "ext": ".ts,.js",
  "ignore": [],
  "exec": "ts-node -r tsconfig-paths/register ./src/server.ts"
}`,

  '.eslintrc.json': `{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "prettier"],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "error"
  }
}`,

  '.prettierrc': `{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}`,

  '.env.example': `PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/chatverse
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000`,

  '.gitignore': `node_modules/
dist/
.env
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*`,

  'README.md': `# ChatVerse Backend

## Architecture
Clean architecture following: Route -> Controller -> Service -> Repository -> Database.

## Scripts
- \`npm run dev\`: Start server in development mode.
- \`npm run build\`: Compile TypeScript to JavaScript.
- \`npm run start\`: Run compiled JavaScript.
- \`npm run lint\`: Run ESLint.
- \`npm run format\`: Format code with Prettier.`,

  'src/server.ts': `import 'dotenv/config';
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
      logger.info(\`Server is running on port \${PORT} in \${envConfig.NODE_ENV} mode\`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
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
process.on('SIGINT', shutdown);`,

  'src/app.ts': `import express, { Application } from 'express';
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
    origin: envConfig.FRONTEND_URL,
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

export default app;`,

  'src/config/env.config.ts': `import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MongoDB URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT Secret is required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT Refresh Secret is required'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment variable validation failed:');
      error.errors.forEach((e) => console.error(\` - \${e.path.join('.')}: \${e.message}\`));
      process.exit(1);
    }
    throw error;
  }
};

const envConfig = parseEnv();
export default envConfig;`,

  'src/config/db.config.ts': `import mongoose from 'mongoose';
import envConfig from './env.config';
import logger from './logger.config';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(envConfig.MONGO_URI);
    logger.info(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;`,

  'src/config/logger.config.ts': `import pino from 'pino';
import envConfig from './env.config';

const isDev = envConfig.NODE_ENV === 'development';

const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
});

export default logger;`,

  'src/sockets/index.ts': `import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import envConfig from '@/config/env.config';
import logger from '@/config/logger.config';

let io: SocketIOServer;

export const initializeSocket = (server: HttpServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: envConfig.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', (socket) => {
    logger.info(\`New client connected: \${socket.id}\`);

    // Authentication middleware would be applied here in the future
    
    // Future socket modules (e.g., chatHandler, presenceHandler) will be attached here
    // chatHandler(io, socket);
    // presenceHandler(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(\`Client disconnected: \${socket.id}, reason: \${reason}\`);
    });
  });
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }
  return io;
};`,

  'src/middlewares/error.middleware.ts': `import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger.config';
import { ApiError } from '@/utils/ApiError.util';
import envConfig from '@/config/env.config';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { ERROR_MESSAGES } from '@/constants/errorMessages.constant';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(STATUS_CODES.NOT_FOUND, \`Resource not found: \${req.originalUrl}\`);
  next(error);
};

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;
  let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  let code = 'INTERNAL_SERVER_ERROR';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || code;
  }

  logger.error(\`[\${req.method}] \${req.originalUrl} >> StatusCode:: \${statusCode}, Message:: \${message}\`);
  if (envConfig.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details: envConfig.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};`,

  'src/utils/asyncHandler.util.ts': `import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};`,

  'src/utils/ApiResponse.util.ts': `export class ApiResponse<T> {
  public success: boolean;
  public data: T | null;
  public message: string;
  public meta?: any;

  constructor(data: T | null, message: string = 'Success', meta?: any) {
    this.success = true;
    this.data = data;
    this.message = message;
    if (meta) {
      this.meta = meta;
    }
  }
}`,

  'src/utils/ApiError.util.ts': `export class ApiError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    if (code) {
      this.code = code;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}`,

  'src/constants/statusCodes.constant.ts': `export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;`,

  'src/constants/errorMessages.constant.ts': `export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred on the server.',
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  BAD_REQUEST: 'Invalid request data.',
} as const;`,

  'src/routes/index.ts': `import { Router } from 'express';
import healthRoutes from '@/api/health/health.route';

const router = Router();

// API Routes
router.use('/health', healthRoutes);

export default router;`,

  'src/api/health/health.route.ts': `import { Router } from 'express';
import { checkHealth } from './health.controller';

const router = Router();

router.get('/', checkHealth);

export default router;`,

  'src/api/health/health.controller.ts': `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import mongoose from 'mongoose';

export const checkHealth = asyncHandler(async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(STATUS_CODES.OK).json(
    new ApiResponse({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    }, 'Service is running smoothly')
  );
});`
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Backend scaffolding complete.');
