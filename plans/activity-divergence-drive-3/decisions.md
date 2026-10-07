# Architecture decisions: add3 (approved 2026-10-06, "approve all")

Scope answers: lead with XLANE + Snake labels; klimt edits allowed; embedded
`{{ }}` in add3.

## D1: Snake label placement ported 1:1 on pre-compression points
Ours places every edge label at the path midpoint +4/-4 with an unsourced
`0.6 * fontSize` pill (`renderer.ts:82-116`). The jar draws `text.textBlock` at
`Snake.getTextBlockPosition` (`Snake.java:244-267`: BOTTOM, CENTER, zigzag
CENTER/RIGHT, RD/LD, default) through the compressing UGraphic, so the anchor
is ct(position). Each labelled edge carries `labelAlign`, set at every live
`withLabel` site with its `file:line`; label boxes count in the canvas extent
(`Snake.getMaxX`, `Snake.java:234-242`, via LimitFinder). The pill is removed
only if T1a's oracle renders show the jar draws none.

## D2: XLANE = one `LoopTranslate` kind per Java connection class
Every cross-lane connection without a tag falls into `swimlane-placement.ts:344-352`'s
generic jog. Port each Java `drawTranslate` (`FtileIfWithLinks.java:149-286`
H->V / V->H with detours; `FtileRepeat.java:432-535` BackBackward1/2;
`FtileIfLongHorizontal` out; `FtileWhile` cross-lane) as its own kind, deciding
sides from translated coordinates as the Java does. T1a lists every live
`drawTranslate` without a port; one T1b/T1c cannot absorb = stop 12.

## D3: re-census before fixing
T0c/T0d re-census all 126 rows (split at ws 100; out-of-repo sandbox toggles
allowed). Batch 1 is XLANE + labels regardless; the census shapes batches 2-3.

## D4: klimt edits allowed, write-set-scoped, survey-guarded
A klimt/core file may change only when named in the task write-set, with an
all-engine survey before and after (sequential). Any conformant loss = stop 4.

## D5: embedded `{{ }}` through the core creole Sheet
Upstream draws action text as a `Display` through the creole sheet, where
`EmbeddedDiagram` is an atom (`src/core/EmbeddedDiagram.ts`, `SheetBuilder`,
nested renderer registered at `src/index.ts:383`). Route activity action text
through that sheet, staged: a spike must keep every pinned golden byte-equal,
otherwise stop 16 (no silent special-casing of `{{`).

## D6: measurement carried from add2
Golden ratchet, harness-parity, zero UNEXPLAINED rises with add2's D7 reveal
classes (element counts now equal; a points/d list now the jar's length;
corrected order re-pairing; attribute added inside a short-circuited subtree),
close procedure, pin at each close. New: committed `measurements/survey-all.sh`;
merges gated on clean porcelain + empty stash (stop 17); no-Serena ban first in
every agent prompt.

## D7: exit bar
- Every `fixtures.md` row has `final` ∈ `pinned (<tag>)`, `open -> add4 (<mechanism>)`.
- Four gates green, collected = on-disk; golden ratchet + harness-parity green.
- 0 conformant losses in any engine (b0 -> final); 0 unexplained rises.
- **>= 280 activity fixtures pinned; Σ <= 10000.** A miss is acceptable only
  when every short row is mechanised.

## D8: execution rules
add2 D11 carried: worktrees per parallel task, no Serena, no stash, no raw `&`,
scratch named by task ID, merge commit at close, never push.

## D9: housekeeping
Retire `tmp1` (byte-identical duplicate of ruzazu-94-meso880, pinned since
`9524864ff`): remove its diff/style/text/swimlane baseline rows and its
routing/refusal rows, counts updated by derivation. Move `resolveInlineLinks`
to a core `url/` seam (upstream `url/UrlBuilder` is shared) and drop the
layering allowlist entry add2 added.
