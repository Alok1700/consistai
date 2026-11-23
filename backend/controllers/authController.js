import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'consistai_jwt_secret_key_2026',
    { expiresIn: '30d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };

  res.setHeader('X-Refreshed-Token', token);
  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences
      }
    });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, role });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

export const demoLogin = async (req, res, next) => {
  try {
    let demoUser = await User.findOne({ email: 'demo@consistai.edu' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Arjun Verma (CSE Demo)',
        email: 'demo@consistai.edu',
        password: 'Password123!',
        role: 'student'
      });
    }
    sendTokenResponse(demoUser, 200, res);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, preferences } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (preferences) {
      updateData.preferences = {
        ...(req.user.preferences ? (req.user.preferences.toObject ? req.user.preferences.toObject() : req.user.preferences) : {}),
        ...preferences
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const preferences = req.body;
    const currentPrefs = req.user.preferences ? (req.user.preferences.toObject ? req.user.preferences.toObject() : req.user.preferences) : {};
    const updatedPreferences = {
      ...currentPrefs,
      ...preferences
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences: updatedPreferences },
      { new: true, runValidators: true }
    );
    res.json({ success: true, preferences: user.preferences, user });
  } catch (err) {
    next(err);
  }
};
