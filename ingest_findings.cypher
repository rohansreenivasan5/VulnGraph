// ========================================
// VulnGraph Data Ingestion Script
// ========================================
// This script clears existing data and ingests findings from findings.json
// Run this script in Neo4j Browser or via Cypher shell

// ========================================
// STEP 1: Clear all existing data
// ========================================

// Delete all nodes and relationships
MATCH (n) DETACH DELETE n;

// ========================================
// STEP 2: Create constraints and indexes
// ========================================

// Create constraints for unique identifiers
CREATE CONSTRAINT finding_id_unique IF NOT EXISTS FOR (f:Finding) REQUIRE f.finding_id IS UNIQUE;
CREATE CONSTRAINT cwe_id_unique IF NOT EXISTS FOR (c:CWE) REQUIRE c.cwe_id IS UNIQUE;
CREATE CONSTRAINT owasp_id_unique IF NOT EXISTS FOR (o:OWASP) REQUIRE o.owasp_id IS UNIQUE;
CREATE CONSTRAINT scanner_name_unique IF NOT EXISTS FOR (s:Scanner) REQUIRE s.name IS UNIQUE;
CREATE CONSTRAINT service_name_unique IF NOT EXISTS FOR (svc:Service) REQUIRE svc.name IS UNIQUE;
CREATE CONSTRAINT asset_url_unique IF NOT EXISTS FOR (a:Asset) REQUIRE a.url IS UNIQUE;
CREATE CONSTRAINT package_name_version_unique IF NOT EXISTS FOR (p:Package) REQUIRE (p.name, p.version) IS UNIQUE;

// Create indexes for better query performance
CREATE INDEX finding_severity_idx IF NOT EXISTS FOR (f:Finding) ON (f.severity);
CREATE INDEX finding_timestamp_idx IF NOT EXISTS FOR (f:Finding) ON (f.timestamp);
CREATE INDEX asset_service_idx IF NOT EXISTS FOR (a:Asset) ON (a.service);

// ========================================
// STEP 3: Create canonical reference nodes
// ========================================

// Create CWE nodes
CREATE (cwe89:CWE {cwe_id: "CWE-89", name: "SQL Injection", description: "The software constructs all or part of an SQL command using externally-influenced input from an upstream component, but it does not neutralize or incorrectly neutralizes special elements that could modify the intended SQL command when it is sent to a downstream component."})
CREATE (cwe287:CWE {cwe_id: "CWE-287", name: "Improper Authentication", description: "When an actor claims to have a given identity, the software does not prove or insufficiently proves that the claim is correct."})
CREATE (cwe256:CWE {cwe_id: "CWE-256", name: "Plaintext Storage of Password", description: "Storing a password in plaintext may result in a system compromise."})
CREATE (cwe502:CWE {cwe_id: "CWE-502", name: "Deserialization of Untrusted Data", description: "The application deserializes untrusted data without sufficiently verifying that the resulting data will be valid."})
CREATE (cwe693:CWE {cwe_id: "CWE-693", name: "Protection Mechanism Failure", description: "The product does not use or incorrectly uses a protection mechanism that provides sufficient defense against directed attacks against the product."})
CREATE (cwe284:CWE {cwe_id: "CWE-284", name: "Improper Access Control", description: "The software does not restrict or incorrectly restricts access to a resource from an unauthorized actor."});

// Create OWASP nodes
CREATE (owasp03:OWASP {owasp_id: "A03:2021", name: "Injection", description: "Injection flaws, such as SQL, NoSQL, OS, and LDAP injection, occur when untrusted data is sent to an interpreter as part of a command or query."})
CREATE (owasp07:OWASP {owasp_id: "A07:2021", name: "Identification and Authentication Failures", description: "Confirmation of the user's identity, authentication, and session management is critical to protect against authentication-related attacks."})
CREATE (owasp02:OWASP {owasp_id: "A02:2021", name: "Cryptographic Failures", description: "Failures related to cryptography which often lead to exposure of sensitive data."})
CREATE (owasp06:OWASP {owasp_id: "A06:2021", name: "Vulnerable and Outdated Components", description: "Using components with known vulnerabilities can undermine application defenses and enable various attacks."})
CREATE (owasp05:OWASP {owasp_id: "A05:2021", name: "Security Misconfiguration", description: "Security misconfiguration is the most commonly seen issue."})
CREATE (owasp01:OWASP {owasp_id: "A01:2021", name: "Broken Access Control", description: "Access control enforces policy such that users cannot act outside of their intended permissions."});

