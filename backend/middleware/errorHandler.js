const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        message: err.message || 'Internal Server Error',
        status: err.status || 500
    };

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        error.message = Object.values(err.errors).map(val => val.message).join(', ');
        error.status = 400;
    }

    // PostgreSQL duplicate key error
    if (err.code === '23505') {
        error.message = 'Resource already exists';
        error.status = 409;
    }

    // PostgreSQL foreign key constraint error
    if (err.code === '23503') {
        error.message = 'Referenced resource not found';
        error.status = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.status = 401;
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.status = 401;
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error.message = 'File too large';
        error.status = 413;
    }

    res.status(error.status).json({
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = { errorHandler };
