const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

// Validation schemas
const departmentSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional()
});

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT d.*, 
                   COUNT(u.id) as user_count
            FROM departments d
            LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true
            GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
            ORDER BY d.name
        `);

        res.json({ departments: result.rows });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// @route   GET /api/departments/:id
// @desc    Get single department by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT d.*, 
                   COUNT(u.id) as user_count
            FROM departments d
            LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true
            WHERE d.id = $1
            GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        // Get users in this department
        const usersResult = await db.query(`
            SELECT id, name, email, role, phone, last_login, created_at
            FROM users
            WHERE department_id = $1 AND is_active = true
            ORDER BY name
        `, [id]);

        res.json({
            department: {
                ...result.rows[0],
                users: usersResult.rows
            }
        });
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
});

// @route   POST /api/departments
// @desc    Create new department
// @access  Private (Manager only)
router.post('/', authenticateToken, requireManager, activityLogger('CREATE_DEPARTMENT', 'department'), async (req, res) => {
    try {
        const { error, value } = departmentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, description } = value;

        // Check if department name already exists
        const existing = await db.query('SELECT id FROM departments WHERE LOWER(name) = LOWER($1)', [name]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Department with this name already exists' });
        }

        const result = await db.query(`
            INSERT INTO departments (name, description)
            VALUES ($1, $2)
            RETURNING *
        `, [name, description]);

        res.status(201).json({
            message: 'Department created successfully',
            department: result.rows[0]
        });
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (Manager only)
router.put('/:id', authenticateToken, requireManager, activityLogger('UPDATE_DEPARTMENT', 'department'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = departmentSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, description } = value;

        // Check if department exists
        const existing = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        // Check if new name conflicts with existing departments
        const nameCheck = await db.query('SELECT id FROM departments WHERE LOWER(name) = LOWER($1) AND id != $2', [name, id]);
        if (nameCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Department with this name already exists' });
        }

        const result = await db.query(`
            UPDATE departments 
            SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [name, description, id]);

        res.json({
            message: 'Department updated successfully',
            department: result.rows[0]
        });
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
});

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private (Manager only)
router.delete('/:id', authenticateToken, requireManager, activityLogger('DELETE_DEPARTMENT', 'department'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if department exists
        const department = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
        if (department.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        // Check if department has users
        const usersCheck = await db.query('SELECT COUNT(*) as count FROM users WHERE department_id = $1 AND is_active = true', [id]);
        if (parseInt(usersCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete department with active users. Please reassign or deactivate users first.' 
            });
        }

        await db.query('DELETE FROM departments WHERE id = $1', [id]);

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

module.exports = router;
