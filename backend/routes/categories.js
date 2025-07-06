const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

// Validation schemas
const categorySchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional()
});

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, 
                   COUNT(p.id) as product_count,
                   SUM(CASE WHEN p.is_active = true THEN p.quantity_in_stock * p.price ELSE 0 END) as total_value
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
            ORDER BY c.name
        `);

        res.json({ categories: result.rows });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT c.*, 
                   COUNT(p.id) as product_count,
                   SUM(CASE WHEN p.is_active = true THEN p.quantity_in_stock * p.price ELSE 0 END) as total_value
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
            WHERE c.id = $1
            GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Get products in this category
        const productsResult = await db.query(`
            SELECT id, name, sku, quantity_in_stock, price, minimum_stock_level,
                   CASE WHEN quantity_in_stock <= minimum_stock_level THEN true ELSE false END as is_low_stock
            FROM products
            WHERE category_id = $1 AND is_active = true
            ORDER BY name
        `, [id]);

        res.json({
            category: {
                ...result.rows[0],
                products: productsResult.rows
            }
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Manager only)
router.post('/', authenticateToken, requireManager, activityLogger('CREATE_CATEGORY', 'category'), async (req, res) => {
    try {
        const { error, value } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, description } = value;

        // Check if category name already exists
        const existing = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Category with this name already exists' });
        }

        const result = await db.query(`
            INSERT INTO categories (name, description)
            VALUES ($1, $2)
            RETURNING *
        `, [name, description]);

        res.status(201).json({
            message: 'Category created successfully',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Manager only)
router.put('/:id', authenticateToken, requireManager, activityLogger('UPDATE_CATEGORY', 'category'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = categorySchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, description } = value;

        // Check if category exists
        const existing = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if new name conflicts with existing categories
        const nameCheck = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2', [name, id]);
        if (nameCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Category with this name already exists' });
        }

        const result = await db.query(`
            UPDATE categories 
            SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [name, description, id]);

        res.json({
            message: 'Category updated successfully',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Manager only)
router.delete('/:id', authenticateToken, requireManager, activityLogger('DELETE_CATEGORY', 'category'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const category = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (category.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category has products
        const productsCheck = await db.query('SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND is_active = true', [id]);
        if (parseInt(productsCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category with active products. Please reassign or deactivate products first.' 
            });
        }

        await db.query('DELETE FROM categories WHERE id = $1', [id]);

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;
