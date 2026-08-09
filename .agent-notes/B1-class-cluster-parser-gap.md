## Observation: class parser has no `package` keyword and no
  dotted-implicit-namespace support — blocks clusterOk parity entirely
- **Context**: B1 (feat/a2-class-dot-sync) — populate
  `DotInputGraph.clusters` from `ast.namespaces` in class `layout.ts` to
  fix the 34 fixtures the mission brief identified as
  clusterOk-only-fail (`npx tsx scripts/dot-sync-report.ts class`).
- **Finding**: `src/diagrams/class/parser.ts`'s `COMMANDS` table has a
  rule for `namespace X { ... }` (regex
  `/^namespace\s+(\S+)\s*\{?\s*$/i`) but NO sibling rule for
  `package X { ... }` — upstream PlantUML treats `package` as an
  equivalent (and more common) container keyword. Result:
  `ast.namespaces` stays `[]` for any `package`-block fixture, and
  members inside it parse as ordinary top-level classifiers with no
  `namespace` field. Separately, upstream derives an IMPLICIT nested
  namespace hierarchy from dots in any classifier/namespace id (e.g.
  `class foo1.foo2` ⇒ namespace `foo1` containing class `foo2`;
  `namespace net.sourceforge { }` ⇒ nested `net` > `net.sourceforge`,
  each a separate DOT cluster, sizes accumulating outward). Our
  `Namespace` AST (`ast.ts`) is flat (`{ id, display, classifiers }`,
  no parent field) and the parser never splits a dotted id — a
  `namespace net.sourceforge { }` becomes ONE flat namespace with id
  `"net.sourceforge"`, not two nested ones.
  Verified exhaustively: enumerated all 34 fixtures the mission brief
  called "clusterOk-only-fail" (script in commit 3cd5cf6's body) —
  EVERY one hits one of: `package` keyword (unrecognized), dotted
  namespace/classifier id (needs implicit nesting), or extra namespace
  syntax the regex doesn't match at all (color spec
  `namespace X #color {`, `namespace "Quoted" as alias {`,
  `set namespaceSeparator ::` custom separators). None are the
  "flat, single-level, plain identifier" case that B1's layout.ts-only
  fix could actually move.
- **Impact**: B1's layout.ts/graph-layout.ts changes are correct,
  necessary groundwork (populate `DotInputGraph.clusters`, use a
  `clusterN`-shaped id so the oracle comparator's `parseClusters`
  regex recognizes it) but produce **zero** movement on
  `dot-sync-report.ts class` today (137/680 EQUAL, 106 clusterOk fails,
  unchanged before/after) because the input data
  (`ast.namespaces`) is never populated correctly for any target
  fixture. A follow-up task must add, in `parser.ts`/`ast.ts`
  (currently outside B1's write-set):
  1. `package X { ... }` recognized as a `namespace`-equivalent block.
  2. Dotted-id implicit namespace splitting (both explicit
     `namespace a.b.c { }` and bare `class a.b.C`), producing a nested
     `Namespace` chain (needs a `parentId`-like field — currently
     absent from `ast.ts`'s `Namespace`).
  3. Handle namespace-declaration trailing decorations (`#color`,
     `as alias`, `[[link]]`, quoted display names,
     `set namespaceSeparator X`) without breaking the block-open match.
  Only after that will `layoutClass`'s cluster emission have real data
  to translate.
- **Also verified (ruled out)**: the mission brief's "SECONDARY —
  shared emitter" diagnosis (rename `graph-layout.ts`'s
  `cluster_${c.id}` to fix component's 8 / usecase's 4 clusterOk
  fails) does not hold. `dot-sync-report.ts`'s structural comparator
  never runs `graph-layout.ts` — it parses
  `toSvekDot(capturedDotInputGraph)` (`src/core/svek-dot-emit.ts`),
  which emits `subgraph ${cluster.id}` directly from the
  `DotInputCluster.id` field, bypassing `graph-layout.ts` entirely.
  The description engine's `clusterId` generator
  (`description/layout.ts:108`, `` `cluster${counter.n++}` ``) already
  matches the regex, so component/usecase's clusterOk fails are a
  membership-count bug (verified on `josoxo-49-taci997`: oracle
  `[5,8]` vs ours `[3,10]` — same names, wrong sizes), unrelated to
  naming. Confirmed empirically: component 234/259 and usecase 59/87
  both unchanged before/after the graph-layout.ts naming fix.
- **Confidence**: High — verified via direct `parseClass()` probes,
  drilldown DOT diffs on every one of the 34 target fixtures, and
  before/after `dot-sync-report.ts` runs for class/component/usecase.
