import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI!;
const NEO4J_USER = process.env.NEO4J_USERNAME!;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!;

export const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

export async function runCypher(query: string, params: Record<string, unknown> = {}) {
  const session = driver.session();
  try {
    console.log('[Neo4j] Attempting to run query (checking authentication)...');
    const result = await session.run(query, params);
    console.log('[Neo4j] Query ran successfully. Authentication succeeded.');
    return result.records.map(r => r.toObject());
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('unauthorized')) {
      console.error('[Neo4j] Authentication failed:', e.message);
    } else {
      console.error('[Neo4j] Query error:', e);
    }
    throw e;
  } finally {
    await session.close();
  }
} 