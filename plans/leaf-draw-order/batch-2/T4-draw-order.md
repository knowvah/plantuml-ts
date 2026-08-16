# T4 — Build `leaves` in jar's order; render as one loop

## Context

After T2 (`computeLeafDrawOrder(ast)`) and T3 (`ClassGeometry.leaves`), the
port has the order and the collection but still draws through N52's
host-interleave: `renderer.ts#renderClass` step 2 walks classifiers in
array order and pushes each hosted note right after its host, step 4
trails the unhosted notes after the edges. Jar (`SvekResult#drawU`,
`svek/SvekResult.java:70-102`): clusters first (`:72-74`), then EVERY node
in `bibliotekon.allNodes()` order (`:82-90` — a hidden node draws through
`UHidden`, i.e. nothing, `:84`), then every edge (`:96-100`). Notes and
TIPS leaves are nodes like any other.

## Task

1. `layout.ts#layoutSinglePage`: `leaves` = the classifier and note geos
   arranged by `computeLeafDrawOrder(effAst)` (index the geos by id; assert
   the order covers every geo id — an id missing from the order is a T2 bug,
   throw). `layoutMultiPage` concatenates pages in page order (each page
   already ordered). `class-geo-builders.ts#degenerateSingleClassifier`
   returns its (single) leaf list unchanged.
2. `renderer.ts#renderClass`: after clusters (step 1), ONE loop over
   `geo.leaves` in array order:
   - `ClassifierGeo` → today's per-kind classifier draw (hidden → nothing,
     assoc-circle unwrapped, lollipop, usymbol, …) — move the existing
     bodies, do not rewrite them;
   - `NoteGeo` `kind: 'note'` → `renderOneNote` (opale/plain, wrapped);
   - `kind: 'tips'` → resolved tip or nothing (`note-tips-resolve.ts`);
   then edges, exactly as today. Delete `notesByHost`, `hostedNoteIds`,
   `renderHostedNotes`, and the trailing-notes pass. A hidden host's notes
   now draw because nothing skips them (D5).
3. `renderer-uid.ts`: `buildClassUidPlan` input from the renderer keeps
   `classifierLeaves(geo.leaves)` / `noteLeaves(geo.leaves)` — note that in
   FALLBACK mode (`isExact` false) numbering follows array order, which now
   follows the leaf order. Production fixtures are exact; hand-built tests
   may not be. Any fixture whose uids get reassigned among themselves must
   show up as `--check-order` MOVED with an unchanged uid MULTISET — list
   each in the journal with the reason (fallback mode). If a PINNED fixture
   is among them, STOP.
4. Tests: rewrite the assertions that pinned N52's interleave/trailing order
   in `tests/unit/class/renderer.test.ts` (and any other file grep finds:
   `hostId`, `renderHostedNotes`, "trailing", "immediately after its host")
   to jar's order, each citing the corpus fixture proving it (e.g.
   `xoxuni-96-fere626`: jar `ent0001 ent0002 note:ent0005 note:ent0008 lnk3`
   — pure creation order; `temise-16-neco018`: all six classes, then the
   three notes). Add a test for D5 (`hide A` + tip on `A::m` → tip drawn).

## Write-set

- `src/diagrams/class/layout.ts`, `class-geo-builders.ts`, `renderer.ts`,
  `renderer-uid.ts`
- `tests/unit/class/renderer.test.ts`, `tests/unit/class/renderer-uid.test.ts`,
  any other test pinning N52 order (grep first; list them in the journal)

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:70-102`
- `src/diagrams/class/class-leaf-order.ts` (T2's contract) and its test
- `src/diagrams/class/renderer.ts:296-470` (`renderClass` today)
- `src/diagrams/class/layout.ts:207-303, 317-400`
- `src/diagrams/class/renderer-uid.ts:182-200` (`isExact`), `:324-345`
  (fallback), `:355-370` (note fallback order)
- `plans/leaf-draw-order/baseline/order-vs-jar.txt` — the 47 ORDER-ONLY
  fixtures you are expected to clear
- `src/diagrams/state/renderer.ts` — how state's single loop dispatches on
  `kind` (shape to copy, not code)

## Architecture decisions

D1–D6 all apply; D3 (leaves order is draw order) and D5 (hidden host) are
this task's substance. Locked.

## Interface contracts

None downstream beyond `ClassGeometry.leaves` now being ORDERED (T3's
type, T2's order). T5/T6 consume the reports.

## Acceptance criteria

- Given the corpus, when `--vs-jar` runs, then `same=725 order-only=0
  other=77 err=0`. If `order-only` > 0, T4 is still complete when every
  remaining fixture is named in the journal for T5 (do not fit).
- Given the corpus, when `--check-order plans/leaf-draw-order/baseline/
  note-order.txt` runs, then `offenders=0` and the MOVED set ⊇ the cleared
  ORDER-ONLY fixtures; every extra MOVED fixture is a listed fallback-uid
  reassignment with an unchanged uid multiset.
- Given the corpus, when shape-match and `dot-sync-report class` run, then
  diff-empty; `npm test` green with only the cited N52 re-pins moved.
- Given `class A {\n  m\n}\nclass C\nnote left of A::m\nhello\nend note\nhide A`
  (multi-line tip), when rendered, then "hello" appears once and the canvas
  is 223x84 (jar probe 2026-08-15, pinned jar; port before: hello=0).
- Given `class X\npackage P {\nclass A\nnote "n" as N\n}\nclass Y\nnote left of X : hello`,
  when rendered, then the entity `<g>` order is `P.A, N, X, Y, __note_1`
  (jar: `P.A, P.N, X, Y, GMN6`).

## Quality bar

All four gates; the four corpus checks in README "Quality gates"; complexity
hook (split the leaf loop's per-kind dispatch into a helper if `renderClass`
exceeds the caps). Do not pipe `npm test`.

## Observability requirements

N/A — no new observable operations.

## Rollback notes

Reversible (revert the commit).

## Boundaries

- Always: move existing classifier-draw bodies verbatim; every re-pinned
  test cites its fixture.
- Never: change any classifier's or edge's own draw output; change uid
  NUMBERING rules; touch `class-dot-graph.ts` or the state engine; sort by
  anything other than T2's order.
- Ask first (STOP): a fixture moves AWAY from jar (`same` < 678) or its uid
  SET changes.
- No git commands (the orchestrator commits: `feat(T4): ...`).
