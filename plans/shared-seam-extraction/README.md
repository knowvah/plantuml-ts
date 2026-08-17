# Mission: shared-seam-extraction (SI27)

**Pull code that upstream keeps in ONE shared place, and this port scattered
into diagram engines (imported across engines, or copy-pasted per engine),
back into `src/core/` — as pure, evidenced moves.** Named by the maintainer in
`planning/next-missions.md §2` (2026-08-16) after `edge-label-box-backlog` T5
had to import *upward* from `src/core/` into `src/diagrams/class/`. Extended
2026-08-17 to the clone families (upstream single-source, ours per-engine).
Register row **SI27** at T10.

**Branch:** `refactor/shared-seam-extraction` · **Merge:** merge commit.

## Starting state (measured 2026-08-17 at `321bfb8b`; verified at T0)

`src/core/**` → `src/diagrams/**` (non-registry): `core/edge-label-box.ts:22`
→ class (`splitEdgeLabelLines`); `core/assemble-svg.ts:10-13` → description/
class/state/json shells. Engine → engine: class → description ×7 (`leaf-
sizing` ×4, `ast`, `renderer-symbol`, `render-atoms`); state → class ×1
(`class-color-override`); hcl/yaml → json ×5 each (**legit, stays** — CLAUDE.md
JsonDiagram ruling). Clones: `Display.getWithNewlines` ×3 ports;
`FrontierCalculator` ×2; `measureLinkNoteDim` ×3 (+`core/rose-note-dim`);
`Command<ParseState>` ×4; `CommandCreateJson` ×2 (74 % identical, `JsonNode`
100 %); shells ×4 over one `core/klimt/document-shell.ts`.
DOT EQUAL class 705/711 · state 266/268 · component 259/263 · usecase 92/93 ·
object 78/80 (SI26 close-out; re-measured at T0, 321bfb8b — unchanged).

## Exit bar (score clause by clause; do not reword)

1. `src/core/**` imports nothing from `src/diagrams/**` except the registry's
   `diagrams/*/index.js` dispatch; no `src/diagrams/X` imports `src/diagrams/Y`
   except hcl/yaml → json. Enforced by `tests/architecture/layering.test.ts`
   whose allowlist entries each carry a written upstream justification, and
   whose `KNOWN_DEBT` is empty.
2. ONE port each of `Display.getWithNewlines`, `FrontierCalculator`,
   `measureLinkNoteDim`, `Command`, `CommandCreateJson`/`JsonNode`, the
   leaf-sizing family, `resolveBareOrBackColor`, the USymbol/atom helpers —
   all under `src/core/`, each `@see`-ing its upstream file.
3. **Byte-identical output**: `scripts/render-manifest.ts` (T0) over every
   `in.puml` in `test-results/dot-cache/*/` and `oracle/goldens/**` — the
   final manifest equals the T0 baseline, OR every differing fixture is
   journalled as jar-ward (T1 only) with the golden/ratchet evidence.
4. DOT EQUAL counts unchanged for all five types; every ratchet pin holds;
   `shape-match-report` no fixture rises.
5. All four quality gates green; coverage ≥ 90/90/90.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Evidence harness + fitness test + baseline | T0 | [x] |
| [1a](batch-1a/overview.md) | Display unification ∥ USymbol/atom helpers ∥ color-override | T1 T2 T4 | [x] |
| [1b](batch-1b/overview.md) | FrontierCalculator ∥ link-note dim ∥ Command<S> ∥ assemble-svg | T5 T6 T7 T8 | [x] |
| [2](batch-2/overview.md) | leaf-sizing family (needs T2) ∥ CommandCreateJson (needs T7) | T3 T9 | [x] |
| [3](batch-3/overview.md) | Retire debt, docs, close-out | T10 | [ ] |

Batches 1a and 1b have disjoint write-sets and MAY run as one 7-way parallel
batch if the executor prefers; they are split only to keep each gate run
small.

## Quality gates

```
- command: npm test            # vitest + 90/90/90
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx jiti scripts/render-manifest.ts --out /tmp/m.json && npx jiti scripts/render-manifest.ts --diff test-results/shared-seam-baseline-manifest.json /tmp/m.json
  pass: "0 fixtures differ" (T1: or every differing fixture journalled jar-ward)
  on_fail: stop
- command: for t in class state component usecase object; do npx jiti scripts/dot-sync-report.ts $t; done
  pass: EQUAL counts unchanged vs T0
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: matches the task's declared write-set only (moved files: old + new path)
  on_fail: stop
```

Manifest and dot-sync runs need a clean tree; the per-task manifest MAY be
scoped to the touched engines' dot-cache dirs (push-forward 6); the batch-end
run is always the full set. Oracle renders only via
`scripts/oracle-render.sh <out-dir> <puml>`.

## Stop conditions

1. A file outside the task's write-set needs changes and is in no other
   task's write-set.
2. Two consecutive gate failures on the same check; fix attempts cap at 2,
   investigation continues to the mechanism (`rules/diagnosis.md`).
3. Any of D1–D8 would be contradicted (e.g. byte identity is only reachable
   through a core→diagram or engine→engine import).
4. Manifest diff non-empty and NOT jar-ward: any fixture whose SVG/DOT
   changes without moving toward (or holding at) its jar golden / ratchet.
5. A move becomes a merge with a behavioural conflict the Java does not
   settle (T5 `FrontierCalculator.java`, T9 `CommandCreateJson.java`) —
   journal both behaviours + citation, stop.
6. Coverage < 90/90/90 and the gap is not a misplaced (un-moved) test.
7. Same location changed 3× without resolving the same failing check.
8. > 5 files need changes beyond a task's write-set.
9. `.claude/catalog.md` does not exist — do NOT create it in this mission.

## Push forward (journal the call)

- Import-path rewrites, transitional re-exports *inside the same task*,
  test-file relocations.
- Delete vs one-line shim for a former engine-side file: prefer delete; shim
  only when a test outside the write-set imports it.
- T1: a fixture that moves toward its jar golden / holds its DOT ratchet —
  accept, journal per fixture.
- Naming of new core files with no Java class behind them (D8).
- JSDoc that still names an old path — fix in the same commit.
- Manifest scoping per engine for per-task runs; full run at batch end.
- Splitting a task's commit into `move` + `rewire` commits (still one task).

## Index

- [decisions.md](decisions.md) — D1–D8
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md) ·
  [diagrams/data-flow.md](diagrams/data-flow.md)
- Deferred families (follow-on missions, NOT tasks here): notes command
  family (`command/note/CommandFactoryNote*`), remove/restore + hide/show
  (`classdiagram/command/CommandRemoveRestore`, `CommandHideShow2`), DOT
  graph builders (`svek/DotStringFactory`), `renderer-group` `<g>` wrappers,
  cluster header/levels (`svek/ClusterHeader`), description JSON wiring,
  `LeafSizingSubject` → `abel/Entity` convergence (SI-1).
- Predecessors: `planning/next-missions.md §2`, `plans/edge-label-box-and-
  class-ports/` (T1 relocation precedent), `plans/edge-label-box-backlog/`.
