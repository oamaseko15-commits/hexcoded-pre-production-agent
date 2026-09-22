"use client";

import dynamic from "next/dynamic";

const WorkflowGraph = dynamic(() => import("./WorkflowGraph"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 h-[420px] grid place-items-center text-sm text-zinc-600">
      Loading node canvas…
    </div>
  ),
});

export default WorkflowGraph;
