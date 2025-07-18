const neo4j = require('neo4j-driver');

// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key] = value;
    }
  });
}

// Neo4j connection details
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://26c4d89b.databases.neo4j.io';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

if (!NEO4J_PASSWORD) {
  console.error('❌ NEO4J_PASSWORD not found in environment variables');
  console.error('Make sure .env.local contains the Neo4j password');
  process.exit(1);
}

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);

async function analyzeResults() {
  console.log('🔍 Analyzing Neo4j query results structure...\n');

  const queries = [
    {
      name: 'Simple Findings',
      cypher: 'MATCH (f:Finding) RETURN f LIMIT 2'
    },
    {
      name: 'Findings with Assets',
      cypher: 'MATCH (f:Finding)-[:AFFECTS]->(a:Asset) RETURN f, a LIMIT 2'
    },
    {
      name: 'Findings with Services',
      cypher: 'MATCH (f:Finding)-[:AFFECTS]->(a:Asset)-[:BELONGS_TO_SERVICE]->(s:Service) RETURN f, a, s LIMIT 2'
    },
    {
      name: 'Relationships',
      cypher: 'MATCH (f:Finding)-[r:AFFECTS]->(a:Asset) RETURN f, r, a LIMIT 2'
    }
  ];

  const session = driver.session();
  
  try {
    for (const query of queries) {
      console.log(`\n📊 ${query.name}`);
      console.log(`Query: ${query.cypher}`);
      console.log('─'.repeat(60));
      
      try {
        const result = await session.run(query.cypher);
        console.log(`Records returned: ${result.records.length}`);
        
        if (result.records.length > 0) {
          // Show raw record structure
          console.log('\nRaw record structure:');
          const firstRecord = result.records[0];
          console.log('Keys:', firstRecord.keys);
          
          // Show converted object structure
          console.log('\nConverted to object:');
          const converted = firstRecord.toObject();
          console.log(JSON.stringify(converted, null, 2));
          
          // Analyze each field
          console.log('\nField analysis:');
          for (const key of firstRecord.keys) {
            const value = firstRecord.get(key);
            console.log(`- ${key}: ${typeof value} - ${value?.constructor?.name || 'null'}`);
            
            if (value && typeof value === 'object') {
              // Check if it's a Neo4j node, relationship, or path
              if (value.labels) {
                console.log(`  → Neo4j Node: labels=${value.labels}, properties=${JSON.stringify(value.properties)}`);
              } else if (value.type && value.start && value.end) {
                console.log(`  → Neo4j Relationship: type=${value.type}, start=${value.start}, end=${value.end}`);
              } else if (value.segments) {
                console.log(`  → Neo4j Path: segments=${value.segments.length}`);
              }
            }
          }
        } else {
          console.log('No records returned');
        }
        
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    }
  } finally {
    await session.close();
  }
}

analyzeResults()
  .then(() => {
    console.log('\n✅ Analysis complete');
    driver.close();
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    driver.close();
    process.exit(1);
  });
