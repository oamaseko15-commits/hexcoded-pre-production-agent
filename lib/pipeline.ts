import type {
  AssetPlan,
  BriefParser,
  ShotList,
  WorkflowBuilder,
} from "@/lib/schemas";

export type PipelineResult = {
  brief: string;
  breakdown: BriefParser;
  shots: ShotList;
  assets: AssetPlan;
  workflow: WorkflowBuilder;
};

export type AgentStatus = "idle" | "running" | "done" | "error";

async function callAgent<T>(
  body: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok || !("ok" in data && data.ok)) {
      return {
        ok: false,
        error:
          data && typeof data === "object" && "error" in data && data.error
            ? String(data.error)
            : "Agent request failed",
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error talking to agent" };
  }
}

export async function runPipeline(
  brief: string,
  onStep: (agent: string, status: AgentStatus, error?: string) => void
): Promise<{ ok: true; result: PipelineResult } | { ok: false; error: string }> {
  onStep("brief-parser", "running");
  const briefRes = await callAgent<{ breakdown: BriefParser }>({
    agent: "brief-parser",
    brief,
  });
  if (!briefRes.ok) {
    onStep("brief-parser", "error", briefRes.error);
    return { ok: false, error: briefRes.error };
  }
  const breakdown = briefRes.data.breakdown;
  onStep("brief-parser", "done");

  onStep("shot-generator", "running");
  const shotRes = await callAgent<{ shots: ShotList }>({
    agent: "shot-generator",
    brief,
    breakdown,
  });
  if (!shotRes.ok) {
    onStep("shot-generator", "error", shotRes.error);
    return { ok: false, error: shotRes.error };
  }
  const shots = shotRes.data.shots;
  onStep("shot-generator", "done");

  onStep("asset-planner", "running");
  const assetRes = await callAgent<{ assets: AssetPlan }>({
    agent: "asset-planner",
    brief,
    breakdown,
    shots,
  });
  if (!assetRes.ok) {
    onStep("asset-planner", "error", assetRes.error);
    return { ok: false, error: assetRes.error };
  }
  const assets = assetRes.data.assets;
  onStep("asset-planner", "done");

  onStep("workflow-builder", "running");
  const wfRes = await callAgent<{ workflow: WorkflowBuilder }>({
    agent: "workflow-builder",
    brief,
    breakdown,
    shots,
    assets,
  });
  if (!wfRes.ok) {
    onStep("workflow-builder", "error", wfRes.error);
    return { ok: false, error: wfRes.error };
  }
  onStep("workflow-builder", "done");

  return {
    ok: true,
    result: { brief, breakdown, shots, assets, workflow: wfRes.data.workflow },
  };
}
