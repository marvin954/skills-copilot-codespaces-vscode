/**
 * In-memory auth store for local development when PostgreSQL is unavailable
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const users = new Map();
const refreshTokens = new Map();

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
    last_login: user.last_login
  };
}

async function register(email, password, name) {
  const normalizedEmail = email.toLowerCase();

  for (const user of users.values()) {
    if (user.email === normalizedEmail) {
      throw { status: 400, message: 'Email already registered' };
    }
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: uuid(),
    email: normalizedEmail,
    name,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
    last_login: null
  };

  users.set(user.id, user);

  const { accessToken, refreshToken } = generateTokens(user);
  storeRefreshToken(user.id, refreshToken);

  return {
    user: publicUser(user),
    accessToken,
    refreshToken
  };
}

async function login(email, password) {
  const normalizedEmail = email.toLowerCase();
  const user = [...users.values()].find((entry) => entry.email === normalizedEmail);

  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  user.last_login = new Date().toISOString();

  const { accessToken, refreshToken } = generateTokens(user);
  storeRefreshToken(user.id, refreshToken);

  return {
    user: publicUser(user),
    accessToken,
    refreshToken
  };
}

function storeRefreshToken(userId, token) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  refreshTokens.set(token, { userId, expiresAt: expiryDate.toISOString() });
}

async function refreshToken(refreshTokenValue) {
  try {
    const decoded = jwt.verify(refreshTokenValue, JWT_SECRET);
    const stored = refreshTokens.get(refreshTokenValue);

    if (!stored || stored.userId !== decoded.id) {
      throw new Error('Token not found');
    }

    const user = users.get(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    refreshTokens.delete(refreshTokenValue);
    storeRefreshToken(user.id, newRefreshToken);

    return {
      user: publicUser(user),
      accessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    throw { status: 401, message: 'Invalid refresh token' };
  }
}

function getUserById(userId) {
  const user = users.get(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }
  return publicUser(user);
}

function logout(userId, refreshTokenValue) {
  const stored = refreshTokens.get(refreshTokenValue);
  if (stored && stored.userId === userId) {
    refreshTokens.delete(refreshTokenValue);
  }
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw { status: 401, message: 'Invalid token' };
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  getUserById,
  logout,
  verifyToken
};
