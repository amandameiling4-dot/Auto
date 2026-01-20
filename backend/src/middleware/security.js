import helmet from "helmet";
import cors from "cors";

/**
 * Helmet security headers configuration
 */
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    noSniff: true,
    frameguard: { action: "deny" },
    xssFilter: true,
});

/**
 * CORS configuration for production
 */
export const corsOptions = {
    origin: process.env.CORS_ORIGIN || "https://onchainweb.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // 24 hours
};

/**
 * CORS configuration for development
 */
export const corsDevOptions = {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

/**
 * Get CORS configuration based on environment
 */
export const getCorsConfig = () => {
    return process.env.NODE_ENV === "production" ? cors(corsOptions) : cors(corsDevOptions);
};
