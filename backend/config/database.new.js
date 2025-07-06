const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection
pool.on('connect', () => {
    console.log('🔗 Connected to Neon PostgreSQL database');
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection function
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Database connection successful');
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        return false;
    }
}

// Export the pool and test function
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    testConnection
};
