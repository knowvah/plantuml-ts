# cdd-B7FU-R4 — seeded `<defs>` ids (row 62's T37 item)

Residual round R4 of batch 7, branch `cdd/b7fu4` off `bbe1613a`. Every
`<linearGradient>`/`<filter>` id the class engine and the chrome fragments
emit can now be renamed to the id upstream's single per-diagram
`SvgGraphics` would have minted. The seam is in, opt-in, and unfed: the ONE
production line that supplies the seed lives in `src/index.ts`, which is
R2's file this round, so it is written out below for the coordinator.

## The upstream rule (read in full, cited)

```java
this.filterUid  = "b" + getSeed(seed);            // SvgGraphics.java:160
this.shadowId   = "f" + getSeed(seed);            // :161
this.gradientId = "g" + getSeed(seed);            // :162
private static String getSeed(long seed) {        // :285-287
  return Long.toString(Math.abs(seed), 36);
}
id     = gradientId + gradients.size();           // :393  and  :431
result = filterUid  + filterBackColor.size();     // :766
filter.setAttribute("id", shadowId);              // :1076 -- no index
```

Three facts decide the port, each read off those methods, not inferred:

1. **Per-kind counters, not one.** `gradients` (`:365`) and
   `filterBackColor` (`:761`) are two separate maps, so a document's first
   gradient is `g<uid>0` even if a filter was created before it.
2. **Both `createSvgGradient` overloads share the one `gradients` map**
   (`:393`, `:431`), so the counter spans the plain and the
   `HColorLinearGradient` form.
3. **The drop shadow has no index** — `withShadow` is a boolean
   (`:1074-1086`), one filter per document.

The index is assignment order = creation order = `defs` child order (every
branch does `defs.appendChild(elt)` immediately after minting the id), so
renumbering an already-assembled `<defs>` in child order reproduces it
exactly, and no emitter ever needs to know the seed.

## Where it landed

`svg-defs.ts#applySeededDefIds(document, seed)` — a pure rename over a
finished document — called once from `assemble-svg.ts#assembleSvg(fragment,
seed?)`. Not in `svgRoot`/`assembleDocumentShell` separately: `assembleSvg`
is already D2's single central assembly point AND the only one that also
sees the `completeSvg` escape hatch (description). With no seed the document
is byte-identical to before, which is why nothing moves on this branch.

## Per fixture, both readings

"as committed" = this branch today (seed never supplied). "with seed" =
`applySeededDefIds(renderSync(src), seedOf(rawSource))`, i.e. the production
function on production output, exactly what the deferred hunk will do.

| fixture | before R4 | as committed | with seed |
|---|---|---|---|
| `galili-87-zivo129` | 3+0 | 3+0 | **0+0 CONFORMANT** |
| `manube-50-xora983` | 6+0 | 6+0 | **0+0 CONFORMANT** |
| `ziripa-77-zizo842` | 2+0 | 2+0 | **0+0 CONFORMANT** |
| `beruje-75-jimu270` | 2+0 | 2+0 | **0+0 CONFORMANT** |
| `dizuse-83-dabi909` | 6+0 | 6+0 | **0+0 CONFORMANT** |
| `taceve-49-mezi408` | 14+0 | 14+0 | **0+0 CONFORMANT** |
| `dacixi-46-lina038` | 2+0 | 2+0 | **0+0 CONFORMANT** |
| `capode-04-jeka075` | 2+0 | 2+0 | **0+0 CONFORMANT** |
| `mexaka-52-gati860` | 7+0 | 7+0 | **0+0 CONFORMANT** |
| `givofi-11-xumu978` | 13+4 | 13+4 | **5+4** |
| `filoxo-23-fafi328` | 19+0 | 19+0 | **16+0** |
| `rakopi-21-sufa571` | 13+0 | 13+0 | **10+0** |
| `popesa-39-sobe866` | 13+4 | 13+4 | 13+4 (seed input, below) |
| `lozego-15-coci435` | 7+28 | 7+28 | 7+28 (emits no gradient) |
| `mizupo-59-zala765` | 173+724 | 173+724 | 173+724 (emits no gradient) |

Nine fixtures reach 0+0. `filoxo`/`rakopi` are the two class fixtures with a
drop shadow: `classShadow` becomes `f<uid>`, worth 3 diffs each.
`lozego`/`mizupo` emit no gradient at all — a different, pre-existing gap
(the def is never produced), untouched by an id rename.

## Observation: the jar seeds off the PREPROCESSED lines, not the raw ones

Diagnosis artifact for `popesa-39-sobe866`, the one fixture where the uid
itself is wrong.

