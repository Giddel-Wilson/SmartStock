const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://smartStockDB_owner:npg_gKjqw6TIOWD3@ep-restless-smoke-a8vwal2f-pooler.eastus2.azure.neon.tech/smartStockDB?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'products\' AND column_name = \'department_id\'')
    .then(result => {
        console.log('Column check result:', result.rows);
        if (result.rows.length === 0) {
            console.log('Adding department_id column...');
            return pool.query('ALTER TABLE products ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL');
        } else {
            console.log('department_id column already exists');
        }
    })
    .then(() => {
        console.log('Migration completed');
        return pool.end();
    })
    .catch(err => {
        console.error('Error:', err);
        pool.end();
    });
