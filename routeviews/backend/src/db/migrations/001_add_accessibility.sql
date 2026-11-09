-- Additive migration. Does not drop or modify any existing table.
CREATE TABLE IF NOT EXISTS place_accessibility (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_source ENUM('internal','osm','manual') NOT NULL,
  place_external_id VARCHAR(128) NOT NULL,
  place_name VARCHAR(255) NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  wheelchair_accessible TINYINT(1) NULL,
  has_ramp TINYINT(1) NULL,
  has_accessible_toilet TINYINT(1) NULL,
  has_accessible_parking TINYINT(1) NULL,
  has_tactile_paving TINYINT(1) NULL,
  notes TEXT NULL,
  verification_source VARCHAR(255) NULL,
  verified_at DATETIME NULL,
  data_freshness_days INT DEFAULT 365,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_place (place_source, place_external_id),
  KEY idx_coords (lat, lng),
  KEY idx_accessible (wheelchair_accessible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;