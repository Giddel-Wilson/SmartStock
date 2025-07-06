const db = require('../config/database');

const createTables = async () => {
    try {
        // Enable UUID extension
        await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Create departments table
        await db.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create users table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'staff')),
                department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create categories table
        await db.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create products table
        await db.query(`
            CREATE TABLE IF NOT EXISTS products (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(200) NOT NULL,
                sku VARCHAR(100) NOT NULL UNIQUE,
                category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
                unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
                low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
                supplier VARCHAR(200),
                description TEXT,
                image_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create inventory_logs table
        await db.query(`
            CREATE TABLE IF NOT EXISTS inventory_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('restock', 'sale', 'adjustment', 'return')),
                quantity_changed INTEGER NOT NULL,
                quantity_before INTEGER NOT NULL,
                quantity_after INTEGER NOT NULL,
                reason TEXT,
                reference_number VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create stock_alerts table
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_alerts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                alert_type VARCHAR(20) NOT NULL DEFAULT 'low_stock',
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                alert_sent BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create activity_logs table
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id UUID,
                details JSONB,
                ip_address INET,
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create refresh_tokens table
        await db.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                revoked_at TIMESTAMP
            )
        `);

        // Create indexes for better performance
        await db.query('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_inventory_logs_timestamp ON inventory_logs(timestamp)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp)');

        // Create triggers for updated_at columns
        await db.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        const tables = ['departments', 'users', 'categories', 'products'];
        for (const table of tables) {
            await db.query(`
                DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
                CREATE TRIGGER update_${table}_updated_at 
                    BEFORE UPDATE ON ${table} 
                    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
            `);
        }

        console.log('✅ Database tables created successfully');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
};

module.exports = { createTables };
