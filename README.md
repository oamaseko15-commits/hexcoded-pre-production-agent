# Hexcoded Pre-Production Agent

Prototype audition project for [Hexcoded](https://hexcoded.ai) — turns a one-line creative brief into a structured production plan and a draft **Creative Studio node workflow**.

## The problem

Creative professionals stall at the blank canvas. A messy brief needs to become an executable plan: breakdown, shot list, assets, and a node graph — before any generation starts.

## What it does

1. **Brief Parser** — extracts objective, duration, format, tone, audience, key messages
2. **Shot Generator** — builds a filmable shot list with timing and coverage
3. **Asset Planner** — lists visual / audio / text assets required
4. **Workflow Builder** — maps the plan to a React Flow node graph shaped like Creative Studio

User flow:

```
"30-second cinematic ad for a sustainable coffee brand…"
        │
        ▼
  [4-agent pipeline]
        │
        ├── Project breakdown cards
        ├── Editable shot list
        ├── Asset requirements
        └── Node workflow (React Flow) → Export JSON / Open in Hexcoded
```

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 |
| AI | Vercel AI SDK 7 + Groq (`openai/gpt-oss-120b`) |
| Validation | Zod |
| Node canvas | `@xyflow/react` (React Flow) |
| Deploy | Netlify · Vercel |

## Live

- **Primary:** https://hexcoded-pre-production-agent.netlify.app
- **Backup:** https://hexcoded-pre-production-agent.vercel.app
- **Code:** https://github.com/oamaseko15-commits/hexcoded-pre-production-agent

## Run locally

```bash
npm install
cp .env.example .env.local   # add your GROQ_API_KEY
npm run dev
```

Open http://localhost:3000

## Environment

| Var | Where |
|-----|-------|
| `GROQ_API_KEY` | `.env.local` locally · Netlify → Site settings → Environment variables |

## Deploy (Netlify)

1. Push this repo to GitHub
2. In Netlify: **Add new site → Import an existing project**
3. Build command `npm run publish` is handled by `@netlify/plugin-nextjs` via `netlify.toml`
4. Set `GROQ_API_KEY` in site env vars

## Architecture

```
app/
  page.tsx                 # Client UI — brief input, pipeline status, results
  api/agents/route.ts      # Single-agent POST endpoint (one LLM call per request)
  layout.tsx               # Hexcoded brand fonts (Outfit / Inter / JetBrains Mono)
components/
  WorkflowGraph.tsx        # React Flow canvas (client-only)
  WorkflowGraphLazy.tsx    # dynamic() wrapper, ssr: false
lib/
  agents.ts                # 4 generateObject agent functions
  pipeline.ts              # Client sequential orchestration (4 fetches)
  schemas.ts               # Zod schemas + agent metadata
  ai.ts                    # Groq provider factory
  examples.ts              # Sample briefs
```

### Agent protocol

`POST /api/agents` runs **one** agent per request (Zod discriminated union on `agent`). The client (`lib/pipeline.ts`) chains the four calls sequentially and reports status after each step:

```json
// Request
{"agent":"brief-parser","brief":"..."}
// → later steps include prior outputs:
{"agent":"shot-generator","brief":"...","breakdown":{...}}

// Response
{"ok":true,"agent":"brief-parser","breakdown":{...}}
// or
{"error":"..."}   // 400 invalid body · 502 generation failure
```

Each call is a single LLM invocation, keeping well under Netlify's ~10s function timeout (a combined 4-call route previously died mid-pipeline).

## Design notes

UI follows the Hexcoded brand kit: green `#22C55E` as the only accent, cool greys, Outfit display + Inter body + JetBrains Mono labels.

## Out of scope (MVP)

Auth, saved projects, live Hexcoded API import, NLE export formats, mobile-first polish.
