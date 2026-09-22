"use client";

import { useMemo, useState } from "react";
import WorkflowGraphLazy from "@/components/WorkflowGraphLazy";
import { EXAMPLE_BRIEFS } from "@/lib/examples";
import { AGENTS, type AgentId, type Shot } from "@/lib/schemas";
import {
  runPipeline,
  type AgentStatus,
  type PipelineResult,
} from "@/lib/pipeline";

type UiStatus = "idle" | "loading" | "success" | "error";

const initialStatuses = (): Record<AgentId, AgentStatus> => ({
  "brief-parser": "idle",
  "shot-generator": "idle",
  "asset-planner": "idle",
  "workflow-builder": "idle",
});

const FIELD_LABELS: { key: keyof PipelineResult["breakdown"]; label: string }[] =
  [
    { key: "title", label: "Working Title" },
    { key: "objective", label: "Objective" },
    { key: "duration", label: "Duration" },
    { key: "format", label: "Format" },
    { key: "tone", label: "Tone" },
    { key: "audience", label: "Audience" },
  ];

function StatusDot({ status }: { status: AgentStatus }) {
  if (status === "done") {
    return (
      <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
    );
  }
  if (status === "running") {
    return (
      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
    );
  }
  if (status === "error") {
    return <span className="h-2 w-2 rounded-full bg-red-400" />;
  }
  return <span className="h-2 w-2 rounded-full bg-zinc-700" />;
}

