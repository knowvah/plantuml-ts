# Architecture decisions (pre-made, locked)

If execution surfaces a conflicting constraint, STOP and log it in
`decision-journal.md` — do not silently override.

## D1 — Walk the symbol; do not add a fourth branch

**Context.** `addClassifierInk` dispatches by shape with three special
cases and a box-rule fallback. Each new USymbol leaf that is drawn as
something other than a box needs another branch, and each branch is an
analytic re-derivation of an extent the symbol already knows how to draw.

**Decision.** Add ONE mechanism: build a `LimitFinder`, draw the symbol's
own drawable into it, read the extent — the shape
`renderer-arrowhead.ts#edgeExtremityInk:345-366` already uses for edge
decorations. Dispatch USymbol-drawn classifiers to it.

**Rejected:** an `actor` branch alongside `usecase`/`lollipop`. It closes
two fixtures and leaves the next symbol to rediscover the same defect.

**Consequences.** The ink path gains a dependency on the symbols being
drawable at ink time. If they are not, that is a real finding and a stop —
not a licence to fall back on a box approximation.

## D2 — `usecase` and `lollipop` keep their behaviour EXACTLY

**Context.** Both branches already dispatch away from the box rule, both
are jar-verified, and both carry evidence in their doc comments.

**Decision.** Their rendered OUTPUT must not change. Whether they end up
routed through the new mechanism or left as-is is an implementation
choice; a single byte of movement in their fixtures is not.

**Consequences.** If routing them through the general walk changes their
output, that is evidence the walk is wrong — investigate the walk, do not
re-baseline them. Leaving them on their existing branches is an acceptable
outcome to record.

## D3 — The class/object ink path only

**Context.** `addClassifierInk` serves class and object (object reuses the
class pipeline). State, description, sequence and activity have their own
ink modules.

**Decision.** Write-set is `src/diagrams/class/`. Any movement in another
diagram type is a stop condition.

## D4 — Do not touch the document-margin or SvekResult constants

**Context.** `INK_DELTA`/`JAR_INK_MARGIN` were consolidated into
`core/svek/SvekResult.ts` (`522873ef`). `HACK_X_FOR_POLYGON` is duplicated
deliberately, because `LimitFinder.ts` keeps it private.

**Decision.** Neither is this mission's business. Import, never re-declare;
do not "fix" the `HACK_X_FOR_POLYGON` duplication.

## D5 — The uniform-offset evidence is the bar, not the fixture count

**Context.** Note (b) says 6 fixtures; enumeration finds 5 in the class
cache. The count is uncertain; the measured 1.5 offset is not.

**Decision.** Exit on the offset reaching 0 on `cacoma-43-poxu615` and
`cezaka-60-jado323` with the headline harness numbers not falling. T1
reconciles the count and records which is right, but the count is not the
bar.