// Create Scanner nodes
CREATE (zap:Scanner {name: "OWASP ZAP", type: "DAST", description: "Open source web application security scanner"})
CREATE (burp:Scanner {name: "BurpSuite", type: "DAST", description: "Web application security testing platform"})
CREATE (semgrep:Scanner {name: "Semgrep", type: "SAST", description: "Static analysis tool for finding bugs and enforcing code standards"})
CREATE (trivy:Scanner {name: "Trivy", type: "Container", description: "Comprehensive security scanner for vulnerabilities in container images"});

// Create Service nodes
CREATE (orderSvc:Service {name: "order-svc", type: "microservice", description: "Order management service"})
CREATE (authSvc:Service {name: "auth-svc", type: "microservice", description: "Authentication and authorization service"})
CREATE (gateway:Service {name: "gateway", type: "api_gateway", description: "API Gateway service"})
CREATE (frontend:Service {name: "frontend", type: "web_application", description: "Frontend web application"});

// Create Package nodes
CREATE (springWeb:Package {name: "spring-web", version: "5.3.20", ecosystem: "maven", description: "Spring Framework Web module"});

// ========================================
// STEP 4: Create Finding nodes and relationships
// ========================================

// Finding F-101: SQL Injection
CREATE (f101:Finding {
    finding_id: "F-101",
    title: "SQL Injection in order lookup",
    severity: "CRITICAL",
    description: "orderId parameter concatenated into raw SQL",
    timestamp: "2025-06-20T04:18:44Z",
    scan_id: "web-scan-2025-06-20",
    detailed_description: "An SQL Injection exists in the order lookup API, allowing malicious SQL code to be injected via the orderId parameter. This occurs because user input is directly concatenated into an SQL query without proper sanitization.",
    exploitability: "Easy – SQL injections are well-known and broadly exploitable with automated tools like sqlmap, or manually by crafting malicious SQL syntax.",
    affected_users: "All users of the application are at risk. If this order lookup can be accessed by customers, any attacker (or malicious user) could extract all customers' order data and related personal information.",
    cvss_base_score: 9.8,
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    remediation_recommendation: "Use parameterized queries or prepared statements instead of string concatenation. Implement strict server-side input validation and use an ORM or stored procedures that do not concatenate SQL.",
    remediation_complexity: "Low-to-Medium",
    example_exploit_scenario: "An attacker calls GET /api/v1/orders/1'%20OR%20'1'%3D'1 (which URL-decodes to 1' OR '1'='1). This modifies the SQL query to always be true, potentially dumping all order records."
})

// Create Asset for F-101
CREATE (asset101:Asset {
    type: "api_endpoint",
    url: "https://shop.local/api/v1/orders/{orderId}",
    service: "order-svc",
    cluster: "prod-gke"
})

// Create relationships for F-101
CREATE (f101)-[:DETECTED_BY]->(zap)
CREATE (f101)-[:AFFECTS]->(asset101)
CREATE (f101)-[:DESCRIBES_CWE]->(cwe89)
CREATE (f101)-[:BELONGS_TO_OWASP]->(owasp03)
CREATE (asset101)-[:BELONGS_TO_SERVICE]->(orderSvc)

