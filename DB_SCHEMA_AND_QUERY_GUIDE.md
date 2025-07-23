# VulnGraph Database Schema & Query Guide

## Overview
This document describes the current schema of the VulnGraph Neo4j knowledge graph, including all node types, relationships, key properties, and how to query the graph for vulnerability analysis. It is designed for both humans and LLMs to generate Cypher queries safely and effectively.

---

## 1. Node Types & Properties

### 1.1. **Finding**
Represents a unique vulnerability finding from a scan or research.
- **Properties:**
  - `finding_id` (string, unique)
  - `title` (string)
  - `severity` (string: CRITICAL, HIGH, MEDIUM, LOW)
  - `description` (string)
  - `detailed_description` (string)
  - `exploitability` (string)
  - `affected_users` (string)
  - `example_exploit_scenario` (string)
  - `timestamp` (datetime)
  - `scan_id` (string)
  - `scanner` (string)

### 1.2. **Asset**
Represents an affected resource (API, file, image, etc).
- **Properties:**
  - `type` (string: api_endpoint, web_route, source_file, container_image, etc)
  - `url` (string, for endpoints/routes)
  - `path` (string, for source files)
  - `image` (string, for container images)
  - `service` (string)
  - `cluster` (string, optional)
  - `repo` (string, optional)
  - `registry` (string, optional)

### 1.3. **Service**
Represents a logical or deployed service.
- **Properties:**
  - `name` (string, unique)
  - `type` (string: microservice, api_gateway, web_application, etc)

### 1.4. **Scanner**
Represents a tool or process that detected a finding.
- **Properties:**
  - `name` (string, unique)
  - `type` (string: DAST, SAST, Container, SCA, Custom, etc)

### 1.5. **OWASP**
Represents an OWASP Top 10 category.
- **Properties:**
  - `owasp_id` (string, unique)
  - `name` (string)

### 1.6. **CWE**
Represents a CWE (Common Weakness Enumeration) category.
- **Properties:**
  - `cwe_id` (string, unique)
  - `name` (string)

### 1.7. **Package**
Represents a software package involved in a finding.
- **Properties:**
  - `name` (string)
  - `version` (string)
  - `ecosystem` (string)

---

## 2. Relationship Types

### 2.1. **DETECTED_BY**
- `(Finding)-[:DETECTED_BY]->(Scanner)`
- Indicates which scanner/tool found the issue.

### 2.2. **AFFECTS**
- `(Finding)-[:AFFECTS]->(Asset)`
- The asset/resource affected by the finding.

### 2.3. **BELONGS_TO_SERVICE**
- `(Asset)-[:BELONGS_TO_SERVICE]->(Service)`
- Which service the asset is part of.

### 2.4. **DESCRIBES_CWE**
- `(Finding)-[:DESCRIBES_CWE]->(CWE)`
- CWE category for the finding.

### 2.5. **BELONGS_TO_OWASP**
- `(Finding)-[:BELONGS_TO_OWASP]->(OWASP)`
- OWASP Top 10 category for the finding.

### 2.6. **USES_VULNERABLE_PACKAGE**
- `(Finding)-[:USES_VULNERABLE_PACKAGE]->(Package)`
- The finding involves a vulnerable package.

### 2.7. **AI-ENHANCED RELATIONSHIPS**
- **SAME_ROOT_CAUSE**: `(Finding)-[:SAME_ROOT_CAUSE {reason}]->(Finding)`
- **SIMILAR_TO**: `(Finding)-[:SIMILAR_TO {similarity_score, reason}]->(Finding)`
- **EXPLOIT_CHAIN**: `(Finding)-[:EXPLOIT_CHAIN {chain_type}]->(Finding)`
- **IMPACT_CORRELATION**: `(Finding)-[:IMPACT_CORRELATION {impact}]->(Finding)`

---

## 3. Schema Diagram

```
graph TD
  F["Finding"] -- "AFFECTS" --> A["Asset"]
  F -- "DETECTED_BY" --> S["Scanner"]
  F -- "DESCRIBES_CWE" --> C["CWE"]
  F -- "BELONGS_TO_OWASP" --> O["OWASP"]
  F -- "USES_VULNERABLE_PACKAGE" --> P["Package"]
  A -- "BELONGS_TO_SERVICE" --> SV["Service"]
  F -- "SAME_ROOT_CAUSE/SIMILAR_TO/EXPLOIT_CHAIN/IMPACT_CORRELATION" --> F2["Finding"]
```

---

## 4. Querying the Graph: What You Can and Can't Do

### 4.1. **What You Can Do**
- **List all findings, assets, or services**
- **Find all findings for a given service, asset, or scanner**
- **Get all findings of a certain severity or type**
- **Trace exploit chains, root causes, or similar findings**
- **Map findings to OWASP/CWE categories**
- **Find all assets affected by critical findings**
- **Get all findings related to a specific package**
- **Explore AI-enhanced relationships (root cause, similarity, exploit chain, impact correlation)**
- **Aggregate findings by severity, scanner, or service**
- **Traverse from a finding to all related business impacts**

### 4.2. **What You Can't Do**
- **Query for data not present in the graph (e.g., user credentials, raw logs, or unrelated business data)**
- **Perform full-text search on arbitrary properties (unless indexed)**
- **Query for time series or historical changes unless explicitly modeled**
- **Directly update or delete nodes/relationships (read-only queries only)**
- **Assume every node has every property (always check for nulls/optionals)**

---

## 5. Sample Cypher Queries

### 5.1. **List all findings with severity CRITICAL**
```cypher
MATCH (f:Finding) WHERE f.severity = 'CRITICAL' RETURN f
```

### 5.2. **Find all assets affected by HIGH or CRITICAL findings**
```cypher
MATCH (f:Finding)-[:AFFECTS]->(a:Asset)
WHERE f.severity IN ['HIGH', 'CRITICAL']
RETURN f, a
```

### 5.3. **Get all findings for a given service**
```cypher
MATCH (f:Finding)-[:AFFECTS]->(a:Asset)-[:BELONGS_TO_SERVICE]->(s:Service)
WHERE s.name = 'order-svc'
RETURN f, a, s
```

### 5.4. **Show all findings related by root cause**
```cypher
MATCH (f1:Finding)-[r:SAME_ROOT_CAUSE]->(f2:Finding)
RETURN f1, r, f2
```

### 5.5. **Trace an exploit chain starting from a finding**
```cypher
MATCH path = (f:Finding {finding_id: 'F-101'})-[:EXPLOIT_CHAIN*1..3]->(next:Finding)
RETURN nodes(path), relationships(path)
```

### 5.6. **Aggregate findings by scanner**
```cypher
MATCH (f:Finding)-[:DETECTED_BY]->(s:Scanner)
RETURN s.name, count(f) as finding_count
ORDER BY finding_count DESC
```

### 5.7. **Find all findings mapped to a specific OWASP category**
```cypher
MATCH (f:Finding)-[:BELONGS_TO_OWASP]->(o:OWASP)
WHERE o.owasp_id = 'A03:2021'
RETURN f, o
```

### 5.8. **Get all similar findings to a given finding**
```cypher
MATCH (f:Finding {finding_id: 'F-101'})-[:SIMILAR_TO]->(other:Finding)
RETURN f, other
```

### 5.9. **Show all packages involved in findings**
```cypher
MATCH (f:Finding)-[:USES_VULNERABLE_PACKAGE]->(p:Package)
RETURN f, p
```

---

## 6. Best Practices for Querying
- Always check for optional properties (e.g., `a.url`, `a.path`, `a.image` may not all exist)
- Use `LIMIT` for large queries
- Use `ORDER BY` for sorting results
- Use relationship directionality as modeled (see above)
- For AI-enhanced relationships, always check for the relevant property (e.g., `reason`, `similarity_score`, `chain_type`, `impact`)
- Do not assume all nodes have all properties; use `coalesce()` or `CASE` for null handling
- Use indexes and constraints for efficient queries (see schema setup scripts)

---

## 7. Limitations & Gotchas
- The graph is **read-only** for LLMs and users (no mutation allowed)
- Not all findings have all relationships (e.g., not every finding is part of an exploit chain)
- Some assets may lack a `url`, `path`, or `image` (check type before using)
- Severity, scanner, and service names are case-sensitive
- The schema may evolve; always check for the latest version

---

## 8. Example: End-to-End Query
**"Show all critical findings in the order-svc, their affected assets, and any exploit chains they are part of."**
```cypher
MATCH (f:Finding)-[:AFFECTS]->(a:Asset)-[:BELONGS_TO_SERVICE]->(s:Service)
WHERE f.severity = 'CRITICAL' AND s.name = 'order-svc'
OPTIONAL MATCH (f)-[:EXPLOIT_CHAIN]->(next:Finding)
RETURN f.finding_id, f.title, a.type, a.url, a.path, a.image, next.finding_id as chained_finding
```

---

## 9. Schema Version
- **Last updated:** 2025-07-15
- **Contact:** VulnGraph maintainers 