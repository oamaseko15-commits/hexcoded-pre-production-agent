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

export const generateRequestSchema = z.object({
  brief: z.string().min(12, "Brief is too short — add a bit more detail").max(2000),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
