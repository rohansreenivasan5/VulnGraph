/**
 * Transforms Neo4j query results into graph visualization format
 * Based on actual Neo4j result structure analysis
 */

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
  severity?: string;
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

interface Neo4jNode {
  identity?: { low: number; high: number };
  elementId?: string;
  labels?: string[];
  properties?: Record<string, unknown>;
}

interface Neo4jRelationship {
  identity?: { low: number; high: number };
  elementId?: string;
  type?: string;
  start?: { low: number; high: number };
  end?: { low: number; high: number };
  startNodeElementId?: string;
  endNodeElementId?: string;
  properties?: Record<string, unknown>;
}

/**
 * Checks if a value is a Neo4j node (has labels and properties)
 */
function isNeo4jNode(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'labels' in value &&
    'properties' in value &&
    'elementId' in value
  );
}

/**
 * Checks if a value is a Neo4j relationship (has type, start, end)
 */
function isNeo4jRelationship(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'start' in value &&
    'end' in value &&
    'properties' in value
  );
}

/**
 * Extracts unique identifier from Neo4j node
 */
function getNodeId(node: Neo4jNode): string {
  // Try common ID properties first
  if (node.properties?.finding_id) return String(node.properties.finding_id);
  if (node.properties?.name) return String(node.properties.name);
  if (node.properties?.owasp_id) return String(node.properties.owasp_id);
  if (node.properties?.cwe_id) return String(node.properties.cwe_id);
  
  // Use elementId as fallback
  return node.elementId || node.identity?.low?.toString() || `node_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extracts display name from Neo4j node
 */
function getNodeName(node: Neo4jNode): string {
  // Try common name properties based on node type
  const label = node.labels?.[0] || 'Node';
  
  if (label === 'Finding') {
    return String(node.properties?.title || node.properties?.finding_id || 'Unknown Finding');
  }
  
  if (label === 'Asset') {
    if (node.properties?.url) return String(node.properties.url);
    if (node.properties?.path) return String(node.properties.path);
    if (node.properties?.image) return String(node.properties.image);
    return `${String(node.properties?.type || 'Asset')}`;
  }
  
  if (label === 'Service') {
    return String(node.properties?.name || 'Unknown Service');
  }
  
  if (label === 'Scanner') {
    return String(node.properties?.name || 'Unknown Scanner');
  }
  
  if (label === 'OWASP') {
    return String(node.properties?.name || node.properties?.owasp_id || 'OWASP Category');
  }
  
  if (label === 'CWE') {
    return String(node.properties?.name || node.properties?.cwe_id || 'CWE Category');
  }
  
  if (label === 'Package') {
    return `${String(node.properties?.name || 'Package')}${node.properties?.version ? ` v${String(node.properties.version)}` : ''}`;
  }
  
  // Generic fallback
  return String(node.properties?.name || node.properties?.title) || `${label} ${getNodeId(node)}`;
}

/**
 * Utility to normalize Neo4j IDs (handles int objects, numbers, strings)
 */
function normalizeId(v: unknown): string {
  if (typeof v === 'object' && v !== null && 'low' in v) return String((v as { low: number }).low);
  return String(v).trim();
}

/**
 * Converts Neo4j node to GraphNode format
 */
function convertNode(node: Neo4jNode): GraphNode {
  const id = normalizeId(getNodeId(node));
  const name = getNodeName(node);
  const type = node.labels?.[0] || 'Unknown';
  
  return {
    id,
    name,
    type,
    properties: node.properties || {},
    severity: node.properties?.severity ? String(node.properties.severity) : undefined,
    labels: node.labels || [],
    elementId: node.elementId,
  };
}

/**
 * Converts Neo4j relationship to GraphLink format
 */
function convertRelationship(relationship: Neo4jRelationship, nodeIdMap: Map<string, string>): GraphLink | null {
  // Map Neo4j internal IDs to our graph node IDs
  const startElementId = relationship.startNodeElementId || (relationship.start && normalizeId(relationship.start));
  const endElementId = relationship.endNodeElementId || (relationship.end && normalizeId(relationship.end));
  
  if (!startElementId || !endElementId) {
    console.warn('Missing element IDs for relationship:', relationship);
    return null;
  }
  
  const sourceId = nodeIdMap.get(startElementId) || normalizeId(startElementId);
  const targetId = nodeIdMap.get(endElementId) || normalizeId(endElementId);
  
  if (!sourceId || !targetId) {
    console.warn('Could not find source or target node for relationship:', relationship, { startElementId, endElementId });
    return null;
  }
  
  return {
    source: sourceId,
    target: targetId,
    type: String(relationship.type || 'RELATED'),
    properties: relationship.properties || {},
  };
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
  const relationships: Neo4jRelationship[] = [];
  const nodeIdMap = new Map<string, string>(); // Maps Neo4j elementId to our graph node ID
  let hasGraphData = false;

  // Helper to add a node if not already present
  function addNode(node: Neo4jNode) {
    const graphNode = convertNode(node);
    nodes.set(graphNode.id, graphNode);
    if (node.elementId) {
      nodeIdMap.set(node.elementId, graphNode.id);
    }
  }

  // Helper to add a relationship
  function addRelationship(rel: Neo4jRelationship) {
    relationships.push(rel);
  }

  // First pass: collect all nodes and relationships, including from arrays (for path queries)
  for (const result of results) {
    if (typeof result !== 'object' || result === null) continue;
    for (const [, value] of Object.entries(result)) {
      if (Array.isArray(value)) {
        // Handle arrays of nodes or relationships (e.g., from nodes(path), relationships(path))
        for (const v of value) {
          if (isNeo4jNode(v)) {
            hasGraphData = true;
            addNode(v as Neo4jNode);
          } else if (isNeo4jRelationship(v)) {
            hasGraphData = true;
            addRelationship(v as Neo4jRelationship);
          }
        }
      } else if (isNeo4jNode(value)) {
        hasGraphData = true;
        addNode(value as Neo4jNode);
      } else if (isNeo4jRelationship(value)) {
        hasGraphData = true;
        addRelationship(value as Neo4jRelationship);
      }
    }
  }

  // Always build table representation
  const columns = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const result of results) {
    if (typeof result === 'object' && result !== null) {
      const row: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(result)) {
        columns.add(key);
        // Enhanced array handling for table display
        if (Array.isArray(value)) {
          if (value.length > 0 && isNeo4jNode(value[0])) {
            // Array of nodes: show their names
            row[key] = value.map(v => getNodeName(v as Neo4jNode)).join(', ');
          } else if (value.length > 0 && isNeo4jRelationship(value[0])) {
            // Array of relationships: show their types
            row[key] = value.map(v => String((v as Neo4jRelationship).type)).join(', ');
          } else {
            // Array of primitives or unknowns
            row[key] = value.join(', ');
          }
        } else if (isNeo4jNode(value)) {
          row[key] = getNodeName(value as Neo4jNode);
        } else if (isNeo4jRelationship(value)) {
          row[key] = String((value as Neo4jRelationship).type);
        } else if (typeof value === 'object' && value !== null) {
          row[key] = JSON.stringify(value);
        } else {
          row[key] = value;
        }
      }
      rows.push(row);
    }
  }
  const tableData: TableData = {
    columns: Array.from(columns),
    rows
  };

  // Build graph representation if possible
  let graphData: GraphData | undefined = undefined;
  if (nodes.size > 0) {
    const links: GraphLink[] = [];
    for (const rel of relationships) {
      const link = convertRelationship(rel, nodeIdMap);
      if (link) {
        links.push(link);
      }
    }
    graphData = {
      nodes: Array.from(nodes.values()),
      links
    };
  }

  // Decide default type: prefer graph if available, else table
  if (graphData) {
    return {
      type: 'graph',
      graph: graphData,
      table: tableData
    };
  } else {
    return {
      type: 'table',
      table: tableData
    };
  }
}

/**
 * Utility function to get node color based on type and severity
 */
export function getNodeColor(node: GraphNode): string {
  if (node.type === 'Finding') {
    switch (node.severity) {
      case 'CRITICAL': return '#dc2626'; // red-600
      case 'HIGH': return '#ea580c'; // orange-600
      case 'MEDIUM': return '#d97706'; // amber-600
      case 'LOW': return '#16a34a'; // green-600
      default: return '#6b7280'; // gray-500
    }
  }
  
  switch (node.type) {
    case 'Asset': return '#3b82f6'; // blue-500
    case 'Service': return '#8b5cf6'; // purple-500
    case 'Scanner': return '#06b6d4'; // cyan-500
    case 'OWASP': return '#f59e0b'; // amber-500
    case 'CWE': return '#ef4444'; // red-500
    case 'Package': return '#84cc16'; // lime-500
    default: return '#6b7280'; // gray-500
  }
}

/**
 * Utility function to get node size based on type and severity
 */
export function getNodeSize(node: GraphNode): number {
  if (node.type === 'Finding') {
    switch (node.severity) {
      case 'CRITICAL': return 12;
      case 'HIGH': return 10;
      case 'MEDIUM': return 8;
      case 'LOW': return 6;
      default: return 8;
    }
  }
  
  switch (node.type) {
    case 'Service': return 10;
    case 'Asset': return 8;
    default: return 6;
  }
}
