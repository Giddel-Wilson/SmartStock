const bcrypt = require('bcryptjs');
const { createTables } = require('./migrate');
const db = require('../config/database');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // First create tables
        await createTables();

        // Create default departments
        console.log('Creating departments...');
        const departments = [
            { name: 'Warehouse', description: 'Inventory and stock management' },
            { name: 'Sales', description: 'Sales team and customer relations' },
            { name: 'Logistics', description: 'Shipping and receiving' },
            { name: 'Management', description: 'Executive and administrative staff' }
        ];

        const createdDepartments = {};
        for (const dept of departments) {
            const result = await db.query(`
                INSERT INTO departments (name, description)
                VALUES ($1, $2)
                ON CONFLICT (name) DO UPDATE SET description = $2
                RETURNING id, name
            `, [dept.name, dept.description]);
            createdDepartments[dept.name] = result.rows[0].id;
        }

        // Create default admin user
        console.log('Creating default admin user...');
        const adminPassword = process.env.ADMIN_PASSWORD || 'SecurePassword123!';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartstock.com';
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        await db.query(`
            INSERT INTO users (name, email, password_hash, role, department_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO UPDATE SET 
                name = $1,
                password_hash = $3,
                role = $4,
                department_id = $5
        `, ['Admin User', adminEmail, hashedPassword, 'manager', createdDepartments.Management]);

        // Create sample staff users
        console.log('Creating sample staff users...');
        const staffUsers = [
            { name: 'John Warehouse', email: 'john@smartstock.com', department: 'Warehouse', role: 'staff' },
            { name: 'Sarah Sales', email: 'sarah@smartstock.com', department: 'Sales', role: 'staff' },
            { name: 'Mike Logistics', email: 'mike@smartstock.com', department: 'Logistics', role: 'staff' },
            { name: 'Emma Manager', email: 'emma@smartstock.com', department: 'Management', role: 'manager' }
        ];

        const defaultPassword = await bcrypt.hash('password123', 12);
        for (const user of staffUsers) {
            await db.query(`
                INSERT INTO users (name, email, password_hash, role, department_id, phone)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (email) DO NOTHING
            `, [
                user.name, 
                user.email, 
                defaultPassword, 
                user.role, 
                createdDepartments[user.department],
                '+1-555-0' + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            ]);
        }

        // Create categories
        console.log('Creating product categories...');
        const categories = [
            { name: 'Electronics', description: 'Electronic devices and accessories' },
            { name: 'Office Supplies', description: 'Office equipment and stationery' },
            { name: 'Tools', description: 'Hand tools and equipment' },
            { name: 'Furniture', description: 'Office and warehouse furniture' },
            { name: 'Safety Equipment', description: 'Safety gear and protective equipment' }
        ];

        const createdCategories = {};
        for (const category of categories) {
            const result = await db.query(`
                INSERT INTO categories (name, description)
                VALUES ($1, $2)
                ON CONFLICT (name) DO UPDATE SET description = $2
                RETURNING id, name
            `, [category.name, category.description]);
            createdCategories[category.name] = result.rows[0].id;
        }

        // Create sample products
        console.log('Creating sample products...');
        const products = [
            // Electronics
            { name: 'Laptop Computer', sku: 'ELEC-LAP-001', category: 'Electronics', quantity: 25, unitPrice: 899.99, lowStockThreshold: 5, supplier: 'Tech Corp' },
            { name: 'Wireless Mouse', sku: 'ELEC-MOU-001', category: 'Electronics', quantity: 3, unitPrice: 29.99, lowStockThreshold: 10, supplier: 'Tech Corp' },
            { name: 'USB Keyboard', sku: 'ELEC-KEY-001', category: 'Electronics', quantity: 8, unitPrice: 59.99, lowStockThreshold: 15, supplier: 'Tech Corp' },
            
            // Office Supplies
            { name: 'A4 Copy Paper', sku: 'OFF-PAP-001', category: 'Office Supplies', quantity: 2, unitPrice: 4.99, lowStockThreshold: 20, supplier: 'Office Max' },
            { name: 'Blue Pens (Pack of 10)', sku: 'OFF-PEN-001', category: 'Office Supplies', quantity: 45, unitPrice: 12.99, lowStockThreshold: 10, supplier: 'Office Max' },
            { name: 'Stapler', sku: 'OFF-STA-001', category: 'Office Supplies', quantity: 15, unitPrice: 24.99, lowStockThreshold: 5, supplier: 'Office Max' },
            
            // Tools
            { name: 'Screwdriver Set', sku: 'TOO-SCR-001', category: 'Tools', quantity: 12, unitPrice: 34.99, lowStockThreshold: 8, supplier: 'Tool World' },
            { name: 'Hammer', sku: 'TOO-HAM-001', category: 'Tools', quantity: 1, unitPrice: 18.99, lowStockThreshold: 5, supplier: 'Tool World' },
            
            // Furniture
            { name: 'Office Chair', sku: 'FUR-CHA-001', category: 'Furniture', quantity: 8, unitPrice: 199.99, lowStockThreshold: 3, supplier: 'Furniture Plus' },
            { name: 'Desk', sku: 'FUR-DES-001', category: 'Furniture', quantity: 5, unitPrice: 299.99, lowStockThreshold: 2, supplier: 'Furniture Plus' },
            
            // Safety Equipment
            { name: 'Safety Helmet', sku: 'SAF-HEL-001', category: 'Safety Equipment', quantity: 0, unitPrice: 45.99, lowStockThreshold: 10, supplier: 'Safety First' },
            { name: 'High-Vis Vest', sku: 'SAF-VES-001', category: 'Safety Equipment', quantity: 6, unitPrice: 19.99, lowStockThreshold: 15, supplier: 'Safety First' }
        ];

        for (const product of products) {
            await db.query(`
                INSERT INTO products (name, sku, category_id, quantity, unit_price, low_stock_threshold, supplier, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (sku) DO NOTHING
            `, [
                product.name,
                product.sku,
                createdCategories[product.category],
                product.quantity,
                product.unitPrice,
                product.lowStockThreshold,
                product.supplier,
                `Sample ${product.category.toLowerCase()} product for demonstration`
            ]);
        }

        // Get admin user for inventory logs
        const adminUser = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        const adminUserId = adminUser.rows[0].id;

        // Create initial inventory logs for products with stock
        console.log('Creating initial inventory logs...');
        const productsWithStock = await db.query('SELECT id, quantity, name FROM products WHERE quantity > 0');
        
        for (const product of productsWithStock.rows) {
            await db.query(`
                INSERT INTO inventory_logs (product_id, user_id, change_type, quantity_changed, quantity_before, quantity_after, reason)
                VALUES ($1, $2, 'restock', $3, 0, $3, 'Initial stock setup')
            `, [product.id, adminUserId, product.quantity]);
        }

        // Create stock alerts for low stock products
        console.log('Creating stock alerts for low stock products...');
        const lowStockProducts = await db.query(`
            SELECT p.id, p.name, p.sku, p.quantity, p.low_stock_threshold
            FROM products p
            WHERE p.quantity <= p.low_stock_threshold
        `);

        for (const product of lowStockProducts.rows) {
            const message = `Low stock alert: ${product.name} (SKU: ${product.sku}) has ${product.quantity} units remaining (threshold: ${product.low_stock_threshold})`;
            await db.query(`
                INSERT INTO stock_alerts (product_id, message)
                VALUES ($1, $2)
            `, [product.id, message]);
        }

        console.log('✅ Database seeding completed successfully!');
        console.log('');
        console.log('🔐 Default Admin Credentials:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('');
        console.log('👥 Sample Staff Credentials (password: password123):');
        staffUsers.forEach(user => {
            console.log(`   ${user.name}: ${user.email} (${user.role})`);
        });
        console.log('');
        console.log('📊 Sample data created:');
        console.log(`   - ${departments.length} departments`);
        console.log(`   - ${staffUsers.length + 1} users`);
        console.log(`   - ${categories.length} categories`);
        console.log(`   - ${products.length} products`);
        console.log(`   - Stock alerts for low inventory items`);

    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        throw error;
    } finally {
        await db.end();
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('🎉 Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
