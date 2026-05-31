/**
 * Authentication Service
 * Handles user registration, login, and token management
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { query } = require('../config/database');
const runtime = require('../config/runtime');
const MemoryAuthStore = require('./MemoryAuthStore');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

class AuthService {
  /**
   * Hash password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register new user
   */
  static async register(email, password, name) {
    if (runtime.useMemoryAuth) {
      return MemoryAuthStore.register(email, password, name);
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw {
        status: 400,
        message: 'Email already registered'
      };
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const userId = uuid();
    const result = await query(
      `INSERT INTO users (id, email, name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name`,
      [userId, email.toLowerCase(), name, passwordHash]
    );

    const user = result.rows[0];

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Login user
   */
  static async login(email, password) {
    if (runtime.useMemoryAuth) {
      return MemoryAuthStore.login(email, password);
    }

    // Find user
    const result = await query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw {
        status: 401,
        message: 'Invalid email or password'
      };
    }

    const user = result.rows[0];

    // Verify password
    const passwordValid = await this.verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      throw {
        status: 401,
        message: 'Invalid email or password'
      };
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken) {
    if (runtime.useMemoryAuth) {
      return MemoryAuthStore.refreshToken(refreshToken);
    }

    // Verify refresh token
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      
      // Check if token is stored
      const result = await query(
        'SELECT user_id FROM refresh_tokens WHERE token = $1 AND user_id = $2',
        [refreshToken, decoded.id]
      );

      if (result.rows.length === 0) {
        throw new Error('Token not found');
      }

      // Get user
      const userResult = await query(
        'SELECT id, email, name FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

      // Store new refresh token
      await this.storeRefreshToken(user.id, newRefreshToken);

      // Delete old refresh token
      await query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );

      return {
        user,
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw {
        status: 401,
        message: 'Invalid refresh token'
      };
    }
  }

  /**
   * Generate JWT tokens
   */
  static generateTokens(user) {
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

  /**
   * Store refresh token in database
   */
  static async storeRefreshToken(userId, token) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiryDate]
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    if (runtime.useMemoryAuth) {
      return MemoryAuthStore.verifyToken(token);
    }

    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw {
        status: 401,
        message: 'Invalid token'
      };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    if (runtime.useMemoryAuth) {
      return MemoryAuthStore.getUserById(userId);
    }

    const result = await query(
      'SELECT id, email, name, created_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw {
        status: 404,
        message: 'User not found'
      };
    }

    return result.rows[0];
  }

  /**
   * Logout user
   */
  static async logout(userId, refreshToken) {
    if (runtime.useMemoryAuth) {
      return MemoryAuthStore.logout(userId, refreshToken);
    }

    // Delete refresh token
    await query(
      'DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2',
      [userId, refreshToken]
    );
  }
}

module.exports = AuthService;
