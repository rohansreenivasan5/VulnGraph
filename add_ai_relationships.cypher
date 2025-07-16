// ========================================
// AI-Enhanced Relationship Generation
// ========================================
// Add intelligent relationships for all findings based on research data analysis

// Root Cause Analysis - vulnerabilities with similar root causes
// F-107: Same Spring vulnerability as F-104
MERGE (f107:Finding {finding_id: "F-107"})
MERGE (f104:Finding {finding_id: "F-104"})
CREATE (f107)-[:SAME_ROOT_CAUSE {reason: "Outdated Spring Framework component"}]->(f104)
CREATE (f104)-[:SAME_ROOT_CAUSE {reason: "Outdated Spring Framework component"}]->(f107)

// F-111: Same deserialization issue as F-104/F-107
MERGE (f111:Finding {finding_id: "F-111"})
CREATE (f111)-[:SAME_ROOT_CAUSE {reason: "Insecure deserialization"}]->(f104)
CREATE (f111)-[:SAME_ROOT_CAUSE {reason: "Insecure deserialization"}]->(f107)
CREATE (f104)-[:SAME_ROOT_CAUSE {reason: "Insecure deserialization"}]->(f111)
CREATE (f107)-[:SAME_ROOT_CAUSE {reason: "Insecure deserialization"}]->(f111)

// F-108: Same input validation failure as F-101
MERGE (f108:Finding {finding_id: "F-108"})
MERGE (f101:Finding {finding_id: "F-101"})
CREATE (f108)-[:SAME_ROOT_CAUSE {reason: "Input validation failure"}]->(f101)
CREATE (f101)-[:SAME_ROOT_CAUSE {reason: "Input validation failure"}]->(f108)

// F-112: Same injection pattern as F-101
MERGE (f112:Finding {finding_id: "F-112"})
CREATE (f112)-[:SAME_ROOT_CAUSE {reason: "Injection vulnerability"}]->(f101)
CREATE (f101)-[:SAME_ROOT_CAUSE {reason: "Injection vulnerability"}]->(f112)

// F-110: Same configuration issue as F-105
MERGE (f110:Finding {finding_id: "F-110"})
MERGE (f105:Finding {finding_id: "F-105"})
CREATE (f110)-[:SAME_ROOT_CAUSE {reason: "Security misconfiguration"}]->(f105)
CREATE (f105)-[:SAME_ROOT_CAUSE {reason: "Security misconfiguration"}]->(f110)

// Similarity Relationships - vulnerabilities that are similar in nature
// F-107: Similar to F-104 (both Spring RCE)
CREATE (f107)-[:SIMILAR_TO {similarity_score: 0.95, reason: "Identical Spring vulnerability in different services"}]->(f104)
CREATE (f104)-[:SIMILAR_TO {similarity_score: 0.95, reason: "Identical Spring vulnerability in different services"}]->(f107)

// F-111: Similar to F-107 (both in auth-svc, both RCE)
CREATE (f111)-[:SIMILAR_TO {similarity_score: 0.85, reason: "Both are RCE vulnerabilities in auth-svc"}]->(f107)
CREATE (f107)-[:SIMILAR_TO {similarity_score: 0.85, reason: "Both are RCE vulnerabilities in auth-svc"}]->(f111)

// F-108: Similar to F-112 (both injection attacks)
CREATE (f108)-[:SIMILAR_TO {similarity_score: 0.75, reason: "Both are injection attacks (XSS vs Path Traversal)"}]->(f112)
CREATE (f112)-[:SIMILAR_TO {similarity_score: 0.75, reason: "Both are injection attacks (XSS vs Path Traversal)"}]->(f108)

// F-109: Similar to F-105 (both configuration issues)
CREATE (f109)-[:SIMILAR_TO {similarity_score: 0.70, reason: "Both are security misconfiguration issues"}]->(f105)
CREATE (f105)-[:SIMILAR_TO {similarity_score: 0.70, reason: "Both are security misconfiguration issues"}]->(f109)

// F-110: Similar to F-101 (both can lead to data extraction)
CREATE (f110)-[:SIMILAR_TO {similarity_score: 0.65, reason: "Both can be used for data extraction"}]->(f101)
CREATE (f101)-[:SIMILAR_TO {similarity_score: 0.65, reason: "Both can be used for data extraction"}]->(f110)

// Exploit Chain Relationships - vulnerabilities that can be chained together
// F-110 -> F-101: SSRF can lead to SQL injection
CREATE (f110)-[:EXPLOIT_CHAIN {chain_type: "Data extraction", description: "SSRF can be used to access internal endpoints that may have SQL injection"}]->(f101)

