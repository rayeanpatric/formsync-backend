# Deploying to Vercel

This document provides comprehensive instructions for deploying this application to Vercel.

## Prerequisites

Before you begin, you need:

1. A [Vercel account](https://vercel.com/signup)
2. A GitHub repository with your code
3. A PostgreSQL database (we recommend [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or any other PostgreSQL provider)

## Step 1: Prepare Your Database

1. Set up a PostgreSQL database with your preferred provider
2. Make note of the connection string (usually in the format `postgresql://username:password@hostname:port/database?sslmode=require`)
3. Ensure the database is accessible from the internet (Vercel needs to connect to it)

## Step 2: Connect Your Repository to Vercel

1. Log in to [Vercel](https://vercel.com/)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Configure the project settings:
   - **Framework Preset**: None (or select Node.js if available)
   - **Build Command**: `npm run vercel-build` (this will run Prisma generate and db push)
   - **Output Directory**: `./`
   - **Install Command**: `npm install`

## Step 3: Set Environment Variables

In the Vercel project settings, add the following environment variables:

- **DATABASE_URL**: Your PostgreSQL connection string
- **PORT**: 3000
- **NODE_ENV**: production

## Step 4: Deploy

Click "Deploy" and wait for the build process to complete.

## Troubleshooting

### Database Connection Issues

If you see errors related to the database connection:

1. Check that your DATABASE_URL is correctly formatted (must start with `postgresql://`)
2. Ensure your database is accessible from the internet
3. Check if your database provider requires special SSL settings

### Prisma Issues

If you encounter Prisma-related errors:

1. Try manually running a deployment with the following command in Vercel:
   ```
   npx prisma generate && npx prisma db push && npm start
   ```

### Socket.IO Issues

If real-time features aren't working:

1. Check that your Vercel deployment is using the correct WebSocket protocol (wss://)
2. Ensure the client is properly connecting to the Vercel URL

## Updating Your Deployment

Any push to your main branch will trigger a new deployment. If you need to update environment variables or other settings, do so in the Vercel project dashboard.
