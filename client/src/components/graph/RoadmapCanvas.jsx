import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CivicNode from './CivicNode';
import {
  CheckCircle2,
  Maximize2,
  ArrowDownUp,
  ArrowRightLeft,
  ZoomIn,
  ZoomOut,
  Target,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

const nodeTypes = {
  civicNode: CivicNode
};

/**
 * Calculates topological levels and coordinates for DAG nodes.
 */
function layoutDAG(rawNodes = [], rawEdges = [], orientation = 'TB') {
  if (!rawNodes || rawNodes.length === 0) return { nodes: [], edges: [], stages: [] };

  const nodeMap = new Map();
  const inDegree = new Map();
  const adj = new Map();

  rawNodes.forEach((node) => {
    nodeMap.set(node.id, node);
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  });

  rawEdges.forEach((edge) => {
    if (inDegree.has(edge.target)) {
      inDegree.set(edge.target, inDegree.get(edge.target) + 1);
    }
    if (adj.has(edge.source)) {
      adj.get(edge.source).push(edge.target);
    }
  });

  // Calculate topological rank for each node
  const ranks = new Map();
  const queue = [];

  rawNodes.forEach((node) => {
    if (inDegree.get(node.id) === 0) {
      ranks.set(node.id, 0);
      queue.push(node.id);
    }
  });

  while (queue.length > 0) {
    const currId = queue.shift();
    const currRank = ranks.get(currId) || 0;
    const children = adj.get(currId) || [];

    for (const childId of children) {
      const existingRank = ranks.get(childId);
      const nextRank = Math.max(existingRank !== undefined ? existingRank : 0, currRank + 1);
      ranks.set(childId, nextRank);
      queue.push(childId);
    }
  }

  // Group nodes by calculated rank
  const levelGroups = new Map();
  rawNodes.forEach((node) => {
    const r = ranks.get(node.id) || 0;
    if (!levelGroups.has(r)) {
      levelGroups.set(r, []);
    }
    levelGroups.get(r).push(node);
  });

  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  const positionedNodes = [];
  const stagesList = [];

  const isTB = orientation === 'TB';
  const PRIMARY_SPACING = isTB ? 260 : 420;
  const SECONDARY_SPACING = isTB ? 380 : 240;
  const OFFSET_CENTER = 450;

  sortedLevels.forEach((level) => {
    const nodesInLevel = levelGroups.get(level);
    const count = nodesInLevel.length;

    nodesInLevel.forEach((node, idx) => {
      const secondaryOffset = (idx - (count - 1) / 2) * SECONDARY_SPACING;

      let x, y;
      if (isTB) {
        x = OFFSET_CENTER + secondaryOffset;
        y = 60 + level * PRIMARY_SPACING;
      } else {
        x = 80 + level * PRIMARY_SPACING;
        y = OFFSET_CENTER + secondaryOffset;
      }

      positionedNodes.push({
        id: node.id,
        type: 'civicNode',
        position: { x, y },
        data: {
          ...node,
          id: node.id,
          orientation,
          title: node.title,
          stage: node.stage,
          department: node.department,
          estimatedDays: node.estimatedDays || 0,
          cost: node.cost || 0,
          isBottleneck: Boolean(node.isBottleneck),
          statutoryRule: node.statutoryRule,
          forms: node.forms || [],
          officialUrl: node.officialUrl || '',
          plainLanguageSummary: node.plainLanguageSummary || ''
        }
      });
    });
  });

  // Extract unique stages
  const uniqueStages = Array.from(new Set(rawNodes.map((n) => n.stage).filter(Boolean)));

  // Styled edges with glowing connectors
  const styledEdges = rawEdges.map((edge) => ({
    id: edge.id || `e_${edge.source}_${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: true,
    label: edge.label || '',
    style: {
      stroke: '#6366f1',
      strokeWidth: 2,
      strokeDasharray: '6 4'
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: '#6366f1'
    },
    labelStyle: {
      fontSize: 10,
      fontWeight: 600,
      fill: '#94a3b8'
    },
    labelBgStyle: {
      fill: '#0f172a',
      fillOpacity: 0.95,
      stroke: '#334155',
      strokeWidth: 1
    },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 6
  }));

  return { nodes: positionedNodes, edges: styledEdges, stages: uniqueStages };
}

function InnerRoadmapCanvas({
  graphData,
  onSelectNode,
  selectedNodeId,
  completedNodes = new Set(),
  onToggleComplete,
  className
}) {
  const [orientation, setOrientation] = useState('TB'); // 'TB' | 'LR'
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeStageFilter, setActiveStageFilter] = useState(null);

  const { fitView, setCenter, zoomTo } = useReactFlow();

  // Toggle node completion status
  const handleStatusChange = useCallback((nodeId, nextStatus) => {
    if (onToggleComplete) {
      onToggleComplete(nodeId, nextStatus);
    }
  }, [onToggleComplete]);

  // Compute status for all nodes based on prerequisites DAG
  const computedGraph = useMemo(() => {
    if (!graphData || !graphData.nodes) return { nodes: [], edges: [], stages: [] };
    const { nodes: rawNodes, edges: rawEdges, stages } = layoutDAG(
      graphData.nodes,
      graphData.edges,
      orientation
    );

    // Build incoming prerequisite lookup
    const incomingParents = new Map();
    rawNodes.forEach((n) => incomingParents.set(n.id, []));
    rawEdges.forEach((e) => {
      if (incomingParents.has(e.target)) {
        incomingParents.get(e.target).push(e.source);
      }
    });

    // Determine status: "completed" | "available" | "locked"
    const enrichedNodes = rawNodes.map((n) => {
      const isDone = completedNodes.has(n.id);
      let status = 'locked';

      if (isDone) {
        status = 'completed';
      } else {
        const parents = incomingParents.get(n.id) || [];
        const allParentsDone =
          parents.length === 0 || parents.every((pId) => completedNodes.has(pId));
        status = allParentsDone ? 'available' : 'locked';
      }

      return {
        ...n,
        selected: n.id === selectedNodeId,
        data: {
          ...n.data,
          status,
          orientation,
          onStatusChange: handleStatusChange
        }
      };
    });

    // Update edge styling based on parent completion
    const enrichedEdges = rawEdges.map((e) => {
      const sourceCompleted = completedNodes.has(e.source);
      return {
        ...e,
        style: {
          ...e.style,
          stroke: sourceCompleted ? '#10b981' : '#6366f1',
          strokeWidth: sourceCompleted ? 2.5 : 1.75
        },
        markerEnd: {
          ...e.markerEnd,
          color: sourceCompleted ? '#10b981' : '#6366f1'
        }
      };
    });

    return { nodes: enrichedNodes, edges: enrichedEdges, stages };
  }, [graphData, completedNodes, selectedNodeId, orientation, handleStatusChange]);

  // Sync ReactFlow internal state with computed nodes and edges
  useEffect(() => {
    setNodes(computedGraph.nodes);
    setEdges(computedGraph.edges);
  }, [computedGraph.nodes, computedGraph.edges, setNodes, setEdges]);

  // Initial focus on the first node ONLY when graphData/taskId changes (Not on completion!)
  const lastTaskIdRef = React.useRef(null);
  useEffect(() => {
    const currentTaskId = graphData?.taskId || 'default-task';
    if (lastTaskIdRef.current !== currentTaskId) {
      lastTaskIdRef.current = currentTaskId;
      if (computedGraph.nodes.length > 0) {
        const firstNode = computedGraph.nodes[0];
        if (firstNode) {
          setTimeout(() => {
            setCenter(firstNode.position.x + 150, firstNode.position.y + 120, {
              zoom: 0.9,
              duration: 500
            });
          }, 100);
        }
      }
    }
  }, [graphData?.taskId, computedGraph.nodes, setCenter]);

  // Smoothly center camera when active/selected node changes
  useEffect(() => {
    if (selectedNodeId && computedGraph.nodes.length > 0) {
      const targetNode = computedGraph.nodes.find((n) => n.id === selectedNodeId);
      if (targetNode) {
        setCenter(targetNode.position.x + 150, targetNode.position.y + 100, {
          zoom: 0.95,
          duration: 500
        });
      }
    }
  }, [selectedNodeId, computedGraph.nodes, setCenter]);

  // Jump to specific stage
  const handleFocusStage = (stageName) => {
    setActiveStageFilter(stageName);
    const stageNodes = computedGraph.nodes.filter((n) => n.data.stage === stageName);
    if (stageNodes.length > 0) {
      const avgX = stageNodes.reduce((acc, n) => acc + n.position.x, 0) / stageNodes.length;
      const avgY = stageNodes.reduce((acc, n) => acc + n.position.y, 0) / stageNodes.length;
      setCenter(avgX + 150, avgY + 100, { zoom: 0.95, duration: 600 });
    }
  };

  // Focus next available actionable step
  const handleFocusActionable = () => {
    const readyNode = computedGraph.nodes.find((n) => n.data.status === 'available');
    if (readyNode) {
      if (onSelectNode) onSelectNode(readyNode.data);
    } else {
      const nextUncompleted = computedGraph.nodes.find((n) => n.data.status !== 'completed');
      if (nextUncompleted && onSelectNode) {
        onSelectNode(nextUncompleted.data);
      }
    }
  };

  // Reset to 100% zoom
  const handleResetZoom = () => {
    const firstNode = computedGraph.nodes[0];
    if (firstNode) {
      setCenter(firstNode.position.x + 150, firstNode.position.y + 120, {
        zoom: 1.0,
        duration: 400
      });
    }
  };

  // Overall Stats summary
  const stats = useMemo(() => {
    const total = graphData?.nodes?.length || 0;
    const completedCount = completedNodes.size;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { total, completedCount, progressPercent };
  }, [graphData, completedNodes]);

  const handleNodeClick = useCallback(
    (event, node) => {
      if (onSelectNode) {
        onSelectNode(node.data);
      }
    },
    [onSelectNode]
  );

  return (
    <div className={`w-full h-full relative bg-slate-950 overflow-hidden flex flex-col ${className || ''}`}>
      {/* Stage Fast-Navigator Strip */}
      <div className="h-11 bg-slate-900/90 border-b border-slate-800/90 px-4 flex items-center gap-2 overflow-x-auto text-xs z-10 shrink-0 shadow-sm no-print">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          Navigate Stage:
        </span>
        {computedGraph.stages?.map((st, idx) => {
          const isSelected = activeStageFilter === st;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleFocusStage(st)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 border',
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              )}
            >
              <span>{st}</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>
          );
        })}
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 50, y: 50, zoom: 0.9 }}
          minZoom={0.2}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          className="touch-none"
        >
          <Background color="#1e293b" gap={28} size={1.5} />
          <Controls
            className="!bg-slate-900/95 !border-slate-800 !fill-slate-200 !rounded-xl !shadow-2xl [&>button]:!border-slate-800 [&>button]:!bg-slate-900 [&>button]:!text-slate-200 hover:[&>button]:!bg-slate-800"
            showInteractive={false}
          />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              if (node.data?.status === 'completed') return '#10b981';
              if (node.data?.status === 'available') return '#6366f1';
              return '#475569';
            }}
            className="!bg-slate-900/90 !border-slate-800 !rounded-xl !shadow-2xl hidden md:block"
          />

          {/* Top Left: Interactive Viewport Tools & Quick Focus */}
          <Panel position="top-left" className="m-3 flex items-center gap-2">
            {/* Progress Badge */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl text-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">
                  {stats.completedCount} / {stats.total} Done ({stats.progressPercent}%)
                </span>
              </div>
              <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-750">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Focus on Next Actionable Step */}
            <button
              type="button"
              onClick={handleFocusActionable}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              title="Center camera on the next actionable step"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Next Step</span>
            </button>

            {/* 100% Zoom Reset */}
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold shadow-xl transition-all"
              title="Reset view to 100% scale"
            >
              100% Zoom
            </button>

            {/* Orientation Switcher */}
            <button
              type="button"
              onClick={() => setOrientation((prev) => (prev === 'TB' ? 'LR' : 'TB'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold shadow-xl transition-all"
              title="Toggle between Vertical Hierarchy and Horizontal Pipeline"
            >
              {orientation === 'TB' ? (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Horizontal View</span>
                </>
              ) : (
                <>
                  <ArrowDownUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Vertical View</span>
                </>
              )}
            </button>

            {/* Fit Entire Map */}
            <button
              type="button"
              onClick={() => fitView({ padding: 0.15, duration: 400 })}
              className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white shadow-xl transition-all"
              title="Fit entire map in window"
            >
              <Maximize2 className="w-4 h-4 text-indigo-400" />
            </button>
          </Panel>

          {/* Bottom Center: Legend Panel */}
          <Panel position="bottom-center" className="mb-3">
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30" />
                <span className="font-semibold">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-indigo-500/30" />
                <span className="font-semibold">Ready for Action</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span className="font-medium text-slate-400">Prerequisites Locked</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function RoadmapCanvas(props) {
  return (
    <ReactFlowProvider>
      <InnerRoadmapCanvas {...props} />
    </ReactFlowProvider>
  );
}