// F-112 -> F-103: Path traversal can expose password hashes
CREATE (f112)-[:EXPLOIT_CHAIN {chain_type: "Credential theft", description: "Path traversal can access config files containing database credentials, leading to password hash exposure"}]->(f103)

// F-107 -> F-111: Spring RCE can lead to JWT manipulation
CREATE (f107)-[:EXPLOIT_CHAIN {chain_type: "Authentication bypass", description: "Spring RCE in auth-svc can lead to JWT manipulation"}]->(f111)

// F-108 -> F-102: XSS can lead to session hijacking
CREATE (f108)-[:EXPLOIT_CHAIN {chain_type: "Session hijacking", description: "Stored XSS can steal session cookies, exploiting predictable session IDs"}]->(f102)

// F-109 -> F-101: No logging can hide SQL injection
CREATE (f109)-[:EXPLOIT_CHAIN {chain_type: "Stealth exploitation", description: "Disabled logging allows SQL injection to go undetected"}]->(f101)

// F-109 -> F-104: No logging can hide Spring RCE
CREATE (f109)-[:EXPLOIT_CHAIN {chain_type: "Stealth exploitation", description: "Disabled logging allows Spring RCE to go undetected"}]->(f104)

// F-111 -> F-106: JWT manipulation can bypass access control
CREATE (f111)-[:EXPLOIT_CHAIN {chain_type: "Privilege escalation", description: "JWT manipulation can create admin tokens, bypassing broken access control"}]->(f106)

// Impact Correlation - vulnerabilities affecting the same business functions
// F-107 and F-111: Both affect authentication system
CREATE (f107)-[:IMPACT_CORRELATION {impact: "Authentication compromise", severity: "CRITICAL"}]->(f111)
CREATE (f111)-[:IMPACT_CORRELATION {impact: "Authentication compromise", severity: "CRITICAL"}]->(f107)

// F-101 and F-110: Both can lead to data breach
CREATE (f101)-[:IMPACT_CORRELATION {impact: "Data breach", severity: "CRITICAL"}]->(f110)
CREATE (f110)-[:IMPACT_CORRELATION {impact: "Data breach", severity: "CRITICAL"}]->(f101)

// F-103 and F-112: Both can expose sensitive data
CREATE (f103)-[:IMPACT_CORRELATION {impact: "Sensitive data exposure", severity: "HIGH"}]->(f112)
CREATE (f112)-[:IMPACT_CORRELATION {impact: "Sensitive data exposure", severity: "HIGH"}]->(f103)

// F-108 and F-106: Both can lead to account takeover
CREATE (f108)-[:IMPACT_CORRELATION {impact: "Account takeover", severity: "HIGH"}]->(f106)
CREATE (f106)-[:IMPACT_CORRELATION {impact: "Account takeover", severity: "HIGH"}]->(f108)

// F-109 and F-104: Both affect order-svc
CREATE (f109)-[:IMPACT_CORRELATION {impact: "Order service compromise", severity: "HIGH"}]->(f104)
CREATE (f104)-[:IMPACT_CORRELATION {impact: "Order service compromise", severity: "HIGH"}]->(f109)

// F-105 and F-110: Both affect API gateway
CREATE (f105)-[:IMPACT_CORRELATION {impact: "API gateway compromise", severity: "HIGH"}]->(f110)
CREATE (f110)-[:IMPACT_CORRELATION {impact: "API gateway compromise", severity: "HIGH"}]->(f105)

// Cross-service impact relationships
// F-107 and F-104: Both affect critical services
CREATE (f107)-[:IMPACT_CORRELATION {impact: "Critical service compromise", severity: "CRITICAL"}]->(f104)
CREATE (f104)-[:IMPACT_CORRELATION {impact: "Critical service compromise", severity: "CRITICAL"}]->(f107)

// F-101 and F-103: Both affect data integrity
CREATE (f101)-[:IMPACT_CORRELATION {impact: "Data integrity breach", severity: "CRITICAL"}]->(f103)
CREATE (f103)-[:IMPACT_CORRELATION {impact: "Data integrity breach", severity: "CRITICAL"}]->(f101)

// F-102 and F-108: Both affect user sessions
CREATE (f102)-[:IMPACT_CORRELATION {impact: "Session compromise", severity: "HIGH"}]->(f108)
CREATE (f108)-[:IMPACT_CORRELATION {impact: "Session compromise", severity: "HIGH"}]->(f102) 