// Finding F-102: Predictable session IDs
CREATE (f102:Finding {
    finding_id: "F-102",
    title: "Predictable session IDs",
    severity: "HIGH",
    description: "SESSIONID is incremental; entropy < 32 bits",
    timestamp: "2025-06-20T04:23:12Z",
    scan_id: "web-scan-2025-06-20",
    detailed_description: "The application's session identifiers appear to be predictable or have low entropy. Specifically, the SESSIONID values are incremental or otherwise sequential, implying fewer than 2^32 possible values.",
    exploitability: "Easy to Moderate. If the pattern of session IDs is truly incremental or guessable, an attacker can write a simple script to cycle through possible session tokens.",
    affected_users: "Potentially all users of the system are affected. Any active session could be taken over by an attacker who predicts its token.",
    cvss_base_score: 9.8,
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    remediation_recommendation: "Use cryptographically secure, high-entropy session identifiers. Session IDs should be at least 128 bits of entropy and not sequential.",
    remediation_complexity: "Low",
    example_exploit_scenario: "After logging in, a user observes their SESSIONID cookie is ABC123000. The attacker notices another user's session ID was ABC123005. Recognizing the pattern, the attacker guesses that session ABC123004 might be valid."
})

// Create Asset for F-102
CREATE (asset102:Asset {
    type: "web_route",
    url: "https://shop.local/login",
    service: "auth-svc"
})

// Create relationships for F-102
CREATE (f102)-[:DETECTED_BY]->(burp)
CREATE (f102)-[:AFFECTS]->(asset102)
CREATE (f102)-[:DESCRIBES_CWE]->(cwe287)
CREATE (f102)-[:BELONGS_TO_OWASP]->(owasp07)
CREATE (asset102)-[:BELONGS_TO_SERVICE]->(authSvc)

// Finding F-103: Passwords stored as MD5 hashes
CREATE (f103:Finding {
    finding_id: "F-103",
    title: "Passwords stored as MD5 hashes",
    severity: "HIGH",
    description: "crypto.createHash('md5') spotted in userModel.js",
    timestamp: "2025-06-18T22:51:10Z",
    scan_id: "code-2025-06-18",
    detailed_description: "The authentication service stores passwords using MD5 hashes, which is a weak and cryptographically broken hashing algorithm for passwords. MD5 hashes are fast to compute and have known vulnerabilities.",
    exploitability: "Moderate. On its own, stored MD5 hashes require the attacker to first obtain the hash data. However, if hashes are obtained, cracking them is highly feasible.",
    affected_users: "Potentially every user in the system. All stored passwords are inadequately protected. In the event of a breach, user accounts can be compromised.",
    cvss_base_score: 7.4,
    cvss_vector: "CVSS:3.1/AV:L/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N",
    remediation_recommendation: "Use a strong hashing algorithm with salt and key stretching (e.g., bcrypt, Argon2, or PBKDF2) for password storage.",
    remediation_complexity: "Medium",
    example_exploit_scenario: "A database backup is accidentally exposed or stolen. The attacker finds a table Users with usernames and password hashes. The hashes are in MD5, identifiable by their 32-character hex format."
})

// Create Asset for F-103
CREATE (asset103:Asset {
    type: "source_file",
    path: "services/auth-svc/src/models/userModel.js",
    repo: "github.com/org/shop",
    service: "auth-svc"
})

// Create relationships for F-103
CREATE (f103)-[:DETECTED_BY]->(semgrep)
CREATE (f103)-[:AFFECTS]->(asset103)
CREATE (f103)-[:DESCRIBES_CWE]->(cwe256)
CREATE (f103)-[:BELONGS_TO_OWASP]->(owasp02)
CREATE (asset103)-[:BELONGS_TO_SERVICE]->(authSvc)

