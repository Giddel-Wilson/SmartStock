const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 Auth check - Token received:', token ? 'Yes' : 'No');

    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // For testing, accept any token and create a mock user
        console.log('✅ Token accepted (mock mode)');
        req.user = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'admin@smartstock.com',
            name: 'Admin User',
            role: 'admin',
            department_id: '550e8400-e29b-41d4-a716-446655440002',
            is_active: true
        };
        
        console.log('👤 Mock user set:', req.user.email);
        next();
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

module.exports = {
    authenticateToken
};
