import { z } from "zod";
import {
  runAssetPlanner,
  runBriefParser,
  runShotGenerator,
  runWorkflowBuilder,
} from "@/lib/agents";
import {
  briefParserSchema,
  shotListSchema,
  assetPlanSchema,
} from "@/lib/schemas";

const bodySchema = z.discriminatedUnion("agent", [
  z.object({
    agent: z.literal("brief-parser"),
    brief: z.string().min(12).max(2000),
  }),
  z.object({
    agent: z.literal("shot-generator"),
    brief: z.string().min(12).max(2000),
    breakdown: briefParserSchema,
  }),
  z.object({
    agent: z.literal("asset-planner"),
    brief: z.string().min(12).max(2000),
    breakdown: briefParserSchema,
    shots: shotListSchema,
  }),
  z.object({
    agent: z.literal("workflow-builder"),
    brief: z.string().min(12).max(2000),
    breakdown: briefParserSchema,
    shots: shotListSchema,
    assets: assetPlanSchema,
  }),
]);

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;
    switch (data.agent) {
      case "brief-parser": {
        const breakdown = await runBriefParser(data.brief);
        return Response.json({ ok: true, agent: data.agent, breakdown });
      }
      case "shot-generator": {
        const shots = await runShotGenerator(data.brief, data.breakdown);
        return Response.json({ ok: true, agent: data.agent, shots });
      }
      case "asset-planner": {
        const assets = await runAssetPlanner(
          data.brief,
          data.breakdown,
          data.shots
        );
        return Response.json({ ok: true, agent: data.agent, assets });
      }
      case "workflow-builder": {
        const workflow = await runWorkflowBuilder(
          data.brief,
          data.breakdown,
          data.shots,
          data.assets
        );
        return Response.json({ ok: true, agent: data.agent, workflow });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
