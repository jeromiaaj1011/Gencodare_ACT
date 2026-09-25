import crypto from "crypto";

// Security Configuration
const TOKEN_SECRET = process.env.AUTH_SECRET || "archaia_production_secure_token_secret_2026_xyz";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

// Rate limiting in-memory cache
interface AttemptRecord {
  count: number;
  lockedUntil?: number;
}
const attemptsCache = new Map<string, AttemptRecord>();

export class SecurityService {
  /**
   * Generates a random cryptographic salt (hex)
   */
  public static generateSalt(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Hashes a password with salt using PBKDF2 (10,000 iterations of SHA-256)
   */
  public static hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha256").toString("hex");
  }

  /**
   * Verifies password against stored salt and hash in constant time
   */
  public static verifyPassword(password: string, salt: string, storedHash: string): boolean {
    const computedHash = this.hashPassword(password, salt);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, "hex"),
        Buffer.from(storedHash, "hex")
      );
    } catch {
      return false;
    }
  }

  /**
   * Generates a signed, tamper-proof session token (header.payload.signature)
   */
  public static generateSessionToken(userId: string, email: string, role: string): string {
    const payload = {
      userId,
      email,
      role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payloadB64)
      .digest("base64url");

    return `${payloadB64}.${signature}`;
  }

  /**
   * Verifies and decodes a signed session token
   */
  public static verifySessionToken(token: string): {
    valid: boolean;
    payload?: { userId: string; email: string; role: string; expiresAt: number };
    error?: string;
  } {
    if (!token || !token.includes(".")) {
      return { valid: false, error: "Malformed token format." };
    }

    const [payloadB64, signature] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payloadB64)
      .digest("base64url");

    if (signature !== expectedSig) {
      return { valid: false, error: "Tampered or invalid token signature." };
    }

    try {
      const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
      const payload = JSON.parse(payloadJson);

      if (Date.now() > payload.expiresAt) {
        return { valid: false, error: "Session token expired." };
      }

      return { valid: true, payload };
    } catch {
      return { valid: false, error: "Invalid token payload structure." };
    }
  }

  /**
   * Checks rate limit and brute-force attempt lockout
   */
  public static checkRateLimit(key: string): { allowed: boolean; remainingLockoutSeconds?: number } {
    const record = attemptsCache.get(key);
    if (!record) return { allowed: true };

    const now = Date.now();
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSecs = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingLockoutSeconds: remainingSecs };
    }

    if (record.lockedUntil && record.lockedUntil <= now) {
      // Lockout expired, reset counter
      attemptsCache.delete(key);
      return { allowed: true };
    }

    return { allowed: true };
  }

  /**
   * Records a failed login attempt; locks out if maximum attempts exceeded
   */
  public static recordFailedAttempt(key: string): { locked: boolean; attemptsLeft: number } {
    const now = Date.now();
    const record = attemptsCache.get(key) || { count: 0 };
    record.count += 1;

    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MINUTES * 60 * 1000;
      attemptsCache.set(key, record);
      return { locked: true, attemptsLeft: 0 };
    }

    attemptsCache.set(key, record);
    return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - record.count };
  }

  /**
   * Clears failed attempts upon successful login
   */
  public static clearFailedAttempts(key: string): void {
    attemptsCache.delete(key);
  }

  /**
   * Evaluates password strength:
   * Score 0-4 (Weak to Very Strong)
   */
  public static evaluatePasswordStrength(password: string): {
    score: number;
    label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push("Minimum 8 characters required.");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Include at least one uppercase letter.");

    if (/[0-9]/.test(password)) score++;
    else feedback.push("Include at least one number.");

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push("Include at least one special character.");

    const labels: Array<"Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong"> = [
      "Very Weak",
      "Weak",
      "Fair",
      "Strong",
      "Very Strong",
    ];

    return {
      score,
      label: labels[score],
      feedback,
    };
  }
}
