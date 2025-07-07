require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runDepartmentMigration() {
    try {
        console.log('Running department migration...');
        
        // Check if department_id column already exists
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'department_id'
        `);
        
        if (checkResult.rows.length > 0) {
            console.log('department_id column already exists');
            return;
        }
        
        // Read and execute migration
        const migrationSQL = fs.readFileSync('./migrations/003_add_product_departments.sql', 'utf8');
        await pool.query(migrationSQL);
        
        console.log('Department migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

runDepartmentMigration()
    .then(() => {
        console.log('✅ Migration script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
    });
