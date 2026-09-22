"use client";

import { useCallback } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  type Edge,
} from "@xyflow/react";
import type { WorkflowBuilder } from "@/lib/schemas";

type WorkflowNodeData = {
  label: string;
  nodeType: string;
  description: string;
};

type WorkflowFlowNode = Node<WorkflowNodeData, "workflow">;

const nodeTypes = {
  workflow: WorkflowNodeNode,
};

function WorkflowNodeNode({ data }: NodeProps<WorkflowFlowNode>) {
  return (
    <div className="rounded-xl border border-zinc-700/80 bg-[#121216] px-4 py-3 shadow-lg shadow-black/40 min-w-[160px] max-w-[220px] hover:border-green-500/60 transition-colors">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-green-500"
      />
      <p className="eyebrow text-[10px] text-green-500">{data.nodeType}</p>
      <p className="text-sm font-semibold text-zinc-100 mt-0.5 leading-snug font-display">
        {data.label}
      </p>
      <p className="text-[11px] text-zinc-500 mt-1 leading-snug line-clamp-2">
        {data.description}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-green-400"
      />
    </div>
  );
}

function layoutNodes(workflow: WorkflowBuilder): {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
} {
  const inbound = new Map<string, number>();
  workflow.nodes.forEach((n) => inbound.set(n.id, 0));
  workflow.edges.forEach((e) => {
    inbound.set(e.target, (inbound.get(e.target) ?? 0) + 1);
  });

  const level = new Map<string, number>();
  const queue: string[] = [];
  workflow.nodes.forEach((n) => {
    if ((inbound.get(n.id) ?? 0) === 0) {
      level.set(n.id, 0);
      queue.push(n.id);
    }
  });
  if (queue.length === 0 && workflow.nodes[0]) {
    level.set(workflow.nodes[0].id, 0);
    queue.push(workflow.nodes[0].id);
  }

  while (queue.length) {
    const id = queue.shift()!;
    const current = level.get(id) ?? 0;
    workflow.edges
      .filter((e) => e.source === id)
      .forEach((e) => {
        const next = Math.max(level.get(e.target) ?? 0, current + 1);
        level.set(e.target, next);
        queue.push(e.target);
      });
  }

  const byLevel = new Map<number, string[]>();
  workflow.nodes.forEach((n) => {
    const l = level.get(n.id) ?? 0;
    const arr = byLevel.get(l) ?? [];
    arr.push(n.id);
    byLevel.set(l, arr);
  });

  const nodes: WorkflowFlowNode[] = workflow.nodes.map((n) => {
    const l = level.get(n.id) ?? 0;
    const siblings = byLevel.get(l) ?? [];
    const idx = siblings.indexOf(n.id);
    return {
      id: n.id,
      type: "workflow",
      position: { x: l * 260, y: idx * 120 },
      data: {
        label: n.label,
        nodeType: n.type,
        description: n.description,
      },
      draggable: true,
    };
  });

  const edges: Edge[] = workflow.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    style: { stroke: "#22C55E", strokeWidth: 1.5 },
    labelStyle: { fill: "#86868B", fontSize: 11 },
  }));

  return { nodes, edges };
}

export default function WorkflowGraph({
  workflow,
  height = 420,
}: {
  workflow: WorkflowBuilder;
  height?: number;
}) {
  const { nodes, edges } = layoutNodes(workflow);

  const onInit = useCallback(() => {
    /* flow ready */
  }, []);

  return (
    <div
      className="rounded-xl border border-zinc-800 overflow-hidden bg-[#0B0B0F]"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="#27272a"
        />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(11,11,15,0.75)"
          nodeColor="#22C55E"
        />
      </ReactFlow>
    </div>
  );
}
