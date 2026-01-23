// Compatibility shim: re-export environment from config/env.js
// This allows legacy imports like "../env.js" to keep working.
export {
  ENV,
  JWT_SECRET,
  DATABASE_URL,
  PORT,
  REDIS_URL,
  NODE_ENV,
  CORS_ORIGIN,
  LOG_LEVEL,
} from "./config/env.js";
