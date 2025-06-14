# Deployment Guide - Fullstack Collaborative Form System

## Overview

This guide covers deploying the fullstack collaborative form system with:

- **Frontend**: Vercel (static hosting)
- **Backend**: Render (Node.js hosting)
- **Database**: Neon (PostgreSQL)
- **Cache/Redis**: Render Redis or Upstash

## Prerequisites

- GitHub repository with your code
- Vercel account
- Render account
- Neon account (for PostgreSQL)

## 1. Database Setup (Neon)

1. **Create Neon Database:**

   - Go to [Neon Console](https://console.neon.tech/)
   - Create a new project
   - Copy the connection string

2. **Connection String Format:**
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

## 2. Backend Deployment (Render)

1. **Create Web Service:**

   - Connect your GitHub repository
   - Choose "server" as the root directory
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Environment Variables:**

   ```
   DATABASE_URL=postgresql://your-neon-connection-string
   NODE_ENV=production
   PORT=3000
   CLIENT_URL=https://your-app.vercel.app
   REDIS_URL=redis://your-redis-url:port
   ```

3. **Add Redis:**
   - In Render dashboard, add Redis service
   - Or use external Redis (Upstash, Redis Cloud)
   - Update REDIS_URL environment variable

## 3. Frontend Deployment (Vercel)

1. **Import Project:**

   - Import from GitHub
   - Set root directory to "client"
   - Framework preset: "Other"

2. **Build Settings:**

   - Build Command: `npm run build`
   - Output Directory: (leave empty for static files)
   - Install Command: `npm install`

3. **Update Configuration:**
   - Edit `client/js/config.js`:
   ```javascript
   SERVER_URL: "https://your-backend.onrender.com";
   ```

## 4. Domain Configuration

### Custom Domains (Optional)

- **Vercel**: Add custom domain in project settings
- **Render**: Add custom domain in service settings
- **Update CORS**: Update CLIENT_URL in backend env vars

## 5. Database Migration

```bash
# After backend deployment, run database setup
# Via Render shell or locally with production DATABASE_URL

npx prisma generate
npx prisma db push
npx prisma db seed
```

## 6. Testing Deployment

1. **Backend Health Check:**

   ```
   GET https://your-backend.onrender.com/health
   ```

2. **Frontend Load:**

   ```
   https://your-app.vercel.app
   ```

3. **Socket.IO Connection:**
   - Check browser console for connection logs
   - Test real-time features

## 7. Environment Variables Summary

### Backend (Render)

```env
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-app.vercel.app
REDIS_URL=redis://...
```

### Frontend (Update config.js)

```javascript
SERVER_URL: "https://your-backend.onrender.com";
```

## 8. Monitoring & Logs

### Render Logs

- View logs in Render dashboard
- Monitor deployment status
- Check health endpoint

### Vercel Logs

- View function logs
- Monitor edge function performance
- Check deployment status

## 9. Scaling Considerations

### Redis Scaling

- Use Redis cluster for high availability
- Consider Redis Enterprise or AWS ElastiCache

### Database Scaling

- Neon auto-scales
- Consider read replicas for heavy read workloads

### CDN

- Vercel automatically provides CDN
- Consider additional CDN for API responses

## 10. Troubleshooting

### Common Issues

1. **CORS Errors:**

   - Verify CLIENT_URL in backend
   - Check cors configuration in server.js

2. **Database Connection:**

   - Verify DATABASE_URL format
   - Check firewall/security settings

3. **Socket.IO Issues:**

   - Verify WebSocket support
   - Check transport fallbacks

4. **Redis Connection:**
   - Verify REDIS_URL format
   - Check Redis service status

### Debug Commands

```bash
# Test database connection
node -e "require('./server/src/services/prismaService')"

# Test Redis connection
redis-cli -u $REDIS_URL ping

# Check API endpoints
curl https://your-backend.onrender.com/health
```

## 11. Continuous Deployment

### Automatic Deployment

- Both Vercel and Render auto-deploy on git push
- Configure branch-specific deployments
- Set up staging environments

### Database Migrations

- Run migrations via Render shell
- Consider migration scripts in deployment

## 12. Security Checklist

- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] HTTPS enforced
- [ ] Session security configured

## Support

For deployment issues:

1. Check service status pages
2. Review application logs
3. Test individual components
4. Verify environment variables
5. Check network connectivity
