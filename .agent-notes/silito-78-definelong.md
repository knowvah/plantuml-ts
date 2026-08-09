# silito-78-vubi253 — diagnosis (`!definelong` 3-vs-1 link count)

**Status correction up front:** this defect is **NOT open**. It was root-caused and
fixed on `main` in commit `8898572` ("fix(desc-dot): honor single link style as
add-time dedup, not render style"). Re-verified from a clean tree during this pass:
`npx tsx scripts/dot-sync-report.ts --slug silito-78-vubi253 component` reports
`all structural checks pass (structurallyEqual=true)` — our DOT emits 2 edges,
matching the oracle's 2. The task brief describing it as unresolved is stale.
This note records the mechanism with independent evidence, and flags one residual.

## Mechanism

`-[single]->` is not a render style — it is a link-**add**-time dedup flag. Upstream,
the `single` token sets `WithLinkType.single`, and `CucaDiagram.addLink` silently
**drops** any incoming `single` link when the diagram already holds any other link
connecting the same two entities. plantuml-ts's `link-grammar.ts` classified `single`
alongside the purely cosmetic tokens (dotted/dashed/bold/plain/node/thickness/#color)
and never surfaced it past parsing, so no dedup ever fired and all three expansions
of the macro body were appended.

## Origin

- **Ours (the bug):** `src/diagrams/description/link-grammar.ts` — `parseStyleFlags`,
  which recorded only `hidden` / `norank` and dropped `single` into the ignored
  `rawStyle` blob. Symptom surfaces later, at the `state.ast.links.push` site in
  `src/diagrams/description/parser.ts`, where upstream's dedup gate should sit.
- **Upstream (the spec):** `~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:880-885`
  (`addLink` → `containsSimilarLink`, :887-893) → `abel/Link.java:462-468`
  (`sameConnections` — endpoint identity, either direction, ignoring style/type).
  Flag set at `decoration/WithLinkType.java:151-152` (`applyOneStyle`'s `"single"`
  branch) → `goSingle()` / `isSingle()` at :110-116.

## Causal chain

1. The fixture's `!definelong connect(CALLER)` body contains `CALLER -[single]-> callee`.
   `connect(test2)` is invoked 3×.
2. **Both** our preprocessor and the jar's expand the macro 3×, producing 3 textually
   identical `test2 -[single]-> callee` statements. Verified by dumping our
   post-preprocessor line output — expansion is byte-correct. Macro expansion is NOT
   the divergence.
3. The jar parses each into a `Link` with `single=true`, then calls `CucaDiagram.addLink`.
   The 1st is appended; the 2nd and 3rd hit `isSingle() && containsSimilarLink()` and are
   dropped. → **1** `test2→callee` edge.
4. Ours parsed the same 3 statements, but `parseStyleFlags` discarded the `single` token,
   so `DescriptiveLink.single` was `undefined` and the push site had no dedup gate. All 3
   were appended. → **3** identical `test2→callee` edges. That is the reported symptom.

Pre-fix state reproduced directly (git worktree at `8898572^`, parser dumped):

```
test1 -> callee  single=undefined rawStyle=single   <-- token SEEN, flag DISCARDED
test2 -> callee  single=undefined rawStyle=single
test2 -> callee  single=undefined rawStyle=single
test2 -> callee  single=undefined rawStyle=single
```

`rawStyle=single` proves the token reached the parser and was then thrown away — the
divergence is precisely the drop, not a tokenization miss.

## Ruled out

| Hypothesis | Evidence that eliminated it |
| --- | --- |
| **`!definelong` / TIM macro expansion expands N× where jar expands 1×** | Dumped our post-preprocessor lines: we emit exactly 3 `test2 -[single]-> callee` statements. Controlled variant **V1** (same fixture, `[single]` deleted, `!definelong` kept) run through the jar → jar emits **4 edges**, 3 of them identical `test2→callee`. The jar's macro expansion also yields 3 links and does not dedup. Expansion is identical on both sides. |
| **`!definelong` is involved at all** | Controlled variant **V2** (`!definelong` deleted entirely, the 3 `-[single]->` links written out literally) → jar emits **2 edges**, collapsed. The collapse happens with zero macro involvement. `!definelong` is a red herring — it was merely the vehicle that produced 3 identical links. |
| **Single-keyword dedup / node-level dedup** (prior passes) | Confirmed still ruled out. V1 shows the jar happily keeps 3 identical links when `single` is absent, so there is no generic identical-link or node-level dedup. The 3× repeated `component "CALLEE" as callee` re-declaration is idempotent and irrelevant to edge count. |
| **`WithLinkType.isSingle` is dead code upstream** (asserted by an earlier pass; the brief repeats it) | **False.** It is live at `net/atmp/CucaDiagram.java:881`. The earlier "full-tree grep" missed it because `CucaDiagram` lives in package **`net.atmp`**, *outside* `net/sourceforge/plantuml/` — the package tree CLAUDE.md enumerates and that greps get scoped to. Any future upstream grep must cover `src/main/java/net/` , not just `net/sourceforge/plantuml/`. |

**Isolating experiment (the deciding variable):** holding the macro constant and toggling
only the `single` token flips the jar between 4 edges (absent) and 2 edges (present).
Holding `single` constant and removing the macro leaves 2 edges. `single` is the sole
determinant; the macro is not a factor.

## Proposed fix

**Already landed at the origin** in `8898572`, and it is the minimal change there:

- `DescriptiveLink.single?: boolean` (`ast.ts`), documented as a dedup flag, not a style.
- `parseStyleFlags` / `buildLinkFromArgs` (`link-grammar.ts`) surface the token instead of
  burying it in `rawStyle`.
- An `addLink()` wrapper at the single `links.push` site (`parser.ts:153-158`) replicating
  `CucaDiagram.addLink`'s `sameConnections` gate.

Post-fix, our AST holds 2 links and our DOT 2 edges; the drill-down reports
`structurallyEqual=true`. No preprocessor/TIM change was needed or made.

### Residual (latent, NOT the silito-78 mechanism — do not fold into that fix)

Upstream's dedup lives in `CucaDiagram.addLink`, the **shared base** of the whole cuca
family: `ClassDiagram`, `StateDiagram`, and `DescriptionDiagram` all inherit it
(`classdiagram/AbstractEntityDiagram.java:53 extends CucaDiagram`;
`statediagram/StateDiagram.java:56` and `descdiagram/DescriptionDiagram.java:50` both
extend `AbstractEntityDiagram`). Our fix is scoped to the description parser only —
`grep -rn "'single'" src/diagrams/` matches nothing outside `description/`. So a
`-[single]->` link in a **class** or **state** diagram will still not dedup. No corpus
fixture currently exercises it, so this is un-triggered, but it is the same root cause at
a second call site and should be tracked as its own item.

## Confidence

**High.** Mechanism confirmed on both sides of the oracle: upstream source read at the
exact call sites (`CucaDiagram.java:880-893`, `Link.java:462-468`,
`WithLinkType.java:110-116,151-152`); pre-fix symptom reproduced from a worktree at
`8898572^`; post-fix parity verified by the drill-down harness; and the deciding variable
isolated by two controlled jar variants (V1/V2) that independently exclude the macro path.
