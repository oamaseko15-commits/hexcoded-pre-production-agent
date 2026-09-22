import {
  runAssetPlanner,
  runBriefParser,
  runShotGenerator,
  runWorkflowBuilder,
} from "@/lib/agents";
import { generateRequestSchema } from "@/lib/schemas";

type StreamEvent =
  | { type: "step"; agent: string; status: "running" | "done" | "error"; error?: string }
  | {
      type: "result";
      ok: true;
      brief: string;
      breakdown: Awaited<ReturnType<typeof runBriefParser>>;
      shots: Awaited<ReturnType<typeof runShotGenerator>>;
      assets: Awaited<ReturnType<typeof runAssetPlanner>>;
      workflow: Awaited<ReturnType<typeof runWorkflowBuilder>>;
    }
  | { type: "result"; ok: false; error: string };

function encoder() {
  return new TextEncoder();
}

function line(e: StreamEvent): Uint8Array {
  return encoder().encode(`${JSON.stringify(e)}\n`);
}

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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(line(e));

      try {
        send({ type: "step", agent: "brief-parser", status: "running" });
        const breakdown = await runBriefParser(brief);
        send({ type: "step", agent: "brief-parser", status: "done" });

        send({ type: "step", agent: "shot-generator", status: "running" });
        const shots = await runShotGenerator(brief, breakdown);
        send({ type: "step", agent: "shot-generator", status: "done" });

        send({ type: "step", agent: "asset-planner", status: "running" });
        const assets = await runAssetPlanner(brief, breakdown, shots);
        send({ type: "step", agent: "asset-planner", status: "done" });

        send({ type: "step", agent: "workflow-builder", status: "running" });
        const workflow = await runWorkflowBuilder(brief, breakdown, shots, assets);
        send({ type: "step", agent: "workflow-builder", status: "done" });

        send({ type: "result", ok: true, brief, breakdown, shots, assets, workflow });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        send({ type: "result", ok: false, error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
