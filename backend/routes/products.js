const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

// Validation schemas
const productSchema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    sku: Joi.string().min(1).max(100).required(),
    categoryId: Joi.string().uuid().optional(),
    quantity: Joi.number().integer().min(0).default(0),
    unitPrice: Joi.number().min(0).required(),
    lowStockThreshold: Joi.number().integer().min(0).default(10),
    supplier: Joi.string().max(200).optional(),
    description: Joi.string().optional()
});

const updateProductSchema = Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    sku: Joi.string().min(1).max(100).optional(),
    categoryId: Joi.string().uuid().allow(null).optional(),
    unitPrice: Joi.number().min(0).optional(),
    lowStockThreshold: Joi.number().integer().min(0).optional(),
    supplier: Joi.string().max(200).allow('').optional(),
    description: Joi.string().allow('').optional(),
    isActive: Joi.boolean().optional()
});

// Helper function to check low stock and create alerts
const checkLowStock = async (productId) => {
    try {
        const result = await db.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1 AND p.quantity_in_stock <= p.minimum_stock_level AND p.is_active = true
        `, [productId]);

        if (result.rows.length > 0) {
            const product = result.rows[0];
            
            // Check if alert already exists for this product
            const existingAlert = await db.query(`
                SELECT id FROM stock_alerts 
                WHERE product_id = $1 AND alert_sent = false
            `, [productId]);

            if (existingAlert.rows.length === 0) {
                // Create new alert
                const message = `Low stock alert: ${product.name} (SKU: ${product.sku}) has ${product.quantity} units remaining (threshold: ${product.low_stock_threshold})`;
                
                await db.query(`
                    INSERT INTO stock_alerts (product_id, message)
                    VALUES ($1, $2)
                `, [productId, message]);

                // Send real-time notification to managers
                if (global.wsConnections) {
                    const managerResult = await db.query(`
                        SELECT id FROM users WHERE role = 'manager' AND is_active = true
                    `);

                    for (const manager of managerResult.rows) {
                        const ws = global.wsConnections.get(manager.id);
                        if (ws && ws.readyState === 1) {
                            ws.send(JSON.stringify({
                                type: 'low_stock_alert',
                                data: {
                                    productId: product.id,
                                    productName: product.name,
                                    sku: product.sku,
                                    currentQuantity: product.quantity,
                                    threshold: product.low_stock_threshold,
                                    category: product.category_name,
                                    message
                                }
                            }));
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking low stock:', error);
    }
};

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            category = '',
            lowStock = false,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const offset = (page - 1) * limit;
        const validSortColumns = ['name', 'sku', 'quantity', 'unit_price', 'created_at'];
        const validSortOrders = ['asc', 'desc'];
        
        const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'name';
        const order = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';

        let whereConditions = ['p.is_active = true'];
        let queryParams = [];
        let paramIndex = 1;

        // Search filter
        if (search) {
            whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Category filter
        if (category) {
            whereConditions.push(`p.category_id = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }

        // Low stock filter
        if (lowStock === 'true') {
            whereConditions.push('p.quantity_in_stock <= p.minimum_stock_level');
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM products p
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, queryParams);
        const totalProducts = parseInt(countResult.rows[0].total);

        // Get products
        const query = `
            SELECT p.*, c.name as category_name,
                   CASE WHEN p.quantity_in_stock <= p.minimum_stock_level THEN true ELSE false END as is_low_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereClause}
            ORDER BY p.${orderBy} ${order}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        queryParams.push(limit, offset);
        const result = await db.query(query, queryParams);

        res.json({
            products: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalProducts,
                pages: Math.ceil(totalProducts / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT p.*, c.name as category_name,
                   CASE WHEN p.quantity_in_stock <= p.minimum_stock_level THEN true ELSE false END as is_low_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Manager only)
router.post('/', authenticateToken, requireManager, activityLogger('CREATE_PRODUCT', 'product'), async (req, res) => {
    try {
        const { error, value } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            name,
            sku,
            categoryId,
            quantity,
            unitPrice,
            lowStockThreshold,
            supplier,
            description
        } = value;

        // Check if SKU already exists
        const existingSku = await db.query('SELECT id FROM products WHERE sku = $1', [sku]);
        if (existingSku.rows.length > 0) {
            return res.status(409).json({ error: 'Product with this SKU already exists' });
        }

        // Validate category if provided
        if (categoryId) {
            const category = await db.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
            if (category.rows.length === 0) {
                return res.status(400).json({ error: 'Category not found' });
            }
        }

        // Create product
        const result = await db.query(`
            INSERT INTO products (name, sku, category_id, quantity_in_stock, price, minimum_stock_level, supplier, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [name, sku, categoryId, quantity, unitPrice, lowStockThreshold, supplier, description]);

        const newProduct = result.rows[0];

        // Log inventory change if quantity > 0
        if (quantity > 0) {
            await db.query(`
                INSERT INTO inventory_logs (product_id, user_id, type, quantity_change, previous_quantity, new_quantity, reason)
                VALUES ($1, $2, 'purchase', $3, 0, $4, 'Initial stock')
            `, [newProduct.id, req.user.id, quantity, quantity]);
        }

        // Check for low stock
        await checkLowStock(newProduct.id);

        res.status(201).json({
            message: 'Product created successfully',
            product: newProduct
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Manager only)
router.put('/:id', authenticateToken, requireManager, activityLogger('UPDATE_PRODUCT', 'product'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateProductSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Check if product exists
        const existingProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (existingProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if new SKU conflicts with existing products
        if (value.sku) {
            const skuCheck = await db.query('SELECT id FROM products WHERE sku = $1 AND id != $2', [value.sku, id]);
            if (skuCheck.rows.length > 0) {
                return res.status(409).json({ error: 'Product with this SKU already exists' });
            }
        }

        // Validate category if provided
        if (value.categoryId) {
            const category = await db.query('SELECT id FROM categories WHERE id = $1', [value.categoryId]);
            if (category.rows.length === 0) {
                return res.status(400).json({ error: 'Category not found' });
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
            UPDATE products 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, updateValues);
        const updatedProduct = result.rows[0];

        // Check for low stock after update
        await checkLowStock(id);

        res.json({
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (Manager only)
router.delete('/:id', authenticateToken, requireManager, activityLogger('DELETE_PRODUCT', 'product'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const product = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Soft delete by setting is_active to false
        await db.query('UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// @route   GET /api/products/:id/history
// @desc    Get inventory history for a product
// @access  Private
router.get('/:id/history', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Check if product exists
        const product = await db.query('SELECT name FROM products WHERE id = $1', [id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const result = await db.query(`
            SELECT il.*, u.name as user_name
            FROM inventory_logs il
            JOIN users u ON il.user_id = u.id
            WHERE il.product_id = $1
            ORDER BY il.created_at DESC
            LIMIT $2 OFFSET $3
        `, [id, limit, offset]);

        const countResult = await db.query(`
            SELECT COUNT(*) as total FROM inventory_logs WHERE product_id = $1
        `, [id]);

        res.json({
            history: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get product history error:', error);
        res.status(500).json({ error: 'Failed to fetch product history' });
    }
});

module.exports = router;
