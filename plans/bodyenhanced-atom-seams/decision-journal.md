# Decision Journal — bodyenhanced-atom-seams

Appended during execution. Every non-trivial judgment call gets an entry:
if a reasonable developer might have chosen differently, log it.

## Planning — 2026-07-29

Brief generated via `/plan-mission`. Two claims were verified and one was
falsified during planning, before any task was written:

- **Scoping confirmed against the Java.** `BodyFactory.create2` →
  `BodyEnhanced1`, `create3` → `BodyEnhanced2`; `createLeaf`/`createGroup`
  return `Bodier` (the class/object MEMBER model) and are correctly SI1's,
  not this mission's.
- **S1L-i is structurally inseparable.** `decorate` and both `getArea`
  implementations carry the separator loop, so it cannot be stubbed
  cleanly. Maintainer folded it IN (ADR-4).
- **T6's "no defaultFont seam" is FALSE.** `imgFallbackFont` exists at
  `StripeSimple.ts:279` and threads end-to-end within that file; no caller
  outside ever passes it. ADR-3 corrects the premise and shrinks the
  deliverable. Eighth agent claim corrected against the code across these
  two missions — and note it is the same lock-step defect the mission line
  is about, recurring inside the fix for its own bug class.
- **Risk found at Phase 2:** only 4 `svg-description` goldens vs 352 size
  goldens, while ADR-1 is renderer-wide. Maintainer approved ADR-5 (goldens
  first) and extended its scope to existing separator-bearing fixtures.

## Execution — 2026-07-29

### Batch 1 startup — the "4 goldens" figure is STALE (does not change scope)

`oracle/goldens/svg-description/ratchet.json` pins **48** fixtures today —
32 component, 16 usecase, last added 2026-07-15 — not the 4 that both
ADR-5 and `batch-1/T1-svg-goldens.md` state. The 4 was accurate at T18
only. Corrected before dispatch per the mission's own "verify a
load-bearing claim before repeating it" constraint; the ninth agent-era
claim corrected against the code across this mission line.

**Scope is unchanged.** None of T1's targets is among the 48: all eight
folder/package slugs, `bootstrap-0`, `ruziru-69-xixo434`,
`jecici-56-bimu826`, and `codabo-50-mupa164` are unpinned (checked by
slug-prefix match against the manifest). ADR-5's *conclusion* stands even
though its stated premise was overstated — the affected fixtures are
genuinely unwatched.

### Batch 1 — two T1 targets are AC3-INELIGIBLE

`tests/oracle/svg-conformance/parity.json` reports `dotEqual=false` for
`usecase/bootstrap-0` and `usecase/ruziru-69-xixo434`. The ratchet's AC3
block enforces DOT-EQUAL as an admission gate, so these two cannot be
pinned without weakening it — which the mission forbids. Decision: leave
AC3 intact and accept that T6 narrowing #2's two fixtures land with no SVG
gate. T1 is instructed to report them as uncovered rather than route
around the gate. Logged because a reasonable developer might instead have
argued for a second, DOT-inequality-tolerant golden class; that would be a
second channel for one fact, the shape ADR-2 explicitly rejects.

### Batch 1 — expected partial coverage of group 1

`oracle/goldens/svg-description/README.md` § "Known gap" records that as of
T19 no package/cluster fixture reached zero-diff under
`DeterministicMeasurer`. Eight of T1's eleven group-1 targets are
folder/package. The gate may therefore cover materially less of the blast
radius than ADR-5 assumes. T1 is instructed to report the true coverage
plainly rather than pin our own output to close the gap. If coverage comes
back thin, that is a maintainer decision point before batch 4 (T4) lands,
not a reason to proceed quietly.

### STOP 1 — ADR-5's gate cannot be built: 0 of 22 fixtures are conformant

T1 returned **zero** pinnable goldens. Verified independently by the
orchestrator rather than taken on report, per the mission's own
verify-before-repeating constraint:

- `npx tsx scripts/svg-conformance-census.ts component usecase` →
  **57** zero-diff fixtures across the two types (component alone: 39 of
  265). **Not one of T1's 22 candidates appears in that list.**
- Harness-wide breakage RULED OUT: the 48 already-pinned goldens still
  pass through the same `render-fixture.ts` path (`npm test` green at
  400 files / 10419 tests).
- Mechanism for group 2+3 confirmed by reading: `src/diagrams/description/`
  has no creole block-separator support at all. Every `separator` hit in
  that directory is `set separator` / `namespaceseparator`
  (`command-table-directives.ts:30`, `ast.ts:299`) — the namespace
  qualifier, an unrelated feature. So a separator line's width is never
  contributed to body sizing and the entity box undersizes globally.
