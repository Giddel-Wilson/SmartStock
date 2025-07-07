const express = require('express');
const PDFDocument = require('pdfkit');
const csv = require('csv-parser');
const db = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/inventory-summary
// @desc    Get inventory summary report
// @access  Private
router.get('/inventory-summary', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, categoryId, departmentId, format = 'json' } = req.query;
        const { user } = req;

        let whereConditions = ['p.is_active = true'];
        let queryParams = [];
        let paramIndex = 1;

        // Department-based access control
        if (user.role === 'staff') {
            if (!user.department_id) {
                return res.status(403).json({ 
                    error: 'Access denied. Staff must be assigned to a department to view reports.' 
                });
            }
            // Staff can only see products from their department
            whereConditions.push(`p.department_id = $${paramIndex}`);
            queryParams.push(user.department_id);
            paramIndex++;
        } else if (departmentId) {
            // Managers can filter by specific department
            whereConditions.push(`p.department_id = $${paramIndex}`);
            queryParams.push(departmentId);
            paramIndex++;
        }

        // Date filter for inventory movements
        let dateFilter = '';
        if (startDate && endDate) {
            dateFilter = `AND il.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            queryParams.push(startDate, endDate);
            paramIndex += 2;
        }

        // Category filter
        if (categoryId) {
            whereConditions.push(`p.category_id = $${paramIndex}`);
            queryParams.push(categoryId);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get inventory summary
        const summaryQuery = `
            SELECT 
                p.id,
                p.name,
                p.sku,
                p.quantity_in_stock as quantity,
                p.price as unit_price,
                p.minimum_stock_level as low_stock_threshold,
                p.quantity_in_stock * p.price as total_value,
                c.name as category_name,
                d.name as department_name,
                p.department_id,
                CASE WHEN p.quantity_in_stock <= p.minimum_stock_level THEN true ELSE false END as is_low_stock,
                COALESCE(movements.total_in, 0) as total_stock_in,
                COALESCE(movements.total_out, 0) as total_stock_out,
                COALESCE(movements.net_movement, 0) as net_movement
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN (
                SELECT 
                    product_id,
                    SUM(CASE WHEN type IN ('purchase', 'return') THEN ABS(quantity_change) ELSE 0 END) as total_in,
                    SUM(CASE WHEN type IN ('sale') THEN ABS(quantity_change) ELSE 0 END) as total_out,
                    SUM(quantity_change) as net_movement
                FROM inventory_logs il
                WHERE 1=1 ${dateFilter}
                GROUP BY product_id
            ) movements ON p.id = movements.product_id
            ${whereClause}
            ORDER BY p.name
        `;

        const result = await db.query(summaryQuery, queryParams);

        // Calculate totals
        const totals = result.rows.reduce((acc, product) => {
            acc.totalProducts += 1;
            acc.totalValue += parseFloat(product.total_value || 0);
            acc.lowStockCount += product.is_low_stock ? 1 : 0;
            acc.outOfStockCount += product.quantity === 0 ? 1 : 0;
            return acc;
        }, {
            totalProducts: 0,
            totalValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0
        });

        const reportData = {
            summary: totals,
            products: result.rows,
            generatedAt: new Date().toISOString(),
            filters: {
                startDate,
                endDate,
                categoryId,
                departmentId: user.role === 'staff' ? user.department_id : departmentId
            }
        };

        if (format === 'pdf') {
            // Generate PDF report
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=inventory-summary.pdf');
            doc.pipe(res);

            // PDF Header
            doc.fontSize(20).text('SmartStock Inventory Summary Report', 50, 50);
            doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
            
            if (startDate && endDate) {
                doc.text(`Period: ${startDate} to ${endDate}`, 50, 95);
            }

            // Summary section
            doc.fontSize(16).text('Summary', 50, 130);
            doc.fontSize(12)
               .text(`Total Products: ${totals.totalProducts}`, 50, 155)
               .text(`Total Inventory Value: $${totals.totalValue.toFixed(2)}`, 50, 170)
               .text(`Low Stock Products: ${totals.lowStockCount}`, 50, 185)
               .text(`Out of Stock Products: ${totals.outOfStockCount}`, 50, 200);

            // Products table header
            let yPosition = 240;
            doc.fontSize(14).text('Product Details', 50, yPosition);
            yPosition += 20;

            doc.fontSize(10)
               .text('Name', 50, yPosition)
               .text('SKU', 150, yPosition)
               .text('Qty', 200, yPosition)
               .text('Price', 230, yPosition)
               .text('Value', 270, yPosition)
               .text('Category', 320, yPosition)
               .text('Status', 400, yPosition);

            yPosition += 15;
            doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
            yPosition += 10;

            // Products data
            result.rows.forEach(product => {
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50;
                }

                const status = product.quantity === 0 ? 'Out of Stock' : product.is_low_stock ? 'Low Stock' : 'In Stock';
                
                doc.text(product.name.substring(0, 15), 50, yPosition)
                   .text(product.sku, 150, yPosition)
                   .text(product.quantity.toString(), 200, yPosition)
                   .text(`$${product.unit_price}`, 230, yPosition)
                   .text(`$${product.total_value.toFixed(2)}`, 270, yPosition)
                   .text(product.category_name || 'N/A', 320, yPosition)
                   .text(status, 400, yPosition);

                yPosition += 15;
            });

            doc.end();
        } else {
            res.json(reportData);
        }
    } catch (error) {
        console.error('Inventory summary report error:', error);
        res.status(500).json({ error: 'Failed to generate inventory summary report' });
    }
});

// @route   GET /api/reports/low-stock
// @desc    Get low stock report
// @access  Private
router.get('/low-stock', authenticateToken, async (req, res) => {
    try {
        const { format = 'json' } = req.query;

        const result = await db.query(`
            SELECT p.*, c.name as category_name,
                   (p.minimum_stock_level - p.quantity_in_stock) as units_needed,
                   CASE 
                     WHEN p.minimum_stock_level > 0 THEN (p.quantity_in_stock * 100.0 / p.minimum_stock_level)
                     ELSE 0 
                   END as stock_percentage
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.quantity_in_stock <= p.minimum_stock_level AND p.is_active = true
            ORDER BY p.quantity_in_stock ASC, p.name
        `);

        const reportData = {
            lowStockProducts: result.rows,
            totalCount: result.rows.length,
            generatedAt: new Date().toISOString()
        };

        if (format === 'pdf') {
            // Generate PDF report
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=low-stock-report.pdf');
            doc.pipe(res);

            doc.fontSize(20).text('SmartStock Low Stock Report', 50, 50);
            doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
            doc.text(`Total Low Stock Products: ${result.rows.length}`, 50, 95);

            let yPosition = 130;
            doc.fontSize(10)
               .text('Product', 50, yPosition)
               .text('SKU', 150, yPosition)
               .text('Current', 200, yPosition)
               .text('Threshold', 250, yPosition)
               .text('Needed', 300, yPosition)
               .text('%', 340, yPosition)
               .text('Category', 370, yPosition);

            yPosition += 15;
            doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
            yPosition += 10;

            result.rows.forEach(product => {
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50;
                }

                doc.text(product.name.substring(0, 15), 50, yPosition)
                   .text(product.sku, 150, yPosition)
                   .text(product.quantity.toString(), 200, yPosition)
                   .text(product.low_stock_threshold.toString(), 250, yPosition)
                   .text(product.units_needed.toString(), 300, yPosition)
                   .text(`${product.stock_percentage}%`, 340, yPosition)
                   .text(product.category_name || 'N/A', 370, yPosition);

                yPosition += 15;
            });

            doc.end();
        } else {
            res.json(reportData);
        }
    } catch (error) {
        console.error('Low stock report error:', error);
        res.status(500).json({ error: 'Failed to generate low stock report' });
    }
});

// @route   GET /api/reports/inventory-movements
// @desc    Get inventory movements report
// @access  Private
router.get('/inventory-movements', authenticateToken, async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            productId, 
            changeType, 
            userId,
            format = 'json',
            page = 1,
            limit = 100
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ['1=1'];
        let queryParams = [];
        let paramIndex = 1;

        // Date filter
        if (startDate && endDate) {
            whereConditions.push(`il.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
            queryParams.push(startDate, endDate);
            paramIndex += 2;
        }

        // Product filter
        if (productId) {
            whereConditions.push(`il.product_id = $${paramIndex}`);
            queryParams.push(productId);
            paramIndex++;
        }

        // Change type filter
        if (changeType) {
            whereConditions.push(`il.type = $${paramIndex}`);
            queryParams.push(changeType);
            paramIndex++;
        }

        // User filter
        if (userId) {
            whereConditions.push(`il.user_id = $${paramIndex}`);
            queryParams.push(userId);
            paramIndex++;
        }

        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

        const result = await db.query(`
            SELECT il.*, p.name as product_name, p.sku, u.name as user_name
            FROM inventory_logs il
            JOIN products p ON il.product_id = p.id
            JOIN users u ON il.user_id = u.id
            ${whereClause}
            ORDER BY il.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, [...queryParams, limit, offset]);

        const countResult = await db.query(`
            SELECT COUNT(*) as total
            FROM inventory_logs il
            JOIN products p ON il.product_id = p.id
            JOIN users u ON il.user_id = u.id
            ${whereClause}
        `, queryParams);

        const reportData = {
            movements: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit)
            },
            generatedAt: new Date().toISOString(),
            filters: {
                startDate,
                endDate,
                productId,
                changeType,
                userId
            }
        };

        res.json(reportData);
    } catch (error) {
        console.error('Inventory movements report error:', error);
        res.status(500).json({ error: 'Failed to generate inventory movements report' });
    }
});

// @route   GET /api/reports/activity-logs
// @desc    Get activity logs report (Manager only)
// @access  Private (Manager only)
router.get('/activity-logs', authenticateToken, requireManager, async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            userId, 
            action,
            entityType,
            page = 1,
            limit = 100
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ['1=1'];
        let queryParams = [];
        let paramIndex = 1;

        // Date filter
        if (startDate && endDate) {
            whereConditions.push(`al.timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
            queryParams.push(startDate, endDate);
            paramIndex += 2;
        }

        // User filter
        if (userId) {
            whereConditions.push(`al.user_id = $${paramIndex}`);
            queryParams.push(userId);
            paramIndex++;
        }

        // Action filter
        if (action) {
            whereConditions.push(`al.action = $${paramIndex}`);
            queryParams.push(action);
            paramIndex++;
        }

        // Entity type filter
        if (entityType) {
            whereConditions.push(`al.entity_type = $${paramIndex}`);
            queryParams.push(entityType);
            paramIndex++;
        }

        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

        const result = await db.query(`
            SELECT al.*, u.name as user_name, u.email as user_email
            FROM activity_logs al
            JOIN users u ON al.user_id = u.id
            ${whereClause}
            ORDER BY al.timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, [...queryParams, limit, offset]);

        const countResult = await db.query(`
            SELECT COUNT(*) as total
            FROM activity_logs al
            JOIN users u ON al.user_id = u.id
            ${whereClause}
        `, queryParams);

        res.json({
            activities: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit)
            },
            generatedAt: new Date().toISOString(),
            filters: {
                startDate,
                endDate,
                userId,
                action,
                entityType
            }
        });
    } catch (error) {
        console.error('Activity logs report error:', error);
        res.status(500).json({ error: 'Failed to generate activity logs report' });
    }
});

// @route   GET /api/reports/sales-summary
// @desc    Get sales summary report
// @access  Private
router.get('/sales-summary', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, period = '30' } = req.query;
        
        let dateFilter = '';
        let queryParams = [];
        let paramIndex = 1;

        if (startDate && endDate) {
            dateFilter = `WHERE il.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            queryParams.push(startDate, endDate);
            paramIndex += 2;
        } else {
            dateFilter = `WHERE il.created_at >= NOW() - INTERVAL '${parseInt(period)} days'`;
        }

        // Get sales data
        const salesQuery = `
            SELECT 
                COUNT(*) as total_sales,
                SUM(ABS(il.quantity_change)) as total_units_sold,
                SUM(ABS(il.quantity_change) * p.price) as total_revenue
            FROM inventory_logs il
            JOIN products p ON il.product_id = p.id
            ${dateFilter}
            AND il.type = 'sale'
        `;

        const topProductsQuery = `
            SELECT 
                p.name,
                p.sku,
                SUM(ABS(il.quantity_change)) as total_sold,
                SUM(ABS(il.quantity_change) * p.price) as revenue
            FROM inventory_logs il
            JOIN products p ON il.product_id = p.id
            ${dateFilter}
            AND il.type = 'sale'
            GROUP BY p.id, p.name, p.sku, p.price
            ORDER BY total_sold DESC
            LIMIT 10
        `;

        const categoryQuery = `
            SELECT 
                c.name as category_name,
                SUM(ABS(il.quantity_change)) as total_sold,
                SUM(ABS(il.quantity_change) * p.price) as revenue
            FROM inventory_logs il
            JOIN products p ON il.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            ${dateFilter}
            AND il.type = 'sale'
            GROUP BY c.id, c.name
            ORDER BY total_sold DESC
        `;

        const salesResult = await db.query(salesQuery, queryParams);
        const topProductsResult = await db.query(topProductsQuery, queryParams);
        const categoryResult = await db.query(categoryQuery, queryParams);

        const reportData = {
            period: `Last ${period} days`,
            totalSales: parseInt(salesResult.rows[0]?.total_sales || 0),
            totalUnitsSold: parseInt(salesResult.rows[0]?.total_units_sold || 0),
            totalRevenue: parseFloat(salesResult.rows[0]?.total_revenue || 0),
            topProducts: topProductsResult.rows,
            salesByCategory: categoryResult.rows,
            generatedAt: new Date().toISOString()
        };

        res.json(reportData);
    } catch (error) {
        console.error('Sales summary error:', error);
        res.status(500).json({ message: 'Failed to fetch sales summary' });
    }
});

module.exports = router;
