/**
 * @autoops-ai/config
 *
 * Purpose:
 * - Environment variable validation
 * - Shared application configuration
 * - Common constants used across all packages and apps
 * - Future application-level settings
 *
 * Usage:
 * Import from this package to access typed, validated environment configuration.
 * Do NOT hardcode environment values anywhere else in the codebase.
 */

// --- Environment Constants ---
export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
} as const;

// --- Application Constants ---
export const APP_NAME = 'AutoOps AI';
export const APP_VERSION = '0.1.0';

// --- Config Skeleton Marker ---
export const CONFIG_SKELETON = 'config-skeleton';
