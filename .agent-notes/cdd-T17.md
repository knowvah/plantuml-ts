# cdd-T17 — role labels on relationship ends

## Observation: role syntax is NOT purely additive at the reservation
level, but the "second anchor" is purely additive at the ink level

- **Context**: reading `SvekEdge.java:329-351,447-466,1023-1030` +
  `drawRoleLabel` (`:1025-1063`) before porting M8.
- **Finding**: upstream never emits a second, role-specific DOT attribute.
  `taillabel`/`headlabel` reserve EITHER the quantifier OR the role
  (`if (startTailText != null) ... else if (startTailRoleText != null)`,
  `:447-466`) — one slot, ever. When an end has a real quantifier, the
  role is drawn as a SEPARATE, purely geometric block (`drawRoleLabel`),
  mirrored across the line direction from the ALREADY-PLACED quantifier
  box, with no DOT reservation of its own. So "the role occupies the
  cardinality's position" (fallback) and "the role is a second anchor"
  (additive) are two DIFFERENT mechanisms triggered by two DIFFERENT
  conditions on the SAME end, not one feature with an edge case.
- **Impact**: `class-layout-edge-labels.ts#computeMultiplicityAttrs` only
  needed a one-line fallback (`rel.fromMultiplicity ?? rel.fromRole`); the
  actual new geometry work is entirely in `class-edge-label-anchor.ts`
  (mirror math), not in the DOT-reservation layer.
- **Confidence**: High (Java read line-by-line; both branches jar-verified
  against `mugobo-34-fede498`/`nenexe-35-zere033`, byte-exact within the
  pre-existing N25 sub-pixel residual).

## Observation: step-1 grep must be the real parser, not a regex — a
regex reliably misses bare-role syntax

- **Context**: the orchestrator's own naive `"[^"]*"/"[^"]*"` grep hit
  only ONE of the two named fixtures.
- **Finding**: `REL_ROLE = (?:/([^\s]+|"[^"]*"))?` (`class-relationship-
  parser.ts:174`) accepts a BARE (unquoted) role token, glued directly
  (no `\s*`) after the optional quoted cardinality. `mugobo-34-fede498`
  uses `"owner which is very long"/1` (bare role `1`); `nenexe-35-
  zere033` uses `"owner"/"1"` (quoted role). Any single fixed-form regex
  misses one shape or the other. Ran the REAL parser
  (`parseClass`/`extractBlocks`) over every cached `in.puml` and checked
  `rel.fromRole`/`toRole !== undefined` on the parsed AST instead — this
  is strictly more reliable than any regex approximation, and is what
  the reported list below is actually grounded in.
- **Impact**: **exactly 2 of 712 corpus fixtures use role syntax at all**
  — `mugobo-34-fede498`, `nenexe-35-zere033`, both already `diverged` in
  `t16b.json`, both with `dotEdgeReversed === false`. The zero-fixture-
  rise hazard the brief named never had a THIRD fixture to move; the risk
  was real in principle, empty in this corpus.
- **Confidence**: High (ran the actual parser, not an approximation).

## Observation: `Link.java:116-117`'s `getInv()` swaps `role2`/`role1`
too — a REAL, currently-unreached gap in `class-dot-edges.ts#swappedRel`

- **Context**: T11's `swappedRel` doc comment (before this task) claimed
  swapping `fromRole`/`toRole` "would be inert" since nothing read them.
  That's now false: `attachPortLabels` reads them.
- **Finding**: `Link.getInv()` → `new Link(..., linkArg.getInv())` →
  `LinkArg.getInv()` returns `new LinkArg(..., quantifier2, quantifier1,
  ..., kal2, kal1, role2, role1)` — quantifiers, kals, AND roles all swap
  together on direction inversion (`-left-`/`-up-`). `class-dot-edges.ts
  #swappedRel` swaps `fromMultiplicity`/`toMultiplicity` but NOT
  `fromRole`/`toRole`. For a hypothetical FUTURE fixture combining
  `-left-`/`-up-` direction AND the role-as-fallback case (role, no
  multiplicity, on a `dotEdgeReversed` edge), the DOT reservation would
  size the box from the WRONG end's role text.
  `class-edge-label-anchor.ts#attachPortLabels` does NOT have this gap —
  it independently recomputes `swap` from the true (unswapped) `rel` and
  swaps `fromRole`/`toRole` itself (mirrors `LinkArg.getInv()` exactly),
  so the ANCHOR/ink side is correct for every case, swapped or not.
