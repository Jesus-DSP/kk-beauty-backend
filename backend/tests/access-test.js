require('dotenv').config();
const axios = require('axios');

// Get the backend URL from environment or use default
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function runTests() {
    console.log('🚀 Starting Backend Access Tests');
    console.log('================================');
    console.log('Testing URL:', BACKEND_URL);
    
    const tests = [
        testHealthEndpoint,
        testDatabaseConnection,
        testStripeConnection,
        testOrdersEndpoint
    ];

    for (const test of tests) {
        try {
            await test();
        } catch (error) {
            console.error(`❌ ${test.name} failed:`, error.message);
        }
    }
}

async function testHealthEndpoint() {
    console.log('\n🔍 Testing Health Endpoint...');
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Health Check Response:', response.data);
}

async function testDatabaseConnection() {
    console.log('\n🔍 Testing Database Connection...');
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    if (response.data.services.database === 'connected') {
        console.log('✅ Database Connection: SUCCESS');
    } else {
        throw new Error('Database not connected');
    }
}

async function testStripeConnection() {
    console.log('\n🔍 Testing Stripe Connection...');
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    if (response.data.services.stripe === 'connected') {
        console.log('✅ Stripe Connection: SUCCESS');
    } else {
        throw new Error('Stripe not connected');
    }
}

async function testOrdersEndpoint() {
    console.log('\n🔍 Testing Orders Endpoint...');
    try {
        const response = await axios.get(`${BACKEND_URL}/api/admin/orders?limit=1`);
        console.log('✅ Orders Endpoint: SUCCESS');
        console.log(`📊 Found ${response.data.orders.length} orders`);
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('ℹ️ Orders endpoint returned no orders (this might be normal for a new database)');
        } else {
            throw error;
        }
    }
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});
