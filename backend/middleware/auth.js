import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check cookies first (HttpOnly cookie)
    if (req.cookies && req.cookies.token && req.cookies.token !== 'none') {
      token = req.cookies.token;
    }
    // Fallback to Bearer token in header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const parts = req.headers.authorization.split(' ');
      if (parts[1] && parts[1] !== 'none' && parts[1] !== 'null') {
        token = parts[1];
      }
    }

    const jwtSecret = process.env.JWT_SECRET || 'consistai_jwt_secret_key_2026';

    // Helper to sign fresh 30-day token and refresh cookie/headers
    const refreshAndSetUser = (user) => {
      const freshToken = jwt.sign(
        { id: user._id, role: user.role },
        jwtSecret,
        { expiresIn: '30d' }
      );
      res.setHeader('X-Refreshed-Token', freshToken);
      res.cookie('token', freshToken, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      req.user = user;
      return next();
    };

    // If no token was sent, require explicit authentication (no silent demo fallback)
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Standard JWT verification
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists. Please log in again.'
        });
      }

      req.user = user;
      return next();
    } catch (verifyErr) {
      // If token expired or failed verification, do not silently switch user.
      // Return clear 401 Unauthorized so client can re-authenticate.
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.'
      });
    }
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
};

export const optionalProtect = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token && req.cookies.token !== 'none') {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const parts = req.headers.authorization.split(' ');
      if (parts[1] && parts[1] !== 'none' && parts[1] !== 'null') {
        token = parts[1];
      }
    }

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'consistai_jwt_secret_key_2026';
      try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id).select('-password');
        if (user) req.user = user;
      } catch (e) {}
    }
    return next();
  } catch (e) {
    return next();
  }
};
