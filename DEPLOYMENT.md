# Docker Deployment Guide

This guide explains how to deploy your SubTracker application using Docker and Docker Compose.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- Git (to clone your repository)

## Quick Deployment

1. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Access your application:**
   - Frontend: http://localhost (port 80)
   - API Server: http://localhost:3001
   - Health Check: http://localhost:3001/health

## Detailed Commands

### Development/Testing
```bash
# Build and run with logs visible
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Build containers
docker-compose build

# Start services in production mode
docker-compose up -d

# Monitor service health
docker-compose ps
```

## Service Configuration

### Frontend (React + Nginx)
- **Container:** `subtracker-frontend`
- **Port:** 80
- **Image:** Multi-stage build (Node.js build + Nginx serve)
- **Nginx:** Configured with client-side routing support and API proxying

### Mock Server (Express.js)
- **Container:** `subtracker-api`
- **Port:** 3001
- **Health Check:** `/health` endpoint
- **Auto-restart:** Unless manually stopped

## Port Configuration

| Service | Internal Port | External Port | Description |
|---------|--------------|---------------|-------------|
| Frontend | 80 | 80 | Main web application |
| API Server | 3001 | 3001 | REST API endpoints |

## Troubleshooting

### Check service status
```bash
docker-compose ps
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs frontend
docker-compose logs mock-server
```

### Restart services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart frontend
```

### Clean rebuild
```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build --force-recreate
```

## Environment Variables

You can customize the deployment by creating a `.env` file:

```env
# .env file
FRONTEND_PORT=80
API_PORT=3001
NODE_ENV=production
```

Then reference in docker-compose.yml:
```yaml
ports:
  - "${FRONTEND_PORT:-80}:80"
```

## Production Considerations

1. **Security:**
   - Change default ports
   - Use HTTPS with SSL certificates
   - Implement proper authentication
   - Add rate limiting

2. **Performance:**
   - Configure Nginx caching
   - Use CDN for static assets
   - Monitor resource usage

3. **Monitoring:**
   - Set up log aggregation
   - Health check monitoring
   - Performance metrics

## Scaling (Optional)

To scale services:
```bash
# Scale API server instances
docker-compose up --scale mock-server=3

# Use load balancer for multiple instances
```

## Cleanup

```bash
# Stop and remove everything
docker-compose down -v --rmi all

# Remove unused Docker resources
docker system prune -a
```