# cdd-T22b — hideText shield margins + enhanced-body isMethodMember

## Item 1: `hideText` leaf shield margins (T22's residual, row 72)

`EntityImageDescription.getShield()` (java:239-262, ported faithfully
already in `EntityImageDescription.ts:369-374`) was never CALLED at
DOT-node-build time — `class-dot-graph.ts#buildOneDotNode` declared every
`circle`/`() "Name"` leaf as a bare `fixedsize` 18x18 node with no
`shieldMargins`, so `SvekNode.java:220-267`'s 3x3 shield table (top/bottom
margin = the label's own height, 14px on conija) was never reserved and
graphviz ranked 18-28px too tight.

Fix: `class-hidetext-shield.ts` (new) computes, per `kind:'circle'`
classifier, the SAME sizing-time `EntityImageDescription` instance T22's
`measureCircleInterfaceInk` builds (via a widened
`class-layout-leaf-shapes.ts#buildCircleInterfaceSizingParams`, now
threading a real `links` array instead of the hardcoded `[]` — `getShield`
is the ONLY consumer of `this.links`/`this.fixCircleLabelOverlapping`, so
every pre-existing caller stays byte-identical with the new param
defaulting to `[]`), calls `.getShield(bounder)`, and reads the result
into `DotInputNode.shieldMargins` through T15's already-generic
`graph-layout.ts#portNodeSize`/`shieldCorner` reconciliation — no changes
needed there.

`linksTouching` filters `ast.relationships` to those touching the leaf
(upstream: `Collection<Link> links`, ALREADY filtered per
`EntityImageDescriptionLinkInfo`'s own doc comment — the Java does the
`contains(leaf)` filter INSIDE each of the three scan helpers instead,
same net effect). `sourceDecor`/`targetDecor` fall back to
`EDGE_DECORATION_MAP[rel.type]` when absent, mirroring
`class-edge-group-inheritance.ts`'s identical pattern — `LinkType
#isDoubleDecorated` always reads a fully-resolved pair upstream. Neither
target fixture (conija, niduni) ever exercises this fallback: both of
their circle-touching links have `length === 2` (default), and all three
of `getShield`'s escape-hatch conditions gate on `length === 1` — so the
decor-default path is unverified against a live fixture, ported per the
Java rather than left out.

A node only gets `shieldMargins` when `!shield.isZero()` OR
`theme.fixCircleLabelOverlapping === true` — `SvekNode#appendShape`
(java:132-155) draws the HTML shield table unconditionally for
`RECTANGLE_WITH_CIRCLE_INSIDE` (that skinparam) but only when
`isShielded()` (`shield().isZero() == false`) for the plain `RECTANGLE`
case; the corpus never reaches the `fixCircleLabelOverlapping` branch, so
it too is ported, not exercised.

**Import-cycle avoidance**: `hideTextShieldMarginsByEntity` could not live
in `class-shield-helpers.ts` (its natural "shield helpers" home) because
it needs `class-dot-edges.ts#EDGE_DECORATION_MAP` for the decor-default
fallback, and `class-dot-edges.ts` → `class-port-rows.ts` →
`class-shield-helpers.ts` is already a real edge — importing back would
cycle. New standalone module instead.

