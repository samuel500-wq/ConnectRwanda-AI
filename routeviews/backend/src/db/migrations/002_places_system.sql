-- Additive. Does NOT drop or modify any existing table.
-- Apply once: mysql -u root routeview < src\db\migrations\002_places_system.sql

CREATE TABLE IF NOT EXISTS places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_rw VARCHAR(255) NULL,
  category VARCHAR(64) NOT NULL,
  description TEXT NULL,
  address VARCHAR(500) NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  phone VARCHAR(64) NULL,
  website VARCHAR(500) NULL,
  opening_hours VARCHAR(500) NULL,
  source ENUM('osm','community','business','import','seed') NOT NULL DEFAULT 'community',
  source_ref VARCHAR(255) NULL,
  status ENUM('pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
  owner_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_category (category),
  KEY idx_status (status),
  KEY idx_coords (lat, lng),
  KEY idx_owner (owner_user_id),
  KEY idx_name (name),
  KEY idx_source_ref (source, source_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS place_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id INT NOT NULL,
  url VARCHAR(1000) NOT NULL,
  uploaded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_place (place_id),
  CONSTRAINT fk_photos_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS place_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submitted_by INT NULL,
  kind ENUM('new','update') NOT NULL DEFAULT 'new',
  target_place_id INT NULL,
  payload JSON NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewer_id INT NULL,
  review_notes TEXT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_submitter (submitted_by),
  KEY idx_target (target_place_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS business_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id INT NOT NULL,
  claimant_user_id INT NOT NULL,
  evidence TEXT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewer_id INT NULL,
  review_notes TEXT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_place (place_id),
  KEY idx_claimant (claimant_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS staff_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_place_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_business (business_place_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS staff_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  business_place_id INT NOT NULL,
  action ENUM('in','out') NOT NULL,
  at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by INT NULL,
  note VARCHAR(500) NULL,
  KEY idx_staff (staff_id),
  KEY idx_business_at (business_place_id, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;