// Finding F-104: RCE in Spring Boot
CREATE (f104:Finding {
    finding_id: "F-104",
    title: "RCE in Spring Boot < 2.6.9",
    severity: "CRITICAL",
    description: "Outdated component org.springframework:spring-web 5.3.20",
    timestamp: "2025-06-17T11:05:11Z",
    scan_id: "image-2025-06-17",
    detailed_description: "The order-svc:1.1.0 container includes Spring Framework (spring-web 5.3.20) which is vulnerable to a known Remote Code Execution (RCE) flaw. Specifically, Spring Boot versions < 2.6.9 are affected by critical exploits.",
    exploitability: "High. Exploits for these Spring vulnerabilities are publicly available and were actively used in the wild soon after disclosure.",
    affected_users: "All functionality of the order-svc and any data it manages are at risk. An attacker gaining RCE on this service could access all orders data.",
    cvss_base_score: 9.8,
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    remediation_recommendation: "Upgrade the Spring Boot/Spring Framework library to a patched version. For Spring4Shell, the issue is fixed in Spring Framework 5.3.18+ and 5.2.20+.",
    remediation_complexity: "Medium",
    example_exploit_scenario: "An attacker finds that the order-svc is using Spring Boot 2.6.0. They craft a malicious HTTP request exploiting Spring4Shell: for example, sending a specially crafted form submission that triggers object binding."
})

// Create Asset for F-104
CREATE (asset104:Asset {
    type: "container_image",
    image: "order-svc:1.1.0",
    registry: "ghcr.io/org/order-svc",
    service: "order-svc"
})

// Create relationships for F-104
CREATE (f104)-[:DETECTED_BY]->(trivy)
CREATE (f104)-[:AFFECTS]->(asset104)
CREATE (f104)-[:DESCRIBES_CWE]->(cwe502)
CREATE (f104)-[:BELONGS_TO_OWASP]->(owasp06)
CREATE (f104)-[:USES_VULNERABLE_PACKAGE]->(springWeb)
CREATE (asset104)-[:BELONGS_TO_SERVICE]->(orderSvc)

// ========================================
// STEP 5: Create additional findings from research.json
// ========================================

// Finding F-105: CORS misconfiguration
CREATE (f105:Finding {
    finding_id: "F-105",
    title: "CORS misconfiguration allows `*` origin with credentials",
    severity: "HIGH",
    description: "`Access-Control-Allow-Credentials: true` with wildcard Origin",
    timestamp: "2025-06-20T04:26:49Z",
    scan_id: "web-scan-2025-06-20",
    detailed_description: "The API gateway is misconfigured to allow Cross-Origin Resource Sharing (CORS) from any origin while also permitting credentials. This configuration is inherently insecure.",
    exploitability: "Moderate. The attacker must lure a victim (who is logged into shop.local) to visit an attacker-controlled web page.",
    affected_users: "Any user of the application who can be tricked into visiting an untrusted website is at risk.",
    cvss_base_score: 6.5,
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N",
    remediation_recommendation: "Fix the CORS headers to be restrictive. If credentials are allowed, do not use `*` as the allowed origin. Instead, explicitly specify trusted origins.",
    remediation_complexity: "Low",
    example_exploit_scenario: "The attacker creates a malicious page and tricks a logged-in user to visit it. The page contains a script that silently invokes the shop.local API using the user's session cookie."
})

// Create Asset for F-105
CREATE (asset105:Asset {
    type: "api_endpoint",
    url: "https://api.shop.local/*",
    service: "gateway"
})

// Create relationships for F-105
CREATE (f105)-[:DETECTED_BY]->(zap)
CREATE (f105)-[:AFFECTS]->(asset105)
CREATE (f105)-[:DESCRIBES_CWE]->(cwe693)
CREATE (f105)-[:BELONGS_TO_OWASP]->(owasp05)
CREATE (asset105)-[:BELONGS_TO_SERVICE]->(gateway)

// Finding F-106: Broken access control
CREATE (f106:Finding {
    finding_id: "F-106",
    title: "Broken access control on Admin panel",
    severity: "CRITICAL",
    description: "`/admin/*` accessible to unauthenticated users",
    timestamp: "2025-06-20T04:30:01Z",
    scan_id: "web-scan-2025-06-20",
    detailed_description: "The application's admin interface lacks proper access control, meaning unauthenticated users can access admin-only pages or functionality.",
    exploitability: "Trivial. An attacker simply needs to know or guess the URL of admin pages. There is no login required.",
    affected_users: "All users and the application as a whole. If an attacker can act as an admin, they can likely read any user's data, change any content, or take the application offline.",
    cvss_base_score: 10.0,
    cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    remediation_recommendation: "Immediately enforce authentication and authorization on all admin routes. The `/admin` section should require a logged-in account with an admin role.",
    remediation_complexity: "Low",
    example_exploit_scenario: "An attacker visits `https://shop.local/admin` and finds that the admin dashboard loads without any login prompt. They can manage users and orders without authentication."
})

