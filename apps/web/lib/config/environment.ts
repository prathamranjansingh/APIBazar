import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  
  REDIS_URL: z.string().url(),
  
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),
  
  ENABLE_PUBLIC_TESTING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_CACHING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  
  DEFAULT_RATE_LIMIT: z.string().transform(Number).default('1000'),
  PUBLIC_TEST_RATE_LIMIT: z.string().transform(Number).default('5'),
  MAX_RESPONSE_SIZE_BYTES: z.string().transform(Number).default('1048576'),
});

export type Environment = z.infer<typeof envSchema>;

let env: Environment;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  process.exit(1);
}

export { env };

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';