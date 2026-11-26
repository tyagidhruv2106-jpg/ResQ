# ResQ — From Distress to Rescue
## Senior Backend Architecture & Project Context

---

### 1. Executive Summary

**ResQ** is an emergency distress-to-rescue coordination backend platform designed to bridge the critical time gap between spotting an injured, abandoned, or distressed animal and dispatching the nearest capable animal welfare organization or rescue personnel.

For our 3rd-year Computer Science & Engineering capstone evaluation, the primary goal is not to build an overly complex consumer app with endless UI gimmicks. Instead, the focus is on demonstrating a **genuine, resilient, and production-minded backend engineering foundation**:
1. **Clean Microservice Architecture & Monorepo Layout**
2. **Robust Spatial Database Design using PostgreSQL & PostGIS**
3. **Asynchronous Event-Driven Messaging using RabbitMQ**
4. **Secure Stateless Authentication & Role-Based Access Control using JWT**
5. **Containerized Multi-Service Deployment using Docker Compose**

---

### 2. Core Problem & Engineering Solution

#### The Real-World Bottleneck
In traditional animal distress reporting:
- Reports arrive via chaotic WhatsApp groups or phone calls.
- There is no geospatial index to instantly determine which NGO is closest or equipped to handle specific animals (e.g., cattle vs. raptor birds vs. stray dogs).
- Manual dispatch creates long turnaround times, often leading to avoidable animal fatalities.

#### The ResQ Solution
- **Citizen Report Ingestion**: A standardized REST API accepts animal distress reports with photos, severity levels, and precise GPS coordinates (`latitude`, `longitude`).
- **Spatial Matching Engine**: Upon report submission, a background event triggers PostGIS spatial queries (`ST_DWithin` / `ST_DistanceSphere`) to compute distance matrices against registered organization operating radii and animal competencies.
- **Asynchronous Notification & Dispatch Queue**: RabbitMQ message brokers decouple report ingestion from notification dispatch. Reports are never blocked by email/SMS latency or busy worker processes.
- **Audit & Live Tracking Log**: State changes (`reported` $\rightarrow$ `matching` $\rightarrow$ `assigned` $\rightarrow$ `in_transit` $\rightarrow$ `rescued` $\rightarrow$ `closed`) are immutably logged with timestamps and rescuer coordinates for accountability.

---

### 3. Technology Stack Justification

| Technology | Role | Justification for Evaluation & 3-Day Timeline |
| :--- | :--- | :--- |
| **Node.js (v20 LTS) & Express** | Service Runtime & HTTP Framework | Lightweight, non-blocking I/O, fast prototyping, shared JavaScript/TypeScript knowledge across the team. Express is explicit and easy for examiners to audit. |
| **PostgreSQL 16 + PostGIS 3.4** | Relational & Geospatial Database | Standard relational database with industry-grade spatial capabilities. PostGIS provides native spatial indexing (`GIST`) and spherical distance calculations out-of-the-box. |
| **RabbitMQ 3.x** | AMQP Message Broker | Enables asynchronous, reliable pub/sub messaging. Separates high-throughput report intake from background matching and notification processing. |
| **Docker & Docker Compose** | Infrastructure & Orchestration | Spin up PostgreSQL (with PostGIS), RabbitMQ, and all microservices with a single `docker compose up --build` command, avoiding local environment discrepancies. |
| **JWT (JSON Web Tokens)** | Authentication & RBAC | Stateless, cryptographically signed tokens containing user IDs and roles (`citizen`, `org_admin`, `rescuer`, `admin`), verified at API Gateway or individual services. |

---

### 4. Evaluation Objectives (What the Professor Will Look For)

1. **System Modularity**: Are services loosely coupled with single responsibilities? Can the Report Service function if notifications are delayed?
2. **Data Model Integrity**: Are primary keys, foreign keys, spatial geometry columns, and indexes properly defined?
3. **Event-Driven Communication**: Does the system demonstrate real message queue publishing and consuming (not just synchronous HTTP waterfalls)?
4. **Pragmatic Delivery**: Does the team have a runnable backend with functional endpoints within 2–3 days, rather than an incomplete, overly ambitious system?

---

### 5. Architectural Principle: Pragmatic Monorepo for College Scope

In an enterprise setting, microservices often each reside in isolated Git repositories with independent CI/CD pipelines. For a 3-day evaluation:
- We use a **modular monorepo** where each service has its own directory, isolated dependencies, and Dockerfile.
- Services share a standardized database connection / messaging pattern under `shared/`.
- We utilize a **unified database instance with logical schema isolation or well-defined relational boundaries** rather than spinning up 6 separate heavy PostgreSQL database containers, saving machine memory while maintaining strict architectural boundaries.
