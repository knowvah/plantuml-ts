# cdd-T15 — qualifier box (`Kal`)

## Observation: blast-radius grep isolates exactly the 19 named fixtures
- **Context**: T15 step 1 — bound the geometry blast radius before editing.
- **Finding**: A naive `\s\[...\]\s` + arrow grep over
  `test-results/dot-cache/class/*/in.puml` returns false positives
  (`+ int rating [0..3]` member rows, `bar1 : [thickness=1]`,
  `sprite $demo [13x26/color] {` — the last one only because `o` is an
  aggregation glyph in the arrow character class and `demo` ends in `o`).
  The refined script (below) requires the bracket to be adjacent to a real
  class-link arrow token that starts at a space and contains `-` or `.`,
  with the optional `"card"` / `/role` segments upstream's
  `CommandLinkClass` regex allows between the qualifier and the arrow
  (`CommandLinkClass.java:120-152`):

  ```perl
  my $Q   = qr/\[[^\[\]]+\]/;
  my $LBL = qr/(?:"[^"]*"[ \t]+)?(?:\/\S+[ \t]+)?/;
  my $ARR = qr/[<>*o+#^|.-]*[-.][<>*o+#^|.lrudLRUD-]*/;
  next if /^\s*[!'\/#]/;
  /[ \t]$Q[ \t]+$LBL$ARR(?:[ \t]|$)/ || /(?:^|[ \t])$ARR[ \t]+$LBL$Q[ \t]/
  ```

  Result: **19 fixtures, exactly the 19 named in the task spec** — zero
  additional fixtures beyond them. Two of the 19 (`mucoti-34-seve858`,
  `sefazi-02-defe499`) use a single-char `-` arrow and are missed by any
  `[-.]{2,}` form of the grep.
- **Impact**: the Kal geometry change cannot move a fixture outside the
  named 19; any mover elsewhere is a bug, not blast radius.
- **Confidence**: High.

## Observation: all 19 qualifier fixtures' DOT node sizes AND shield margins match the oracle
- **Context**: T15 step 8 — confirm the `Kal` margins do not break DOT parity.
- **Finding**: For each of the 19, the emitted `sh#### [shape=plaintext …
  PORT="h"]` centre-cell `WIDTH`/`HEIGHT` and the four `Margins` cells are
  byte-equal (after Java's `.0`-suffix double formatting is normalised) to
  the fixture's cached `svek-N.dot`; so are the `shape=rect` nodes'
  `width=`/`height=`. The only remaining textual difference is node
  DECLARATION ORDER (jar prints `lines0`-endpoint nodes first), which the
  structural comparator already normalises. `npx jiti
  scripts/dot-sync-report.ts class` stays at **711/712 structurally EQUAL**.
- **Impact**: the `ensureMargins` port and the `getKalWidth() * 1.3` width
  floor are jar-exact; any residual pixel delta on these fixtures is
  downstream of layout, not of the DOT we emit.
- **Confidence**: High.

## Observation: dot-engine drops a `PORT="h"` on a FLAT (same-rank) edge
- **Context**: wiring `Bibliotekon#getNodeUid`'s `:h` onto the LAYOUT edge
  (`tailport`/`headport`) so the spline leaves the class box rather than
  the margin-inflated shield table.
- **Finding**: dot-engine honours the port on a RANKED edge
  (`baneru-00-kuro607`: spline starts at y=54.818, the cell's own 55) and
  IGNORES it on a `minlen=0` flat edge, starting/ending at the node's
  bounding box instead (`mucoti-34-seve858`: x=142.879 where the cell edge
  is 78.9). Real graphviz 16.1.0 fed the SAME cached oracle DOT puts it at
  78.9. Filed as `docs/graphviz-issues/19-flat-edge-ignores-html-table-
  port.md` + TRACKER line.
- **Impact**: the three flat-edge qualifier fixtures
  (`mucoti-34-seve858`, `sefazi-02-defe499`, `camuna-58-veca254`'s third
  link) keep a spline-endpoint delta no amount of porting can remove; do
  not chase it, and do not compensate for it in `class-kal.ts`.
- **Confidence**: High (controlled experiment, one variable).

## Observation: a widened class box does not re-centre its own header
- **Context**: `baneru-00-kuro607` still shows a uniform 0.572px x-offset
  on every header glyph of the Kal-widened `class1`.
- **Finding**: `HeaderLayout#drawU`'s `suppWith`/`h1`/`h2` split
  (`svek/HeaderLayout.java:81-117`, ported in `class-badge.ts:127-142`)
  is evaluated inside `measureClassifier`, i.e. BEFORE any post-measure
  width floor mutates `MeasuredClassifier.width`. So both
  `applySameClassWidthFloor` and the new `applyKalWidthFloor` widen the box
  without moving its header content. This is the SAME gap
  `applySameClassWidthFloor`'s own doc comment already records
  ("Header-row indents are NOT re-centered against the widened box").
- **Impact**: a pre-existing, now more widely reachable, bounded cosmetic
  gap. Fixing it means re-running the header geometry after the floors, not
  patching `class-kal.ts`.
- **Confidence**: High.