- **Mechanism**: `UmlSource#seed()` (`UmlSource.java:222-234`) hashes
  `this.source`, and `this.source` is loaded from the PREPROCESSED list:
  `BlockUml#getDiagram` (`BlockUml.java:188-201`) calls
  `PSystemBuilder#createPSystem(pathSystem, data, rawSource, …)`
  (`PSystemBuilder.java:232-240`), which builds
  `UmlSource.createWithRaw(source = data, …, rawSource)`
  (`UmlSource.java:133-138`) — `rawSource` is kept as a separate field and
  never hashed.
- **Causal chain**: popesa carries `!define MyBlue #6192d1`. Upstream hashes
  the lines with that directive REMOVED and `MyBlue` substituted; this port
  hashes `rawSourceLines`, which still has both. Different string, different
  seed.
- **Evidence, not assumption**: hand-building upstream's post-preprocessor
  list (raw lines minus the `!define`, with `white\MyBlue` →
  `white\#6192d1`) and hashing it yields `30vatrr2be6m` — the jar's uid for
  popesa, exactly.
- **Ruled out**: the numbering rule (popesa's id ends in `0`, as expected),
  the `@start`/`@end` lines (present in both; removing them changes the hash
  to neither value), and the skinparam blocks (upstream keeps them — they
  are diagram commands, not preprocessor directives, and dropping them gives
  a third, wrong value).
- **Reach**: 42 of 723 class fixtures carry a preprocessor directive, but
  only popesa ALSO has a seeded def id, so the gap costs exactly one fixture
  today.
- **Fix, filed not guessed**: the port needs the preprocessor to keep its
  post-substitution, pre-extraction line list. `preprocessed.lines` is NOT
  that list — it also hoists `skinparam`/`<style>` blocks into side channels
  (verified: `popesa`'s `preprocessed.lines` has both `skinparam` blocks
  stripped). That is a `core/BlockUmlBuilder.ts` change, outside this
  task's write-set.
- **Same gap in description**: `diagrams/description/index.ts:38-47
  #reconstructSourceForSeed` has it too (its own doc comment flags a
  related approximation, but not this one).
- **Confidence**: High (hash computed against the oracle).

## The deferred `src/index.ts` hunk — verbatim, four one-line edits

No new import statement: `assembleSvg` already comes from that module.

```diff
@@ line 37
-import { assembleSvg } from './core/assemble-svg.js';
+import { assembleSvg, seedOfUmlSource } from './core/assemble-svg.js';

@@ interface PageContext (line 283-289)
   readonly preprocessed: PreprocessorResult;
   readonly measurer: StringMeasurer;
+  /** The diagram's `UmlSource#seed()` -- every `<linearGradient>`/`<filter>`
+   *  id in the assembled document is minted from it (`svg-defs.ts
+   *  #applySeededDefIds`, `SvgGraphics.java:160-162`). */
+  readonly seed: bigint;
 }

@@ assembleOnePage (line 301)
-  return assembleSvg(chromed);
+  return assembleSvg(chromed, ctx.seed);

@@ prepareBlock (line 372)
-  return { ctx: { plugin, theme, styleMap, preprocessed: block.preprocessed, measurer }, ast };
+  return {
+    ctx: { plugin, theme, styleMap, preprocessed: block.preprocessed, measurer, seed: seedOfUmlSource(umlSource) },
+    ast,
+  };
```

## What applying it moves, measured across every engine

Probe: for all 91 corpus fixtures whose ORACLE carries a seeded id
(`id="[gbf][0-9a-z]{8,}"`), render through `renderSync`, apply
`applySeededDefIds`, and compare both against the jar.

| engine | improves | unchanged | worse |
|---|---|---|---|
| board | **4** (104→87, 76→63, 89→75, 117→96) | 0 | 0 |
| state | **1** (`nimana-36-veco708` 124→119) | 2 | 0 |
| activity, c4, component, gantt, mindmap, object, salt, sequence, usecase, wbs, unknown | 0 | 66 | 0 |

**Zero regressions anywhere.** Description/component/usecase do not move,
which is the predicted result and a real check on the rule: that engine
already seeds its own klimt document (`description/index.ts:69`), so the
rename recomputes the ids it already had — the pass is idempotent on a
jar-shaped document (unit-tested directly).

## Re-pin needed when the hunk lands

`oracle/goldens/svg-conformance/gradient-fill/golden.svg` is the one pinned
golden carrying a content-hash gradient id; it will need regenerating in the
same commit as the hunk. Nothing else in `oracle/goldens` matches
`url(#g<hash>)`/`classShadow`. `tests/unit/class/renderer.test.ts`'s
`classShadow` assertions call `renderClass` directly (fragment level, before
assembly) and are unaffected.
