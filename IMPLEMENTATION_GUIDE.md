# VulnGraph Implementation Guide
## Vulnerability Knowledge-Graph & Multi-Agent Reasoning Chat System

This guide provides step-by-step instructions to build a complete vulnerability analysis system with knowledge graph capabilities and AI agents.

---

## 🎯 Project Overview

**Objective**: Build a full-stack system that ingests vulnerability findings, creates a knowledge graph, and provides an AI-powered chat interface for security analysis.

**Tech Stack**:
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Neo4j AuraDB
- **AI**: LiteLLM (OpenAI-compatible)
- **Deployment**: Vercel

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] Git configured
- [ ] Neo4j AuraDB account (free tier available)
- [ ] Vercel account
- [ ] LiteLLM API credentials (provided)

---

## 🚀 Phase 1: Project Setup & Foundation

### Step 1.1: Initialize Next.js Project
```bash
# Create new Next.js project
npx create-next-app@latest vulngraph --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd vulngraph

# Install additional dependencies
npm install @neo4j/neo4j-driver d3 react-force-graph lucide-react
npm install -D @types/d3
```

**Test**: Run `npm run dev` and verify the app starts at `http://localhost:3000`

### Step 1.2: Environment Configuration
Create `.env.local`:
```env
# LiteLLM Configuration
LITELLM_API_KEY=sk-8NY0UzYOXsTyJNEvwLcL9g
LITELLM_BASE_URL=https://api.litellm.ai

# Neo4j Configuration
NEO4J_URI=your_neo4j_uri_here
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password_here

# Next.js Configuration
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**Test**: Verify environment variables are loaded by checking `process.env.LITELLM_API_KEY`

### Step 1.3: Project Structure Setup
```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   ├── graph/
│   │   └── ingest/
│   ├── components/
│   │   ├── ui/
│   │   ├── chat/
│   │   └── graph/
│   ├── lib/
│   │   ├── neo4j.ts
│   │   ├── litellm.ts
│   │   └── types.ts
│   └── data/
│       └── findings.json
```

**Test**: Verify all directories exist and are accessible

---

## 🗄️ Phase 2: Database & Data Layer

### Step 2.1: Neo4j Database Setup
1. Create Neo4j AuraDB instance
2. Get connection details (URI, username, password)
3. Update `.env.local` with Neo4j credentials

**Test**: Create `src/lib/neo4j.ts` and test connection:
```typescript
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

