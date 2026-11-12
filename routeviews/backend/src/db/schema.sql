-- ============================================================
--  CONNECTRWANDA AI — FINAL COMPLETE DATABASE SCHEMA
--  MySQL 8.0+ / MariaDB 10.4+
--  Target database: routeview
--  18 tables: 16 urban (RouteView) + 2 interprovincial (Ticketing)
--  Safe to run repeatedly: drops and recreates everything.
--
--  HOW TO RUN
--    Option A (CLI):
--      mysql -u root < final_schema.sql
--
--    Option B (phpMyAdmin):
--      Open phpMyAdmin → SQL tab → paste this file → Go
--
--  AFTER THIS FILE
--    Load demonstration data:
--      cd routeviews/backend
--      npm run seed            (urban data)
-- ============================================================

CREATE DATABASE IF NOT EXISTS routeview
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE routeview;

-- Ensure the database default collation matches the tables
ALTER DATABASE routeview
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
--  DROP IN REVERSE DEPENDENCY ORDER
--  (Includes old legacy intercity tables to clean them up)
-- ============================================================

DROP TABLE IF EXISTS intercity_tickets;
DROP TABLE IF EXISTS intercity_bookings;
DROP TABLE IF EXISTS intercity_trips;
DROP TABLE IF EXISTS intercity_schedules;
DROP TABLE IF EXISTS intercity_routes;
DROP TABLE IF EXISTS intercity_companies;

DROP TABLE IF EXISTS press_resources;
DROP TABLE IF EXISTS service_alerts;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS ai_conversations;

DROP TABLE IF EXISTS ticket_redemptions;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS fares;

DROP TABLE IF EXISTS vehicle_positions;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS route_stops;
DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  URBAN SYSTEM — 16 TABLES (UNCHANGED FROM ROUTEVIEW)
-- ============================================================

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(190) NOT NULL UNIQUE,
  password_hash   VARCHAR(120) NOT NULL,
  full_name       VARCHAR(120) NOT NULL,
  phone           VARCHAR(30) NULL,
  role            ENUM('passenger','operator','admin') NOT NULL DEFAULT 'passenger',
  preferred_lang  ENUM('rw','en') NOT NULL DEFAULT 'rw',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- vehicles
