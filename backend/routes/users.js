const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

// Validation schemas
const updateUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().max(20).allow('').optional(),
    departmentId: Joi.string().uuid().allow(null).optional(),
    role: Joi.string().valid('manager', 'staff').optional(),
    isActive: Joi.boolean().optional()
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

const resetPasswordSchema = Joi.object({
    newPassword: Joi.string().min(6).required()
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Manager only)
router.get('/', authenticateToken, requireManager, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            department = '', 
            role = '', 
            isActive = '' 
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Search filter
        if (search) {
            whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Department filter
        if (department) {
            whereConditions.push(`u.department_id = $${paramIndex}`);
            queryParams.push(department);
            paramIndex++;
        }

        // Role filter
        if (role) {
            whereConditions.push(`u.role = $${paramIndex}`);
            queryParams.push(role);
            paramIndex++;
        }

        // Active status filter
        if (isActive !== '') {
            whereConditions.push(`u.is_active = $${paramIndex}`);
            queryParams.push(isActive === 'true');
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, queryParams);
        const totalUsers = parseInt(countResult.rows[0].total);

        // Get users
        const query = `
            SELECT u.id, u.name, u.email, u.role, u.phone, u.is_active, u.last_login, u.created_at,
                   d.name as department_name, d.id as department_id
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ${whereClause}
            ORDER BY u.name
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        queryParams.push(limit, offset);
        const result = await db.query(query, queryParams);

        res.json({
            users: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private (Manager or own profile)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is trying to access their own profile or is a manager
        if (req.user.id !== id && req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.phone, u.is_active, u.last_login, u.created_at,
                   d.name as department_name, d.id as department_id
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get recent activity for the user
        const activityResult = await db.query(`
            SELECT action, resource_type, created_at
            FROM activity_logs
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 10
        `, [id]);

        res.json({
            user: {
                ...result.rows[0],
                recentActivity: activityResult.rows
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Manager only, except own profile for basic info)
router.put('/:id', authenticateToken, activityLogger('UPDATE_USER', 'user'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateUserSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Check if user exists
        const existingUser = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentUser = existingUser.rows[0];

        // Check permissions
        const isOwnProfile = req.user.id === id;
        const isManager = req.user.role === 'manager';
        
        if (!isOwnProfile && !isManager) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Restrict what non-managers can update on their own profile
        if (isOwnProfile && !isManager) {
            const allowedFields = ['name', 'email', 'phone'];
            const restrictedFields = Object.keys(value).filter(field => !allowedFields.includes(field));
            
            if (restrictedFields.length > 0) {
                return res.status(403).json({ 
                    error: `You can only update: ${allowedFields.join(', ')}` 
                });
            }
        }

        // Check if new email conflicts with existing users
        if (value.email && value.email !== currentUser.email) {
            const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [value.email, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }

        // Validate department if provided
        if (value.departmentId) {
            const dept = await db.query('SELECT id FROM departments WHERE id = $1', [value.departmentId]);
            if (dept.rows.length === 0) {
                return res.status(400).json({ error: 'Department not found' });
            }
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        Object.entries(value).forEach(([key, val]) => {
            if (val !== undefined) {
                const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                updateFields.push(`${columnName} = $${paramIndex}`);
                updateValues.push(val);
                paramIndex++;
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, name, email, role, phone, is_active, department_id, last_login, created_at
        `;

        const result = await db.query(query, updateValues);

        res.json({
            message: 'User updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// @route   POST /api/users/:id/change-password
// @desc    Change user password
// @access  Private (Own profile or Manager)
router.post('/:id/change-password', authenticateToken, activityLogger('CHANGE_PASSWORD', 'user'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = changePasswordSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { currentPassword, newPassword } = value;

        // Check permissions
        const isOwnProfile = req.user.id === id;
        const isManager = req.user.role === 'manager';
        
        if (!isOwnProfile && !isManager) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get user's current password hash
        const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password (only required for own profile)
        if (isOwnProfile) {
            const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
            if (!isValidPassword) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await db.query(`
            UPDATE users 
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [newPasswordHash, id]);

        // Revoke all refresh tokens for this user
        await db.query(`
            UPDATE refresh_tokens 
            SET revoked_at = CURRENT_TIMESTAMP 
            WHERE user_id = $1 AND revoked_at IS NULL
        `, [id]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// @route   POST /api/users/:id/reset-password
// @desc    Reset user password (Manager only)
// @access  Private (Manager only)
router.post('/:id/reset-password', authenticateToken, requireManager, activityLogger('RESET_PASSWORD', 'user'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = resetPasswordSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { newPassword } = value;

        // Check if user exists
        const userResult = await db.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await db.query(`
            UPDATE users 
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [newPasswordHash, id]);

        // Revoke all refresh tokens for this user
        await db.query(`
            UPDATE refresh_tokens 
            SET revoked_at = CURRENT_TIMESTAMP 
            WHERE user_id = $1 AND revoked_at IS NULL
        `, [id]);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user (soft delete)
// @access  Private (Manager only)
router.delete('/:id', authenticateToken, requireManager, activityLogger('DEACTIVATE_USER', 'user'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deactivating yourself
        if (req.user.id === id) {
            return res.status(400).json({ error: 'You cannot deactivate your own account' });
        }

        // Deactivate user
        await db.query(`
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);

        // Revoke all refresh tokens for this user
        await db.query(`
            UPDATE refresh_tokens 
            SET revoked_at = CURRENT_TIMESTAMP 
            WHERE user_id = $1 AND revoked_at IS NULL
        `, [id]);

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});

// @route   POST /api/users/:id/activate
// @desc    Reactivate user
// @access  Private (Manager only)
router.post('/:id/activate', authenticateToken, requireManager, activityLogger('ACTIVATE_USER', 'user'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Activate user
        await db.query(`
            UPDATE users 
            SET is_active = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);

        res.json({ message: 'User activated successfully' });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({ error: 'Failed to activate user' });
    }
});

module.exports = router;