export async function testConnection() {
  const session = driver.session();
  try {
    const result = await session.run('RETURN 1 as test');
    console.log('Neo4j connection successful:', result.records[0].get('test'));
    return true;
  } catch (error) {
    console.error('Neo4j connection failed:', error);
    return false;
  } finally {
    await session.close();
  }
}
```

### Step 2.2: Data Models & Types
Create `src/lib/types.ts`:
```typescript
export interface Vulnerability {
  finding_id: string;
  scanner: string;
  scan_id: string;
  timestamp: string;
  vulnerability: {
    owasp_id: string;
    cwe_id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    vector: string;
    cve_id?: string;
  };
  asset: {
    type: string;
    url?: string;
    path?: string;
    service?: string;
    cluster?: string;
    image?: string;
    registry?: string;
    repo?: string;
  };
  package?: {
    ecosystem: string;
    name: string;
    version: string;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'Vulnerability' | 'Asset' | 'Service' | 'Package' | 'Scanner';
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}
```

**Test**: Import types and verify TypeScript compilation

### Step 2.3: Database Schema Creation
Create `src/lib/schema.ts`:
```typescript
import { driver } from './neo4j';

export async function createConstraints() {
  const session = driver.session();
  try {
    // Create constraints for unique properties
    await session.run('CREATE CONSTRAINT vulnerability_id IF NOT EXISTS FOR (v:Vulnerability) REQUIRE v.finding_id IS UNIQUE');
    await session.run('CREATE CONSTRAINT asset_id IF NOT EXISTS FOR (a:Asset) REQUIRE a.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.name IS UNIQUE');
    await session.run('CREATE CONSTRAINT package_id IF NOT EXISTS FOR (p:Package) REQUIRE p.name_version IS UNIQUE');
    
    console.log('Database constraints created successfully');
  } catch (error) {
    console.error('Error creating constraints:', error);
  } finally {
    await session.close();
  }
}
```

**Test**: Run schema creation and verify constraints exist in Neo4j browser

---

## 📊 Phase 3: Data Ingestion & Knowledge Graph

### Step 3.1: Findings Data Setup
Create `src/data/findings.json` with the provided vulnerability data.

**Test**: Verify JSON is valid and contains all 12 findings

### Step 3.2: Data Ingestion API
Create `src/app/api/ingest/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { driver } from '@/lib/neo4j';
import { Vulnerability } from '@/lib/types';
import findings from '@/data/findings.json';

export async function POST(request: NextRequest) {
  try {
    const session = driver.session();
    
    // Clear existing data
    await session.run('MATCH (n) DETACH DELETE n');
    
    // Create nodes and relationships
    for (const finding of findings as Vulnerability[]) {
      // Create vulnerability node
      await session.run(`
        CREATE (v:Vulnerability {
          finding_id: $finding_id,
          title: $title,
          severity: $severity,
          description: $description,
          owasp_id: $owasp_id,
          cwe_id: $cwe_id,
          vector: $vector,
          timestamp: $timestamp
        })
      `, {
        finding_id: finding.finding_id,
        title: finding.vulnerability.title,
        severity: finding.vulnerability.severity,
        description: finding.vulnerability.description,
        owasp_id: finding.vulnerability.owasp_id,
        cwe_id: finding.vulnerability.cwe_id,
        vector: finding.vulnerability.vector,
        timestamp: finding.timestamp
      });
      
      // Create asset node
      if (finding.asset.service) {
        await session.run(`
          MERGE (s:Service {name: $service})
          WITH s
          MATCH (v:Vulnerability {finding_id: $finding_id})
          CREATE (v)-[:AFFECTS]->(s)
        `, {
          service: finding.asset.service,
          finding_id: finding.finding_id
        });
      }
      
      // Create scanner relationship
      await session.run(`
        MERGE (sc:Scanner {name: $scanner})
        WITH sc
        MATCH (v:Vulnerability {finding_id: $finding_id})
        CREATE (sc)-[:DETECTED]->(v)
      `, {
        scanner: finding.scanner,
        finding_id: finding.finding_id
      });
    }
    
    await session.close();
    
    return NextResponse.json({ 
      success: true, 
      message: `Ingested ${findings.length} findings` 
    });
    
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}
```

**Test**: 
1. Call `POST /api/ingest` 
2. Verify response shows successful ingestion
3. Check Neo4j browser for nodes and relationships

### Step 3.3: Graph Query API
Create `src/app/api/graph/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { driver } from '@/lib/neo4j';

export async function GET(request: NextRequest) {
  try {
    const session = driver.session();
    
    // Get all nodes and relationships
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
      LIMIT 100
    `);
    
    const nodes = new Map();
    const edges = [];
    
    result.records.forEach(record => {
      const node1 = record.get('n');
      const node2 = record.get('m');
      const relationship = record.get('r');
      
      if (node1) {
        nodes.set(node1.identity.toString(), {
          id: node1.identity.toString(),
          label: node1.labels[0],
          properties: node1.properties
        });
      }
      
      if (node2) {
        nodes.set(node2.identity.toString(), {
          id: node2.identity.toString(),
          label: node2.labels[0],
          properties: node2.properties
        });
      }
      
      if (relationship) {
        edges.push({
          source: relationship.start.toString(),
          target: relationship.end.toString(),
          type: relationship.type,
          properties: relationship.properties
        });
      }
    });
    
    await session.close();
    
    return NextResponse.json({
      nodes: Array.from(nodes.values()),
      edges
    });
    
  } catch (error) {
    console.error('Graph query error:', error);
    return NextResponse.json({ error: 'Graph query failed' }, { status: 500 });
  }
}
```

**Test**: Call `GET /api/graph` and verify JSON response with nodes and edges

---

## 🤖 Phase 4: AI Agent System

### Step 4.1: LiteLLM Integration
Create `src/lib/litellm.ts`:
```typescript
export class LiteLLMClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.LITELLM_BASE_URL!;
    this.apiKey = process.env.LITELLM_API_KEY!;
  }

  async chatCompletion(messages: any[], model: string = 'gpt-4') {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`LiteLLM API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const litellm = new LiteLLMClient();
```

**Test**: Create simple test to verify LiteLLM connection:
```typescript
// Test in API route
const response = await litellm.chatCompletion([
  { role: 'user', content: 'Hello, test message' }
]);
console.log('LiteLLM test response:', response);
```

### Step 4.2: Graph Analysis Agent
Create `src/lib/agents/graphAgent.ts`:
```typescript
import { litellm } from '../litellm';
import { driver } from '../neo4j';

export class GraphAnalysisAgent {
  async analyzeVulnerabilities(query: string) {
    const session = driver.session();
    
    try {
      // Get relevant graph data
      const result = await session.run(`
        MATCH (v:Vulnerability)
        OPTIONAL MATCH (v)-[:AFFECTS]->(s:Service)
        OPTIONAL MATCH (sc:Scanner)-[:DETECTED]->(v)
        RETURN v, s, sc
        LIMIT 20
      `);
      
      const context = result.records.map(record => ({
        vulnerability: record.get('v').properties,
        service: record.get('s')?.properties,
        scanner: record.get('sc')?.properties
      }));
      
      const messages = [
        {
          role: 'system',
          content: `You are a security analyst agent. Analyze the following vulnerability data and answer the user's question. Provide detailed insights and recommendations.`
        },
        {
          role: 'user',
          content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${query}`
        }
      ];
      
      const response = await litellm.chatCompletion(messages);
      return response.choices[0].message.content;
      
    } finally {
      await session.close();
    }
  }
}
```

**Test**: Create test API route to verify agent functionality

### Step 4.3: Chat API with Agent Integration
Create `src/app/api/chat/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GraphAnalysisAgent } from '@/lib/agents/graphAgent';

const agent = new GraphAnalysisAgent();

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    const response = await agent.analyzeVulnerabilities(message);
    
    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
```

**Test**: Send POST request to `/api/chat` with message and verify AI response

---

## 🎨 Phase 5: Frontend UI

### Step 5.1: Basic Layout & Components
Create `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VulnGraph - Vulnerability Analysis',
  description: 'AI-powered vulnerability knowledge graph and analysis system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
```

**Test**: Verify layout renders correctly

### Step 5.2: Main Dashboard Page
Create `src/app/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import GraphVisualization from '@/components/graph/GraphVisualization';
import DataIngestion from '@/components/DataIngestion';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'graph' | 'ingest'>('chat');

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          VulnGraph
        </h1>
        <p className="text-gray-600">
          AI-powered vulnerability knowledge graph and analysis system
        </p>
      </header>

      <nav className="mb-6">
        <div className="flex space-x-4 border-b border-gray-200">
          {[
            { id: 'chat', label: 'Chat Analysis' },
            { id: 'graph', label: 'Graph Visualization' },
            { id: 'ingest', label: 'Data Ingestion' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium rounded-t-lg ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main>
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'graph' && <GraphVisualization />}
        {activeTab === 'ingest' && <DataIngestion />}
      </main>
    </div>
  );
}
```

**Test**: Verify page loads with tabs and navigation works

### Step 5.3: Chat Interface Component
Create `src/components/chat/ChatInterface.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg h-96 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Vulnerability Analysis Chat</h2>
          <p className="text-sm text-gray-600">Ask questions about your security findings</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-xs opacity-75">
                    {message.role === 'user' ? 'You' : 'AI Agent'}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs opacity-75">AI Agent</span>
                </div>
                <div className="flex space-x-1 mt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about vulnerabilities, services, or security patterns..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Test**: Verify chat interface renders and can send/receive messages

### Step 5.4: Graph Visualization Component
Create `src/components/graph/GraphVisualization.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface GraphData {
  nodes: any[];
  edges: any[];
}

export default function GraphVisualization() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await fetch('/api/graph');
      const data = await response.json();
      setGraphData(data);
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading graph data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Vulnerability Knowledge Graph</h2>
        <div className="h-96 border border-gray-200 rounded-lg">
          <ForceGraph2D
            graphData={graphData}
            nodeLabel="properties"
            nodeColor={(node: any) => {
              switch (node.label) {
                case 'Vulnerability': return '#ef4444';
                case 'Service': return '#3b82f6';
                case 'Scanner': return '#10b981';
                default: return '#6b7280';
              }
            }}
            nodeRelSize={6}
            linkWidth={2}
            linkColor={() => '#9ca3af'}
          />
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Vulnerabilities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Services</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Scanners</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Test**: Verify graph visualization loads and displays nodes/edges

### Step 5.5: Data Ingestion Component
Create `src/components/DataIngestion.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function DataIngestion() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const ingestData = async () => {
    setStatus('loading');
    setMessage('Ingesting vulnerability data...');

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        throw new Error(data.error || 'Ingestion failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Data Ingestion</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Click the button below to ingest the vulnerability findings into the knowledge graph.
            This will create nodes for vulnerabilities, services, and scanners, along with their relationships.
          </p>
          
          <button
            onClick={ingestData}
            disabled={status === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {status === 'loading' ? 'Ingesting...' : 'Ingest Data'}
          </button>
        </div>

        {status !== 'idle' && (
          <div className={`p-4 rounded-lg ${
            status === 'success' ? 'bg-green-50 border border-green-200' :
            status === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {status === 'loading' && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
              <span className={`
                ${status === 'success' ? 'text-green-700' : ''}
                ${status === 'error' ? 'text-red-700' : ''}
                ${status === 'loading' ? 'text-blue-700' : ''}
              `}>
                {message}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Test**: Verify data ingestion component works and shows proper status messages

---

## 🚀 Phase 6: Advanced Features

### Step 6.1: Enhanced AI Agent with Reasoning
Update `src/lib/agents/graphAgent.ts` with reasoning capabilities:
```typescript
export class GraphAnalysisAgent {
  async analyzeWithReasoning(query: string) {
    const session = driver.session();
    
    try {
      // Get comprehensive graph data
      const result = await session.run(`
        MATCH (v:Vulnerability)
        OPTIONAL MATCH (v)-[:AFFECTS]->(s:Service)
        OPTIONAL MATCH (sc:Scanner)-[:DETECTED]->(v)
        OPTIONAL MATCH (v)-[:SIMILAR_TO]->(v2:Vulnerability)
        RETURN v, s, sc, v2
        ORDER BY v.properties.severity DESC
        LIMIT 30
      `);
      
      const context = this.processGraphData(result.records);
      
      const messages = [
        {
          role: 'system',
          content: `You are an expert security analyst AI agent. Analyze vulnerability data and provide:
1. Detailed analysis of the findings
2. Risk assessment and prioritization
3. Remediation recommendations
4. Patterns and correlations you identify
5. Security insights and trends

Always explain your reasoning process step by step.`
        },
        {
          role: 'user',
          content: `Analyze this vulnerability data: ${JSON.stringify(context, null, 2)}

User Question: ${query}

Provide a comprehensive analysis with reasoning steps.`
        }
      ];
      
      const response = await litellm.chatCompletion(messages, 'gpt-4');
      return response.choices[0].message.content;
      
    } finally {
      await session.close();
    }
  }

  private processGraphData(records: any[]) {
    // Process and structure the graph data for better AI analysis
    const vulnerabilities = new Map();
    const services = new Map();
    const scanners = new Map();

    records.forEach(record => {
      const vuln = record.get('v').properties;
      const service = record.get('s')?.properties;
      const scanner = record.get('sc')?.properties;

      if (!vulnerabilities.has(vuln.finding_id)) {
        vulnerabilities.set(vuln.finding_id, {
          ...vuln,
          services: [],
          scanners: []
        });
      }

      if (service && !services.has(service.name)) {
        services.set(service.name, service);
      }

      if (scanner && !scanners.has(scanner.name)) {
        scanners.set(scanner.name, scanner);
      }
    });

    return {
      vulnerabilities: Array.from(vulnerabilities.values()),
      services: Array.from(services.values()),
      scanners: Array.from(scanners.values()),
      summary: {
        totalVulnerabilities: vulnerabilities.size,
        totalServices: services.size,
        totalScanners: scanners.size,
        severityBreakdown: this.getSeverityBreakdown(Array.from(vulnerabilities.values()))
      }
    };
  }

  private getSeverityBreakdown(vulnerabilities: any[]) {
    return vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {});
  }
}
```

**Test**: Verify enhanced agent provides detailed reasoning in responses

### Step 6.2: Real-time Chat with Streaming
Update chat API to support streaming responses:
```typescript
// In src/app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { message } = await request.json();
  
  // Set up streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await agent.analyzeWithReasoning(message);
        
        // Stream the response in chunks
        const chunks = response.split(' ');
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk + ' ' })}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing
        }
        
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Test**: Verify streaming responses work in chat interface

---

## 🌐 Phase 7: Deployment

### Step 7.1: Vercel Configuration
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "LITELLM_API_KEY": "@litellm_api_key",
    "LITELLM_BASE_URL": "@litellm_base_url",
    "NEO4J_URI": "@neo4j_uri",
    "NEO4J_USERNAME": "@neo4j_username",
    "NEO4J_PASSWORD": "@neo4j_password"
  }
}
```

### Step 7.2: Environment Variables Setup
1. Go to Vercel dashboard
2. Add environment variables:
   - `LITELLM_API_KEY`
   - `LITELLM_BASE_URL`
   - `NEO4J_URI`
   - `NEO4J_USERNAME`
   - `NEO4J_PASSWORD`

### Step 7.3: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Test**: Verify deployment is successful and all features work on live URL

---

## ✅ Testing Checklist

### Phase 1: Foundation
- [ ] Next.js project starts successfully
- [ ] Environment variables are loaded
- [ ] Project structure is correct

### Phase 2: Database
- [ ] Neo4j connection test passes
- [ ] Database constraints are created
- [ ] Types are properly defined

### Phase 3: Data Ingestion
- [ ] Findings data is valid JSON
- [ ] Ingestion API creates nodes and relationships
- [ ] Graph query API returns data

### Phase 4: AI Agents
- [ ] LiteLLM connection works
- [ ] Graph analysis agent responds
- [ ] Chat API integrates with agent

### Phase 5: Frontend
- [ ] Main page loads with tabs
- [ ] Chat interface sends/receives messages
- [ ] Graph visualization displays data
- [ ] Data ingestion component works

### Phase 6: Advanced Features
- [ ] Enhanced agent provides reasoning
- [ ] Streaming responses work
- [ ] Real-time features function

### Phase 7: Deployment
- [ ] Vercel deployment succeeds
- [ ] Environment variables are set
- [ ] Live URL works correctly

---

## 🎯 Success Criteria

✅ **Frontend & UI/UX**: Clean, intuitive interface with real-time features
✅ **Technical Implementation**: Well-structured, maintainable codebase
✅ **Creativity & Problem-Solving**: Intelligent AI agents with reasoning
✅ **AI Framework Usage**: Effective LiteLLM integration
✅ **Deployment**: Successful Vercel deployment with working live link

---

## 📝 Next Steps

1. **Enhance AI Agents**: Add more specialized agents (remediation, compliance, etc.)
2. **Advanced Graph Features**: Implement graph algorithms for vulnerability clustering
3. **Real-time Updates**: Add WebSocket support for live graph updates
4. **Export Features**: Add PDF/CSV export capabilities
5. **Authentication**: Implement user authentication and role-based access
6. **Monitoring**: Add application monitoring and logging

---

## 🆘 Troubleshooting

### Common Issues:
1. **Neo4j Connection**: Ensure AuraDB instance is running and credentials are correct
2. **LiteLLM API**: Verify API key and base URL are properly set
3. **Environment Variables**: Check all variables are loaded in both development and production
4. **CORS Issues**: Ensure API routes are properly configured
5. **Build Errors**: Check TypeScript compilation and dependency versions

### Support:
- Check Neo4j documentation for database issues
- Review LiteLLM documentation for API problems
- Consult Next.js documentation for framework issues
- Use browser developer tools for frontend debugging

---

This implementation guide provides a complete roadmap to build the VulnGraph system. Each step is testable and builds upon the previous steps, ensuring a solid foundation for the final product. 