export default function Home() {
  const [brief, setBrief] = useState("");
  const [status, setStatus] = useState<UiStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState(initialStatuses);
  const [result, setResult] = useState<PipelineResult | null>(null);

  const doneCount = useMemo(
    () => Object.values(agentStatuses).filter((s) => s === "done").length,
    [agentStatuses]
  );

  function updateShot(index: number, patch: Partial<Shot>) {
    setResult((prev) => {
      if (!prev) return prev;
      const shots = prev.shots.shots.map((s, i) =>
        i === index ? { ...s, ...patch } : s
      );
      return { ...prev, shots: { ...prev.shots, shots } };
    });
  }

  function moveShot(index: number, delta: number) {
    setResult((prev) => {
      if (!prev) return prev;
      const shots = [...prev.shots.shots];
      const target = index + delta;
      if (target < 0 || target >= shots.length) return prev;
      [shots[index], shots[target]] = [shots[target], shots[index]];
      const renumbered = shots.map((s, i) => ({ ...s, number: i + 1 }));
      return { ...prev, shots: { ...prev.shots, shots: renumbered } };
    });
  }

  function removeShot(index: number) {
    setResult((prev) => {
      if (!prev) return prev;
      const shots = prev.shots.shots
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, number: i + 1 }));
      return { ...prev, shots: { ...prev.shots, shots } };
    });
  }

  function addShot() {
    setResult((prev) => {
      if (!prev) return prev;
      const next: Shot = {
        number: prev.shots.shots.length + 1,
        description: "New shot — describe what happens on screen",
        duration: "2s",
        type: "other",
        notes: "",
      };
      return {
        ...prev,
        shots: { ...prev.shots, shots: [...prev.shots.shots, next] },
      };
    });
  }

  async function handleGenerate() {
    const trimmed = brief.trim();
    if (trimmed.length < 12) {
      setError("Add a bit more detail to the brief (at least a short sentence).");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    setResult(null);
    setAgentStatuses(initialStatuses());

    const outcome = await runPipeline(trimmed, (agent, agentStatus) => {
      setAgentStatuses((prev) => ({
        ...prev,
        [agent]: agentStatus,
      }));
    });

    if (!outcome.ok) {
      setError(outcome.error);
      setStatus("error");
      setAgentStatuses((prev) => {
        const next = { ...prev };
        (Object.keys(next) as AgentId[]).forEach((id) => {
          if (next[id] === "running") next[id] = "error";
        });
        return next;
      });
      return;
    }

    setResult(outcome.result);
    setStatus("success");
  }

  function handleReset() {
    setBrief("");
    setStatus("idle");
    setError(null);
    setResult(null);
    setAgentStatuses(initialStatuses());
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-zinc-800/80 bg-[#0B0B0F]/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto w-full max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md border border-green-500/40 bg-green-500/10 grid place-items-center text-green-500 font-display font-black text-sm">
              H
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight font-display">
                Pre-Production Agent
              </p>
              <p className="text-[11px] text-zinc-500">
                Prototype for Hexcoded Creative Studio
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-400 eyebrow">
            4-agent pipeline
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 space-y-10">
        <section className="space-y-3">
          <p className="eyebrow text-[11px] text-green-500">
            Blank canvas → structured plan → node workflow
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50 font-display">
            Turn a one-line brief into a production-ready plan.
          </h1>
          <p className="max-w-2xl text-zinc-400 leading-relaxed">
            Four agents parse the brief, generate a shot list, plan assets, and
            map everything to a draft Creative Studio node workflow.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4 h-fit">
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
              className="w-full resize-y rounded-xl border border-zinc-700 bg-[#0B0B0F] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_BRIEFS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setBrief(example)}
                  className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-[11px] text-zinc-400 hover:border-green-500/50 hover:text-green-300 transition-colors text-left"
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
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-black hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === "loading" ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    Running pipeline… {doneCount}/4
                  </>
                ) : (
                  "Run Pre-Production Pipeline"
                )}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                >
                  New brief
                </button>
              )}
            </div>

            {status === "error" && error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3 h-fit">
            <p className="eyebrow text-[10px] text-zinc-500">Agent pipeline</p>
            <ol className="space-y-3">
              {AGENTS.map((agent, i) => (
                <li key={agent.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center pt-1.5">
                    <StatusDot status={agentStatuses[agent.id]} />
                    {i < AGENTS.length - 1 && (
                      <span
                        className={`w-px h-8 mt-1 ${
                          agentStatuses[agent.id] === "done"
                            ? "bg-green-500/40"
                            : "bg-zinc-800"
                        }`}
                      />
                    )}
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="text-sm font-medium text-zinc-200 font-display">
                      {agent.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-snug">
                      {agent.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        {status === "success" && result && (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-100 font-display">
                  1 · Project breakdown
                </h2>
                <span className="text-[11px] text-zinc-500 font-mono">
                  brief-parser ✓
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FIELD_LABELS.map(({ key, label }) => (
                  <article
                    key={key}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1.5"
                  >
                    <p className="eyebrow text-[10px] text-zinc-500">{label}</p>
                    <p className="text-sm text-zinc-200 leading-snug">
                      {result.breakdown[key]}
                    </p>
                  </article>
                ))}
              </div>

              <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                <p className="eyebrow text-[10px] text-zinc-500">
                  Key messages
                </p>
                <ul className="flex flex-wrap gap-2">
                  {result.breakdown.keyMessages.map((msg) => (
                    <li
                      key={msg}
                      className="rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1 text-xs text-green-300"
                    >
                      {msg}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                <p className="eyebrow text-[10px] text-zinc-500">
                  Creative summary
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {result.breakdown.summary}
                </p>
              </article>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-100 font-display">
                  2 · Shot list
                </h2>
                <span className="text-[11px] text-zinc-500 font-mono">
                  shot-generator ✓
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-zinc-500 text-left text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Shot</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Notes</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {result.shots.shots.map((shot, index) => (
                      <tr key={shot.number} className="bg-[#0B0B0F]/50">
                        <td className="px-4 py-3 font-mono text-zinc-500">
                          {shot.number}
                        </td>
                        <td className="px-4 py-3 text-zinc-200 min-w-[220px]">
                          <input
                            value={shot.description}
                            onChange={(e) =>
                              updateShot(index, { description: e.target.value })
                            }
                            className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-green-500/60 focus:bg-zinc-900 rounded px-2 py-1 text-sm text-zinc-200 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                          <input
                            value={shot.duration}
                            onChange={(e) =>
                              updateShot(index, { duration: e.target.value })
                            }
                            className="w-16 bg-transparent border border-transparent hover:border-zinc-700 focus:border-green-500/60 focus:bg-zinc-900 rounded px-2 py-1 text-sm text-zinc-300 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400">
                            {shot.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs min-w-[160px]">
                          {shot.notes?.trim() ? shot.notes : "—"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => moveShot(index, -1)}
                            disabled={index === 0}
                            className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Move shot up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveShot(index, 1)}
                            disabled={index === result.shots.shots.length - 1}
                            className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Move shot down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeShot(index)}
                            className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-red-300 hover:bg-red-500/10"
                            aria-label="Remove shot"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={addShot}
                  className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                >
                  + Add shot
                </button>
                <p className="text-xs text-zinc-500 italic">
                  Pacing: {result.shots.pacingNote}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-100 font-display">
                  3 · Asset requirements
                </h2>
                <span className="text-[11px] text-zinc-500 font-mono">
                  asset-planner ✓
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.assets.assets.map((asset) => (
                  <article
                    key={`${asset.kind}-${asset.name}`}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow text-[10px] text-zinc-500">
                        {asset.kind}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          asset.priority === "required"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {asset.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-200 font-display">
                      {asset.name}
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {asset.detail}
                    </p>
                  </article>
                ))}
              </div>
              <p className="text-xs text-zinc-500 italic">
                Approach: {result.assets.stockOrShoot}
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-100 font-display">
                  4 · Draft node workflow
                </h2>
                <span className="text-[11px] text-zinc-500 font-mono">
                  workflow-builder ✓
                </span>
              </div>
              <WorkflowGraphLazy workflow={result.workflow} height={440} />
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <p className="text-xs text-zinc-500">
                  {result.workflow.rationale}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify(result, null, 2)],
                        { type: "application/json" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "hexcoded-preproduction-plan.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 hover:bg-green-500/20 transition-colors"
                  >
                    Export JSON
                  </button>
                  <a
                    href="https://hexcoded.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-green-500/50 hover:text-green-300 transition-colors"
                  >
                    Open in Hexcoded →
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 py-6">
        <p className="mx-auto max-w-5xl px-6 text-xs text-zinc-600">
          Built as an audition prototype for Hexcoded · Not an official product
        </p>
      </footer>
    </div>
  );
}
