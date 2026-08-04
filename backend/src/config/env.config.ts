import dotenv from 'dotenv';
import { z } from 'zod';

// Ensure environment variables are loaded regardless of module import order
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MongoDB URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT Secret is required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT Refresh Secret is required'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment variable validation failed:');
      error.errors.forEach((e) => console.error(` - ${e.path.join('.')}: ${e.message}`));
      process.exit(1);
    }
    throw error;
  }
};

const envConfig = parseEnv();
export default envConfig;
