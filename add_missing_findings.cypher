// Add missing reference nodes (MERGE to avoid duplicates)
MERGE (owasp04:OWASP {owasp_id: "A04:2021", name: "Insecure Design"})
MERGE (owasp08:OWASP {owasp_id: "A08:2021", name: "Software and Data Integrity Failures"})
MERGE (owasp09:OWASP {owasp_id: "A09:2021", name: "Security Logging and Monitoring Failures"})
MERGE (owasp10:OWASP {owasp_id: "A10:2021", name: "Server-Side Request Forgery (SSRF)"})
MERGE (cwe79:CWE {cwe_id: "CWE-79", name: "Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')"})
MERGE (cwe918:CWE {cwe_id: "CWE-918", name: "Server-Side Request Forgery (SSRF)"})
MERGE (cwe778:CWE {cwe_id: "CWE-778", name: "Insufficient Logging"})
MERGE (cwe73:CWE {cwe_id: "CWE-73", name: "External Control of File Name or Path"})
MERGE (snyk:Scanner {name: "Snyk", type: "SCA", description: "Software Composition Analysis"})
MERGE (custom:Scanner {name: "Custom-Probe", type: "Custom", description: "Custom security probe"})
MERGE (burp:Scanner {name: "BurpSuite"})
MERGE (semgrep:Scanner {name: "Semgrep"})
MERGE (zap:Scanner {name: "OWASP ZAP"})
MERGE (mediaSvc:Service {name: "media-svc", type: "microservice"})
MERGE (authSvc:Service {name: "auth-svc"})
MERGE (orderSvc:Service {name: "order-svc"})
MERGE (frontend:Service {name: "frontend"})

// Add missing findings, assets, and relationships
// F-107
MERGE (f107:Finding {finding_id: "F-107"})
SET f107 += {
  title: "RCE in Spring Boot < 2.6.9 (auth-svc)",
  severity: "CRITICAL",
  description: "Same outdated Spring component as F-104, but in auth-svc image",
  timestamp: "2025-06-17T11:05:11Z",
  scan_id: "sbom-2025-06-17",
  detailed_description: "auth-svc:0.9.1 container uses Spring Framework 5.3.20, vulnerable to RCE issues.",
  exploitability: "High. Same as F-104.",
  affected_users: "All users of the platform are indirectly affected.",
  cvss_base_score: 9.8,
  cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  remediation_recommendation: "Upgrade Spring to a safe version.",
  remediation_complexity: "Medium",
  example_exploit_scenario: "Spring4Shell exploit tool targets auth-svc endpoint."
}
MERGE (asset107:Asset {type: "container_image", image: "auth-svc:0.9.1", registry: "ghcr.io/org/auth-svc"})
MERGE (pkgSpring:Package {name: "spring-web", version: "5.3.20", ecosystem: "maven"})
MERGE (f107)-[:DETECTED_BY]->(snyk)
MERGE (f107)-[:AFFECTS]->(asset107)
MERGE (f107)-[:DESCRIBES_CWE]->(cwe502)
MERGE (f107)-[:BELONGS_TO_OWASP]->(owasp06)
MERGE (f107)-[:USES_VULNERABLE_PACKAGE]->(pkgSpring)
MERGE (asset107)-[:BELONGS_TO_SERVICE]->(authSvc)

// F-108
MERGE (f108:Finding {finding_id: "F-108"})
SET f108 += {
  title: "Stored XSS in profile bio",
  severity: "HIGH",
  description: "<script> saved to /account/profile and reflected in other users' pages",
  timestamp: "2025-06-20T04:34:55Z",
  scan_id: "web-scan-2025-06-20",
  detailed_description: "Profile bio field allows stored XSS.",
  exploitability: "Relatively easy.",
  affected_users: "Any user who views content that includes the malicious profile bio.",
  cvss_base_score: 8.0,
  cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N",
  remediation_recommendation: "Implement robust output encoding and input validation.",
  remediation_complexity: "Medium",
  example_exploit_scenario: "Attacker injects <script> in bio, victim loads profile, script executes."
}
MERGE (asset108:Asset {type: "web_route", url: "https://shop.local/account/profile", service: "frontend"})
MERGE (f108)-[:DETECTED_BY]->(burp)
MERGE (f108)-[:AFFECTS]->(asset108)
MERGE (f108)-[:DESCRIBES_CWE]->(cwe79)
MERGE (f108)-[:BELONGS_TO_OWASP]->(owasp04)
MERGE (asset108)-[:BELONGS_TO_SERVICE]->(frontend)

