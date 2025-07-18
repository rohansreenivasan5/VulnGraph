"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ForceGraph2D with SSR disabled
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
  id: string;
  name: string;
  [key: string]: unknown;
}
interface GraphLink {
  source: string;
  target: string;
  [key: string]: unknown;
}

interface GraphPanelProps {
  graphData?: { nodes: GraphNode[]; links: GraphLink[] };
}

const sampleData: { nodes: GraphNode[]; links: GraphLink[] } = {
  nodes: [
    { id: '1', name: 'Node 1' },
    { id: '2', name: 'Node 2' },
    { id: '3', name: 'Node 3' }
  ],
  links: [
    { source: '1', target: '2' },
    { source: '2', target: '3' }
  ]
};

const GraphPanel: React.FC<GraphPanelProps> = ({ graphData }) => {
  const data =
    graphData && Array.isArray(graphData.nodes) && Array.isArray(graphData.links)
      ? graphData
      : sampleData;
  return (
    <div className="w-full h-full bg-zinc-900 border border-zinc-700 rounded">
      <ForceGraph2D
        graphData={data}
        width={undefined}
        height={undefined}
        nodeLabel={node => (node as GraphNode).name}
        nodeAutoColorBy="id"
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
      />
    </div>
  );
};

export default GraphPanel; 