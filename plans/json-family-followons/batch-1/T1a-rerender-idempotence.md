# T1a — dot-engine re-render idempotence (D3)

Agent: debugger (opus, effort high), worktree `jff-T1a`. Include
[../task-contract.md](../task-contract.md). Commit: `docs(graphviz-issues):
re-render of one graph object (T1a)` if filed, else `docs(jff): re-render
idempotence check closed (T1a)`.

## Context
`.agent-notes/jfp-b1.md` ("dot-engine re-render of the same graph object is not
idempotent", Medium confidence, two agents, never checked by an orchestrator):
`digraph{a->b}` rendered twice on one graph object gave `a 27,90 / b 27,18`
first (= real dot) and `a 27,18 / b 99,18` second, with the first pass's edge
route. `layoutGraph` (`src/core/graph-layout.ts`) renders once, so no
production row is affected. Memory `dot-engine-blame-needs-real-dot`: two
earlier attributions to dot-engine fell to a real-`dot` check. This task is
diagnosis, not a fix — never edit dot-engine.

## Task
1. Reproduce in a scratch script outside `src/` (your worktree's tmp, not
   committed): build `digraph{a->b}` with the API the note used (find it in
   `src/core/graph-layout.ts` / `graph-layout-build.ts`), render twice, print
   node positions and the edge route each time. Also: re-parse the DOT and
   render once (control — must equal the first render).
2. Read dot-engine's contract for reusing a `Graph`: `node_modules/@knowvah/dot-engine/README.md`
   (API section around `render(g: Graph, format, …)`, line ~447), its `dist/*.d.ts`
   JSDoc. Quote what it says about repeated layout/render (or that it says nothing).
3. Native comparison: compile a tiny C program against libgvc
   (`/opt/homebrew/include/graphviz/gvc.h`; `cc … -lgvc -lcgraph`) that does
   `agmemread` → `gvLayout` → `gvRender(…,"plain")` → `gvFreeLayout` → `gvLayout`
   → `gvRender` and prints both. (If the API has no free-layout analogue, also
   run layout twice without free and record what libgvc does.)
4. Decide per D3:
   - dot-engine documents single-use, or has no free/reset step and native also
     requires `gvFreeLayout` → record in `.agent-notes/jff-T1a.md` (the note's
     template), close the item.
   - reuse is permitted (documented or implied by an API like native's free
     cycle) AND native is idempotent → file `docs/graphviz-issues/<next n>-rerender-not-idempotent.md`
     (self-contained: repro, both outputs, native output, contract quote; follow
     an existing file's layout, e.g. `docs/graphviz-issues/36-*.md`; next free number is 37 at planning time) and one
     `TRACKER.md` line.

## Write-set
`.agent-notes/jff-T1a.md`; only on the file branch:
`docs/graphviz-issues/<n>-rerender-not-idempotent.md`, `docs/graphviz-issues/TRACKER.md`.

## Read-set
`.agent-notes/jfp-b1.md:19-24`, `src/core/graph-layout.ts` (the render call),
`node_modules/@knowvah/dot-engine/README.md`, `node_modules/@knowvah/dot-engine/dist/*.d.ts`,
`docs/graphviz-issues/TRACKER.md` (format), one existing issue file.

## Acceptance
- Given the scratch repro, then the note records both render outputs and the re-parse control with exact coordinates.
- Given the contract read, then the note quotes the README/d.ts text (or states it is silent) with file and line.
- Given the native program, then the note records its source and both outputs.
- Given D3's rule, then exactly one of: an issue file + TRACKER line exist, or the note closes the item with the reason.

Observability: N/A. Rollback: Reversible.