// F-109
MERGE (f109:Finding {finding_id: "F-109"})
SET f109 += {
  title: "Audit logging disabled in order-svc",
  severity: "MEDIUM",
  description: "logging.level=OFF in application.properties",
  timestamp: "2025-06-15T13:12:02Z",
  scan_id: "cloud-meta-2025-06-15",
  detailed_description: "order-svc application has logging level OFF.",
  exploitability: "N/A in the traditional sense.",
  affected_users: "All users are indirectly affected.",
  cvss_base_score: 3.6,
  cvss_vector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
  remediation_recommendation: "Enable appropriate logging on order-svc.",
  remediation_complexity: "Low",
  example_exploit_scenario: "Attacker exploits F-101 and F-104, goes undetected due to no logs."
}
MERGE (asset109:Asset {type: "container_image", image: "order-svc:1.1.0"})
MERGE (f109)-[:DETECTED_BY]->(custom)
MERGE (f109)-[:AFFECTS]->(asset109)
MERGE (f109)-[:DESCRIBES_CWE]->(cwe778)
MERGE (f109)-[:BELONGS_TO_OWASP]->(owasp09)
MERGE (asset109)-[:BELONGS_TO_SERVICE]->(orderSvc)

// F-110
MERGE (f110:Finding {finding_id: "F-110"})
SET f110 += {
  title: "SSRF via image upload feature",
  severity: "HIGH",
  description: "/api/v1/upload fetches external URL without whitelist",
  timestamp: "2025-06-20T04:38:29Z",
  scan_id: "web-scan-2025-06-20",
  detailed_description: "File upload API accepts a URL and fetches it, vulnerable to SSRF.",
  exploitability: "Easy.",
  affected_users: "All users of the service are affected.",
  cvss_base_score: 9.1,
  cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N",
  remediation_recommendation: "Implement strict input validation and handling for any URL fetch.",
  remediation_complexity: "Medium",
  example_exploit_scenario: "Attacker uses upload to fetch AWS metadata URL, gets credentials."
}
MERGE (asset110:Asset {type: "api_endpoint", url: "https://api.shop.local/v1/upload", service: "media-svc"})
MERGE (f110)-[:DETECTED_BY]->(burp)
MERGE (f110)-[:AFFECTS]->(asset110)
MERGE (f110)-[:DESCRIBES_CWE]->(cwe918)
MERGE (f110)-[:BELONGS_TO_OWASP]->(owasp10)
MERGE (asset110)-[:BELONGS_TO_SERVICE]->(mediaSvc)

// F-111
MERGE (f111:Finding {finding_id: "F-111"})
SET f111 += {
  title: "Insecure deserialization of JWTs",
  severity: "HIGH",
  description: "eval(atob(jwt.payload)) pattern in tokenUtil.js",
  timestamp: "2025-06-18T22:51:10Z",
  scan_id: "code-2025-06-18",
  detailed_description: "tokenUtil.js uses eval on JWT payload, leading to RCE.",
  exploitability: "High, if attacker can manipulate JWT.",
  affected_users: "All users are indirectly at risk.",
  cvss_base_score: 9.8,
  cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  remediation_recommendation: "Never use eval on JWT data.",
  remediation_complexity: "Low",
  example_exploit_scenario: "Attacker crafts JWT with malicious payload, server evals it."
}
MERGE (asset111:Asset {type: "source_file", path: "services/auth-svc/src/utils/tokenUtil.js", repo: "github.com/org/shop"})
MERGE (f111)-[:DETECTED_BY]->(semgrep)
MERGE (f111)-[:AFFECTS]->(asset111)
MERGE (f111)-[:DESCRIBES_CWE]->(cwe502)
MERGE (f111)-[:BELONGS_TO_OWASP]->(owasp08)
MERGE (asset111)-[:BELONGS_TO_SERVICE]->(authSvc)

// F-112
MERGE (f112:Finding {finding_id: "F-112"})
SET f112 += {
  title: "Path traversal in download endpoint",
  severity: "HIGH",
  description: "../../etc/passwd readable via file param",
  timestamp: "2025-06-20T04:41:17Z",
  scan_id: "web-scan-2025-06-20",
  detailed_description: "Download API vulnerable to path traversal.",
  exploitability: "Very easy.",
  affected_users: "All users could be indirectly affected.",
  cvss_base_score: 7.5,
  cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
  remediation_recommendation: "Implement strict validation or sanitization on the file parameter.",
  remediation_complexity: "Low",
  example_exploit_scenario: "Attacker requests ../../etc/passwd, retrieves sensitive file."
}
MERGE (asset112:Asset {type: "api_endpoint", url: "https://api.shop.local/v1/download", service: "media-svc"})
MERGE (f112)-[:DETECTED_BY]->(zap)
MERGE (f112)-[:AFFECTS]->(asset112)
MERGE (f112)-[:DESCRIBES_CWE]->(cwe73)
MERGE (f112)-[:BELONGS_TO_OWASP]->(owasp03)
MERGE (asset112)-[:BELONGS_TO_SERVICE]->(mediaSvc) 