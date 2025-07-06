const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Mock login endpoint
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Mock user validation (accept any credentials for testing)
        console.log('✅ Mock login successful');

        const mockUser = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: email,
            name: 'Admin User',
            role: 'admin',
            department_id: '550e8400-e29b-41d4-a716-446655440002'
        };

        // Generate tokens
        const accessToken = jwt.sign(
            { userId: mockUser.id, email: mockUser.email },
            process.env.JWT_SECRET || 'mock-secret',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: mockUser.id },
            process.env.REFRESH_TOKEN_SECRET || 'mock-refresh-secret',
            { expiresIn: '7d' }
        );

        console.log('🎫 Tokens generated successfully');

        res.json({
            success: true,
            token: accessToken,
            refreshToken: refreshToken,
            user: mockUser,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

module.exports = router;
