# Railway Deployment Guide

This guide explains how to deploy the KK Beauty backend to Railway.

## Prerequisites

1. Have a [Railway account](https://railway.app)
2. Install the [Railway CLI](https://docs.railway.app/develop/cli)

## Environment Variables

Set these environment variables in your Railway project:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Application Configuration
NODE_ENV=production
PORT=$PORT  # Railway will set this automatically
FRONTEND_URL=https://your-frontend-domain.com
```

## Deployment Steps

1. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway Project**
   ```bash
   railway init
   ```

4. **Link Your Project**
   ```bash
   railway link
   ```

5. **Set Environment Variables**
   - Go to Railway Dashboard → Your Project → Variables
   - Add all required environment variables
   - Railway will automatically set PORT

6. **Deploy**
   ```bash
   railway up
   ```

## Important Notes

- Make sure you're in the `backend` directory when deploying
- The `railway.json` and `Procfile` must be in the backend directory
- All npm commands will run from the backend directory

## Monitoring & Logs

- View logs: `railway logs`
- Monitor status: Railway Dashboard → Your Project → Deployments
- Check metrics: Railway Dashboard → Your Project → Metrics

## Troubleshooting

1. **Connection Issues**
   - Verify DATABASE_URL is correct
   - Check Supabase firewall rules
   - Ensure all environment variables are set

2. **Build Failures**
   - Check build logs in Railway Dashboard
   - Verify package.json scripts
   - Check node version in package.json

3. **Runtime Errors**
   - Check application logs: `railway logs`
   - Verify environment variables
   - Check PORT configuration

## Automatic Deployments

Railway automatically deploys when you push to your GitHub repository. To set this up:

1. Connect your GitHub repository in Railway Dashboard
2. Set the root directory to `/backend` in the deployment settings
3. Enable automatic deployments
4. Configure branch rules if needed

## Best Practices

1. Always test locally before deploying
2. Use environment variables for configuration
3. Set appropriate node version in package.json
4. Monitor application logs after deployment
5. Set up health checks endpoint