- Mechanism for group 1 is the package/cluster `[childCount]` gap the
  goldens README already documents as open since T19.

**This is not a T1 failure — T1 executed its spec correctly and refused to
pin our own wrong output, which is the behaviour the mission demands.** It
is ADR-5 resting on a false premise: the decision assumed a conformant
population existed to freeze, and none does inside the blast radius. A
"golden that must not drift" gate is unbuildable when nothing is correct
yet.

Escalated rather than reshaped unilaterally: ADR-5 is LOCKED, batch 1 is
GATING, and its Done criterion cannot be met as written.

### STOP 2 — T2a is mis-scoped: `TextBlockLineBefore` arithmetic IS ported

T2a states "`TextBlockLineBefore` does NOT exist in this port and must be
ported with it." **False in substance.** Found by reading, not grepping:

- `src/diagrams/class/class-body-enhanced-layout.ts` (347 lines) carries
  `@see BodyEnhancedAbstract.java#decorate`, `TextBlockLineBefore.java`,
  and `UHorizontalLine.java`, and states every offset formula is
  jar-verified byte-exact against `fecolo-08-gepu579`,
  `jajebo-21-dada557`, and `pacagu-24-nune023` (mission G2 N42; derivation
  in `plans/g2-class-svg/ledger.md` N42). It already encodes `decorate`'s
  bottom-margin `4` and the titled/untitled branch split.
- `src/diagrams/class/renderer-body-enhanced.ts` (139 lines) reproduces
  `TextBlockLineBefore#drawU`'s title!=null draw order — content first,
  then divider+label — explicitly noting it is the OPPOSITE of a Y-sort.

What is genuinely missing is a `src/core/`-level reusable TextBlock the
description side can share. So T2a's *work* exists; its *premise* about
prior art does not. Porting fresh into `src/core/klimt/shape/` as written
would create a SECOND independent encoding of jar-verified arithmetic —
precisely the "two builders" divergence ADR-1 exists to prevent and the
second-channel shape ADR-2 rejects (the `inkSprites` mistake).

Two project laws collide here and the tie is the maintainer's to break:
"upstream architecture is authoritative, rewrites are allowed" argues for
one `src/core/` owner consumed by both engines; "do not refactor while
porting" argues against touching a jar-verified working class path.
Not decided autonomously.

### Maintainer rulings — 2026-07-29

Both stops resolved by the maintainer; recorded as ADR-5 AMENDMENT and
ADR-7 in `decisions.md`.

**STOP 1 → diff-count baseline ratchet.** Batch 1 stays gating and gains
**T1b**, which pins each of the 22 fixtures' current diff count, fails on a
rise, and reports a fixture reaching 0 as ready for promotion into
`ratchet.json`. Rejected alternatives are recorded in the AMENDMENT.

**STOP 2 → one owner, now.** `TextBlockLineBefore` is ported into
`src/core/klimt/shape/` from the Java AND the class path is rewired onto it
inside T2a. The maintainer accepted the larger blast radius over time-boxed
duplication.

**Consequence T2a's own file did not state: object diagrams are now in
scope.** Found by reading the consumers rather than assuming the write-set:
`measureEnhancedBody` is called from `class-layout-generic-classifier.ts:119`
AND `class-object-map-sizing.ts:417`; `renderEnhancedBody` from
`renderer-classifier-box.ts:344`. So T2a's gates grow from the three sizing
ratchets to include the pinned SVG goldens **svg-class 310** and
**svg-object 22** (plus svg-description 48, svg-state 57 for completeness).
T2a's "N/A — pure addition, no caller" rollback line is now void and was
rewritten; the task must land as exactly one commit so `git revert` is a
real rollback. Batch-2 parallelism is unaffected — T2a's and T3's
write-sets remain disjoint.

### Batch 1 CLOSED — the gate exists in its amended shape

T1b landed the 22-fixture diff-count ratchet: 19 numeric baselines, 3
`status: "error"` entries carrying a reason and `diffCount: null` so an
error can never read as "reached 0". Provenance (`measuredAt`,
`measuredAgainstCommit`) sits beside every count so a hand-edited baseline
is visible in review. Verified by the orchestrator, not taken on report:
401 files / 10443 tests green, typecheck + lint + build clean, working tree
limited to the three write-set files, description ratchet still 317/351
with 0 widened.

**Corroboration worth recording:** T1b recomputed all 22 counts
independently and every one matched T1's separately-derived number. Two
agents, two harness paths, same values — the baseline is trustworthy.

