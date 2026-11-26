# ResQ — College Evaluation Live Demonstration Guide

Follow this step-by-step presentation script to demonstrate the platform to your evaluators.

---

## ⏱️ 5-Minute Demonstration Walkthrough

### Step 1: System Startup (30 seconds)
Show the evaluator that all microservices and infrastructure are running:
1. Terminal 1: `docker compose ps` $\rightarrow$ Both `resq-postgres` and `resq-rabbitmq` are running and healthy.
2. Terminal 2: `npm start` $\rightarrow$ API Gateway (8000), Auth (8001), Reports (8002), Organizations (8003), Notifications (8005) running.
3. Terminal 3: `npm run frontend` $\rightarrow$ Frontend running at `http://localhost:3000`.

---

### Step 2: The Landing Page & Brand Identity (1 minute)
1. Open `http://localhost:3000` in the browser.
2. Highlight the **Ethereal visual design**:
   - Soft luminous lighting, emerald and sage palette, layered glassmorphism cards.
   - Tagline: *"Every second matters. Every life counts."*
   - Live Emergency Stray Rescue Network beacon.
3. Scroll through:
   - **How ResQ Works**: The 4-stage pipeline (Report $\rightarrow$ Spatial Proximity $\rightarrow$ Shelter Dispatch $\rightarrow$ Recovery).
   - **Live Recent Cases**: Show that this displays actual cases pulled from the PostgreSQL database via API Gateway.
   - **Verified Shelters**: Displays partner animal welfare NGOs in Delhi NCR.

---

### Step 3: Citizen Reports an Injured Animal (1.5 minutes)
1. Click **"Report an Animal"** (navigates to `/report`).
2. Demonstrate the form:
   - Choose **Dog / Stray Pup**.
   - Select Severity: **Critical** (note the color-coded badge).
   - Condition Description: *"Injured indie pup limping near metro pillar 12, conscious but unable to walk."*
   - Click **"Use My GPS Location"** to show browser geolocation integration (or leave default Delhi coordinates).
   - Click a photo preset (e.g. *Injured Dog*).
3. Click **"Submit Emergency Report"**:
   - The report is stored in PostgreSQL with PostGIS Point geometry (`ST_MakePoint`).
   - A `report.created` domain event is emitted to RabbitMQ.
   - An Ethereal Confirmation screen appears showing the unique Report UUID.
   - Click **"Track Live Rescue Status"**.

---

### Step 4: NGO Shelter Accepts Case (1 minute)
1. Click **"Log In"** in the navbar.
2. Click the **"NGO Shelter Admin"** demo chip (`delhi_shelter@resq.org`).
3. Click **"Sign In to Portal"**:
   - Automatically directs to `/dashboard/ngo`.
4. Under **"Available Distress Requests"**, locate the report just submitted by the citizen.
5. Click **"Accept & Dispatch Rescuer"**:
   - An atomic database transaction updates the report to `assigned`, creates a rescue assignment record, and writes an audit tracking entry.
   - RabbitMQ emits `rescue.assigned`.
   - The case moves to **"Our Active Cases"**.

---

### Step 5: Field Rescuer Updates Progress (1 minute)
1. In the top navbar, log out and sign in with the **"Field Rescuer Rahul"** demo chip (`rescuer.rahul@resq.org`).
2. Redirects to `/dashboard/rescuer`.
3. Locate the assigned case:
   - Highlight the **"Navigate (Maps)"** button opening Google Maps coordinates.
   - Click **"Mark Arrived / In Progress"** $\rightarrow$ Status changes to `in_progress`.
   - Click **"Mark Successfully Rescued"** $\rightarrow$ Status changes to `rescued`, emitting `rescue.completed`.

---

### Step 6: Citizen Verifies Resolution (30 seconds)
1. Log out and sign in with the **"Citizen Priya"** demo chip (`citizen.priya@gmail.com`).
2. In `/dashboard/citizen`:
   - Point out the **Live Alerts** bell showing the in-app notification consumed from RabbitMQ.
   - Click **"Track"** on the report to view the full chronological audit timeline with timestamps and rescuer notes.

---

### Step 7: Platform Admin & Metrics (30 seconds)
1. Log out and sign in with **"Platform Admin"** (`admin@resq.org`).
2. Redirects to `/dashboard/admin`:
   - Point out real live metrics calculated from the database: Total Reports, Active Rescues, Rescued Lives, Registered NGOs.
   - Open **"Shelter Verification"** tab and demonstrate clicking **"Approve NGO"** on *Noida Animal Care Sanctuary*.
   - View **"Users Registry"** displaying all roles and active states.

