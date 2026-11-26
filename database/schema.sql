-- ============================================================================
-- ResQ — From Distress to Rescue
-- PostgreSQL + PostGIS Database Schema
-- Target Version: PostgreSQL 15+ with PostGIS 3.x
-- ============================================================================

-- 1. Enable Required Extensions
-- uuid-ossp: For generating secure, decentralized UUID primary keys
-- postgis: For spatial data types, distance matrices, and spatial indexing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Clean start (useful for development reset scripts)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS rescue_tracking_updates CASCADE;
-- DROP TABLE IF EXISTS rescue_assignments CASCADE;
-- DROP TABLE IF EXISTS rescue_reports CASCADE;
-- DROP TABLE IF EXISTS organization_members CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 2. USERS TABLE
-- Stores citizen reporters, organization admins, field rescuers, and superadmins.
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL CHECK (role IN ('citizen', 'org_admin', 'rescuer', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. ORGANIZATIONS TABLE
-- Stores registered animal welfare shelters, NGOs, and veterinary rescue groups.
-- PostGIS geometry: Point in WGS 84 coordinate system (SRID 4326: Lon, Lat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    address_text TEXT NOT NULL,
    -- GEOMETRY(Point, 4326): Point(longitude, latitude)
    location GEOMETRY(Point, 4326) NOT NULL,
    operational_radius_km NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    -- Array of animal types the organization is capable of handling
    animal_types_handled TEXT[] NOT NULL DEFAULT ARRAY['dog', 'cat'],
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. ORGANIZATION MEMBERS TABLE
-- Links rescuer / admin users to specific organizations (Multi-tenancy support).
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_role VARCHAR(30) NOT NULL DEFAULT 'rescuer' CHECK (org_role IN ('admin', 'rescuer', 'dispatcher')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

-- ============================================================================
-- 5. RESCUE REPORTS TABLE
-- Distress reports submitted by citizens when an injured animal is spotted.
-- ============================================================================
CREATE TABLE IF NOT EXISTS rescue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous/guest reports
    animal_type VARCHAR(50) NOT NULL, -- 'dog', 'cat', 'cattle', 'bird', 'wildlife'
    breed VARCHAR(100),
    condition_description TEXT NOT NULL,
    severity_level VARCHAR(20) NOT NULL DEFAULT 'medium' 
        CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    photo_url TEXT,
    -- PostGIS Point(longitude, latitude) of the distress location
    location GEOMETRY(Point, 4326) NOT NULL,
    address_text TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'reported' 
        CHECK (status IN ('reported', 'matching', 'assigned', 'in_progress', 'rescued', 'closed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. RESCUE ASSIGNMENTS TABLE
-- Tracks dispatch offers, accepts/rejects, and assignments between a report & org.
-- ============================================================================
CREATE TABLE IF NOT EXISTS rescue_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES rescue_reports(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_rescuer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'offered'
        CHECK (status IN ('offered', 'accepted', 'rejected', 'in_transit', 'rescued', 'cancelled')),
    distance_meters NUMERIC(10,2), -- Distance computed by PostGIS during matching
    response_notes TEXT,
    offered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- A single organization should only have one active offer/assignment per report
    CONSTRAINT unique_report_org UNIQUE (report_id, organization_id)
);

-- ============================================================================
-- 7. RESCUE TRACKING UPDATES TABLE
-- Immutable timeline audit log of all rescue progress and field actions.
-- ============================================================================
CREATE TABLE IF NOT EXISTS rescue_tracking_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES rescue_reports(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES rescue_assignments(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status_update VARCHAR(50) NOT NULL,
    notes TEXT,
    rescuer_location GEOMETRY(Point, 4326), -- Optional GPS location ping of rescuer
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- Notifications dispatched to organizations, rescuers, and citizen reporters.
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    report_id UUID REFERENCES rescue_reports(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'rescue_dispatched', 'case_accepted', 'status_updated'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. PERFORMANCE & SPATIAL INDEXES
-- Spatial GiST (Generalized Search Tree) indexes are critical for O(log N)
-- geospatial radius queries (ST_DWithin, ST_Distance).
-- ============================================================================

-- Spatial Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_location 
    ON organizations USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_rescue_reports_location 
    ON rescue_reports USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_tracking_location 
    ON rescue_tracking_updates USING GIST (rescuer_location);

-- Foreign Key & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_reports_status ON rescue_reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_animal_type ON rescue_reports (animal_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON rescue_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_report ON rescue_assignments (report_id);
CREATE INDEX IF NOT EXISTS idx_assignments_org ON rescue_assignments (organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON rescue_assignments (status);
CREATE INDEX IF NOT EXISTS idx_tracking_report ON rescue_tracking_updates (report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications (organization_id, is_read);

-- ============================================================================
-- 10. AUTOMATIC UPDATED_AT TRIGGER
-- Automatically updates updated_at column on UPDATE statements.
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_orgs_updated_at ON organizations;
CREATE TRIGGER trg_orgs_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON rescue_reports;
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON rescue_reports
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_assignments_updated_at ON rescue_assignments;
CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON rescue_assignments
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 11. DEMO & EVALUATION SEED DATA
-- Pre-populates sample organizations, users, and reports for testing & demo.
-- Note: Points are ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
-- Example Coordinates centered around Delhi NCR:
--   Connaught Place: Longitude 77.2167, Latitude 28.6304
--   South Delhi / Hauz Khas: Longitude 77.2060, Latitude 28.5494
--   Noida Sector 18: Longitude 77.3236, Latitude 28.5708
-- ============================================================================

-- Password for all seed users is 'Password123!' (bcrypt hash below)
-- $2b$10$w0M89.7W8k0ZkVm3sWjUweU7HauiYmBqWcT62j1dC2RkJ/4wTffO2
INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@resq.org', '$2b$10$w0M89.7W8k0ZkVm3sWjUweU7HauiYmBqWcT62j1dC2RkJ/4wTffO2', 'System Admin', '+919876543210', 'admin'),
('22222222-2222-2222-2222-222222222222', 'delhi_shelter@resq.org', '$2b$10$w0M89.7W8k0ZkVm3sWjUweU7HauiYmBqWcT62j1dC2RkJ/4wTffO2', 'Delhi Animal Shelter Admin', '+919876543211', 'org_admin'),
('33333333-3333-3333-3333-333333333333', 'rescuer.rahul@resq.org', '$2b$10$w0M89.7W8k0ZkVm3sWjUweU7HauiYmBqWcT62j1dC2RkJ/4wTffO2', 'Rahul Rescuer', '+919876543212', 'rescuer'),
('44444444-4444-4444-4444-444444444444', 'citizen.priya@gmail.com', '$2b$10$w0M89.7W8k0ZkVm3sWjUweU7HauiYmBqWcT62j1dC2RkJ/4wTffO2', 'Priya Sharma (Citizen)', '+919876543213', 'citizen')
ON CONFLICT (id) DO NOTHING;

-- Seed Organizations
INSERT INTO organizations (id, name, registration_number, contact_email, contact_phone, address_text, location, operational_radius_km, animal_types_handled, is_verified, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
 'Friendicoes SECA (South Delhi)', 
 'REG-DL-2015-0819', 
 'contact@friendicoes.org', 
 '+911124314987', 
 '271 & 273 Defence Colony Flyover Market, New Delhi', 
 ST_SetSRID(ST_MakePoint(77.2345, 28.5728), 4326), 
 20.00, 
 ARRAY['dog', 'cat', 'cattle', 'bird'], 
 TRUE, 
 TRUE),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
 'Sanjay Gandhi Animal Care Centre (West Delhi)', 
 'REG-DL-2010-0112', 
 'sgacc@delhianimals.org', 
 '+911125448062', 
 'Near Raja Garden, Shivaji College Road, New Delhi', 
 ST_SetSRID(ST_MakePoint(77.1215, 28.6542), 4326), 
 25.00, 
 ARRAY['dog', 'cat', 'cattle', 'horse'], 
 TRUE, 
 TRUE)
ON CONFLICT (id) DO NOTHING;

-- Link org admin and rescuer to Friendicoes
INSERT INTO organization_members (organization_id, user_id, org_role) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'admin'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'rescuer')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Seed a sample report near Defence Colony (within Friendicoes operational radius)
INSERT INTO rescue_reports (id, reporter_id, animal_type, breed, condition_description, severity_level, location, address_text, status) VALUES
('99999999-9999-9999-9999-999999999999', 
 '44444444-4444-4444-4444-444444444444', 
 'dog', 
 'Indie / Stray', 
 'Limping on right hind leg after minor collision with two-wheeler. Conscious and resting under tea stall.', 
 'medium', 
 ST_SetSRID(ST_MakePoint(77.2280, 28.5710), 4326), 
 'Near Moolchand Metro Station, Ring Road, New Delhi', 
 'reported')
ON CONFLICT (id) DO NOTHING;
