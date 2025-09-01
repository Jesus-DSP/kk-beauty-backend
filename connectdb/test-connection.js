require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing environment variables!');
    console.error('Please make sure you have set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        // Try to check the orders table structure
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .limit(1);

        if (ordersError) throw ordersError;

        // Also check order_items table
        const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('id')
            .limit(1);

        if (itemsError) throw itemsError;

        console.log('✅ Successfully connected to Supabase!');
        console.log('\nDatabase Schema Verification:');
        console.log('- ✓ orders table is accessible');
        console.log('- ✓ order_items table is accessible');
        console.log('\nConnection details:');
        console.log(`URL: ${supabaseUrl}`);
        console.log('Status: Connected and authenticated');
        
        // Show table counts
        const { count: ordersCount, error: countError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (!countError) {
            console.log(`\nCurrent data:`);
            console.log(`- Orders in database: ${ordersCount || 0}`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to Supabase!');
        console.error('Error details:', error.message);
        
        // Try to get table information to help diagnose the issue
        try {
            const { data: tables, error: tablesError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .limit(5);

            if (!tablesError && tables) {
                console.log('\nAvailable public tables:');
                tables.forEach(t => console.log(`- ${t.table_name}`));
            }
        } catch (e) {
            // Ignore secondary errors
        }

        console.error('\nConnection attempt details:');
        console.error('URL:', supabaseUrl);
        console.error('Auth: Using anon key (key length:', supabaseAnonKey?.length || 0, 'characters)');
        console.error('\nTroubleshooting tips:');
        console.error('1. Check if the schema has been applied (orders and order_items tables should exist)');
        console.error('2. Verify Row Level Security (RLS) policies are correctly set');
        console.error('3. Confirm the anon key has the necessary permissions');
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