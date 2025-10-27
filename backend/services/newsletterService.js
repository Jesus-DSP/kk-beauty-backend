const { pool } = require('../database/connection');

class NewsletterService {
  static async subscribe(email) {
    try {
      const result = await pool.query(
        `INSERT INTO newsletter_subscriptions (email) 
         VALUES ($1) 
         ON CONFLICT (email) 
         DO UPDATE SET is_active = true, subscribed_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [email]
      );

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
        subscription: result.rows[0]
      };
    } catch (error) {
      console.error('Error in newsletter subscription:', error);
      throw error;
    }
  }

  static async unsubscribe(email) {
    try {
      const result = await pool.query(
        `UPDATE newsletter_subscriptions 
         SET is_active = false 
         WHERE email = $1 
         RETURNING *`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Email not found in subscription list');
      }

      return {
        success: true,
        message: 'Successfully unsubscribed from newsletter'
      };
    } catch (error) {
      console.error('Error in newsletter unsubscription:', error);
      throw error;
    }
  }
}

module.exports = NewsletterService;
