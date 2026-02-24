/**
 * Simple in-memory rate limiter for server actions
 * For production at scale, consider using Redis
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store - resets on server restart
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    /** Time window in seconds */
    windowSeconds: number;
    /** Maximum requests allowed in the window */
    maxRequests: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetInSeconds: number;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (IP address, user ID, phone number, etc.)
 * @param action - Action name for namespacing (e.g., 'login', 'signup', 'donate')
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and remaining attempts
 */
export function checkRateLimit(
    identifier: string,
    action: string,
    config: RateLimitConfig
): RateLimitResult {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    const entry = rateLimitStore.get(key);

    // If no entry or window has expired, create new entry
    if (!entry || entry.resetTime < now) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetInSeconds: config.windowSeconds,
        };
    }

    // Window still active
    const remaining = config.maxRequests - entry.count - 1;
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

    if (entry.count >= config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetInSeconds,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        success: true,
        remaining: Math.max(0, remaining),
        resetInSeconds,
    };
}

// Pre-configured rate limits for common actions
export const RATE_LIMITS = {
    login: { windowSeconds: 300, maxRequests: 5 },      // 5 attempts per 5 minutes
    signup: { windowSeconds: 3600, maxRequests: 3 },    // 3 signups per hour
    donate: { windowSeconds: 60, maxRequests: 3 },      // 3 donations per minute
    passwordChange: { windowSeconds: 3600, maxRequests: 3 }, // 3 password changes per hour
    helpRequest: { windowSeconds: 300, maxRequests: 2 }, // 2 help requests per 5 minutes
} as const;

/**
 * Track failed login attempts for account lockout
 */
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function trackLoginAttempt(phone: string, success: boolean): { isLocked: boolean; lockoutMinutes: number } {
    const now = Date.now();
    const entry = loginAttempts.get(phone);
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // Check if currently locked
    if (entry && entry.lockedUntil > now) {
        return {
            isLocked: true,
            lockoutMinutes: Math.ceil((entry.lockedUntil - now) / 60000),
        };
    }

    // If successful login, clear attempts
    if (success) {
        loginAttempts.delete(phone);
        return { isLocked: false, lockoutMinutes: 0 };
    }

    // Track failed attempt
    const currentCount = (entry?.count || 0) + 1;

    if (currentCount >= maxAttempts) {
        loginAttempts.set(phone, {
            count: currentCount,
            lockedUntil: now + lockoutDuration,
        });
        return { isLocked: true, lockoutMinutes: 15 };
    }

    loginAttempts.set(phone, {
        count: currentCount,
        lockedUntil: 0,
    });

    return { isLocked: false, lockoutMinutes: 0 };
}

export function isAccountLocked(phone: string): { isLocked: boolean; lockoutMinutes: number } {
    const now = Date.now();
    const entry = loginAttempts.get(phone);

    if (!entry || entry.lockedUntil <= now) {
        return { isLocked: false, lockoutMinutes: 0 };
    }

    return {
        isLocked: true,
        lockoutMinutes: Math.ceil((entry.lockedUntil - now) / 60000),
    };
}
