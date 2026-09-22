import type { AssetPlan, BriefParser, ShotList, WorkflowBuilder } from "@/lib/schemas";

export type PipelineResult = {
  brief: string;
  breakdown: BriefParser;
  shots: ShotList;
  assets: AssetPlan;
  workflow: WorkflowBuilder;
};

export type AgentStatus = "idle" | "running" | "done" | "error";

export async function runPipeline(
  brief: string,
  onStep: (agent: string, status: AgentStatus, error?: string) => void
): Promise<{ ok: true; result: PipelineResult } | { ok: false; error: string }> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief }),
  });

  if (!res.ok && !res.body) {
    let msg = "Pipeline request failed";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      /* ignore */
    }
    return { ok: false, error: msg };
  }

  if (!res.body) {
    return { ok: false, error: "Empty response from pipeline" };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: PipelineResult | null = null;
  let error: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) >= 0) {
      const raw = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);
      if (!raw) continue;

      try {
        const event = JSON.parse(raw) as
          | { type: "step"; agent: string; status: AgentStatus; error?: string }
          | ({ type: "result" } & (
              | ({ ok: true } & PipelineResult)
              | { ok: false; error: string }
            ));

        if (event.type === "step") {
          onStep(event.agent, event.status, event.error);
        } else if (event.type === "result") {
          if (event.ok) {
            result = {
              brief: event.brief,
              breakdown: event.breakdown,
              shots: event.shots,
              assets: event.assets,
              workflow: event.workflow,
            };
          } else {
            error = event.error;
          }
        }
      } catch {
        /* skip partial/malformed line */
      }
    }
  }

  if (result) return { ok: true, result };
  return { ok: false, error: error ?? "Pipeline finished without a result" };
}
