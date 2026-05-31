/**
 * Authentication Routes
 * POST /auth/signup - Register user
 * POST /auth/login - Login user
 * POST /auth/refresh - Refresh token
 * POST /auth/logout - Logout user
 * GET /auth/me - Get current user
 */
const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const { authenticate } = require('../middleware/authenticate');

/**
 * User Registration
 * POST /auth/signup
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw {
        status: 400,
        message: 'Email, password, and name are required'
      };
    }

    if (password.length < 8) {
      throw {
        status: 400,
        message: 'Password must be at least 8 characters'
      };
    }

    const result = await AuthService.register(email, password, name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * User Login
 * POST /auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw {
        status: 400,
        message: 'Email and password are required'
      };
    }

    const result = await AuthService.login(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh Access Token
 * POST /auth/refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw {
        status: 400,
        message: 'Refresh token is required'
      };
    }

    const result = await AuthService.refreshToken(refresh_token);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        user: result.user,
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Current User
 * GET /auth/me
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await AuthService.getUserById(req.user.id);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Logout
 * POST /auth/logout
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      await AuthService.logout(req.user.id, refresh_token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
