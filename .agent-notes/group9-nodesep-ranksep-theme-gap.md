## Observation: skinparam nodesep/ranksep cannot reach class-dot-graph.ts
without a Theme field (theme.ts), and the brief's assumed override
semantics (max-with-minimum) is wrong

- **Context**: Group 9 task (iteration 15) — thread `skinparam nodesep N` /
  `skinparam ranksep N` into `src/diagrams/class/class-dot-graph.ts`
  (currently hardcodes `nodeSep: 35, rankSep: 60` at ~L226-229). Write-set
  was `class-dot-graph.ts` + `skinparam.ts` (additive-only) + a new test
  file — explicitly NOT `ast.ts` or `layout.ts`.

- **Finding 1 (threading gap)**: `buildDotGraph(ast, measuredMap, theme,
  measurer)` already receives a `Theme` (from `src/core/theme.ts`), and
  other layout-relevant skinparams (`linetype`, `fixCircleLabelOverlapping`,
  `componentStyle`) reach it exactly this way: parsed in
  `resolveSkinparam` (`src/core/skinparam.ts`) into a `ThemeOverride`,
  merged by `deepMergeTheme`'s `applyOptionalScalars`
  (`src/core/theme.ts:347-360`) into the final `Theme`. **But `Theme` has
  no `nodeSep`/`rankSep` fields today** — grepped `theme.ts` for
  nodesep/ranksep: zero hits. Adding them requires editing three spots in
  `theme.ts`: the `Theme` interface (~L23-38), the `ThemeOverride` type
  (~L290-316), and `applyOptionalScalars` (~L347-360) — mirroring the
  `linetype` pattern exactly. `theme.ts` is a shared file **not in this
  task's write-set** (only `class-dot-graph.ts` / `skinparam.ts` /
  the new test are). This is architecturally the same class of blocker as
  the ast.ts/layout.ts stop condition the brief called out, just one file
  over from where the brief drew the line.
  - Independent corroboration: `src/diagrams/description/link-edge-attrs.ts:88`
    already has a comment on `computeGraphSpacing`: "(The skinparam
    nodesep/ranksep override is deferred — Theme has no such fields yet.)"
    — a different diagram type hit and documented this exact same gap.
  - Once `theme.ts` has the fields, the fix in `class-dot-graph.ts` is a
    one-line read (`theme.nodeSep ?? 35`, `theme.rankSep ?? 60`) — no
    `ast.ts` or `layout.ts` changes needed at all. The precedent
    (`rankdir`) that lives on `ClassDiagramAST` instead of `Theme` does
    NOT apply here — `rankdir` is class-diagram-structural (`left to
    right direction` keyword, not a `skinparam`), whereas nodesep/ranksep
    are generic cross-diagram-type skinparams and belong on `Theme` like
    `linetype`.

- **Finding 2 (semantics mismatch vs. the brief)**: The brief describes
  upstream as "getNodesep()/getRanksep() take max(skinparam value, minimum
  35/60px)" citing `DotStringFactory.java:242-258`. Read those lines
  directly (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java`):
  lines 241-256 are actually just `getMinRankSep()`/`getMinNodeSep()` —
  private helpers returning the *default* minimum (60/35, or 40/20 for
  ACTIVITY diagrams) used to clamp the **dzeta-computed** default when no
  skinparam is set. The actual skinparam-override logic lives at
  `DotStringFactory.java:117-133`:
  ```java
  double nodesep = getHorizontalDzeta(stringBounder);
  if (nodesep < getMinNodeSep()) nodesep = getMinNodeSep();
  if (skinParam.getNodesep() != 0) nodesep = skinParam.getNodesep();   // unconditional override, no max/clamp
  ...
  double ranksep = getVerticalDzeta(stringBounder);
  if (ranksep < getMinRankSep()) ranksep = getMinRankSep();
  if (skinParam.getRanksep() != 0) ranksep = skinParam.getRanksep();   // same
  ```
  `SkinParam.getNodesep()`/`getRanksep()` (`skin/SkinParam.java:847-856`)
  are `getAsInt("nodesep", 0)` / `getAsInt("ranksep", 0)` — plain int
  reads, default 0 meaning "unset".
  So a skinparam value, when present (nonzero), **replaces** the
  clamped/dzeta value outright — it is NOT maxed against the 35/60
  minimum. `skinparam nodesep 10` legitimately emits `nodesep=10` (below
  the oracle's usual floor), not `nodesep=35`. A test asserting
  "below-minimum value clamps to 35/60px" (as the brief's TDD step 2
  specifies) would encode the wrong behavior per upstream source.

- **Impact**: Any future iteration picking up Group 9 must (a) get
  `theme.ts` added to the write-set (or have another agent add the two
  optional fields + merge-scalar lines there first), and (b) implement
  unconditional-override-when-set, not max-with-minimum, to match
  `DotStringFactory.java:117-133`. Implementing the brief's literal
  max-semantics as written would pass a self-authored test but diverge
  from the oracle whenever a fixture sets nodesep/ranksep below 35/60.

- **Confidence**: High — both findings verified directly against
  `~/git/plantuml` source (exact line numbers cited above) and against
  the current `theme.ts`/`skinparam.ts` contents in this repo.
