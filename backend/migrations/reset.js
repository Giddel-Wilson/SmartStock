require('dotenv').config();
const pool = require('../config/database');

async function resetDatabase() {
    try {
        console.log('🧹 Resetting database...');
        
        // Drop all existing tables
        const dropSQL = `
            DROP TABLE IF EXISTS activity_logs CASCADE;
            DROP TABLE IF EXISTS inventory_logs CASCADE;
            DROP TABLE IF EXISTS refresh_tokens CASCADE;
            DROP TABLE IF EXISTS stock_alerts CASCADE;
            DROP TABLE IF EXISTS products CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS categories CASCADE;
            DROP TABLE IF EXISTS departments CASCADE;
            
            -- Drop the trigger function if it exists
            DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
        `;
        
        console.log('🗑️ Dropping existing tables...');
        await pool.query(dropSQL);
        console.log('✅ Existing tables dropped successfully');
        
        console.log('🎉 Database reset completed!');
        
    } catch (error) {
        console.error('❌ Reset failed:', error);
        throw error;
    }
}

// Run reset if this file is executed directly
if (require.main === module) {
    resetDatabase()
        .then(() => {
            console.log('Reset completed. Exiting...');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Reset failed:', error);
            process.exit(1);
        });
}

module.exports = { resetDatabase };