- **Impact**: filed as a follow-on for `class-dot-edges.ts#swappedRel`
  (outside this task's write-set) — unreached by all 712 corpus fixtures
  (neither role fixture has `dotEdgeReversed === true`), so not a stop
  condition, but a real latent gap for `next-missions.md`.
- **Confidence**: High (Java read; corpus-wide check confirms zero
  fixtures combine the two conditions today).

## Observation: `class-geo-types.ts` needed a SECOND split (`ClassGeometry`
→ `class-geo-geometry-types.ts`) — the cdd-T6 split alone wasn't enough
headroom for one more field

- **Context**: file was already at 502 lines (over cap after a prettier
  pass, per the orchestrator's pre-flight note) before adding
  `EdgeGeo.roleLines`.
- **Finding**: moved the self-contained `ClassGeometry` interface (the
  top-level document type, unrelated to `EdgeGeo`'s own growth) to a new
  sibling `class-geo-geometry-types.ts`, re-exported — same pure-move
  precedent as the existing `NamespaceGeo`/`JsonBodyItem` splits in the
  same file. This is a TYPE-ONLY circular import between the two files
  (`class-geo-geometry-types.ts` imports `type EdgeGeo` from
  `class-geo-types.ts`; that file re-exports `type ClassGeometry` from
  the new file) — safe under `verbatimModuleSyntax: true` (fully erased
  at compile time, confirmed clean via `tsc --noEmit`).
- **Impact**: future `EdgeGeo` fields should budget for this file being
  right at the cap again; the two sibling files it can still shed pieces
  into are `class-geo-edge-extras.ts` (119 lines, room) and now
  `class-geo-geometry-types.ts` (74 lines, room).
- **Confidence**: High (measured via the hook's own line-count enforcement).

## Observation: `class-edge-label-anchor.ts` needed a SECOND split too —
the role mirror geometry + `attachPortLabels` moved to a new sibling

- **Context**: the file was 386 lines pre-task; adding the role-mirror
  cluster (`mirrorRoleBoxTopLeft`/`roleLabelAnchors`/`attachEndPortLabel`/
  `attachPortLabels`) pushed it to 615 lines in one shot.
- **Finding**: split the WHOLE role-mirror + `attachPortLabels` cluster
  into a new `class-edge-role-label-anchor.ts`, which imports
  `measureLabelLines`/`labelLinesFromTopLeft`/`placeQuantifierBox`/
  `portLabelAnchor` (exported from the original file) — the original file
  then re-exports `roleLabelAnchors`/`attachPortLabels` so
  `class-edge-geo.ts`'s existing `import { attachPortLabels } from
  './class-edge-label-anchor.js'` needed NO change. `attachPortLabels`
  itself also independently tripped the complexity hook (47 NLOC / CCN 13,
  a REAL new violation, not a lizard artifact) once the swap-resolved
  role variables joined the pre-existing quantifier-swap logic — fixed by
  extracting `buildEndLabelInputs` (the tail/head `EndLabelInput` pair
  assembly) out of `attachPortLabels`, which then dropped comfortably
  under both caps.
- **Impact**: same lesson as T16b's own note — when a change trips the
  hook on a function whose CONTENT genuinely grew (not a
  false-positive), extracting a new small function is the fix, not
  reformatting.
- **Confidence**: High (measured directly via the hook's pass/fail on
  each edit).

## Step-1 fixture list (role syntax, corpus-wide)

| slug | t16b.json verdict | role syntax form |
|---|---|---|
| `mugobo-34-fede498` | diverged | bare (`/1`), quoted (`/items`) |
| `nenexe-35-zere033` | diverged | quoted (`/"1"`), quoted (`/"items"`) |

No other fixture in the 712-fixture corpus carries `fromRole`/`toRole`
(verified by running the real parser, not a regex, over every cached
`in.puml`). Both were already `diverged`, so the zero-fixture-rise hazard
never had a THIRD fixture to move; there is no t16b-conformant fixture in
this list at all.

## Step-7 mover confirmation

`render-all.mts` → `pin-diff.mts t16b.json t17.json`: exactly 2
transitions, both `diverged -> structural-match` (mugobo, nenexe) — no
other slug moved (structural or numeric). `dot-sync-report.ts class`
stays 711/712 (unchanged). Both movers' final render matches jar
byte-for-byte on structure and within the pre-existing N25 sub-pixel
residual on position (e.g. `151.231` vs jar's `151.23`).
