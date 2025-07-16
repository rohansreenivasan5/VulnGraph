// ========================================
// VulnGraph Knowledge Graph Schema Setup
// ========================================

// Clear existing data (if any)
MATCH (n) DETACH DELETE n;

// ========================================
// CONSTRAINTS - Enforce data integrity
// ========================================

// Finding constraints
CREATE CONSTRAINT finding_id_unique IF NOT EXISTS FOR (f:Finding) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT finding_scan_id_unique IF NOT EXISTS FOR (f:Finding) REQUIRE f.scan_id IS UNIQUE;

// Vulnerability constraints  
CREATE CONSTRAINT vulnerability_owasp_unique IF NOT EXISTS FOR (v:Vulnerability) REQUIRE v.owasp_id IS UNIQUE;
CREATE CONSTRAINT vulnerability_owasp_cwe_unique IF NOT EXISTS FOR (v:Vulnerability) REQUIRE (v.owasp_id, v.cwe_id) IS UNIQUE;

// Asset constraints
CREATE CONSTRAINT asset_url_unique IF NOT EXISTS FOR (a:Asset) REQUIRE a.url IS UNIQUE;

// Service constraints
CREATE CONSTRAINT service_name_unique IF NOT EXISTS FOR (s:Service) REQUIRE s.name IS UNIQUE;

// Scanner constraints
CREATE CONSTRAINT scanner_name_unique IF NOT EXISTS FOR (sc:Scanner) REQUIRE sc.name IS UNIQUE;

// Package constraints
CREATE CONSTRAINT package_version_unique IF NOT EXISTS FOR (p:Package) REQUIRE (p.name, p.version, p.ecosystem) IS UNIQUE;

// ========================================
// INDEXES - Improve query performance
// ========================================

// Finding indexes
CREATE INDEX finding_severity_idx IF NOT EXISTS FOR (f:Finding) ON (f.severity);
CREATE INDEX finding_timestamp_idx IF NOT EXISTS FOR (f:Finding) ON (f.timestamp);
CREATE INDEX finding_scanner_idx IF NOT EXISTS FOR (f:Finding) ON (f.scanner);

// Vulnerability indexes
CREATE INDEX vulnerability_severity_idx IF NOT EXISTS FOR (v:Vulnerability) ON (v.severity);
CREATE INDEX vulnerability_vector_idx IF NOT EXISTS FOR (v:Vulnerability) ON (v.vector);

// Asset indexes
CREATE INDEX asset_type_idx IF NOT EXISTS FOR (a:Asset) ON (a.type);
CREATE INDEX asset_service_idx IF NOT EXISTS FOR (a:Asset) ON (a.service);

// Service indexes
CREATE INDEX service_type_idx IF NOT EXISTS FOR (s:Service) ON (s.type);

// CVSS indexes
CREATE INDEX cvss_score_idx IF NOT EXISTS FOR (c:CVSS) ON (c.base_score);

// ========================================
// VERIFICATION QUERIES
// ========================================

// Show all constraints
SHOW CONSTRAINTS;

// Show all indexes
SHOW INDEXES;

// Verify database is empty and ready
MATCH (n) RETURN count(n) as node_count; 