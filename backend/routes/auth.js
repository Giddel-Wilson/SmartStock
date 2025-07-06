const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { logActivity } = require('../middleware/activityLogger');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('manager', 'staff').default('staff'),
    departmentId: Joi.string().uuid().optional(),
    phone: Joi.string().max(20).optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Generate JWT tokens
const generateTokens = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });

    return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user (Manager only)
// @access  Private (Manager)
router.post('/register', authLimiter, authenticateToken, async (req, res) => {
    try {
        // Only managers can register new users
        if (req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Only managers can register new users' });
        }

        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, email, password, role, departmentId, phone } = value;

        // Check if user already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Validate department if provided
        if (departmentId) {
            const dept = await db.query('SELECT id FROM departments WHERE id = $1', [departmentId]);
            if (dept.rows.length === 0) {
                return res.status(400).json({ error: 'Department not found' });
            }
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await db.query(`
            INSERT INTO users (name, email, password_hash, role, department_id, phone)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, email, role, department_id, phone, created_at
        `, [name, email, passwordHash, role, departmentId, phone]);

        const newUser = result.rows[0];

        // Log activity
        await logActivity(req.user.id, 'CREATE_USER', 'user', newUser.id, {
            newUserEmail: email,
            newUserRole: role
        }, req);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                departmentId: newUser.department_id,
                phone: newUser.phone,
                createdAt: newUser.created_at
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = value;

        // Find user
        const result = await db.query(`
            SELECT u.*, d.name as department_name 
            FROM users u 
            LEFT JOIN departments d ON u.department_id = d.id 
            WHERE u.email = $1
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token hash in database
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await db.query(`
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '7 days')
        `, [user.id, refreshTokenHash]);

        // Update last login
        await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        // Log activity
        await logActivity(user.id, 'LOGIN', 'auth', null, {}, req);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department_id: user.department_id,
                department_name: user.department_name,
                phone: user.phone,
                last_login: new Date()
            },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Check if refresh token exists and is valid
        const tokenResult = await db.query(`
            SELECT rt.*, u.name, u.email, u.role, u.is_active 
            FROM refresh_tokens rt
            JOIN users u ON rt.user_id = u.id
            WHERE rt.user_id = $1 AND rt.expires_at > NOW() AND rt.revoked_at IS NULL
        `, [decoded.userId]);

        if (tokenResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const tokenData = tokenResult.rows[0];

        if (!tokenData.is_active) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Verify the refresh token hash
        const isValidToken = await bcrypt.compare(refreshToken, tokenData.token_hash);
        if (!isValidToken) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Generate new access token
        const user = {
            id: decoded.userId,
            email: tokenData.email,
            role: tokenData.role
        };

        const { accessToken } = generateTokens(user);

        res.json({
            accessToken,
            user: {
                id: user.id,
                name: tokenData.name,
                email: tokenData.email,
                role: tokenData.role
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Token refresh failed' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (revoke refresh token)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Revoke the refresh token
            await db.query(`
                UPDATE refresh_tokens 
                SET revoked_at = NOW() 
                WHERE user_id = $1 AND token_hash = $2
            `, [req.user.id, await bcrypt.hash(refreshToken, 10)]);
        }

        // Log activity
        await logActivity(req.user.id, 'LOGOUT', 'auth', null, {}, req);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.phone, u.last_login, u.created_at,
                   d.name as department_name, d.id as department_id
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                department_id: user.department_id,
                department_name: user.department_name,
                last_login: user.last_login,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

module.exports = router;
