"use client";

import { useState } from "react";
import { EXAMPLE_BRIEFS } from "@/lib/examples";
import type { BriefParser } from "@/lib/schemas";

type Status = "idle" | "loading" | "success" | "error";

type ApiResponse =
  | { ok: true; brief: string; agent: string; breakdown: BriefParser }
  | { ok?: false; error: string };

const FIELD_LABELS: { key: keyof BriefParser; label: string }[] = [
  { key: "title", label: "Working Title" },
  { key: "objective", label: "Objective" },
  { key: "duration", label: "Duration" },
  { key: "format", label: "Format" },
  { key: "tone", label: "Tone" },
  { key: "audience", label: "Audience" },
];

export default function Home() {
  const [brief, setBrief] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<BriefParser | null>(null);

  async function handleGenerate() {
    const trimmed = brief.trim();
    if (trimmed.length < 12) {
      setError("Add a bit more detail to the brief (at least a short sentence).");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    setBreakdown(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: trimmed }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !("ok" in data && data.ok)) {
        setError(
          "error" in data && data.error
            ? data.error
            : "Something went wrong running the Brief Parser."
        );
        setStatus("error");
        return;
      }

      setBreakdown(data.breakdown);
      setStatus("success");
    } catch {
      setError("Network error — could not reach the agent pipeline.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto w-full max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-violet-500 to-cyan-400 grid place-items-center text-zinc-950 font-bold text-sm">
              HX
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Pre-Production Agent
              </p>
              <p className="text-[11px] text-zinc-500">
                Prototype for HexCoded Creative Studio
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
            Agent 1 · Brief Parser
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 space-y-10">
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
            Blank canvas → structured plan
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
            Turn a one-line brief into a production breakdown.
          </h1>
          <p className="max-w-2xl text-zinc-400 leading-relaxed">
            Creative teams stall at the blank canvas. Drop a messy brief — the
            agent extracts objective, tone, duration, and key messages so you
            can move straight into shots, assets, and node workflows.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <label
            htmlFor="brief"
            className="block text-sm font-medium text-zinc-300"
          >
            Creative brief
          </label>
          <textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            placeholder="e.g. 30-second cinematic ad for a sustainable coffee brand, warm tones, emotional"
            className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_BRIEFS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setBrief(example)}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] text-zinc-400 hover:border-violet-500/50 hover:text-violet-300 transition-colors text-left"
              >
                {example.length > 52 ? `${example.slice(0, 52)}…` : example}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={status === "loading"}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === "loading" ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Parsing brief…
                </>
              ) : (
                "Run Brief Parser"
              )}
            </button>
            {breakdown && (
              <button
                type="button"
                onClick={() => {
                  setBreakdown(null);
                  setStatus("idle");
                  setError(null);
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {status === "error" && error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {status === "loading" && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 space-y-2">
              <p className="text-xs font-medium text-violet-300">
                Agent reasoning
              </p>
              <ul className="space-y-1.5 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-violet-400">1.</span> Reading brief for
                  objective, constraints, and format…
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400">2.</span> Inferring tone,
                  audience, and key messages…
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400">3.</span> Structuring
                  production-ready breakdown…
                </li>
              </ul>
            </div>
          )}
        </section>

        {status === "success" && breakdown && (
          <section className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-100">
                Project breakdown
              </h2>
              <span className="text-[11px] text-zinc-500 font-mono">
                agent:brief-parser ✓
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FIELD_LABELS.map(({ key, label }) => (
                <article
                  key={key}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-1.5"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    {label}
                  </p>
                  <p className="text-sm text-zinc-200 leading-snug">
                    {breakdown[key]}
                  </p>
                </article>
              ))}
            </div>

            <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Key messages
              </p>
              <ul className="flex flex-wrap gap-2">
                {breakdown.keyMessages.map((msg) => (
                  <li
                    key={msg}
                    className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200"
                  >
                    {msg}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Creative summary
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {breakdown.summary}
              </p>
            </article>
          </section>
        )}

        <section className="rounded-2xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-500 space-y-2">
          <p className="font-medium text-zinc-400">Roadmap in this prototype</p>
          <ul className="list-disc list-inside space-y-1">
            <li className="text-violet-300/90">Agent 1 · Brief Parser — live</li>
            <li>Agent 2 · Shot Generator — next</li>
            <li>Agent 3 · Asset Planner — next</li>
            <li>Agent 4 · Workflow Builder + React Flow graph — next</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-6">
        <p className="mx-auto max-w-5xl px-6 text-xs text-zinc-600">
          Built as an audition prototype for HexCoded · Not an official product
        </p>
      </footer>
    </div>
  );
}
