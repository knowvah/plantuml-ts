# T4 — G15: clip composite-anchor splines before they reach the ink extent

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-residual-fix-batch`. Faithful TypeScript port of PlantUML; the Java
at `~/git/plantuml` is the **canonical spec** — read the method body, not a
summary. vitest, tests under `tests/unit/`.

This task was reclassified into the mission on 2026-08-19. It was filed as
dot-engine issue 15 (an anchor-ranking defect) and **disproven**: `-Tdot` on
`test-results/dot-cache/state/fovafu-44-mifu394/svek-1.dot` is byte-identical
between the port and native graphviz, as on five hand-built variants of the
shape. The two numbers in the original filing were never the same quantity —
`88.187` is the jar's **drawn (clipped)** spline start, `112` is our
**unclipped** one. The anchor never moved.

## Task

### The mechanism, already established
The jar clips a cluster-sourced edge at the cluster rectangle in Java, via
`DotPath#simulateCompound` (`SvekEdge.java:671-672`). Graphviz cannot do it for
this shape even if asked: with `compound=true` + `ltail`, the head is inside
the tail cluster's bb, so `makeCompoundEdge`
(`~/git/graphviz/lib/dotgen/compound.c:378-383`) warns "head is inside tail
cluster" and leaves the spline untouched — verified, adding both attributes
changes the oracle's output not at all. The jar's DOT sets neither attribute.

The +7.820 px is arithmetic on the segment we keep: the oracle's control point
`205.82` maps into the jar's frame as `200.820`, A's right frontier is `193`,
and `200.820 − 193 = 7.820`.

### Step 1 — move the seam to core
`src/diagrams/description/spline-clip.ts` (161 lines) is already a faithful
port of `DotPath#simulateCompound`, exporting `subdivide`, `clipSplineStart`
and `clipSplineEnd`. Its only import is a `Bbox` **type** from
`./layout-helpers.js`.

Move it to `src/core/spline-clip.ts` and repoint every existing importer.
Resolve the `Bbox` type without dragging description internals into core —
either re-declare the structural type in core, or take it from an existing core
geometry type if one matches exactly. **Do not copy the file**: one port of
`simulateCompound`, per CLAUDE.md and SI27.

`tests/architecture/layering.test.ts` is the gate. `KNOWN_DEBT` is `[]` and must
stay `[]`; adding an ALLOWLIST entry to make state import from description is
stop 6, not a solution.

### Step 2 — consume it in the state ink walk
Apply the clip to state composite-anchor transitions **before** the spline is
folded into the ink extent (`layout-ink-extent.ts`'s transition-ink path).
Clip against the source composite's own rectangle, mirroring what
`SvekEdge.java:671-672` passes.

Note T3 (Batch 3) has already edited `layout-ink-extent.ts` for the G5
south-cap term. Do not disturb it.

## Write-set
- `src/core/spline-clip.ts` — new (moved)
- `src/diagrams/description/spline-clip.ts` — deleted
- description's importers of it (at least
  `src/diagrams/description/renderer-draw-sequence.ts`; grep for the rest)
- `src/diagrams/state/layout-ink-extent.ts` — the transition-ink path only
- The corresponding unit tests, including the moved file's own

## Read-set
- `docs/graphviz-issues/15-cluster-anchor-point-ranked-with-target.md` — read
  the **whole** file: the original filing AND the reclassification note that
  supersedes it. The table at the top is the disproven premise; do not work
  from it.
- `src/diagrams/description/spline-clip.ts` — the port you are moving
- `tests/architecture/layering.test.ts:1-90` — Rules 1 and 2, `ALLOWLIST`,
  `KNOWN_DEBT`
- `src/diagrams/state/layout-ink-extent.ts` — the transition-ink path
  (`addTransitionInk` and its callers)
- **Java:** `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:660-690`
  (the `simulateCompound` call site — which rectangles it passes, and under
  what condition) and `klimt/shape/DotPath.java`'s `simulateCompound` itself.
  **Read both method bodies before touching the clip.**
- `plans/shared-seam-extraction/README.md` — SI27, the precedent for moving a
  seam into `src/core/` without changing behaviour

## Architecture decisions (locked)
D4's spirit applies: T3 owns `layout-ink-extent.ts`'s south-cap term in the
prior batch; you own its transition-ink path. Stop 6 governs layering — no
ALLOWLIST entry, no `KNOWN_DEBT`.

## Acceptance
- Given `fovafu-44-mifu394`, when the harness runs, then scope2 width idx0 is
  exact (+7.8205 → 0). Its scope2 height row (+0.0038 px) is the G14
  sub-pixel band and is **out of scope** — it must not grow.
- Given the description engine, when the full suite runs, then moving
  `spline-clip.ts` changes nothing: description's own fixtures and the
  description parity ratchet (357) are byte-identical.
- Given `tests/architecture/layering.test.ts`, then it passes with
  `KNOWN_DEBT` still `[]` and no new ALLOWLIST entry.
- Given `oracle/goldens/state/size-backlog.json`, then `fovafu-44-mifu394`'s
  pin (currently `0.108618`) is removed or tightened — never loosened — and
  the change is journaled.
- Given the harness, then `0 rows appeared or grew`.
- Given `render-manifest`, then every moved fixture is on
  `expected-moves.txt` under a `# Batch 4` heading with a jar-side account.
  Clipping changes drawn splines, so moves are expected here.

## Interface contracts
`src/core/spline-clip.ts` exports the same three functions with unchanged
signatures — `subdivide(cubic)`, `clipSplineStart(points, tail)`,
`clipSplineEnd(points, head)`. The move is behaviour-preserving; if you find
yourself changing their arithmetic, you have exceeded this task.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: one commit. The move is a rename plus import repointing; the state
consumer is additive.

## Quality bar
All four gates green, coverage >= 90/90/90. TDD. Prove the move is inert
before adding the state consumer — commit-ready state after Step 1 should have
zero fixture movement anywhere.

Opus behavioural note: implement the minimal faithful interpretation. Do not
generalise the clip into a geometry framework, and do not refactor the ink walk
while you are in it. The carve-out applies in the other direction too — Steps 1
and 2 are both required; neither is optional scope.

## Boundaries
- **Always:** one port of `simulateCompound`; cite `SvekEdge.java:671-672` at
  the state call site.
- **Ask first:** nothing.
- **Never:** copy `spline-clip.ts` instead of moving it; add an ALLOWLIST or
  `KNOWN_DEBT` entry; loosen the `fovafu-44` backlog pin; disturb T3's
  south-cap term; run git.

## Report (<=500 tokens)
fovafu-44 before/after (both rows); proof Step 1 was inert; the layering test
result; the backlog pin's disposition; moved fixtures with accounts.
