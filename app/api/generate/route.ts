import { generateObject } from "ai";
import { GROQ_MODEL, getGroq } from "@/lib/ai";
import {
  briefParserSchema,
  generateRequestSchema,
} from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedReq = generateRequestSchema.safeParse(body);
  if (!parsedReq.success) {
    return Response.json(
      { error: parsedReq.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { brief } = parsedReq.data;

  try {
    const groq = getGroq();

    const { object: breakdown } = await generateObject({
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

    return Response.json({
      ok: true,
      brief,
      agent: "brief-parser",
      breakdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    const isConfig = message.includes("GROQ_API_KEY");
    return Response.json(
      { error: message },
      { status: isConfig ? 500 : 502 }
    );
  }
}
