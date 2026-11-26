# ResQ API Documentation (v1)

Base URL: `http://localhost:8000/api/v1`  
All requests and responses use JSON formatting:
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "...",
  "data": { ... },
  "timestamp": "2026-11-19T00:00:00.000Z"
}
```

---

## 1. Authentication Service (`/api/v1/auth`)

### Register Account
- **Endpoint:** `POST /api/v1/auth/register` (or `POST /api/v1/auth/`)
- **Body:**
  ```json
  {
    "full_name": "Priya Sharma",
    "email": "priya@example.com",
    "phone": "+919876543210",
    "password": "Password123!",
    "role": "citizen" // 'citizen' | 'org_admin' | 'rescuer'
  }
  ```
- **Response:** `201 Created` with signed JWT and sanitized user object.

### Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Body:**
  ```json
  {
    "email": "priya@example.com",
    "password": "Password123!"
  }
  ```
- **Response:** `200 OK` with `{ token, user }`.

### Current User Profile
- **Endpoint:** `GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK` with user record.

---

## 2. Report Service (`/api/v1/reports`)

### Submit Distress Report
- **Endpoint:** `POST /api/v1/reports`
- **Headers:** `Authorization: Bearer <token>` (Optional)
- **Body:**
  ```json
  {
    "animal_type": "dog",
    "breed": "Indie Stray",
    "severity_level": "medium",
    "condition_description": "Limping hind leg",
    "latitude": 28.5728,
    "longitude": 77.2345,
    "address_text": "Defence Colony, New Delhi",
    "photo_url": "https://..."
  }
  ```
- **Response:** `201 Created`. Publishes `report.created` domain event to RabbitMQ.

### List Reports
- **Endpoint:** `GET /api/v1/reports`
- **Query Params:** `status`, `animal_type`, `severity_level`, `limit`, `offset`
- **Response:** `200 OK` with `{ reports, pagination }`.

### My Reports
- **Endpoint:** `GET /api/v1/reports/my`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK` with reports created by current user.

### Open Reports for NGOs
- **Endpoint:** `GET /api/v1/reports/available`
- **Headers:** `Authorization: Bearer <token>` (Role: `org_admin`, `rescuer`, `admin`)
- **Response:** `200 OK` with open unassigned reports.

### Accept Report (Atomic)
- **Endpoint:** `POST /api/v1/reports/:id/accept`
- **Headers:** `Authorization: Bearer <token>` (Role: `org_admin`, `rescuer`, `admin`)
- **Body:** `{ "notes": "Rescue ambulance dispatched" }`
- **Response:** `201 Created`. Transitions report to `assigned`, creates assignment record, emits `rescue.assigned`.

### Update Status
- **Endpoint:** `PUT /api/v1/reports/:id/status`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "status": "in_progress", // 'in_progress' | 'rescued' | 'closed' | 'cancelled'
    "notes": "First aid applied on site"
  }
  ```
- **Response:** `200 OK`. Inserts tracking audit record and publishes `rescue.status_updated` (and `rescue.completed` if `rescued`).

### Tracking History Log
- **Endpoint:** `GET /api/v1/reports/:id/tracking`
- **Response:** `200 OK` with chronological list of all status milestones and rescuer notes.

---

## 3. Organization Service (`/api/v1/organizations`)

### List Shelters
- **Endpoint:** `GET /api/v1/organizations`
- **Query Params:** `lat`, `lon`, `radius_km`, `is_verified`
- **Response:** `200 OK` with list of shelters and calculated distances (`distance_meters`).

### Register Shelter
- **Endpoint:** `POST /api/v1/organizations`
- **Body:** `{ name, registration_number, contact_email, contact_phone, address_text, latitude, longitude, operational_radius_km }`
- **Response:** `201 Created`.

### Verify Shelter (Admin Only)
- **Endpoint:** `PATCH /api/v1/organizations/:id/verify`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Body:** `{ "verified": true }`
- **Response:** `200 OK`.

---

## 4. Admin API (`/api/v1/admin`)

### Dashboard Metrics
- **Endpoint:** `GET /api/v1/admin/stats`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Response:**
  ```json
  {
    "total_users": 6,
    "total_organizations": 3,
    "pending_verifications": 1,
    "total_reports": 5,
    "pending_reports": 2,
    "rescued_count": 2,
    "active_rescues": 2,
    "total_assignments": 4
  }
  ```

### User Management
- **Endpoint:** `GET /api/v1/admin/users`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Query Params:** `role`, `limit`, `offset`
- **Response:** `200 OK` with user accounts list.

---

## 5. Notification Service (`/api/v1/notifications`)

### Get In-App Alerts
- **Endpoint:** `GET /api/v1/notifications`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `is_read`, `limit`, `offset`
- **Response:** `200 OK` with user notifications.

### Mark All Read
- **Endpoint:** `PATCH /api/v1/notifications/read-all`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK`.

