-- Prumo — extensão multitenant para MySQL/MariaDB
-- Executar somente depois de importar database/prumo.sql no banco prumo.
-- Revisar nomes e políticas antes de usar em produção.
USE prumo;

CREATE TABLE IF NOT EXISTS organizations (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  legal_name VARCHAR(220) NULL,
  document VARCHAR(40) NULL,
  status ENUM('trial','active','suspended','cancelled') NOT NULL DEFAULT 'trial',
  plan_code VARCHAR(60) NOT NULL DEFAULT 'standard',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_organization_document (document)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS master_accounts (
  id CHAR(36) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  status ENUM('active','blocked') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_master_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_master_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resellers (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NULL,
  name VARCHAR(180) NOT NULL,
  legal_name VARCHAR(220) NULL,
  document VARCHAR(40) NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  commission_percent DECIMAL(6,3) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reseller_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  UNIQUE KEY uq_reseller_document (document),
  UNIQUE KEY uq_reseller_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS affiliates (
  id CHAR(36) PRIMARY KEY,
  reseller_id CHAR(36) NULL,
  name VARCHAR(180) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NULL,
  referral_code VARCHAR(60) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  commission_percent DECIMAL(6,3) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_affiliate_reseller FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE SET NULL,
  UNIQUE KEY uq_affiliate_email (email),
  UNIQUE KEY uq_affiliate_code (referral_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organization_partners (
  organization_id CHAR(36) NOT NULL,
  reseller_id CHAR(36) NULL,
  affiliate_id CHAR(36) NULL,
  relationship_status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, reseller_id, affiliate_id),
  CONSTRAINT fk_partner_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_partner_reseller FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE CASCADE,
  CONSTRAINT fk_partner_affiliate FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organization_users (
  organization_id CHAR(36) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  status ENUM('invited','active','suspended','removed') NOT NULL DEFAULT 'invited',
  invited_by VARCHAR(64) NULL,
  joined_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id),
  CONSTRAINT fk_org_user_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_user_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_user_inviter FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NULL,
  code VARCHAR(60) NOT NULL,
  label VARCHAR(120) NOT NULL,
  system_role TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_role_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY uq_role_org_code (organization_id, code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE,
  label VARCHAR(180) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  organization_id CHAR(36) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  role_id CHAR(36) NOT NULL,
  granted_by VARCHAR(64) NULL,
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id, role_id),
  CONSTRAINT fk_user_role_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_granter FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  plan_code VARCHAR(60) NOT NULL,
  status ENUM('trial','active','past_due','cancelled','ended') NOT NULL DEFAULT 'trial',
  started_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  external_reference VARCHAR(160) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscription_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_subscription_org_status (organization_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS financial_transactions (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NULL,
  reseller_id CHAR(36) NULL,
  affiliate_id CHAR(36) NULL,
  subscription_id CHAR(36) NULL,
  transaction_type ENUM('charge','payment','refund','commission','adjustment') NOT NULL,
  status ENUM('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
  amount DECIMAL(16,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  due_at DATE NULL,
  paid_at DATETIME NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  external_reference VARCHAR(160) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_finance_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_reseller FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_affiliate FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  INDEX idx_finance_org_date (organization_id, created_at),
  INDEX idx_finance_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trash_items (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  entity_label VARCHAR(255) NOT NULL DEFAULT '',
  snapshot_json LONGTEXT NOT NULL,
  deleted_by VARCHAR(64) NOT NULL,
  deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletion_reason VARCHAR(255) NOT NULL DEFAULT '',
  restored_by VARCHAR(64) NULL,
  restored_at DATETIME NULL,
  permanently_deleted_by VARCHAR(64) NULL,
  permanently_deleted_at DATETIME NULL,
  CONSTRAINT fk_trash_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  CONSTRAINT fk_trash_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_trash_restored_by FOREIGN KEY (restored_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_trash_permanent_by FOREIGN KEY (permanently_deleted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_trash_org_date (organization_id, deleted_at),
  INDEX idx_trash_entity (entity_type, entity_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS access_logs (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NULL,
  user_id VARCHAR(64) NULL,
  event_code VARCHAR(100) NOT NULL,
  outcome ENUM('success','failure','pending') NOT NULL DEFAULT 'success',
  resource_type VARCHAR(80) NULL,
  resource_id VARCHAR(64) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  request_id VARCHAR(80) NULL,
  metadata_json JSON NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_access_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  CONSTRAINT fk_access_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_access_org_date (organization_id, occurred_at),
  INDEX idx_access_user_date (user_id, occurred_at),
  INDEX idx_access_event (event_code, occurred_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resource_assignments (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  access_level ENUM('view','edit','manage') NOT NULL DEFAULT 'view',
  assigned_by VARCHAR(64) NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignment_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_assigner FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_assignment_resource_user (organization_id, user_id, resource_type, resource_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS share_links (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  permission ENUM('view','download','sign') NOT NULL DEFAULT 'view',
  created_by VARCHAR(64) NOT NULL,
  expires_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_share_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_share_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_share_token_hash (token_hash)
) ENGINE=InnoDB;

-- Papéis de sistema. Os IDs devem ser UUIDs gerados pela aplicação no provisionamento.
-- Não inserir usuários ou credenciais reais neste script.
