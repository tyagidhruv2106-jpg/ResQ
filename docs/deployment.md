# Deployment Architecture — ResQ

## Overview

ResQ uses a split deployment model:

- **Frontend**: Vercel (free tier) — builds from `frontend/` directory
- **Backend**: Docker Compose on a VPS or cloud instance with public HTTPS proxy
- **Database**: PostgreSQL 16 + PostGIS (Docker volume)
- **Message Queue**: RabbitMQ 3.13 (Docker volume)

---

## Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variable:
   - `VITE_API_URL` = `https://your-backend-domain.com`
6. Enable **SPA** routing by creating `frontend/public/_redirects` with: `/* /index.html 200`

---

## Backend Deployment (Docker Compose + VPS)

### Production docker-compose

The root `docker-compose.yml` starts PostgreSQL and RabbitMQ.

Backend microservices run as Node.js processes managed by PM2 or systemd:

```bash
npm install -g pm2
pm2 start scripts/start_all_services.js --name resq-backend
pm2 save
pm2 startup
```

### Required production environment variables

```
NODE_ENV=production
POSTGRES_HOST=localhost
POSTGRES_USER=<secure>
POSTGRES_PASSWORD=<secure>
POSTGRES_DB=resq_db
RABBITMQ_HOST=localhost
RABBITMQ_USER=<secure>
RABBITMQ_PASS=<secure>
JWT_SECRET=<32+ char random secret>
JWT_EXPIRES_IN=24h
GATEWAY_PORT=8000
AUTH_PORT=8001
REPORT_PORT=8002
ORG_PORT=8003
NOTIFICATION_PORT=8005
```

### HTTPS / CORS

Use Nginx or Caddy as a reverse proxy on the VPS:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Set `CORS_ORIGIN` environment variable on the backend to match the Vercel frontend URL.

---

## Zero-Cost Free Tier Options

| Service | Provider | Notes |
|---|---|---|
| Frontend | Vercel free | Unlimited personal projects |
| PostgreSQL | Railway free (500 MB) | Has PostGIS support |
| RabbitMQ | CloudAMQP free (1M msgs/mo) | External AMQP URL |
| Backend | Railway / Render free | Sleeps on inactivity |

### Environment variable for external services

```
DATABASE_URL=postgresql://user:pass@external-host:5432/resq_db
RABBITMQ_URL=amqps://user:pass@external-rabbitmq-host/vhost
```

---

## Database Initialization

Schema is applied automatically when Docker starts (via `database/schema.sql`).

For external databases, run manually:
```bash
psql $DATABASE_URL < database/schema.sql
npm run seed  # optional — dev only
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Gateway returns 503 | A downstream service is not running — check `npm start` logs |
| DB connection refused | Ensure Docker is running: `docker compose up -d` |
| JWT errors after deploy | Verify `JWT_SECRET` is set in production env |
| CORS errors | Set correct `VITE_API_URL` on Vercel and ensure backend CORS matches |
| RabbitMQ consumer not running | Check notification service logs; it auto-reconnects |
