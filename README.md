# ResQ — From Distress to Rescue

> A full-stack animal rescue coordination platform connecting citizens, NGOs, and field rescuers.

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)](./frontend)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20Microservices-green)](./services)
[![Database](https://img.shields.io/badge/DB-PostgreSQL%20%2B%20PostGIS-blueviolet)](./database)
[![Queue](https://img.shields.io/badge/Queue-RabbitMQ-orange)](./docker-compose.yml)

---

## Overview

ResQ is a microservices-based animal rescue coordination platform. When a citizen spots a distressed animal, they submit a report. Nearby verified NGO shelters receive it, dispatch field rescuers, and update the rescue status in real time — all through a modern React dashboard.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TailwindCSS |
| API Gateway | Node.js / Express (port 8000) |
| Auth Service | Node.js / Express (port 8001) |
| Report Service | Node.js / Express (port 8002) |
| Organization Service | Node.js / Express (port 8003) |
| Notification Service | Node.js / Express (port 8005) |
| Database | PostgreSQL 16 + PostGIS 3.4 (port 5432) |
| Message Queue | RabbitMQ 3.13 (port 5672, UI: 15672) |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- Docker Desktop

### 1. Clone & Install

```bash
git clone https://github.com/tyagidhruv2106-jpg/ResQ.git
cd ResQ
npm install
npm install --prefix frontend
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your own secrets before starting
```

**Required env variables:**

| Variable | Description |
|---|---|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name |
| `RABBITMQ_USER` | RabbitMQ username |
| `RABBITMQ_PASS` | RabbitMQ password |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `24h`) |

### 3. Start Infrastructure (Docker)

```bash
docker compose up -d
```

This starts PostgreSQL+PostGIS and RabbitMQ. The database schema is applied automatically via `database/schema.sql`.

### 4. Seed Demo Data (Optional)

```bash
npm run seed
```

Creates demo accounts for evaluation. See [docs/demo-guide.md](./docs/demo-guide.md).

### 5. Start Backend Services

```bash
npm start
```

Starts all five microservices (auth, reports, organizations, notifications, gateway).

### 6. Start Frontend

```bash
npm run frontend
```

Frontend runs at **http://localhost:3000**  
API Gateway at **http://localhost:8000**

---

## Demo Accounts

> Demo accounts are created by the seed script only. See [`docs/demo-guide.md`](./docs/demo-guide.md) for credentials.
>
> **Never deploy seed data to production.**

---

## API Endpoints

| Route | Service | Description |
|---|---|---|
| `POST /api/v1/auth/register` | Auth | Register (citizen or org_admin only) |
| `POST /api/v1/auth/login` | Auth | Authenticate and receive JWT |
| `GET /api/v1/auth/me` | Auth | Current user profile |
| `GET /api/v1/reports` | Reports | List all reports |
| `POST /api/v1/reports` | Reports | Submit new distress report |
| `POST /api/v1/reports/:id/accept` | Reports | NGO accepts report |
| `PUT /api/v1/reports/:id/status` | Reports | Update rescue status |
| `GET /api/v1/reports/:id/tracking` | Reports | Full tracking audit log |
| `GET /api/v1/organizations` | Organizations | List verified orgs |
| `POST /api/v1/organizations` | Organizations | Register shelter |
| `GET /api/v1/notifications` | Notifications | User notifications |
| `GET /api/v1/admin/stats` | Admin | Platform statistics |
| `GET /api/v1/admin/users` | Admin | All users |
| `GET /api/v1/admin/reports` | Admin | All reports |
| `PATCH /api/v1/organizations/:id/verify` | Admin | Verify/unverify org |

---

## Deployment

See [`docs/architecture.md`](./docs/architecture.md) for the full deployment architecture.

**Recommended zero-cost deployment:**
- **Frontend**: Vercel (free tier) — set `VITE_API_URL` to backend URL
- **Backend + DB + Queue**: Railway / Render free tier or Docker Compose on any VPS

---

## Security Notes

- Public registration is restricted to `citizen` and `org_admin` roles only.
- `admin` and `rescuer` accounts must be provisioned directly by a platform admin.
- Never commit `.env` files or secrets.
- JWT secret must be explicitly set in production — no default is used.

---

## Project Structure

```
ResQ/
├── frontend/          # React + Vite frontend
├── services/
│   ├── api-gateway/   # Ingress proxy (port 8000)
│   ├── auth-service/  # Authentication (port 8001)
│   ├── report-service/ # Reports & rescue (port 8002)
│   ├── organization-service/ # NGOs & admin (port 8003)
│   └── notification-service/ # Events & alerts (port 8005)
├── shared/            # Shared DB, messaging, auth utilities
├── database/
│   ├── schema.sql     # Complete PostgreSQL schema
│   └── seed.js        # Development demo seed
├── scripts/           # Startup and verification scripts
├── docs/              # Architecture and demo guide
├── docker-compose.yml # PostgreSQL + RabbitMQ infra
├── .env.example       # Environment variable template
└── package.json       # Root scripts
```

---

## License

MIT