// Create Asset for F-106
CREATE (asset106:Asset {
    type: "web_route",
    url: "https://shop.local/admin",
    service: "frontend"
})

// Create relationships for F-106
CREATE (f106)-[:DETECTED_BY]->(zap)
CREATE (f106)-[:AFFECTS]->(asset106)
CREATE (f106)-[:DESCRIBES_CWE]->(cwe284)
CREATE (f106)-[:BELONGS_TO_OWASP]->(owasp01)
CREATE (asset106)-[:BELONGS_TO_SERVICE]->(frontend)

// ========================================
// STEP 6: Create AI-enhanced relationships
// ========================================

// Root cause relationships - vulnerabilities with similar root causes
CREATE (f101)-[:SAME_ROOT_CAUSE {reason: "Input validation failure"}]->(f102)
CREATE (f101)-[:SAME_ROOT_CAUSE {reason: "Input validation failure"}]->(f105)
CREATE (f102)-[:SAME_ROOT_CAUSE {reason: "Authentication/Authorization failure"}]->(f106)
CREATE (f103)-[:SAME_ROOT_CAUSE {reason: "Cryptographic weakness"}]->(f102)

// Similarity relationships - vulnerabilities that are similar in nature
CREATE (f101)-[:SIMILAR_TO {similarity_score: 0.8, reason: "Both are injection attacks"}]->(f104)
CREATE (f102)-[:SIMILAR_TO {similarity_score: 0.7, reason: "Both involve session/authentication issues"}]->(f106)
CREATE (f103)-[:SIMILAR_TO {similarity_score: 0.6, reason: "Both are cryptographic failures"}]->(f102)

// Exploit chain relationships - vulnerabilities that can be chained together
CREATE (f101)-[:EXPLOIT_CHAIN {chain_type: "Data extraction"}]->(f103)
CREATE (f105)-[:EXPLOIT_CHAIN {chain_type: "Session hijacking"}]->(f102)
CREATE (f106)-[:EXPLOIT_CHAIN {chain_type: "Privilege escalation"}]->(f101)

// Impact correlation - vulnerabilities affecting the same business functions
CREATE (f101)-[:IMPACT_CORRELATION {impact: "Data breach"}]->(f103)
CREATE (f102)-[:IMPACT_CORRELATION {impact: "Account takeover"}]->(f106)
CREATE (f104)-[:IMPACT_CORRELATION {impact: "Service compromise"}]->(f101)

// ========================================
// STEP 7: Verification queries
// ========================================

WITH 1 as dummy
// Return summary of created data
MATCH (f:Finding)
WITH count(DISTINCT f) as total_findings
MATCH (c:CWE)
WITH total_findings, count(DISTINCT c) as total_cwes
MATCH (o:OWASP)
WITH total_findings, total_cwes, count(DISTINCT o) as total_owasp
MATCH (s:Scanner)
WITH total_findings, total_cwes, total_owasp, count(DISTINCT s) as total_scanners
MATCH (svc:Service)
WITH total_findings, total_cwes, total_owasp, total_scanners, count(DISTINCT svc) as total_services
MATCH (a:Asset)
WITH total_findings, total_cwes, total_owasp, total_scanners, total_services, count(DISTINCT a) as total_assets
MATCH (p:Package)
RETURN
  'Data ingestion complete!' as status,
  total_findings,
  total_cwes,
  total_owasp,
  total_scanners,
  total_services,
  total_assets,
  count(DISTINCT p) as total_packages; 