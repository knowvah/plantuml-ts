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
| [3](batch-3/overview.md) | Retire debt, docs, close-out | T10 | [x] |

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

## Close-out (2026-08-17)

**Tasks:** 11 of 11 (T0–T10) on `refactor/shared-seam-extraction`; per-task
commits `28d18ee8` T0 · `ee3c4163` T6 · `2e107fd8` T7 · `497cbd24` T4 ·
`46b11a22` T2 · `6584addc` T5 · `2b0c0891` T1 · `d26269f5` T8 · `ca884222`
fix(T1) · `54060b49`/`87bc23e6` debt retirement · `12fec795` T3 · `6313cac6`
T9 · T10 = this commit. Batches 1a+1b ran as one 7-way batch; batch 2 as a
2-way batch; T10 by the orchestrator. Merge with a **merge commit**.

**Exit bar, scored clause by clause (measured at the T10 tree):**

1. ✅ `src/core/**` → `src/diagrams/**`: none (registry lives in
   `src/index.ts`, ALLOWLISTed as documentation); engine → engine: only
   hcl/yaml → json. `tests/architecture/layering.test.ts` passes, 3 ALLOWLIST
   entries each with a `why`, `KNOWN_DEBT = []` and pinned empty.
2. ✅ with one **flag**: ONE core port each of `Display.getWithNewlines`
   (`DisplayNewlines.ts#splitDisplayLines`), `FrontierCalculator`
   (`core/svek/FrontierCalculator.ts`), `measureLinkNoteDim`
   (`core/svek/image/EntityImageNoteLink.ts`), `Command<S>`
   (`core/command/Command.ts` — class/description/sequence alias it; **state
   keeps its own 3-arg `execute(state, match, pass)`**, faithful to
   `command/Command.java:44`, documented + type-tested; D4's "engines alias"
   clause is 3/4 literal), `CommandCreateJson`/`JsonNode`
   (`core/command/`), leaf-sizing family (`core/svek/image/leaf-sizing*.ts` +
   `LeafSizingSubject.ts`), `resolveBareOrBackColor` (`core/color-override.ts`),
   USymbol/atom helpers (`core/decoration/symbol/usymbol-resolve.ts`,
   `core/creole-atoms-image-resolver.ts`). Every file `@see`s its Java.
3. ✅ Manifest (2014 fixtures, `dot` on 1634): **2010 byte-identical**; the 4
   differing (`state/duzazu-41-telu529`, `juvagu-33-dupa212`,
   `lokija-02-dipe348`, `vixobo-14-jole910`) are T1's `\t` fix, jar-ward
   (`Display.java:305`; `<text>` glyphs + `textLength` now = jar; only
   tab-stop x remains — `DIVERGENCES.md` "`\t` in labels"). Journalled with
   before/after evidence.
4. ✅ DOT EQUAL class **705**/711 · state **266**/268 · component **259**/263 ·
   usecase **92**/93 · object **78**/80 — unchanged; every ratchet holds
   (`npm test` green); `shape-match-report` **785** doc-size-exact / **26,256**
   matched-shapes, per-fixture diff vs a 321bfb8b worktree census: 0 matched
   counts moved, 2 doc-width rows moved (`juvagu` 139 → 131 vs jar 104,
   toward; `lokija` 87 → 72 vs jar 183 — width away because the literal `\t`
   glyph pair was wider than the real tab, text content toward). No fixture
   rises.
5. ✅ typecheck · lint · build · `npm test` 601 files / 14,599 tests, coverage
   95.41 / 90.40 / 96.93 / 96.50.

**Decisions:** 20 journal rows; **flagged for the maintainer:** (a) T7 state
`Command` divergence above; (b) `fix(T1)` `ca884222` edited
`tests/unit/state/layout.test.ts` outside every write-set (stop 1 weighed;
2-line test-input correction, mechanism verified on `sosoxe-55-demi451`);
(c) T8 kept the class background/border finalize in `core/assemble-svg.ts`
dispatched on `diagramType` (D2's "inside the engine renderer" prose is not
reachable: both rects need the post-chrome canvas) — the D2 goal (one shell
call, zero engine imports, four shell files gone) is met; (d) T3 rewired 9
consumer test files' import paths beyond its literal write-set (pure move
consequence); (e) batch-1 git-index incident: a bare `git commit` swept other
agents' auto-staged renames — re-sliced by pathspec, tree byte-identical.

**Known issues / follow-ups:** the deferred families in the Index above
(unchanged); `skinparam tabSize` tab-stop indentation; state-parser
trailing-backslash continuation; `tests/architecture/sizer-renderer-parity
.test.ts` glob scans zero files post-move; description JSON wiring;
`.claude/catalog.md` still absent (stop 9 honoured — not created);
`src/core/klimt/document-shell.ts` doc prose still names the deleted
`assemble*Shell` helpers.
