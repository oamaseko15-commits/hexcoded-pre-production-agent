import { z } from "zod";

export const briefParserSchema = z.object({
  objective: z.string().describe("Primary creative objective of the project"),
  title: z.string().describe("Short working title for the project"),
  duration: z.string().describe("Target duration or length, e.g. '30s', '60s', 'episode'"),
  format: z.string().describe("Deliverable format, e.g. 'video ad', 'social reel', 'brand film'"),
  tone: z.string().describe("Tone and visual mood"),
  audience: z.string().describe("Target audience"),
  keyMessages: z.array(z.string()).describe("3-5 key messages the piece must convey"),
  summary: z
    .string()
    .describe("One-paragraph creative summary a director could brief a team from"),
});

export type BriefParser = z.infer<typeof briefParserSchema>;

export const shotSchema = z.object({
  number: z.number().int().positive(),
  description: z.string().describe("What happens on screen — concrete and filmable"),
  duration: z.string().describe("Shot duration, e.g. '2.5s'"),
  type: z
    .enum(["wide", "medium", "close-up", "macro", "aerial", "insert", "title", "other"])
    .describe("Shot size / kind"),
  notes: z
    .string()
    .describe("Camera, lighting, or performance notes — empty string if none"),
});

export const shotListSchema = z.object({
  shots: z.array(shotSchema).min(3).max(24),
  pacingNote: z.string().describe("How the cut should feel across the sequence"),
});

export type ShotList = z.infer<typeof shotListSchema>;
export type Shot = z.infer<typeof shotSchema>;

export const assetItemSchema = z.object({
  name: z.string(),
  kind: z.enum(["visual", "audio", "text", "other"]),
  detail: z.string().describe("What specifically is needed and why"),
  priority: z.enum(["required", "optional"]),
});

export const assetPlanSchema = z.object({
  assets: z.array(assetItemSchema).min(4),
  stockOrShoot: z.string().describe("Guidance on shoot vs stock vs generate"),
});

export type AssetPlan = z.infer<typeof assetPlanSchema>;
export type AssetItem = z.infer<typeof assetItemSchema>;

export const workflowNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["brief", "generate", "style", "edit", "export", "asset", "other"]),
  description: z.string(),
});

export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().describe("Edge label — empty string if none"),
});

export const workflowBuilderSchema = z.object({
  nodes: z.array(workflowNodeSchema).min(4),
  edges: z.array(workflowEdgeSchema).min(3),
  rationale: z.string().describe("Why this node graph fits the brief"),
});

export type WorkflowBuilder = z.infer<typeof workflowBuilderSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;

export const generateRequestSchema = z.object({
  brief: z.string().min(12, "Brief is too short — add a bit more detail").max(2000),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const AGENT_IDS = [
  "brief-parser",
  "shot-generator",
  "asset-planner",
  "workflow-builder",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export type AgentMeta = {
  id: AgentId;
  name: string;
  description: string;
};

export const AGENTS: AgentMeta[] = [
  {
    id: "brief-parser",
    name: "Brief Parser",
    description: "Extracts objective, tone, duration, audience, key messages",
  },
  {
    id: "shot-generator",
    name: "Shot Generator",
    description: "Builds a filmable shot list with timing and coverage",
  },
  {
    id: "asset-planner",
    name: "Asset Planner",
    description: "Lists visual, audio, and text assets required to execute",
  },
  {
    id: "workflow-builder",
    name: "Workflow Builder",
    description: "Maps the plan to a Creative Studio node graph",
  },
];