**New finding — `fepuvo-06-rugi981` is malformed XML on BOTH sides.** T1
found the jar golden malformed; T1b found OUR render output independently
malformed too, at a different byte offset, isolated via direct
`normalizeSvg` calls on each side. Probable mechanism: literal
`<include>`/`<extend>` edge labels plus raw `--`/`__`/`==` separator runs
landing inside an emitted SVG `<!-- -->` comment, and XML forbids `--`
inside comments. Not fixed — T1b was a test/manifest-only task — and the
fixture is `dotEqual=false` so it was AC3-ineligible anyway. Filed here
because it is a real emission bug in our own output, not merely a bad
oracle: revisit once separator support lands, since that is the code path
implicated.

## Batch 2 — 2026-07-29

Gates re-run by the orchestrator on the combined tree AFTER both agents
finished, because each agent measured a worktree containing the other's
in-flight edits and neither number was trustworthy: **405 files / 10481
tests**, typecheck + lint + build clean, description **317/351 w0**, class
**219/708 w0**, DOT **262 / 90 / 708** all 100% EQUAL. Every ratchet
exactly unmoved, which is what ADR-6 demands of the port batches.

### T3 — both seams, no behaviour change

ADR-2 and ADR-3 both honoured literally. Seam A is four optional fields on
`AtomImageResolver` mirroring `SpriteSvg`'s names; seam B threads
`defaultFont` from `buildTextBlock` into `buildLineAtoms`' PRE-EXISTING
`imgFallbackFont` with `StripeSimple.ts` untouched, so no new font seam was
created. Jar-checked end-to-end: `<img:x/y.svg>` measures 100.3625 against
the jar's 100.362 with the font omitted and the `(Cannot decode)` run at
`font-size="14"`; a size-8 default shifts both.

**T3 misattributed a discrepancy and was wrong.** It read the golden
ratchets' TEST counts (51 / 312 / 24 / 59) as golden counts and concluded
its sibling was authoring goldens. Those are 48+3, 310+2, 22+2, 57+2 —
harness tests, not fixtures. No golden moved in batch 2. Recorded because
the reflex to explain away an unexpected number by inventing a cause is
exactly what this mission's method constraints exist to catch.

### T2a — the ADR-7 rewire, and the cross-check came back clean

The port cross-checked against the class side's jar-verified constants with
**zero disagreements** across six formulas — `getMarginX`=6, the +2×6=12
width contribution, plain-divider and titled offsets, the `+8` title-width
floor, and `getDefaultThickness`=0.5. This was the mission's most likely
surprise and it did not fire; the G2 N42 derivation and a fresh port from
the Java agree.

**ADR-7 verified satisfied by reading, not by report:**
`class-body-enhanced-geometry.ts:25` imports `BodyEnhancedAbstract` from
`src/core/cucadiagram/`, and the class file's own
`PLAIN_DIVIDER_MARGIN_TOP` / `BLOCK_MARGIN_BOTTOM` constants are gone. One
owner, as ruled.

**Write-set expansion, accepted.** T2a created a new
`src/diagrams/class/class-body-enhanced-geometry.ts` (213 lines) that its
task file did not list. Justified: `class-body-enhanced-layout.ts` is 361
lines and the combined module would have been ~560 against a hard 500-line
cap. T2a's stop-condition was editing a CONSUMER, which it did not do —
`renderer-body-enhanced.ts` needed no change at all and is byte-unchanged.
Accepted as a reasonable judgment call rather than scope creep.

**Two residual notes, neither a blocker.**

1. The class path consumes the port through a *probe* — `deriveHeightOffsets`
   runs the ported `decorate()` through a minimal draw-order UGraphic and
   reads offsets back, rather than composing `TextBlock`s directly. It
   satisfies ADR-7's one-owner intent (the constants live only in core now),
   but the probe is the coupling point: if `decorate`'s shape changes, that
   is where it bites. Flagged for T2b/T4.
2. `class-body-enhanced-geometry.ts` sits at 75% FUNCTION coverage against
   the 90/90/90 target — 5 unreachable interface-contract stubs on the probe
   UGraphic, mirroring the existing `UGraphicNo.ts` / `Footprint.ts`
   precedent. Aggregate thresholds still pass. A known local deviation, not
   a silent one.

**Forward finding for T2b:** `BodyEnhanced2.getMarginX()`=0 makes the
titled-branch inner margin asymmetric (L=0, R=6). Unexercised territory.

**Landmine for any future `withMargin` audit:** Java's 2-arg
`withMargin(tb, X, Y)` means L/R=X, T/B=Y, which this port's positional
defaults do NOT reproduce if called with two arguments. T2a wrote both
2-arg Java sites as explicit 4-arg calls, matching existing precedent at
`USymbolUsecase.ts:97-110` and `state-sizing.ts:152-165`.
