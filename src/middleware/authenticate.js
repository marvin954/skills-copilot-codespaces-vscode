/**
 * JWT Authentication Middleware
 */
const AuthService = require('../services/AuthService');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Missing authorization header'
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer') {
    return res.status(401).json({
      error: 'Invalid authorization scheme'
    });
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: error.message || 'Invalid token'
    });
  }
}

module.exports = { authenticate };
