import { generateObject } from "ai";
import { GROQ_MODEL, getGroq } from "@/lib/ai";
import {
  assetPlanSchema,
  BriefParser,
  briefParserSchema,
  ShotList,
  shotListSchema,
  WorkflowBuilder,
  workflowBuilderSchema,
} from "@/lib/schemas";

export async function runBriefParser(brief: string): Promise<BriefParser> {
  const groq = getGroq();
  const { object } = await generateObject({
    model: groq(GROQ_MODEL),
    schema: briefParserSchema,
    schemaName: "ProjectBreakdown",
    temperature: 0.3,
    system: `You are the Brief Parser agent in a pre-production pipeline for creative professionals.
Extract a clean, executable project breakdown from a raw creative brief.
Be specific and production-minded. Prefer concrete language over marketing fluff.
If duration or format is implied rather than stated, infer the most likely value.`,
    prompt: `Raw creative brief:\n\n${brief}`,
  });
  return object;
}

export async function runShotGenerator(
  brief: string,
  breakdown: BriefParser
): Promise<ShotList> {
  const groq = getGroq();
  const { object } = await generateObject({
    model: groq(GROQ_MODEL),
    schema: shotListSchema,
    schemaName: "ShotList",
    temperature: 0.45,
    system: `You are the Shot Generator agent. You turn a project breakdown into a practical shot list for editors and directors.
Every shot must be filmable or generatable (AI video, stock, or live action).
Match shot count to duration: ~1 shot per 2-4 seconds for short-form.
Cover an emotional arc: hook, build, payoff.
Use varied shot types. Include optional camera/performance notes when useful.`,
    prompt: `Brief:\n${brief}\n\nBreakdown:\n${JSON.stringify(breakdown, null, 2)}`,
  });
  return object;
}

export async function runAssetPlanner(
  brief: string,
  breakdown: BriefParser,
  shots: ShotList
): Promise<import("@/lib/schemas").AssetPlan> {
  const groq = getGroq();
  const { object } = await generateObject({
    model: groq(GROQ_MODEL),
    schema: assetPlanSchema,
    schemaName: "AssetPlan",
    temperature: 0.35,
    system: `You are the Asset Planner agent. You identify every asset a creative team must have before production starts.
Cover visual (clips, stills, graphics), audio (music, VO, SFX), and text (titles, end card, captions).
Mark each required vs optional. Give shoot/stock/generate guidance at the end.`,
    prompt: `Brief:\n${brief}\n\nBreakdown:\n${JSON.stringify(breakdown, null, 2)}\n\nShots:\n${JSON.stringify(shots, null, 2)}`,
  });
  return object;
}

export async function runWorkflowBuilder(
  brief: string,
  breakdown: BriefParser,
  shots: ShotList,
  assets: import("@/lib/schemas").AssetPlan
): Promise<WorkflowBuilder> {
  const groq = getGroq();
  const { object } = await generateObject({
    model: groq(GROQ_MODEL),
    schema: workflowBuilderSchema,
    schemaName: "WorkflowGraph",
    temperature: 0.3,
    system: `You are the Workflow Builder agent for HexCoded Creative Studio — a node-based creative workflow tool.
Map the pre-production plan to a directed node graph a user could execute in a node editor.
Use 5-8 nodes. Start from the brief, pass through generation/style/asset nodes as appropriate, end at export.
Node types: brief | generate | style | asset | edit | export | other.
IDs must be kebab-case and unique. Edges must reference existing node ids.
The graph should feel like a real Creative Studio pipeline, not a generic flowchart.`,
    prompt: `Brief:\n${brief}\n\nBreakdown:\n${JSON.stringify(breakdown, null, 2)}\n\nShots:\n${JSON.stringify(shots, null, 2)}\n\nAssets:\n${JSON.stringify(assets, null, 2)}`,
  });

  const ids = new Set(object.nodes.map((n) => n.id));
  object.edges = object.edges.filter(
    (e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target
  );
  return object;
}
