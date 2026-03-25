# 🚨 COOLIFY DEPLOYMENT FIX

## The Problem
You got a build failure because Coolify was using docker-compose and the npm dependencies weren't installed correctly.

## ✅ SOLUTION 1: Use Simple Dockerfile (Recommended)

### Step 1: In Coolify Dashboard
1. **Go to your application settings**
2. **Change Build Pack** from "Docker Compose" to **"Dockerfile"**
3. **Set Custom Dockerfile Path**: `Dockerfile.coolify`
4. **Environment Variables**:
   ```
   PORT=3000
   ```

### Step 2: Deploy Again
The `Dockerfile.coolify` is optimized for Coolify and will work correctly.

---

## ✅ SOLUTION 2: If You Must Use Docker Compose

### Step 1: In Coolify Dashboard
1. **Keep Build Pack** as "Docker Compose"
2. **Set Environment Variables**:
   ```
   PORT=3000
   NODE_ENV=production
   ```

### Step 2: Deploy Again
The updated docker-compose.yml should now work.

---

## ✅ SOLUTION 3: Simplest Approach (Single File)

If you want the absolute simplest approach, create this single Dockerfile:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache curl gettext
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=3000
EXPOSE $PORT
HEALTHCHECK CMD curl -f http://localhost:$PORT/health || exit 1
CMD envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
```

---

## 🎯 RECOMMENDED STEPS:

1. **Switch to Dockerfile build** in Coolify (Solution 1)
2. **Use `Dockerfile.coolify`** as the custom dockerfile path
3. **Set `PORT=3000`** environment variable
4. **Deploy again**

This will fix the build issue you encountered!

## 💡 Why This Happened:

- Your original Dockerfile used `npm ci --only=production`
- But Vite and TypeScript are devDependencies needed for building
- The build failed because these tools weren't installed

The fixes ensure all dependencies are installed before building.