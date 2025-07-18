"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ForceGraph2D with SSR disabled
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

import { GraphData, GraphNode, GraphLink, getNodeColor, getNodeSize } from '@/lib/graphTransform';

interface GraphPanelProps {
  graphData?: GraphData;
}

const sampleData: GraphData = {
  nodes: [
    { id: '1', name: 'Node 1', type: 'Sample', properties: {} },
    { id: '2', name: 'Node 2', type: 'Sample', properties: {} },
    { id: '3', name: 'Node 3', type: 'Sample', properties: {} }
  ],
  links: [
    { source: '1', target: '2', type: 'RELATES_TO', properties: {} },
    { source: '2', target: '3', type: 'RELATES_TO', properties: {} }
  ]
};

const GraphPanel: React.FC<GraphPanelProps> = ({ graphData }) => {
  const data =
    graphData && Array.isArray(graphData.nodes) && Array.isArray(graphData.links)
      ? graphData
      : sampleData;
  
  return (
    <div className="w-full h-full bg-zinc-900 border border-zinc-700 rounded">
      {data.nodes.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No graph data available</p>
            <p className="text-sm">Run a query to see the graph visualization</p>
          </div>
        </div>
      ) : (
        <ForceGraph2D
          graphData={data}
          width={undefined}
          height={undefined}
          nodeLabel={(node) => (node as GraphNode).name}
          nodeColor={(node) => getNodeColor(node as GraphNode)}
          nodeVal={(node) => getNodeSize(node as GraphNode)}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkLabel={(link) => (link as GraphLink).type}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = (node as GraphNode).name;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, node.x || 0, (node.y || 0) + 20/globalScale);
          }}
        />
      )}
    </div>
  );
};

export default GraphPanel; 