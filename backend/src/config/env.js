import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
export const DATABASE_URL = process.env.DATABASE_URL;
export const PORT = process.env.PORT || 3000;
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Export as ENV object for compatibility
export const ENV = {
    JWT_SECRET,
    DATABASE_URL,
    PORT,
    REDIS_URL,
    NODE_ENV,
    CORS_ORIGIN,
    LOG_LEVEL
};
