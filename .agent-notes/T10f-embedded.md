# T10f — EmbeddedDiagram

## Observation: `EmbeddedDiagram.java`'s own class hierarchy choice
(`extends TextBlockMemoized` directly, NOT `AbstractAtom`) is a real
upstream fact, not an inconsistency to "fix" toward the batch's usual
`AbstractAtom` convention

- **Context**: T10a's `AbstractAtom.ts` doc comment states "every concrete
  OOP `Atom` implementor this port has (or will have) extends this rather
  than `TextBlockMemoized` directly" — read as a general rule before
  checking the actual Java.
- **Finding**: `EmbeddedDiagram.java:75` is `class EmbeddedDiagram extends
  TextBlockMemoized implements Line, Atom` — upstream itself does NOT
  route this class through `klimt/creole/atom/AbstractAtom.java`, unlike
  `AtomWithMargin`/`CreoleHorizontalLine`. `StripeCode.ts` (T10d,
  concurrent-batch sibling) independently hit and made the identical
  choice for the identical reason.
- **Resolution**: `EmbeddedDiagram.ts extends TextBlockMemoized implements
  Line, Atom` — mirrors upstream exactly, with its own explicit
  `getNeutrons()` override (throwing, ADR-9) rather than inheriting
  `AbstractAtom`'s.
- **Confidence**: High — read the Java class declaration directly.

## Observation: `getEmbeddedType` cannot be literally REUSED (imported)
from `CreoleParser.ts` within this task's boundaries — it is
module-private and `CreoleParser.ts` is off-limits to edit

- **Context**: task instruction "check `CreoleParser.ts` first and reuse
  rather than duplicate" plus the separate boundary "do not modify
  `CreoleParser.ts` (T10g removes all seams at once)".
- **Finding**: T9a's `getEmbeddedType` in `CreoleParser.ts` has no `export`
  keyword — a module-private function. Importing it would require adding
  `export`, which is an edit to a file explicitly out of this task's
  write-set.
- **Resolution**: NOT a silent duplicate. Ported `getEmbeddedType` FRESH
  into `EmbeddedDiagram.ts` — which is upstream's actual, canonical home
  for the method (`EmbeddedDiagram.java:257`, a static method CALLED BY
  `CreoleParser.java`, not the reverse). Verified algorithmically
  byte-for-byte identical to T9a's copy (same whitespace skip, same
  first-character dispatch table, same keyword set, same 3 non-breaking-
  space exclusions U+00A0/U+2007/U+202F) line-by-line while writing this
  file. `CreoleParser.ts`'s copy was always a stand-in for this file not
  existing yet; T10g should now delete it and import from here instead —
  documented inline in `EmbeddedDiagram.ts`'s own module doc comment
  ("On `getEmbeddedType` and T9a").
- **Confidence**: High — read both implementations side-by-side.

## Observation: BOTH of upstream's `TeaVM.isTeaVM()` branches need the
full parse/layout/render pipeline — the callback seam had to sit at
"give me a rendered `TextBlock`", not at some smaller sub-step

- **Context**: deciding where exactly the injected-callback boundary
  belongs.
- **Finding**: upstream's non-TeaVM branch rasterizes via `Diagram
  #exportDiagram` (PNG/SVG-embedded-image/TIKZ, needs AWT/`SImageIO` —
  architecturally impossible in `src/`, confirmed absent: no
  `matchesProperty`/`getFileFormat` anywhere in `StringBounder.ts`/
  `UGraphic.ts`, both documented "no caller"). The TeaVM branch — upstream's
  OWN browser/JS-transpile target, i.e. this port's actual runtime niche —
  instead calls `((UgDiagram) diagram).getTextBlock(0, FileFormatOption)`,
  which STILL requires a fully constructed, fully laid-out `Diagram`. Both
  branches bottom out in "run the whole diagram pipeline on this source
  text"; there is no smaller faithful sub-step to port instead.
- **Resolution**: `NestedDiagramRenderer.render(source, skinParam):
  TextBlock` is the seam — exactly upstream's TeaVM branch's OWN
  contract (build the diagram, hand back a `TextBlock`), pushed one level
  out to whichever caller HAS the top-level pipeline. `EmbeddedDiagram.ts`
  itself never imports anything above `src/core/klimt/`.
- **Confidence**: High — read both branches of both upstream methods
  (`calculateDimensionSlow`, `drawU`) in full; grepped `StringBounder.ts`/
  `UGraphic.ts` for `matchesProperty`/`getFileFormat`, zero hits.

## Nothing else dropped

`EMBEDDED_START`/`EMBEDDED_END`, `getEmbeddedType`, `createAndSkip` (full
nesting-depth algorithm, including the "a nested block's OWN `}}` is
still appended, only the outermost is swallowed" detail — tested), `from`,
`getHorizontalAlignment`, `getStartingAltitude`, `getNeutrons` (throws,
ADR-9 — `Neutron.java` not ported, matching `AbstractAtom.ts`/
`StripeCode.ts`), `calculateDimensionSlow`/`drawU` (both bound to the
`NestedDiagramRenderer` seam, with upstream's own `catch (Exception e) {
Logme.error(e); }` resilience preserved via `console.error`, matching
`svek/Cluster.ts#drawU`'s established convention rather than a silent
swallow), and `Line` (`klimt/shape/Line.java`, ported inline as a local
interface rather than a new file — trivial, no other current caller) are
all ported and reachable/tested today. `HColors.transparent().bg()` ->
`new Back(NONE_PAINT)`, matching this port's established `HColor`-free
`Paint`/`Back`/`UBackground` seam (`klimt/Back.ts`, `svek/Cluster.ts`'s
identical local `NONE_PAINT` convention).
