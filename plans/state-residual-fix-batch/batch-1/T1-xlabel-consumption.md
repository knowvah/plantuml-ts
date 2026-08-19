# T1 — G20b: consume `EdgeGeometry.xlabel` from dot-engine 1.6

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-residual-fix-batch`. Faithful TypeScript port of PlantUML; the Java
at `~/git/plantuml` is the spec. vitest, tests under `tests/unit/core/`.

This work was filed as a dot-engine gap during this mission's planning
(`docs/graphviz-issues/16-edge-xlabel-position-not-in-getlayout.md`, commit
`1fd425e0`) and shipped in **1.6.0**. Issue 16's own "Verification when it
lands" section is your step list; this file expands it.

## Task

### Step 1 — bump, and prove the bump inert
Move `package.json`'s `@knowvah/dot-engine` pin from `^1.5.0` to `^1.6.0` and
install.

The bump is additive by construction — verified during planning, and worth
re-verifying rather than trusting: the entire `dist/index.js` diff between
1.5.0 and 1.6.0 is

```js
const xlabel = placedLabelPos(edge.info.xlabel, flipY);
if (xlabel !== void 0) geom.xlabel = xlabel;
```

inside `snapshotEdge`, plus the type and doc in `src/api/geometry.ts`. The
compound modules (`compound.ts`, `compound-clip.ts`, `compound-geom.ts`) are
byte-identical between the two releases.

**Commit-ready state after Step 1 must move ZERO fixtures** — run the full
harness and `render-manifest` before writing any consumption code. A move here
means the bump is not what the diff says it is; that is a stop, not something
to absorb into Step 2's allow-list.

### Step 2 — forward the attribute
`addEdges` (`src/core/graph-layout-build-edges.ts`, the attribute-forwarding
block) reads `a?.label`, `a?.tailLabel` and `a?.headLabel` and has no `xlabel`
branch. Add one, mirroring the existing `label` branch — including its
`labelBoxWidth`/`labelBoxHeight` fixed-size-table variant, since
`moveLabelToXlabel` sets `xlabelWidth`/`xlabelHeight` alongside `xlabel`.

### Step 3 — map the returned position
`toEdgeEntry` (`src/core/graph-layout.ts`) maps `ge.label`/`ge.tailLabel`/
`ge.headLabel` onto the seam's own fields. Map `ge.xlabel` so
`attachInlineTransitionLabel`'s existing `edgeResult?.labelX !== undefined`
gate starts passing for ortho edges. Do not change that gate.

### Step 4 — correct the type's doc comment
`src/core/graph-layout.types.ts`'s doc block explicitly promises that
`tailLabel`/`headLabel` reach the real layout call and says nothing about
`xlabel` — the asymmetry that exposed this bug. Extend it to cover `xlabel`
now that the claim is true. **Doc only; no type change** — the three
`xlabel`/`xlabelWidth`/`xlabelHeight` fields already exist.

### Step 5 — tick the tracker
`docs/graphviz-issues/TRACKER.md`'s own rule: tick the box only when the fix
has landed in the pinned package **and** the affected fixtures re-measure
clean. Both hold at the end of this task — tick 16 and record the pinned
version and `pavuzo-79`'s measured result in the comment.

## Write-set
- `package.json`, `package-lock.json`
- `src/core/graph-layout-build-edges.ts`
- `src/core/graph-layout.ts`
- `src/core/graph-layout.types.ts` — doc comment only
- `docs/graphviz-issues/TRACKER.md`
- The corresponding unit tests

## Read-set
- `docs/graphviz-issues/16-edge-xlabel-position-not-in-getlayout.md` — the
  whole file, including the "FIXED upstream" note at its foot
- `src/diagrams/state/state-dot-graph.ts` — `moveLabelToXlabel`, which sets
  the three attributes and deletes `label`/`labelWidth`/`labelHeight`
- `src/diagrams/state/state-transition-label.ts` — the
  `edgeResult?.labelX !== undefined` gate and the `perpendicularOffsetLabel`
  fallback it currently takes
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:433-437`
  — the jar's own `dotSplines == ORTHO` fork. **Read the method body.**
- `node_modules/@knowvah/dot-engine/dist/api/geometry.d.ts` after the bump —
  the `xlabel` field and its `lp->set` semantics

## Architecture decisions (locked)
None specific to this task beyond the mission-wide gates. Note the layering
test governs `src/core/` → `src/diagrams/` imports only; adding an attribute
branch inside `src/core/` needs no ALLOWLIST entry, and `KNOWN_DEBT` stays
`[]`.

## Interface contracts
`DotInputEdge.attributes` already declares `xlabel`, `xlabelWidth`,
`xlabelHeight` — no type change. The seam's edge entry gains no new field:
`ge.xlabel` maps onto the existing `labelX`/`labelY`, because for an ortho edge
the xlabel *is* the transition's label.

## Acceptance
- Given Step 1 alone, when the full harness and `render-manifest` run, then
  **zero rows and zero fixtures move**. Report this before Step 2 exists.
- Given `pavuzo-79-zodu430`, when the harness runs after Step 3, then scope2
  width idx2 is exact (−2.460 px → 0).
- Given an ortho-routed transition, when `layoutGraph` runs, then the returned
  edge carries a defined `labelX`/`labelY` (assert directly in a unit test —
  this is the condition that was silently false).
- Given a NON-ortho edge, then its label handling is byte-identical to before
  (no regression on the `label` path).
- Given `render-manifest`, then every moved fixture is on
  `expected-moves.txt` under a `# Batch 1` heading with a jar-side account.
  Ortho composites' labels move to graphviz's real placement — expected, and
  each one is jar-ward.
- Given `TRACKER.md`, then issue 16 is ticked with the pinned version and
  `pavuzo-79`'s result recorded.

## Observability
N/A — no new observable operations. Note for the close-out that this changes
**emitted SVG** for every ortho/polyline composite with an inline transition
label.

## Rollback
Reversible: one commit. Reverting restores the `^1.5.0` pin; the `xlabel`
fields on `DotInputEdge` were already declared and simply go unread again.

## Quality bar
All four gates green, coverage >= 90/90/90. TDD. Step 1's inertness is a
reported measurement, not an assumption.

## Boundaries
- **Always:** prove Step 1 inert before writing Step 2; account for every
  manifest move against the jar's own render.
- **Ask first:** nothing.
- **Never:** change `attachInlineTransitionLabel`'s gate; touch
  `perpendicularOffsetLabel`'s arithmetic (it stays for non-ortho callers);
  absorb a Step-1 move into Step 2's allow-list; run git.

## Report (<=500 tokens)
Step 1's inertness evidence; `pavuzo-79` before/after; the moved fixtures with
accounts; the TRACKER line as written.
