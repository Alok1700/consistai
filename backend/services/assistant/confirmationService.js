import crypto from 'crypto';

/**
 * ConfirmationService — Manages security confirmation tokens for destructive or bulk actions
 * High-risk operations (permanent deletion, bulk reset) require explicit preview & token confirmation.
 */

// In-memory pending confirmations map: token -> { userId, action, payload, expiresAt, preview }
const pendingConfirmations = new Map();

// Auto-purge expired tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of pendingConfirmations.entries()) {
    if (data.expiresAt < now) {
      pendingConfirmations.delete(token);
    }
  }
}, 60000);

export const confirmationService = {
  /**
   * Register a pending destructive action requiring confirmation
   */
  requestConfirmation({ userId, action, payload, preview }) {
    const token = crypto.randomBytes(8).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute TTL

    pendingConfirmations.set(token, {
      userId: String(userId),
      action,
      payload,
      preview,
      expiresAt
    });

    return {
      requiresConfirmation: true,
      confirmationToken: token,
      preview,
      expiresInSeconds: 300,
      message: `CONFIRMATION REQUIRED: ${preview} Please confirm by replying "yes", "confirm", or clicking Confirm.`
    };
  },

  /**
   * Verify and consume a confirmation token
   */
  verifyAndConsume({ userId, token }) {
    if (!token) return { valid: false, message: 'Confirmation token is required.' };

    const pending = pendingConfirmations.get(token);
    if (!pending) {
      return { valid: false, message: 'Invalid or expired confirmation token.' };
    }

    if (pending.userId !== String(userId)) {
      return { valid: false, message: 'Unauthorized confirmation attempt.' };
    }

    if (pending.expiresAt < Date.now()) {
      pendingConfirmations.delete(token);
      return { valid: false, message: 'Confirmation token has expired.' };
    }

    // Token is valid — consume it immediately to prevent replay
    pendingConfirmations.delete(token);
    return {
      valid: true,
      action: pending.action,
      payload: pending.payload
    };
  },

  /**
   * Check if user has an active pending confirmation (e.g. if user just replies "yes")
   */
  getPendingForUser(userId) {
    const uid = String(userId);
    const now = Date.now();
    for (const [token, data] of pendingConfirmations.entries()) {
      if (data.userId === uid && data.expiresAt >= now) {
        return { token, ...data };
      }
    }
    return null;
  }
};

export default confirmationService;
