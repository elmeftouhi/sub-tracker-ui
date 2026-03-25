# Coolify Deployment Guide for SubTracker

## 🚀 Ready for Coolify Deployment!

Your SubTracker application is now optimized for Coolify deployment on a VPS. Since your app uses IndexedDB for local storage, it's a pure frontend application that doesn't require a backend database.

## 📋 Prerequisites

- Coolify installed on your VPS
- Git repository pushed to GitHub/GitLab/etc.
- Domain name pointed to your VPS (optional but recommended)

## 🔧 Coolify Configuration

### 1. Create New Resource in Coolify

1. **Login to Coolify dashboard**
2. **Click "New Resource"** → **"Public Repository"**
3. **Repository Settings:**
   - Repository URL: `https://github.com/yourusername/subTracker`
   - Branch: `main`
   - Build Pack: `Dockerfile`

### 2. Environment Variables

Set these in Coolify's environment section:

```env
# Required
PORT=3000

# Optional (for custom configuration)
NODE_ENV=production
```

### 3. Port Configuration

- **Internal Port**: `3000` (set via PORT environment variable)
- **Public Port**: `80` or `443` (configured by Coolify)

### 4. Domain Configuration

- Set your domain in Coolify
- Enable SSL/HTTPS (recommended)
- Coolify will handle the reverse proxy automatically

## 📁 What's Optimized for Coolify

✅ **Configurable Port**: Uses `PORT` environment variable (Coolify standard)  
✅ **Health Check**: Built-in `/health` endpoint  
✅ **Security Headers**: Production-ready nginx configuration  
✅ **Static Asset Caching**: Optimized for performance  
✅ **SPA Routing**: Handles React Router properly  
✅ **Gzip Compression**: Reduces bandwidth usage  

## 🏗️ Dockerfile Features

- **Multi-stage build**: Optimized image size
- **Production nginx**: Serves static files efficiently  
- **Environment substitution**: Port configuration at runtime
- **Health checks**: For monitoring and auto-recovery
- **Security headers**: XSS protection, content security policy

## 🎯 Deployment Steps

1. **Push your code** to your git repository:
   ```bash
   git add .
   git commit -m "Add Coolify deployment configuration"
   git push origin main
   ```

2. **In Coolify:**
   - Create new resource from your repository
   - Set PORT environment variable to 3000
   - Deploy!

3. **Access your app** at your configured domain

## 🔍 Post-Deployment Verification

- ✅ App loads correctly
- ✅ Client-side routing works (refresh any page)
- ✅ Data persistence works (add/edit subscriptions)
- ✅ Health check responds: `https://yourdomain.com/health`

## 🛠️ Local Development

If you want to test the production build locally:

```bash
# Build the Docker image
docker build -t subtracker .

# Run with custom port
docker run -p 8080:3000 -e PORT=3000 subtracker

# Access at http://localhost:8080
```

## 🐛 Troubleshooting

### App won't start
- Check Coolify build logs
- Verify PORT environment variable is set
- Check nginx configuration generation

### 404 on refresh (routing issues)
- Ensure nginx config has `try_files $uri $uri/ /index.html;`
- Check build folder contains index.html

### Health check failing
- Verify container is listening on correct port
- Check `/health` endpoint returns 200

## 🔧 Optional: Mock API Deployment

If you want to deploy the mock API server separately:

1. **Create separate Coolify resource** for mock-server folder
2. **Use simple Node.js Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

## 📈 Production Considerations

1. **Monitoring**: Set up Coolify monitoring/alerts
2. **Backups**: Since data is stored locally, consider user data export features
3. **Analytics**: Add analytics if needed (local storage won't track across devices)
4. **PWA**: Consider making it a Progressive Web App for mobile experience

## 🎉 You're Ready!

Your SubTracker application is fully optimized for Coolify deployment. The configuration handles all the VPS/cloud deployment requirements automatically.