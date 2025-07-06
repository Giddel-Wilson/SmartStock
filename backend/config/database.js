const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000, // 10 second timeout
    idleTimeoutMillis: 30000,
    max: 20
});

// Test the connection
pool.on('connect', () => {
    console.log('🔗 Connected to Neon PostgreSQL database');
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit immediately, just log the error
});

// Test connection function
async function testConnection() {
    try {
        console.log('Testing database connection...');
        const client = await pool.connect();
        console.log('✅ Database connection successful');
        await client.query('SELECT 1'); // Simple test query
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
}

// Export the pool and test function
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    testConnection
};
