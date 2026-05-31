/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  const message = err.message || getErrorMessage(err) || 'Internal server error';
  console.error('Error:', message);

  if (err.status === 400) {
    return res.status(400).json({ 
      error: message,
      message,
      details: err.details 
    });
  }

  res.status(err.status || 500).json({
    error: message,
    message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function getErrorMessage(err) {
  if (err.code === 'ECONNREFUSED') {
    return 'Database connection failed. Start PostgreSQL or use in-memory auth mode.';
  }

  if (err.code === '42P01') {
    return 'Database tables not found. Run src/db/schema.sql against your database.';
  }

  return null;
}

module.exports = { errorHandler };
