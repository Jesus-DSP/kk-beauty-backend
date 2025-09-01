require('dotenv').config();
const { Pool } = require('pg');

// Get environment variable
const DATABASE_URL = process.env.DATABASE_URL;

// Validate environment variable
if (!DATABASE_URL) {
    console.error('Error: Missing DATABASE_URL environment variable!');
    console.error('Please make sure you have set DATABASE_URL in your .env file');
    process.exit(1);
}

async function testConnection() {
    // Configure connection pool with all possible options to help with connection
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000, // Increased timeout
        // Try to force IPv4
        family: 4
    });

    try {
        // Try to connect and check the tables
        const client = await pool.connect();
        
        console.log('✅ Successfully connected to PostgreSQL!');
        
        // Test query to check orders table
        const ordersResult = await client.query('SELECT COUNT(*) FROM orders');
        console.log(`\nDatabase Status:`);
        console.log(`- Orders in database: ${ordersResult.rows[0].count}`);
        
        // Get PostgreSQL version
        const versionResult = await client.query('SELECT version()');
        console.log(`- PostgreSQL version: ${versionResult.rows[0].version.split(' ')[1]}`);
        
        // Show connection details (masking password)
        const connectionDetails = DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
        console.log('\nConnection details:');
        console.log(`URL: ${connectionDetails}`);
        console.log('SSL: Enabled');
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL!');
        console.error('Error details:', error.message);
        console.error('\nConnection attempt details:');
        
        // Parse and display connection info (safely)
        try {
            const urlParts = new URL(DATABASE_URL);
            console.error('Host:', urlParts.hostname);
            console.error('Port:', urlParts.port || '5432');
            console.error('Database:', urlParts.pathname.slice(1));
            console.error('User:', urlParts.username);
            console.error('SSL: Enabled');
        } catch (e) {
            console.error('Could not parse DATABASE_URL');
        }
        
        return false;
    }
}

// Run the test
testConnection()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
