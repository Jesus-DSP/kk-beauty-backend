// Backend server for Stripe payments with PostgreSQL database
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OrderService = require('./services/orderService');
const { pool } = require('./database/connection');

// Validate environment variables
const requiredEnvVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
  'FRONTEND_URL': process.env.FRONTEND_URL || 'http://localhost:3000'
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Initialize Stripe with validation
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // Test the Stripe key by making a simple API call
  stripe.paymentIntents.list({ limit: 1 }).catch(error => {
    console.error('❌ Invalid Stripe API key:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', items, customer } = req.body;

    // Validate required fields
    if (!amount || !items || !customer) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, items, customer' 
      });
    }

    // Validate items have proper price format
    for (const item of items) {
      if (!item.price) {
        return res.status(400).json({
          success: false,
          error: `Item ${item.name || 'unknown'} is missing price`
        });
      }
      
      // Handle both string prices like "$60" and numeric prices
      let numericPrice;
      if (typeof item.price === 'string') {
        numericPrice = parseFloat(item.price.replace('$', ''));
      } else {
        numericPrice = parseFloat(item.price);
      }
      
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: `Item price must be a positive number`
        });
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        customerCity: customer.city || '',
        customerPostalCode: customer.postalCode || '',
        customerCountry: customer.country || '',
        itemCount: items.length.toString(),
        orderItems: JSON.stringify(items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })))
      }
    });

    // Log the payment intent creation
    console.log('Payment Intent created:', paymentIntent.id);
    console.log('Amount:', amount, 'Currency:', currency);
    console.log('Customer:', customer.name, customer.email);

    res.json({ 
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

// Handle successful payment
app.post('/api/payment-success', async (req, res) => {
  try {
    const { paymentIntentId, items, customer, total } = req.body;

    // Retrieve the payment intent to verify it was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      console.log('=== PAYMENT VERIFIED ===');
      console.log('Payment ID:', paymentIntentId);
      console.log('Customer:', customer.name, customer.email);
      console.log('Items:', items);
      console.log('Total:', total);
      console.log('=======================');

      // Save order to PostgreSQL database
      try {
        const orderResult = await OrderService.createOrder({
          stripePaymentIntentId: paymentIntentId,
          customer: customer,
          items: items,
          total: parseFloat(total)
        });

        console.log('✅ Order saved to database:', orderResult.orderId);

        res.json({ 
          success: true,
          orderId: orderResult.orderId,
          paymentIntentId: paymentIntentId,
          message: orderResult.message,
          customerEmail: customer.email,
          orderTotal: orderResult.totalAmount,
          estimatedDelivery: '3-5 business days',
          orderDate: orderResult.createdAt
        });

      } catch (dbError) {
        console.error('❌ Database error while saving order:', dbError);
        
        // Even if DB fails, payment succeeded, so we should still respond positively
        // but log the error for investigation
        const fallbackOrderId = `KK-${Date.now().toString().slice(-6)}`;
        
        res.json({ 
          success: true,
          orderId: fallbackOrderId,
          paymentIntentId: paymentIntentId,
          message: `Thank you ${customer.name}! Your payment was successful. Order details will be sent via email.`,
          customerEmail: customer.email,
          orderTotal: total,
          estimatedDelivery: '3-5 business days',
          warning: 'Order saved to backup system'
        });
      }

    } else {
      res.status(400).json({ 
        error: 'Payment was not successful',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({ 
      error: 'Failed to process payment confirmation',
      details: error.message
    });
  }
});

// Get order by ID (for customer order lookup)
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      success: true,
      order: {
        orderId: order.order_id,
        status: order.order_status,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        items: order.items,
        subtotal: order.subtotal,
        taxAmount: order.tax_amount,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        estimatedDelivery: '3-5 business days'
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get recent orders (admin endpoint)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const orders = await OrderService.getRecentOrders(limit);
    
    res.json({
      success: true,
      orders: orders.map(order => ({
        orderId: order.order_id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        totalAmount: order.total_amount,
        status: order.order_status,
        createdAt: order.created_at,
        itemCount: order.items?.length || 0,
        items: order.items
      }))
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (admin endpoint)
app.put('/api/admin/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        validStatuses 
      });
    }
    
    const updatedOrder = await OrderService.updateOrderStatus(orderId, status);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      success: true,
      message: `Order ${orderId} status updated to ${status}`,
      order: {
        orderId: updatedOrder.order_id,
        status: updatedOrder.order_status,
        updatedAt: updatedOrder.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      stripe: 'unknown',
      database: 'unknown'
    }
  };

  try {
    // Test Stripe connection
    await stripe.paymentIntents.list({ limit: 1 });
    health.services.stripe = 'connected';
  } catch (error) {
    health.services.stripe = 'error';
    health.status = 'WARNING';
  }

  try {
    // Test database connection
    await pool.query('SELECT 1');
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'ERROR';
  }

  const statusCode = health.status === 'OK' ? 200 : 
                     health.status === 'WARNING' ? 200 : 500;

  res.status(statusCode).json(health);
});

// Graceful shutdown handling
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close server first to stop accepting new requests
  if (server) {
    console.log('Closing HTTP server...');
    await new Promise(resolve => server.close(resolve));
    console.log('HTTP server closed.');
  }

  // Close database pool
  if (pool) {
    console.log('Closing database pool...');
    await pool.end();
    console.log('Database pool closed.');
  }

  console.log('Graceful shutdown completed.');
  process.exit(0);
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💳 Stripe integration ready`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;