**Line-cap workaround**: `class-dot-graph.ts` was ALREADY 502 lines (over
the repo's 500-line hook cap) at this task's start — the hook's own
"directional" policy (`~/.claude/hooks/check-complexity.py`: "a file
already over the line cap, not made longer -> allowed") meant any net
growth would block. Extracted `nonEmptyNamespaceIds`/`buildDotClusters`
(pure move, ~72 lines) to a new `class-dot-clusters.ts`, matching this
file's own established `class-dot-width-floors.ts` precedent from T15 —
freed enough headroom that the wiring (+1 import, +1 merged-map lookup in
the existing Kal-margins post-pass loop) landed at 433 lines, well under
cap.

Verified directly against `conija-14-nuta580/svek-1.dot`'s cell via
`dot-sync-report.ts --slug`: our emitted `toSvekDot` output is
byte-identical (mod the `.0`-suffix double-formatting the structural
comparator already normalizes) to the oracle's shield table --
`WIDTH="35.0125" HEIGHT="14"` margins around an `18x18 PORT="h"` centre.

Targets: conija 0/8 → 0/0 CONFORMANT, niduni 0/425 → 0/0 CONFORMANT.
cacoma unchanged 0/2 (no `circle` in that fixture; pre-existing,
undiagnosed per T22). DOT parity unchanged 711/712.

## Item 2: enhanced-body member classification (T23 row 73 / T19 row 65)

`class-body-enhanced-layout.ts:199` computed `visibilityIsField:
m.params === undefined` inline. `m.params` is only ever set for the TWO
structured method shapes parsed at parse time; a raw-fallback member
(`rawDisplay` set — text that fit neither the structured field nor method
regex) never gets `params`, so the inline check ALWAYS bucketed a
raw-fallback member as a field, regardless of content. `class-member-rows
.ts#isMethodMember` (already correct, classic-path-only before this fix)
additionally checks `forcedBucket` (a `{method}`/`{field}` tag) and,
failing that, `rawDisplay.includes('(') || rawDisplay.includes(')')` —
upstream's own `BodierLikeClassOrObject#isMethod` rule: ANY raw line
containing a paren is a method, however malformed. Fix: `class-body-
enhanced-layout.ts` now imports and calls `isMethodMember(m)` (no logic
duplicated) instead of the inline check.

Targets: xogixe 2/0 → 0/0 CONFORMANT (its two `Resource(A|B|C)`-typed
Observation fields — TYPE containing parens, not a method call —
previously fell to the raw-fallback field bucket; jar classifies them
`PUBLIC_METHOD` filled `#84BE84`, verified directly in the fixture's own
`in.svg`), fijali 11/0 → 0/0 CONFORMANT (Java-style `+void destroy()`).
tuguku 7/0 → 6/0, filoxo 20/0 → 19/0: one member row's icon-fill diff
each resolved fully (`ellipse[1]/@fill exp=#84BE84 act=none` →
byte-exact); the REMAINING diffs on both (`polygon.../@fill exp=#B8860B
act=#FF4`, plus filoxo's separate shadow-filter-id/stroke-width/
font-family residuals) are T19's own row-65 SECOND icon-selector cause —
no `<style> visibilityIcon { protected {...} } }` cascade exists in this
port (`colorsFor()`'s own doc comment) — unaddressed by this item, exactly
as the brief anticipated. Confirmed via `git stash` A/B: before this fix
tuguku's 3 polygon fills read `act=none` (unfilled, WRONG — the
classification defect); after, they read `act=#FF4` (correctly FILLED,
wrong SPECIFIC hex — the cascade defect) — two distinct, provable
mechanisms, not one partially-fixed one.

Four UNPLANNED-but-same-mechanism movers found by the full `pin-diff`
sweep, all enhanced-body fixtures with non-standard ("Java-style")
method syntax that fails the structured parse and falls to `rawDisplay`:
`pejone-71-tige404` (234→220 structural, `.. Fields ..`/`.. Methods ..`
titled separators, `#CapInteract(): virtual void {}`-shaped raw methods),
`xonamo-50-podo529` (234→220, same source shape), `rakopi-21-sufa571`
(17→13), `rusuzi-21-kile910` (10→3, `__` untitled separators). Each
verified by `git stash`-ing the fix and diffing the exact icon-fill paths
that moved from `act=none` (wrong, unfilled) to a real hex value —
same mechanism as tuguku/filoxo, most now fully resolved, a small number
still short by the same style-cascade gap (e.g. pejone's one residual
`g[1]/g[7]/g[1]/polygon[1]/@fill exp=#FF4 act=#4177AF`).

## Gates / measurements

- `pin-diff t22b-base.json t22b.json`: 10 transitions, 0 falls (script:
  `node` comparing `.structural`/`.numeric`/`.verdict` per row, not just
  `pin-diff.mts`'s own verdict-only transitions, since two movers
  — tuguku/filoxo — changed structural COUNT without a verdict flip).
- DOT parity: 711/712 before and after (unchanged).
- `npm test`: 774 passed | 1 skipped (775) test files; 21974 passed | 2
  skipped | 1 todo (21977) tests. Re-run twice (once pre-prettier, once
  post) at load 2.6-45.6 — no flakes.
- `typecheck`/`lint`/`build`: all exit 0, both before and after
  `npx prettier --write` on the touched files.

## Contradiction noted

The mission brief's item-2 target list omitted the four extra movers
(pejone/rakopi/rusuzi/xonamo) that `isMethodMember` also happens to fix —
they are not named in the brief's fixture list, but they are the SAME
mechanism (an enhanced-body raw-fallback member with a paren in its raw
text), a strict improvement, and zero regression risk to anything the
brief did scope. Reported, not filed as a surprise.
