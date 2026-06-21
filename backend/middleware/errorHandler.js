function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}


function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

 
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed', errors: messages });
  }

  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource identifier.' });
  }

  
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with these details already exists.' });
  }

  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Something went wrong on the server.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

module.exports = { notFound, errorHandler };
