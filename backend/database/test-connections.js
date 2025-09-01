require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testDirectConnection() {
    console.log('\n🔍 Testing Direct PostgreSQL Connection...');
    
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        family: 4 // Force IPv4
    });

    try {
        const client = await pool.connect();
        console.log('✅ Direct PostgreSQL Connection: SUCCESS');
        
        // Test query
        const result = await client.query('SELECT COUNT(*) FROM orders');
        console.log(`📊 Orders count: ${result.rows[0].count}`);
        
        // Get version
        const versionResult = await client.query('SELECT version()');
        console.log(`📌 PostgreSQL version: ${versionResult.rows[0].version.split(' ')[1]}`);
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.error('❌ Direct PostgreSQL Connection: FAILED');
        console.error('Error:', error.message);
        if (error.message.includes('getaddrinfo')) {
            console.error('💡 Hint: This might be an IPv6 connectivity issue');
        }
        return false;
    }
}

async function testSupabaseConnection() {
    console.log('\n🔍 Testing Supabase Client Connection...');
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Missing Supabase credentials in .env file');
        return false;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Test query
        const { data, error } = await supabase
            .from('orders')
            .select('count')
            .limit(1);

        if (error) throw error;

        console.log('✅ Supabase Client Connection: SUCCESS');
        return true;
    } catch (error) {
        console.error('❌ Supabase Client Connection: FAILED');
        console.error('Error:', error.message);
        return false;
    }
}

// Run both tests
async function runTests() {
    console.log('🚀 Starting Database Connection Tests');
    console.log('=====================================');
    
    // Test environment variables
    console.log('\n📋 Environment Check:');
    console.log('- DATABASE_URL:', DATABASE_URL ? '✓ Set' : '✗ Missing');
    console.log('- SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing');
    console.log('- SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');

    // Run tests
    const directResult = await testDirectConnection();
    const supabaseResult = await testSupabaseConnection();

    // Summary
    console.log('\n📝 Test Summary:');
    console.log('=====================================');
    console.log('Direct PostgreSQL:', directResult ? '✅ WORKING' : '❌ FAILED');
    console.log('Supabase Client:', supabaseResult ? '✅ WORKING' : '❌ FAILED');
    
    if (!directResult && supabaseResult) {
        console.log('\n💡 Recommendation: Use the Supabase client method instead of direct connection');
    }
}

runTests().catch(console.error);
