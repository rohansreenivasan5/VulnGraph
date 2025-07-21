"use client";
import React, { useRef, useEffect, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  const data =
    graphData && Array.isArray(graphData.nodes) && Array.isArray(graphData.links)
      ? graphData
      : sampleData;

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 20, height: height - 20 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  return (
    <div ref={containerRef} className="w-full h-full bg-zinc-900 border border-zinc-700 rounded relative overflow-hidden">
      {data.nodes.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No graph data available</p>
            <p className="text-sm">Run a query to see the graph visualization</p>
          </div>
        </div>
      ) : (
        <>
          {/* Color Legend */}
          <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur rounded-lg p-3 text-xs text-white">
            <div className="font-semibold mb-2">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span>Critical Finding</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                <span>High Finding</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                <span>Medium Finding</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span>Low Finding</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Asset</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span>Scanner</span>
              </div>
            </div>
          </div>
        <ForceGraph2D
          graphData={data}
          width={800}
          height={600}
          backgroundColor="#18181b"
          nodeLabel={(node) => {
            const n = node as GraphNode;
            return `${n.name}\nType: ${n.type}${n.severity ? `\nSeverity: ${n.severity}` : ''}`;
          }}
          nodeColor={(node) => getNodeColor(node as GraphNode)}
          nodeVal={(node) => getNodeSize(node as GraphNode)}
          nodeRelSize={8}
          linkColor={() => '#666666'}
          linkWidth={2}
          linkDirectionalArrowLength={8}
          linkDirectionalArrowRelPos={1}
          linkLabel={(link) => (link as GraphLink).type}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode;
            const label = n.name;
            const nodeRadius = getNodeSize(n) * 4;
            
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, nodeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = getNodeColor(n);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw label
            const fontSize = Math.max(10, 14/globalScale);
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, node.x || 0, (node.y || 0) + nodeRadius + 15/globalScale);
            
            // Draw type badge
            const typeLabel = n.type;
            const badgeFontSize = Math.max(8, 10/globalScale);
            ctx.font = `${badgeFontSize}px Inter, sans-serif`;
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(typeLabel, node.x || 0, (node.y || 0) + nodeRadius + 30/globalScale);
          }}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.08}
          cooldownTicks={100}
          onEngineStop={() => console.log('Graph layout stabilized')}
        />
        </>
      )}
    </div>
  );
};

export default GraphPanel; 