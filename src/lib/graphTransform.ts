/**
 * Transforms Neo4j Cypher query results into graph visualization format
 * Handles different result patterns: nodes, relationships, paths, and aggregations
 */

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface TransformResult {
  type: 'graph' | 'table' | 'empty';
  graph?: GraphData;
  table?: TableData;
  message?: string;
}

/**
 * Checks if a value is a Neo4j node object
 */
function isNeo4jNode(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'identity' in value &&
    'labels' in value &&
    'properties' in value
  );
}

/**
 * Checks if a value is a Neo4j relationship object
 */
function isNeo4jRelationship(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'identity' in value &&
    'type' in value &&
    'start' in value &&
    'end' in value &&
    'properties' in value
  );
}

/**
 * Checks if a value is a Neo4j path object
 */
function isNeo4jPath(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'start' in value &&
    'end' in value &&
    'segments' in value
  );
}

/**
 * Extracts a unique identifier from a Neo4j node
 */
function getNodeId(node: any): string {
  // Try common ID properties first
  if (node.properties?.finding_id) return node.properties.finding_id;
  if (node.properties?.name) return node.properties.name;
  if (node.properties?.owasp_id) return node.properties.owasp_id;
  if (node.properties?.cwe_id) return node.properties.cwe_id;
  
  // Fall back to Neo4j internal ID
  return node.identity?.toString() || `node_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extracts a display name from a Neo4j node
 */
function getNodeName(node: any): string {
  // Try common name properties
  if (node.properties?.title) return node.properties.title;
  if (node.properties?.name) return node.properties.name;
  if (node.properties?.finding_id) return node.properties.finding_id;
  if (node.properties?.owasp_id) return node.properties.owasp_id;
  if (node.properties?.cwe_id) return node.properties.cwe_id;
  
  // Fall back to label + ID
  const label = node.labels?.[0] || 'Node';
  const id = getNodeId(node);
  return `${label} ${id}`;
}

/**
 * Converts a Neo4j node to GraphNode format
 */
function convertNode(node: any): GraphNode {
  const id = getNodeId(node);
  const name = getNodeName(node);
  const type = node.labels?.[0] || 'Unknown';
  
  return {
    id,
    name,
    type,
    properties: node.properties || {},
    labels: node.labels || [],
    severity: node.properties?.severity || null,
    scanner: node.properties?.scanner || null,
  };
}

/**
 * Converts a Neo4j relationship to GraphLink format
 */
function convertRelationship(relationship: any, nodeMap: Map<string, GraphNode>): GraphLink | null {
  const startId = relationship.start?.toString();
  const endId = relationship.end?.toString();
  
  // Find the actual node IDs from our node map
  let sourceId: string | null = null;
  let targetId: string | null = null;
  
  for (const [nodeId, node] of nodeMap) {
    if (node.properties?.identity?.toString() === startId) {
      sourceId = nodeId;
    }
    if (node.properties?.identity?.toString() === endId) {
      targetId = nodeId;
    }
  }
  
  if (!sourceId || !targetId) {
    console.warn('Could not find source or target node for relationship:', relationship);
    return null;
  }
  
  return {
    source: sourceId,
    target: targetId,
    type: relationship.type || 'RELATED',
    properties: relationship.properties || {},
  };
}

/**
 * Extracts nodes and relationships from Neo4j path objects
 */
function extractFromPath(path: any): { nodes: any[]; relationships: any[] } {
  const nodes: any[] = [];
  const relationships: any[] = [];
  
  if (path.segments) {
    for (const segment of path.segments) {
      if (segment.start) nodes.push(segment.start);
      if (segment.end) nodes.push(segment.end);
      if (segment.relationship) relationships.push(segment.relationship);
    }
  }
  
  return { nodes, relationships };
}

/**
 * Main transformation function
 */
export function transformNeo4jToGraph(results: unknown[]): TransformResult {
  if (!Array.isArray(results) || results.length === 0) {
    return {
      type: 'empty',
      message: 'No data returned from query'
    };
  }
  
  const nodes = new Map<string, GraphNode>();
  const relationships: any[] = [];
  let hasGraphData = false;
  
  // Process each result row
  for (const result of results) {
    if (typeof result !== 'object' || result === null) continue;
    
    // Process each value in the result row
    for (const [key, value] of Object.entries(result)) {
      if (isNeo4jNode(value)) {
        hasGraphData = true;
        const node = convertNode(value);
        nodes.set(node.id, node);
      } else if (isNeo4jRelationship(value)) {
        hasGraphData = true;
        relationships.push(value);
      } else if (isNeo4jPath(value)) {
        hasGraphData = true;
        const { nodes: pathNodes, relationships: pathRels } = extractFromPath(value);
        
        // Add path nodes
        for (const node of pathNodes) {
          const graphNode = convertNode(node);
          nodes.set(graphNode.id, graphNode);
        }
        
        // Add path relationships
        relationships.push(...pathRels);
      }
    }
  }
  
  // If we found graph data, return it
  if (hasGraphData && nodes.size > 0) {
    const links: GraphLink[] = [];
    
    // Convert relationships to links
    for (const rel of relationships) {
      const link = convertRelationship(rel, nodes);
      if (link) {
        links.push(link);
      }
    }
    
    return {
      type: 'graph',
      graph: {
        nodes: Array.from(nodes.values()),
        links
      }
    };
  }
  
  // If no graph data, return as table
  const columns = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  
  for (const result of results) {
    if (typeof result === 'object' && result !== null) {
      const row: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(result)) {
        columns.add(key);
        // Simplify complex objects for table display
        if (typeof value === 'object' && value !== null) {
          if (isNeo4jNode(value)) {
            row[key] = getNodeName(value);
          } else if (Array.isArray(value)) {
            row[key] = value.join(', ');
          } else {
            row[key] = JSON.stringify(value);
          }
        } else {
          row[key] = value;
        }
      }
      
      rows.push(row);
    }
  }
  
  return {
    type: 'table',
    table: {
      columns: Array.from(columns),
      rows
    }
  };
}

/**
 * Utility function to create sample graph data for testing
 */
export function createSampleGraphData(): GraphData {
  return {
    nodes: [
      {
        id: 'F-001',
        name: 'SQL Injection in Login',
        type: 'Finding',
        properties: { severity: 'CRITICAL', scanner: 'DAST' }
      },
      {
        id: 'A-001',
        name: '/api/login',
        type: 'Asset',
        properties: { type: 'api_endpoint', service: 'auth-service' }
      },
      {
        id: 'S-001',
        name: 'auth-service',
        type: 'Service',
        properties: { type: 'microservice' }
      }
    ],
    links: [
      {
        source: 'F-001',
        target: 'A-001',
        type: 'AFFECTS',
        properties: {}
      },
      {
        source: 'A-001',
        target: 'S-001',
        type: 'BELONGS_TO_SERVICE',
        properties: {}
      }
    ]
  };
}
