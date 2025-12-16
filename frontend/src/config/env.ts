// Centralized environment configuration
// All environment variables should be accessed through this file

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
} as const;

// Validate required environment variables
if (!config.apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required but not defined in .env file');
}
