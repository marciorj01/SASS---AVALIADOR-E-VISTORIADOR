-- Prumo — esquema MySQL local para XAMPP
-- Compatível com MySQL/MariaDB. Este script cria somente estrutura;
-- não contém senhas reais nem dados pessoais.

CREATE DATABASE IF NOT EXISTS prumo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prumo;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(160) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS profiles (
  id TINYINT UNSIGNED PRIMARY KEY,
  name VARCHAR(160) NOT NULL DEFAULT '',
  title VARCHAR(160) NOT NULL DEFAULT '',
  registry_label VARCHAR(40) NOT NULL DEFAULT '',
  registry_number VARCHAR(80) NOT NULL DEFAULT '',
  document VARCHAR(80) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  email VARCHAR(160) NOT NULL DEFAULT '',
  city VARCHAR(120) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  document VARCHAR(80) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  added_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inspections (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  client_id VARCHAR(64) NULL,
  client_name VARCHAR(160) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  city VARCHAR(120) NOT NULL DEFAULT '',
  cep VARCHAR(12) NULL,
  uf CHAR(2) NULL,
  service_type VARCHAR(120) NOT NULL DEFAULT '',
  status ENUM('agendada','campo','concluida') NOT NULL DEFAULT 'agendada',
  inspection_date DATE NOT NULL,
  notes TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inspection_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  INDEX idx_inspections_date (inspection_date),
  INDEX idx_inspections_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checklists (
  inspection_id VARCHAR(64) PRIMARY KEY,
  template VARCHAR(120) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_checklist_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checklist_rooms (
  id VARCHAR(64) PRIMARY KEY,
  inspection_id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  room_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_room_checklist FOREIGN KEY (inspection_id) REFERENCES checklists(inspection_id) ON DELETE CASCADE,
  INDEX idx_rooms_inspection_order (inspection_id, room_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checklist_items (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  condition_code VARCHAR(40) NOT NULL DEFAULT 'nao_verificado',
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  note TEXT NOT NULL,
  pending TINYINT(1) NOT NULL DEFAULT 0,
  damage_type VARCHAR(160) NULL,
  recommended_action TEXT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_item_room FOREIGN KEY (room_id) REFERENCES checklist_rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checklist_item_custom_values (
  item_id VARCHAR(64) NOT NULL,
  column_id VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (item_id, column_id),
  CONSTRAINT fk_custom_value_item FOREIGN KEY (item_id) REFERENCES checklist_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comparison_columns (
  id VARCHAR(100) PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  column_order INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS photos (
  id VARCHAR(64) PRIMARY KEY,
  inspection_id VARCHAR(64) NULL,
  room_id VARCHAR(64) NULL,
  checklist_item_id VARCHAR(64) NULL,
  source TEXT NOT NULL,
  caption VARCHAR(255) NOT NULL DEFAULT '',
  category VARCHAR(100) NOT NULL DEFAULT '',
  captured_at DATETIME NOT NULL,
  CONSTRAINT fk_photo_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
  CONSTRAINT fk_photo_room FOREIGN KEY (room_id) REFERENCES checklist_rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_photo_item FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE SET NULL,
  INDEX idx_photos_inspection (inspection_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS photo_notes (
  id VARCHAR(64) PRIMARY KEY,
  photo_id VARCHAR(64) NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_photo_note_photo FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS field_logs (
  inspection_id VARCHAR(64) PRIMARY KEY,
  phase ENUM('entrada','saida','conferencia') NOT NULL DEFAULT 'entrada',
  notes TEXT NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_field_log_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS field_readings (
  id VARCHAR(64) PRIMARY KEY,
  inspection_id VARCHAR(64) NOT NULL,
  meter_kind ENUM('agua','energia','gas') NOT NULL,
  meter_number VARCHAR(100) NOT NULL DEFAULT '',
  reading_value VARCHAR(80) NOT NULL DEFAULT '',
  unit VARCHAR(30) NOT NULL DEFAULT '',
  note TEXT NOT NULL,
  CONSTRAINT fk_reading_log FOREIGN KEY (inspection_id) REFERENCES field_logs(inspection_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS key_records (
  id VARCHAR(64) PRIMARY KEY,
  inspection_id VARCHAR(64) NOT NULL,
  label VARCHAR(120) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  status ENUM('entregue','pendente','nao_aplicavel') NOT NULL DEFAULT 'entregue',
  note TEXT NOT NULL,
  CONSTRAINT fk_key_log FOREIGN KEY (inspection_id) REFERENCES field_logs(inspection_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS measurements (
  id VARCHAR(64) PRIMARY KEY,
  inspection_id VARCHAR(64) NULL,
  label VARCHAR(180) NOT NULL,
  measurement_group VARCHAR(40) NOT NULL DEFAULT '',
  detail TEXT NOT NULL,
  area_m2 DECIMAL(14,4) NULL,
  measured_at DATETIME NOT NULL,
  CONSTRAINT fk_measurement_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assessments (
  id VARCHAR(64) PRIMARY KEY,
  inspection_id VARCHAR(64) NULL,
  purpose VARCHAR(180) NOT NULL DEFAULT '',
  property_type VARCHAR(100) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  city VARCHAR(120) NOT NULL DEFAULT '',
  cep VARCHAR(12) NULL,
  uf CHAR(2) NULL,
  area_m2 DECIMAL(14,4) NOT NULL DEFAULT 0,
  bedrooms INT NOT NULL DEFAULT 0,
  parking INT NOT NULL DEFAULT 0,
  conservation VARCHAR(80) NOT NULL DEFAULT '',
  topography VARCHAR(80) NOT NULL DEFAULT '',
  notes TEXT NOT NULL,
  requester VARCHAR(160) NULL,
  owner VARCHAR(160) NULL,
  document_reference VARCHAR(160) NULL,
  registration_office VARCHAR(160) NULL,
  inspection_date DATE NULL,
  reference_date DATE NULL,
  methodology VARCHAR(180) NULL,
  source_notes TEXT NULL,
  limitations TEXT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_assessment_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comparables (
  id VARCHAR(64) PRIMARY KEY,
  assessment_id VARCHAR(64) NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT '',
  source VARCHAR(180) NOT NULL DEFAULT '',
  collected_date DATE NOT NULL,
  price DECIMAL(16,2) NOT NULL DEFAULT 0,
  area_m2 DECIMAL(14,4) NOT NULL DEFAULT 0,
  location_factor DECIMAL(8,4) NOT NULL DEFAULT 1,
  conservation_factor DECIMAL(8,4) NOT NULL DEFAULT 1,
  offer_factor DECIMAL(8,4) NOT NULL DEFAULT 1,
  notes TEXT NOT NULL,
  property_type VARCHAR(100) NULL,
  excluded TINYINT(1) NOT NULL DEFAULT 0,
  saved_at DATETIME NULL,
  CONSTRAINT fk_comparable_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(64) PRIMARY KEY,
  text TEXT NOT NULL,
  activity_kind ENUM('calc','foto','vistoria','nota') NOT NULL,
  occurred_at DATETIME NOT NULL
) ENGINE=InnoDB;

-- Colunas padrão para uma instalação nova.
INSERT IGNORE INTO comparison_columns (id, label, enabled, column_order) VALUES
  ('ambiente', 'Ambiente', 1, 1),
  ('item', 'Item', 1, 2),
  ('entrada', 'Entrada', 1, 3),
  ('saida', 'Saída', 1, 4),
  ('resultado', 'Resultado', 1, 5),
  ('observacoes', 'Observações', 1, 6);

-- Verificação rápida após a importação.
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'prumo'
ORDER BY TABLE_NAME;
