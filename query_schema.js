const neo4j = require('neo4j-driver');

// Neo4j connection configuration
const uri = 'neo4j+s://26c4d89b.databases.neo4j.io';
const username = 'neo4j';
const password = 'YyzwehHIa7ceulgiSAnYTtjCWbNxPh-dyDgwQ2Qecxw';

async function querySchema() {
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session();

  try {
    console.log('=== DATABASE SCHEMA ANALYSIS ===\n');

    // 1. Count all nodes by type
    console.log('1. NODE COUNTS BY TYPE:');
    const nodeCounts = await session.run(`
      MATCH (n) 
      RETURN labels(n) as node_type, count(n) as count 
      ORDER BY count DESC
    `);
    
    nodeCounts.records.forEach(record => {
      const nodeType = record.get('node_type').join(':');
      const count = record.get('count').toNumber();
      console.log(`   ${nodeType}: ${count}`);
    });

    // 2. Count all relationships by type
    console.log('\n2. RELATIONSHIP COUNTS BY TYPE:');
    const relCounts = await session.run(`
      MATCH ()-[r]->() 
      RETURN type(r) as relationship_type, count(r) as count 
      ORDER BY count DESC
    `);
    
    relCounts.records.forEach(record => {
      const relType = record.get('relationship_type');
      const count = record.get('count').toNumber();
      console.log(`   ${relType}: ${count}`);
    });

    // 3. Sample Finding properties
    console.log('\n3. SAMPLE FINDING PROPERTIES:');
    const findingProps = await session.run(`
      MATCH (f:Finding) 
      RETURN f.finding_id, f.title, f.severity, f.timestamp 
      LIMIT 5
    `);
    
    findingProps.records.forEach(record => {
      console.log(`   ID: ${record.get('f.finding_id')}, Title: ${record.get('f.title')}, Severity: ${record.get('f.severity')}`);
    });

    // 4. Sample relationships
    console.log('\n4. SAMPLE RELATIONSHIPS:');
    const sampleRels = await session.run(`
      MATCH (f:Finding)-[r]->(n) 
      RETURN f.finding_id, type(r), labels(n), n.name, n.owasp_id, n.cwe_id
      LIMIT 10
    `);
    
    sampleRels.records.forEach(record => {
      const findingId = record.get('f.finding_id');
      const relType = record.get('type(r)');
      const targetLabels = record.get('labels(n)').join(':');
      const targetName = record.get('n.name') || record.get('n.owasp_id') || record.get('n.cwe_id') || 'N/A';
      console.log(`   ${findingId} -[${relType}]-> ${targetLabels}:${targetName}`);
    });

    // 5. AI-enhanced relationships
    console.log('\n5. AI-ENHANCED RELATIONSHIPS:');
    const aiRels = await session.run(`
      MATCH (f1:Finding)-[r:SAME_ROOT_CAUSE|SIMILAR_TO|EXPLOIT_CHAIN|IMPACT_CORRELATION]->(f2:Finding)
      RETURN f1.finding_id, type(r), f2.finding_id, r.reason, r.similarity_score, r.chain_type, r.impact
      LIMIT 10
    `);
    
    aiRels.records.forEach(record => {
      const f1Id = record.get('f1.finding_id');
      const relType = record.get('type(r)');
      const f2Id = record.get('f2.finding_id');
      const reason = record.get('r.reason') || record.get('r.similarity_score') || record.get('r.chain_type') || record.get('r.impact') || 'N/A';
      console.log(`   ${f1Id} -[${relType}]-> ${f2Id} (${reason})`);
    });

    // 6. Asset types
    console.log('\n6. ASSET TYPES:');
    const assetTypes = await session.run(`
      MATCH (a:Asset) 
      RETURN a.type, count(a) as count 
      ORDER BY count DESC
    `);
    
    assetTypes.records.forEach(record => {
      const type = record.get('a.type');
      const count = record.get('count').toNumber();
      console.log(`   ${type}: ${count}`);
    });

    // 7. Service types
    console.log('\n7. SERVICE TYPES:');
    const serviceTypes = await session.run(`
      MATCH (s:Service) 
      RETURN s.type, count(s) as count 
      ORDER BY count DESC
    `);
    
    serviceTypes.records.forEach(record => {
      const type = record.get('s.type');
      const count = record.get('count').toNumber();
      console.log(`   ${type}: ${count}`);
    });

    // 8. Scanner types
    console.log('\n8. SCANNER TYPES:');
    const scannerTypes = await session.run(`
      MATCH (s:Scanner) 
      RETURN s.type, count(s) as count 
      ORDER BY count DESC
    `);
    
    scannerTypes.records.forEach(record => {
      const type = record.get('s.type');
      const count = record.get('count').toNumber();
      console.log(`   ${type}: ${count}`);
    });

    // 9. Finding severity distribution
    console.log('\n9. FINDING SEVERITY DISTRIBUTION:');
    const severityDist = await session.run(`
      MATCH (f:Finding) 
      RETURN f.severity, count(f) as count 
      ORDER BY count DESC
    `);
    
    severityDist.records.forEach(record => {
      const severity = record.get('f.severity');
      const count = record.get('count').toNumber();
      console.log(`   ${severity}: ${count}`);
    });

    // 10. Sample CWE and OWASP mappings
    console.log('\n10. SAMPLE CWE/OWASP MAPPINGS:');
    const mappings = await session.run(`
      MATCH (f:Finding)-[:BELONGS_TO_OWASP]->(o:OWASP)
      MATCH (f)-[:DESCRIBES_CWE]->(c:CWE)
      RETURN f.finding_id, o.owasp_id, o.name, c.cwe_id, c.name
      LIMIT 5
    `);
    
    mappings.records.forEach(record => {
      const findingId = record.get('f.finding_id');
      const owaspId = record.get('o.owasp_id');
      const owaspName = record.get('o.name');
      const cweId = record.get('c.cwe_id');
      const cweName = record.get('c.name');
      console.log(`   ${findingId}: ${owaspId} (${owaspName}) -> ${cweId} (${cweName})`);
    });

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

querySchema(); 