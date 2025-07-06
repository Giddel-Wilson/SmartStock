require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
    try {
        console.log('🚀 Starting database migration...');
        
        // Read and execute schema migration
        const schemaSQL = fs.readFileSync(
            path.join(__dirname, '001_initial_schema.sql'),
            'utf8'
        );
        
        console.log('📋 Creating database schema...');
        await pool.query(schemaSQL);
        console.log('✅ Database schema created successfully');
        
        // Read and execute seed data
        const seedSQL = fs.readFileSync(
            path.join(__dirname, '002_seed_data.sql'),
            'utf8'
        );
        
        console.log('🌱 Seeding initial data...');
        await pool.query(seedSQL);
        console.log('✅ Initial data seeded successfully');
        
        console.log('🎉 Database migration completed successfully!');
        
        // Test the connection with a simple query
        const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
        console.log(`👥 Database now contains ${result.rows[0].user_count} users`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('Migration completed. Exiting...');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigrations };
