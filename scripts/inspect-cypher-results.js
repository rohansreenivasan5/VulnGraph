#!/usr/bin/env node

/**
 * Script to inspect the structure of Neo4j Cypher query results
 * This helps us understand what the actual data looks like before transforming it
 */

// Load environment variables from .env file if it exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key] = value;
    }
  });
}

// Since we can't directly require TypeScript files, we'll use a simpler approach
const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('❌ Missing Neo4j environment variables');
  process.exit(1);
}

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

async function runCypher(query, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map(r => r.toObject());
  } finally {
    await session.close();
  }
}

async function inspectResults() {
  console.log('🔍 Inspecting Neo4j Cypher query results...\n');

  const queries = [
    {
      name: 'Simple Findings Query',
      cypher: 'MATCH (f:Finding) RETURN f LIMIT 3'
    },
    {
      name: 'Findings with Relationships',
      cypher: 'MATCH (f:Finding)-[:AFFECTS]->(a:Asset) RETURN f, a LIMIT 3'
    },
    {
      name: 'Service with Assets',
      cypher: 'MATCH (s:Service)<-[:BELONGS_TO_SERVICE]-(a:Asset)<-[:AFFECTS]-(f:Finding) RETURN s, a, f LIMIT 3'
    },
    {
      name: 'Exploit Chain Path',
      cypher: 'MATCH path = (f1:Finding)-[:EXPLOIT_CHAIN]->(f2:Finding) RETURN path LIMIT 2'
    }
  ];

  for (const query of queries) {
    console.log(`\n📊 ${query.name}`);
    console.log(`Query: ${query.cypher}`);
    console.log('─'.repeat(50));
    
    try {
      const results = await runCypher(query.cypher);
      console.log(`Results count: ${results.length}`);
      
      if (results.length > 0) {
        console.log('Sample result structure:');
        console.log(JSON.stringify(results[0], null, 2));
        
        // Show all keys across all results
        const allKeys = new Set();
        results.forEach(result => {
          Object.keys(result).forEach(key => allKeys.add(key));
        });
        console.log(`All keys found: ${Array.from(allKeys).join(', ')}`);
      } else {
        console.log('No results returned');
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

// Run the inspection
inspectResults()
  .then(() => {
    console.log('\n✅ Inspection complete');
    driver.close();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Inspection failed:', error);
    driver.close();
    process.exit(1);
  });
