import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per minute per IP
 */
export const authLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 5,
    message: "Too many login attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Trading rate limiter
 * 20 trades per minute per IP
 */
export const tradeLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 20,
    message: "Too many trade requests, please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Binary options rate limiter
 * 30 binary trades per minute per IP
 */
export const binaryLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 30,
    message: "Too many binary trade requests, please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Admin actions rate limiter
 * 50 requests per minute per IP
 */
export const adminLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 50,
    message: "Too many admin requests, please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
});