-- ------------------------------------------------------------
CREATE TABLE vehicles (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plate           VARCHAR(30) NOT NULL UNIQUE,
  label           VARCHAR(80) NOT NULL,
  capacity        SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  status          ENUM('active','idle','maintenance','offline') NOT NULL DEFAULT 'idle',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicles_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- routes
-- ------------------------------------------------------------
CREATE TABLE routes (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(20) NOT NULL UNIQUE,
  name_rw         VARCHAR(160) NOT NULL,
  name_en         VARCHAR(160) NOT NULL,
  direction_label VARCHAR(160) NOT NULL,
  color_hex       CHAR(7) NOT NULL DEFAULT '#0ea5e9',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_routes_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- stops
-- ------------------------------------------------------------
CREATE TABLE stops (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(30) NOT NULL UNIQUE,
  name_rw         VARCHAR(160) NOT NULL,
  name_en         VARCHAR(160) NOT NULL,
  lat             DECIMAL(10,7) NOT NULL,
  lng             DECIMAL(10,7) NOT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_stops_lat_lng (lat, lng),
  INDEX idx_stops_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- route_stops — ordered stops per route
-- ------------------------------------------------------------
CREATE TABLE route_stops (
  route_id               BIGINT UNSIGNED NOT NULL,
  stop_id                BIGINT UNSIGNED NOT NULL,
  sequence_no            SMALLINT UNSIGNED NOT NULL,
  distance_from_start_m  INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (route_id, stop_id),
  UNIQUE KEY uk_route_seq (route_id, sequence_no),
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id)  REFERENCES stops(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- schedules — recurring departure times
-- ------------------------------------------------------------
CREATE TABLE schedules (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id        BIGINT UNSIGNED NOT NULL,
  departure_time  TIME NOT NULL,
  days_of_week    SET('mon','tue','wed','thu','fri','sat','sun') NOT NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_schedules_route (route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- trips — a specific vehicle running a route
-- ------------------------------------------------------------
CREATE TABLE trips (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id        BIGINT UNSIGNED NOT NULL,
  vehicle_id      BIGINT UNSIGNED NULL,
  started_at      DATETIME NOT NULL,
  ended_at        DATETIME NULL,
  direction       ENUM('outbound','inbound') NOT NULL DEFAULT 'outbound',
  status          ENUM('scheduled','running','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  FOREIGN KEY (route_id)   REFERENCES routes(id)   ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_trips_route (route_id),
  INDEX idx_trips_vehicle (vehicle_id),
  INDEX idx_trips_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- vehicle_positions — live position log (GPS + simulator)
-- ------------------------------------------------------------
CREATE TABLE vehicle_positions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id      BIGINT UNSIGNED NOT NULL,
  route_id        BIGINT UNSIGNED NULL,
  trip_id         BIGINT UNSIGNED NULL,
  lat             DECIMAL(10,7) NOT NULL,
  lng             DECIMAL(10,7) NOT NULL,
  speed_kmh       DECIMAL(6,2) NULL,
  heading_deg     SMALLINT NULL,
  source          ENUM('simulator','gps','manual') NOT NULL,
  recorded_at     DATETIME NOT NULL,
  received_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vp_vehicle_time (vehicle_id, recorded_at),
  INDEX idx_vp_route_time   (route_id,   recorded_at),
  INDEX idx_vp_source_time  (source,     recorded_at),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id)   REFERENCES routes(id)   ON DELETE SET NULL,
  FOREIGN KEY (trip_id)    REFERENCES trips(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- fares — explicit fare table
-- ------------------------------------------------------------
CREATE TABLE fares (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id        BIGINT UNSIGNED NOT NULL,
  from_stop_id    BIGINT UNSIGNED NOT NULL,
  to_stop_id      BIGINT UNSIGNED NOT NULL,
  amount_rwf      INT UNSIGNED NOT NULL,
  UNIQUE KEY uk_fare (route_id, from_stop_id, to_stop_id),
  FOREIGN KEY (route_id)     REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (from_stop_id) REFERENCES stops(id)  ON DELETE CASCADE,
  FOREIGN KEY (to_stop_id)   REFERENCES stops(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- bookings — urban bookings
-- ------------------------------------------------------------
CREATE TABLE bookings (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference       CHAR(12) NOT NULL UNIQUE,
  user_id         BIGINT UNSIGNED NOT NULL,
  route_id        BIGINT UNSIGNED NOT NULL,
  from_stop_id    BIGINT UNSIGNED NOT NULL,
  to_stop_id      BIGINT UNSIGNED NOT NULL,
  depart_at       DATETIME NOT NULL,
  passenger_name  VARCHAR(120) NOT NULL,
  passenger_phone VARCHAR(30) NULL,
  amount_rwf      INT UNSIGNED NOT NULL,
  status          ENUM('pending','paid','cancelled','expired') NOT NULL DEFAULT 'pending',
  payment_ref     VARCHAR(64) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bookings_user   (user_id),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_route  (route_id),
  INDEX idx_bookings_created (created_at),
  FOREIGN KEY (user_id)      REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (route_id)     REFERENCES routes(id),
  FOREIGN KEY (from_stop_id) REFERENCES stops(id),
  FOREIGN KEY (to_stop_id)   REFERENCES stops(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- tickets — urban tickets with QR
-- ------------------------------------------------------------
CREATE TABLE tickets (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id      BIGINT UNSIGNED NOT NULL UNIQUE,
  code            CHAR(24) NOT NULL UNIQUE,
  qr_payload      VARCHAR(255) NOT NULL,
  issued_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME NOT NULL,
  status          ENUM('issued','redeemed','expired','cancelled') NOT NULL DEFAULT 'issued',
  INDEX idx_tickets_status (status),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ticket_redemptions — UNIQUE(ticket_id) prevents double-scan
-- ------------------------------------------------------------
CREATE TABLE ticket_redemptions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id       BIGINT UNSIGNED NOT NULL UNIQUE,
  redeemed_by     BIGINT UNSIGNED NOT NULL,
  redeemed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id)   REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (redeemed_by) REFERENCES users(id),
  INDEX idx_redemption_time (redeemed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- service_alerts — bilingual disruption notices
-- ------------------------------------------------------------
CREATE TABLE service_alerts (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id        BIGINT UNSIGNED NULL,
  severity        ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
  title_rw        VARCHAR(180) NOT NULL,
  title_en        VARCHAR(180) NOT NULL,
  body_rw         TEXT NOT NULL,
  body_en         TEXT NOT NULL,
  starts_at       DATETIME NOT NULL,
  ends_at         DATETIME NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_by      BIGINT UNSIGNED NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alerts_active (is_active, starts_at, ends_at),
  FOREIGN KEY (route_id)   REFERENCES routes(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- press_resources
-- ------------------------------------------------------------
CREATE TABLE press_resources (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(120) NOT NULL UNIQUE,
  title           VARCHAR(200) NOT NULL,
  category        ENUM('logo','press_release','factsheet','image','video','document','mediakit') NOT NULL,
  description     TEXT NULL,
  file_path       VARCHAR(255) NULL,
  external_url    VARCHAR(500) NULL,
  file_size_bytes INT UNSIGNED NULL,
  mime_type       VARCHAR(120) NULL,
  is_published    TINYINT(1) NOT NULL DEFAULT 0,
  published_at    DATETIME NULL,
  created_by      BIGINT UNSIGNED NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_press_published (is_published, published_at),
  INDEX idx_press_category  (category),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ai_conversations
-- ------------------------------------------------------------
CREATE TABLE ai_conversations (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NULL,
  session_key     CHAR(36) NOT NULL,
  lang            ENUM('rw','en') NOT NULL DEFAULT 'rw',
  role            ENUM('user','assistant','tool','system') NOT NULL,
  content         MEDIUMTEXT NOT NULL,
  tool_name       VARCHAR(80) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_session (session_key, created_at),
  INDEX idx_ai_user (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- audit_log
-- ------------------------------------------------------------
CREATE TABLE audit_log (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id        BIGINT UNSIGNED NULL,
  action          VARCHAR(80) NOT NULL,
  entity          VARCHAR(60) NOT NULL,
  entity_id       VARCHAR(60) NULL,
  meta_json       JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_actor  (actor_id),
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_time   (created_at),
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  INTERPROVINCIAL SYSTEM — 2 SIMPLIFIED TABLES
--  (Replaces the old 6-table schema with what we built for the
--   Admin Dashboard and Passenger Ticketing pages)
-- ============================================================

-- ------------------------------------------------------------
-- intercity_trips — buses registered by Admin
-- ------------------------------------------------------------
CREATE TABLE intercity_trips (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id          VARCHAR(50) NOT NULL,
  origin_city         VARCHAR(100) NOT NULL,
  destination_city    VARCHAR(100) NOT NULL,
  departure_dt        DATETIME NOT NULL,
  price_rwf           INT NOT NULL,
  total_seats         INT NOT NULL,
  available_seats     INT NOT NULL,
  status              ENUM('scheduled','boarding','departed','cancelled') NOT NULL DEFAULT 'scheduled',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ic_trip_route   (origin_city, destination_city),
  INDEX idx_ic_trip_date    (departure_dt),
  INDEX idx_ic_trip_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- intercity_bookings — passenger ticket purchases
-- ------------------------------------------------------------
CREATE TABLE intercity_bookings (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id           BIGINT UNSIGNED NOT NULL,
  user_id           BIGINT UNSIGNED NULL,
  passenger_name    VARCHAR(120) NOT NULL,
  passenger_phone   VARCHAR(30) NULL,
  passenger_email   VARCHAR(160) NULL,
  passenger_id_no   VARCHAR(50) NULL,
  seat_number       INT NULL,
  amount_rwf        INT NOT NULL,
  reference         VARCHAR(40) NOT NULL UNIQUE,
  status            ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ic_booking_trip    (trip_id),
  INDEX idx_ic_booking_user    (user_id),
  INDEX idx_ic_booking_status  (status),
  INDEX idx_ic_booking_created (created_at),
  FOREIGN KEY (trip_id) REFERENCES intercity_trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)           ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  VERIFY
-- ============================================================

SELECT 'ConnectRwanda AI schema ready.' AS status,
       COUNT(*) AS tables_created
  FROM information_schema.tables
 WHERE table_schema = 'routeview';

-- ============================================================
--  END OF FILE
--  Expected: 18 tables created
--  - 16 urban (RouteView)
--  - 2 interprovincial (Admin Dashboard + Passenger Ticketing)
-- ============================================================