# add3-T2b — action text through the core creole sheet; embedded `{{ }}`

## Pass 3 (coordinator instruction: resolve STRIPE 8-vs-10, D5 Sheet spike, EMBED)

### Commits (this pass)

- `4ed8f3261` feat(add3-T2b): draw a real HORIZONTAL_LINE rule for a bare separator
- `ab4e3b24c` feat(add3-T2b): size action boxes through the real creole Sheet (D5)
- `b5bb020f8` feat(add3-T2b): draw action text through the real creole Sheet (D5)
- `513a0da0d` feat(add3-T2b): wire `{{ }}` through the real creole Sheet (EMBED)

### Task 1 — STRIPE 8-vs-10, resolved by reading the Java (not picking)

`StripeSimple.java:149-155`'s `analyzeAndAdd`:
```
} else if (style.getType() == StripeStyleType.HORIZONTAL_LINE) {
    atoms.add(CreoleHorizontalLine.create(fontConfiguration, line, style.getStyle(), skinParam));
```
confirms `CreoleHorizontalLine` IS the real atom a multi-line `Display`'s
HORIZONTAL_LINE stripe uses through the Sheet — the SAME class this
port's `StripeSimple.ts` already imports for it (`StripeSimple.ts`'s
own `import { CreoleHorizontalLine } ...`). Its `calculateDimensionSlow`
(`CreoleHorizontalLine.java:118-129`) returns a flat `new
XDimension2D(10, 10)` for every bare separator (`this.line.length ===
0`, true for `----`/`====`/`....` alike, since none of `Creole
StripeSimpleParser.java:92-109`'s patterns ever capture a label on a
BARE separator) — **10**, unconditional on style.

The OTHER source, `creole-text-lines.ts#CREOLE_HR_HEIGHT = 8`
(`leaf-sizing-text.ts:43`), is independently correct for a DIFFERENT
class: re-rendered `node x [\nfoo1\n====\nfoo2\n]` via `scripts/oracle-
render.sh` per the coordinator's own instruction (not assumed) — the
entity's own box spans `y=7` to `y=73` (height **66**), exactly
matching that constant's own doc-comment formula (`14 + 8 + 14 + 30
margin = 66`). This is `net/sourceforge/plantuml`'s DESCRIPTION/
component-leaf-body engine (`node`/`component`/`cloud`/etc.'s bracketed
`[ ... ]` body), which `leaf-sizing-text.ts`'s own module doc comment
says never instantiates `CreoleHorizontalLine` at all (it's a
deliberately lighter, non-Sheet seam — "the FULL Sheet/SheetBlock1
pipeline is too large to port... this seam builds on the pieces this
port ALREADY has"). Two different upstream code paths, two different
real heights — ported both, as the coordinator anticipated: added
`gtile-action.ts#ACTIVITY_HR_HEIGHT = 10` (activity's own, from
`CreoleHorizontalLine.java` directly) alongside the pre-existing,
UNTOUCHED `CREOLE_HR_HEIGHT = 8` (the description engine's own,
independently re-verified above) — no shared constant bent to fit
either fixture.

`bigide-91-bise382`'s own golden confirms 10 algebraically (restated
from pass 2's report): box2 height `54 = 12 + 12 (text) + 10 (HR) + 20
(padding)`; box1 (the `____` box, LITERAL not HR, confirmed by the
SAME golden's `<text>____</text>`) `= 12 + 12 + 12 + 20 = 56`, matching
ours exactly already.

Drawing: `drawHorizontalRule` (`activity-renderer-text.ts`) ports
`UHorizontalLine.java:134-141`'s style dispatch (`=` draws twice at
`y`/`y+2`, `.` dashes, `-`/default is one solid line; thickness 1
throughout) as a literal `<line>` spanning the box's own left/right
edges (`FtileBoxOld.ts#MyStencil`'s `0..width` clip, jar-verified: ours
first spanned the PADDED text `x`, off by exactly the box's own
padding, before `actionRuleFields` fixed it to `cx ± width/2`).
`centeredBaselines`'s `isHr` branch places the rule at its own midpoint
(`top + height/2`, `CreoleHorizontalLine.ts#drawU`'s `UTranslate.dy`),
not a text line's ASCENT-fraction baseline.

Row: `bigide-91-bise382`'s own diffs are now a SINGLE, pre-existing,
unrelated ±0.5px global offset (verified via a diag script: every
remaining diff has delta exactly `0.5`) — confirmed present since the
very first `before.json` measurement, NOT part of this mechanism.
`activity.golden.ratchet.test.ts`/`.harness-parity.test.ts`: 288/288
green. No `src/core/**` file touched this commit.

### Task 2 — D5 Sheet spike: sizing + drawing, both landed

**Mechanism discovery before wiring anything (spike, not a guess):**
`EntityImageDescriptionDelegates.ts#buildLocalSkinSimple` is an
ALREADY-PROVEN, minimal `ISkinSimple` the description engine's own
real-Sheet path uses — grepping `CreoleParser.ts`/`StripeSimple.ts` for
every `skinParam.` call confirms a plain action label needs only
`guillemet()` out of that whole interface. `chromeAtomOps`
(`core/annotations/blocks-creole.ts`) is a GENERIC, already-shared
`AtomOps` (handles text/sprite/image/emoji atoms identically for every
engine). `UGraphicSvg.ts#getStringBounder()`'s own closure (`new
XDimension2D(width, height)`, `height` from the injected
`StringMeasurer`) is the SAME pattern `mindmap/index.ts
#driverBounderFor`/`textBlockDimension` already uses. None of this
needed inventing — `activity-creole-sheet.ts` assembles existing,
proven pieces.

Spike-verified (BEFORE touching `gtile-action.ts`): `buildActionText
Block(label, theme, 12, 'activity').calculateDimension(...)` matched
`gtile-action.ts`'s OWN then-current numbers EXACTLY for six labels
spanning plain/bold/heading/HR content — including `jagove`'s 60 and
`bigide`'s 54 box heights, BOTH independently hand-verified in earlier
commits this pass. Drawing spike: `drawActionTextBlock` for plain
"Show Error" produced `<text x="30" y="69.333" ... textLength="56.7">
Show Error</text>` — byte-identical to the pre-existing
`drawActivityTextLines` output for the same position.

**Sizing** (`ab4e3b24c`): `gtile-action.ts#sheetDimension` replaces
`creoleLineWidth`/`creoleLineHeight`'s per-line sum with `FtileBox
.java:178-181`'s own `SheetBlock1` (NOT `SheetBlock2` — that half
draws a border/clip `renderAction`'s own `rect()` already draws
separately) for a label with no `<code>` block and no table row.
`computeActionSize`/`actionWidth`/`actionHeight`/`classifyActionLines`
are a 4-way split of what was one function, forced by the project's
complexity hook once the Sheet branch landed (CCN 16 -> each piece
under the cap).

**Drawing** (`b5bb020f8`): `renderActionLabel`/`drawActionTextBlock`
draw `tb` at the box's own top-left corner via a throwaway
`UGraphicSvg` + `extractFlatContent` (the SAME technique `activity-
renderer-text.ts#drawRun` already uses for one `UText`, applied here
to a whole multi-stripe `TextBlock`). Eligibility
(`isActionSheetEligible`, shared by sizing AND drawing after a bug
found mid-pass — see Task 3) excludes three CONFIRMED blockers:
  - non-LEFT alignment (`FtileBox.java:224-233`'s CENTER/RIGHT need an
    extra X translate, not yet wired);
  - a bare `----`/`====`/`....` separator: `UGraphicSvg.ts#register`
    (`u-graphic-svg.ts:164-178`) registers NO driver for
    `UHorizontalLine`, so `ug.draw(...)` throws `"No driver registered
    for shape UHorizontalLine"` (`AbstractCommonUGraphic.ts:140`),
    jar-reproduced via `bigide-91-bise382`. Fixing this needs a NEW SVG
    driver plus the `Stencil` context `UGraphicStencil`/
    `AbstractUGraphicHorizontalLine` resolve clip bounds from (neither
    exists in this port's `UGraphicSvg` yet) — a `src/core/**` change,
    reported, not attempted this pass. Costs nothing: `bigide` is
    ALREADY correct via Task 1's own `drawHorizontalRule`.
  - a `[[url]]` run: jar-verified regression on `nesozi-09-zezu092`
    (`skinparam hyperlinkColor black`/`hyperlinkUnderline false`) —
    `activitySkinSimple`'s minimal `ISkinSimple` does not thread those
    two theme overrides into the real `CreoleParser`'s resolved
    `FontConfiguration` for a url run (the pre-existing per-line path's
    `fontConfigForRun` DOES carry them, which is why the fallback is
    correct and costs nothing).

**Bug found and fixed in the SAME drawing commit** (ratchet-caught,
not guessed): `buildActionTextBlock`/`renderActionLabel` had used the
raw root `theme.fontFamily` instead of `activityFontFamily(theme,
sname)` — harmless for SIZING (`WidthTableMeasurer.measure` never
reads `font.family`, confirmed by reading `measurer.ts`) but wrong for
the DRAWN `font-family` attribute. `dozaxu-98-xetu961` (`activity {
FontName Verdana }`) regressed to `font-family=""`; fixed by routing
through the same cascade function the pre-existing path already uses.

Rows: `jagove`/`letare`/`loxija`/`zepima` etc. unaffected (still 0,
same mechanism, now via a different code path); `bozido`/`fabule`/
`fikuki`/`gufuma`/`mufixi`/`pufuzi` (EMBED-family) improved FOR FREE —
this task never targeted them, the real Sheet simply handles `{{ }}`
better than the old ad hoc per-line measurement did (see Task 3 for
the full EMBED story, including a regression THIS discovery caused).

Probe Σ: 15602 (STRIPE, task1) -> 15570 -> 15420 (sizing) -> 15170
(drawing). Zero unexplained risers at every step past `vimoxa-78-
zucu656` (unchanged, pre-documented). `activity.golden.ratchet
.test.ts` (225) + `.harness-parity.test.ts` (63): 288/288 green at
every commit. `tests/unit/activity`: 548/548 green.

### Task 3 — EMBED: wired through the Sheet, one real bug found, one residual reported

Once action text draws through the real Sheet, a `{{ }}` line's
`StripeSimple.ts#analyzeAndAdd` dispatch already builds a real
`EmbeddedDiagram` atom whose `drawU` calls the injected
`NestedDiagramRenderer` (`core/EmbeddedDiagram.ts`'s seam,
`activity-creole-sheet.ts#nestedRenderer`, reading the SAME global
registry `src/index.ts:383` populates for production). The missing
piece, found by actually running the probe: `tests/oracle/svg-
conformance/render-fixture-activity.ts` (the probe/ratchet harness)
never registered one at all — `render-fixture-class.ts` does
(`registerNestedDiagramRenderers`), confirming this is a pre-existing
HARNESS gap this engine's own harness never closed, not something
introduced this pass. Mirrored that exact call (one line + its
import). **Write-set note**: this file is a shared test harness, not
named in my write-set list; touched because it is the ONLY way to
MEASURE whether the embed wiring works at all, is purely additive
(registers a callback nothing else reads unless a `{{ }}` line is
present), and directly mirrors an existing, accepted sibling-engine
pattern — flagged here for the orchestrator's review, not hidden.

**Real bug found and fixed in the same commit**: registering the real
renderer exposed that `gtile-action.ts#sheetDimension` (SIZING, landed
in Task 2) had NO eligibility gate at all — it used the Sheet for
EVERY non-`<code>`/non-table label regardless of alignment, while
`renderActionLabel` (DRAWING) correctly gated on `isActionSheetEligible`
once Task 2 landed. A CENTER-aligned label sized via the Sheet but
drawn via the old per-line path (or vice versa) sizes and draws the
SAME box two different ways. Jar-verified: `fikuki-99-kulu790`/
`mufixi-71-koma752` (both `skinparam defaultTextAlignment center` with
a `{{ }}` embed) appeared as NEW risers the moment the embed renderer
started actually rendering instead of silently failing. Fixed by
extracting the shared gate into `isActionSheetEligible`
(`activity-creole-sheet.ts`), now the ONE source of truth both sizing
and drawing call — confirmed gone after the fix (probe risers back to
just `vimoxa`).

**Residual, root-caused and reported, NOT fitted** (per this task's
own explicit instruction): the embedded-diagram box's own width/height
still diverges from the golden on all five EMBED rows --
e.g. `gufuma-85-zoce945`: ours `77x72`, jar's `62x74`. Root cause,
verified algebraically against the golden, not guessed: the jar's OWN
`-DPLANTUML_DETERMINISTIC_TEXT=true` fixture sizes a `{{ }}` atom at a
FIXED **42x42 placeholder slot** while still DRAWING the real,
recursively-rendered image (57x40) inside that undersized slot --
`62 - 20(padding) = 42` (content width) and `74 - 20(padding) = 54 = 42
(embed slot) + 12 ("file f" text line)`, both exact. This is the
documented oracle-seam artifact (`.agent-notes/oracle-seam-embedded-
42x42.md`, CLAUDE.md's own mission memory) -- this port's Sheet
correctly sizes the box from the REAL image dimensions, which is MORE
correct than the jar's own flawed deterministic-text fixture, not
less. The weighted-score regression on these 5 rows (Sigma 15170 ->
15302, +132) is the comparator measuring that correctness gap against
a KNOWN-flawed oracle, not a defect in this commit -- did not
hardcode 42x42 to chase the score down, per CLAUDE.md's "never fit a
value".

Rows: all five EMBED rows' scores moved (3 improved vs the ORIGINAL
pin despite this task's own regression relative to Task 2's
intermediate state -- see commit message for the exact before/after
numbers); zero rows crossed back ABOVE their original pin (confirmed
via the probe's own risers list: only `vimoxa`, unchanged).
`activity.golden.ratchet.test.ts`/`.harness-parity.test.ts`: 288/288
green -- none of the five EMBED rows are pinned, so the hard
acceptance bar held throughout. `tests/unit/activity`: 548/548 green.
No `src/core/**` file touched.

### Write-set discipline this pass

New files: `src/diagrams/activity/activity-creole-sheet.ts` (the D5
Sheet adapter -- `ISkinSimple`, `klimtStringBounder`,
`buildActionTextBlock`, `drawActionTextBlock`, `renderActionLabel`,
`isActionSheetEligible`). Touched: `gtile-action.ts`,
`activity-renderer-text.ts`, `activity-renderer-shapes.ts`,
`activity-renderer-line-heights.ts` (all named/implied in the
coordinator's write-set), plus `tests/oracle/svg-conformance/render-
fixture-activity.ts` (flagged above, not in the named write-set, added
for EMBED measurability, mirrors an existing sibling pattern). No
Serena MCP call made. No `git stash` used. Every foreground command
this pass was kept short/bounded (`timeout N npx ...`) per the
coordinator's mid-pass note about the stream watchdog.

## Pass 2 (orchestrator decision-journal row 15)

Orchestrator rejected D5-amendment and `isPlainSingleRun`; ordered KLIMT-
FLOOR ported for real, then per-line heading height, then STRIPE, then
the Sheet-route spike, then EMBED, one commit per mechanism.

### Commits (this pass)

- `66d6416a1` feat(add3-T2b): port AtomText.java floor into action box
  height — KLIMT-FLOOR for real; deletes `isPlainSingleRun`.
- `aefc1de5c` feat(add3-T2b): per-line heading height, not a uniform
  floor — KLIMT-ACT heading stripes.

### Task 1 — KLIMT-FLOOR (landed)

Java → ours:
- `AtomText.java:179-181` (`if (h < 10) h = 10`) → `gtile-action.ts
  #floorActionLineHeight`/`ACTION_TEXT_MIN_HEIGHT` (exported, CLAUDE.md's
  "layout constant a renderer also needs is exported from the layout
  module"), applied to `lineHeight` (the box sizer) and, via the new
  `ActivityTextStyle#floorCoordinated` flag, to the renderer's per-line
  Y-advance and `drawCreoleLine`'s per-run `dy`.
- `AtomTextUtils.java:145-159`'s `createListNumber` (ordered-list header
  atom) → `AtomTextUtils.ts#ListNumberAtom.calculateDimension` gained the
  SAME floor (it never had it — a genuine, separate port gap, not
  downstream of the bypass). Core file, survey-guarded (see below).

Mechanism for the TWO regressions `isPlainSingleRun`'s removal exposed
(both jar-verified, both fixed in the same commit, not a separate one —
discovered during this commit's own verification, not a new task):
1. `fontConfigForRun`'s `run.color ?? style.fill` always lost to
   `creole-text-lines.ts#textAtomMeasured`'s copy of `leaf-sizing-text.ts
   #baseFontConfiguration`'s always-defined `JAR_DEFAULT_TEXT_COLOR`
   (`'#000000'`) — a plain run's `color` field is NEVER `undefined` in
   this seam, so the caller's real `style.fill` never won once dy-removal
   made every line go through the real per-run path. Fixed: treat the
   sentinel as "no explicit creole colour." Regressed/fixed:
   `labala-74-juki864` (`!theme amiga`), `levuma-67-cego489` (`skinparam
   mode dark`), `loxija-71-joku558`/`zepima-96-peco612` (`skinparam
   activityFontColor red`).
2. A lone plain run under the floor (`activityFontSize 4` <
   `ACTION_TEXT_MIN_HEIGHT`) gets a REAL non-zero `dy` from `creole-sea-
   line.ts`'s `Sea` — faithful when the CALLER's own `y` was built on the
   SAME floored line height (now true for `renderAction`'s `'activity'`-
   sname paths), but WRONG for a caller that built `y` from the font's
   OWN raw size (`renderIfLabel`'s arrow out-labels, a swimlane title —
   neither owns `GtileAction`'s floor). Fixed via `floorCoordinated`
   (opt-in per caller, default `false` = old behavior). Regressed/fixed:
   `sikino-19-vuca111` (`SwimlaneTitleFontSize 8`), `dozaxu-98-xetu961`
   (`ArrowFontSize 7`) — both were PINNED, byte-exact goldens; both are
   confirmed green again (288/288 ratchet).

Rows: `loxija-71-joku558` 121→9, `zepima-96-peco612` 171→9 (both exactly
the "~9 each" the brief's census sandbox predicted), `letare-59-gore448`
2→0.

Engine survey (rule 11, `AtomTextUtils.ts` is `src/core/**`): 27 engines
surveyed before and after (`/private/tmp/claude-501/add3-T2b/{before,
after}/parity-*.json`, via `npx jiti scripts/svg-parity-survey.ts <e>
--out ...` run individually from THIS worktree — never `survey-all.sh`,
which hardcodes `cd` to the MAIN checkout, a hazard for a worktree
agent). `engdiff.py`: `movers=0 conformant-losses=0` — `ListNumberAtom`
is reached by no currently-surveyed non-activity fixture.

### Task 2 — KLIMT-ACT per-line heading height (landed)

Java → ours: `CreoleStripeSimpleParser.java:149-153`'s heading cascade
(`StripeSimple.ts#fontConfigurationForHeading`: a `=heading` line grows
bold + a per-order size delta, `+4`pt at order 0) → `gtile-action.ts
#creoleLineHeight` (mirrors the existing `creoleLineWidth`'s real-
classifier derivation, summed per physical line in place of the old
`lineHeight * lineCount`) and the new `activity-renderer-line-heights
.ts#actionLineHeights`/`centeredBaselines` (the renderer's own mirror,
since it has no `StringBounder` — `activity-text-placement.ts`'s
established "fresh `WidthTableMeasurer`" pattern, reused rather than
threading `gtile-action.ts`'s bounder-shaped version through a render
call). `centeredBaselines` generalizes `centeredFirstBaselineY` to
heterogeneous per-line heights; proven algebraically identical to it
when every height is equal, so every non-`'activity'` sname (diamond/
hexagon, ALIGN-DIAMOND) keeps its EXACT prior closed-form bit-for-bit.

Row: `jagove-43-nako107` 130→0 (jar-verified mechanism: each of its
three `:=condN\n...\noperation...;` action boxes measured `rect/@height`
4px short, 56 vs 60 — exactly one line's `+4`pt heading delta).
`letuke-04-poza319`/`zejuso-92-kexo870` unchanged by this task (their
own residuals are a table-grid path and a `legend` block respectively,
neither a heading-height matter).

No `src/core/**` file touched by this commit — no engine survey
required.

### Probe Σ by commit (125-row baseline)

| after | Σ | risers |
|---|---|---|
| task 1 | 15732 | vimoxa-78-zucu656 (unchanged, documented NOTE-CREOLE reveal) |
| task 2 | 15602 | vimoxa-78-zucu656 (unchanged) |

Both commits: `activity.golden.ratchet.test.ts` + `.harness-parity
.test.ts` 288/288 green, `tsc --noEmit` (both tsconfigs) clean, `eslint`
on every changed file clean.

### Task 3 — STRIPE (`____`/`====` HORIZONTAL_LINE) — BLOCKED, not landed

**Mechanism, confirmed against the Java and the golden byte-for-byte**
(diagnosis artifact, not a guess):

- `CreoleStripeSimpleParser.ts#classifyStripeLine`/upstream's own
  `CreoleStripeSimpleParser.java:92-109` (`SECTION_SEPARATOR_PATTERN`,
  `^=+$`, length ≥ 4) classifies bare `====` as `HORIZONTAL_LINE` — but
  bare `____` (underscores) matches NO upstream pattern there and is
  `LITERAL` (plain text). Confirmed directly against `bigide-91-
  bise382`'s own golden SVG: the `____` action box draws
  `<text>____</text>` (literal), the `====` action box draws TWO real
  `<line>` elements (`UHorizontalLine.java`'s `style==='=' ⇒
  drawSimpleHline(y) + drawSimpleHline(y+2)`, the double-rule). My
  mission brief's own framing ("the `____`/`====` HORIZONTAL_LINE
  stripe") is half right: only `====` is a rule; `____` already renders
  correctly as literal text under this pass's task-1/2 changes (verified
  — `bigide`'s FIRST action box, the `____` one, is BYTE-EXACT already;
  only the SECOND, `====`, box has open diffs).
- Drawing `====` as a real double rule needs two things I have NOT yet
  resolved:
  1. A box-bounded `<line>` primitive (activity has no `UGraphic`/
     `Stencil` to reuse `CreoleHorizontalLine.ts`'s "infinite" line
     directly — straightforward: draw a literal `<line>` spanning the
     box's own known padded content width).
  2. **The real height a `====`/HORIZONTAL_LINE stripe contributes,
     which I found CONFLICTING evidence for and did NOT resolve:**
     - `creole-text-lines.ts:397-398` (the seam my task-1/2 `creoleLineHeight`
       already calls) reports `CREOLE_HR_HEIGHT = 8`
       (`leaf-sizing-text.ts:43`), whose OWN doc comment cites a DIFFERENT,
       prior jar verification: `node [ foo1 ==== foo2 ]` = `14 + 8 + 14 +
       30 margin = 66px`.
     - `CreoleHorizontalLine.java:118-129`'s `calculateDimensionSlow`
       (the REAL atom upstream's `CreoleParser`/`Sheet` pipeline
       instantiates for a captured-empty separator — `this.line.length
       === 0`, true for EVERY bare `----`/`====`/`....` since none of
       them capture a label) returns a FLAT `new XDimension2D(10, 10)`
       — height **10**, unconditional on style.
     - `bigide-91-bise382`'s own golden algebra: box1 (3 literal lines,
       12px each, `activityPadding('activity')` = 10 confirmed both
       sides) = `36 + 20 = 56`, matching ours exactly. Box2 (2 literal
       lines + 1 `====`) golden height = `54`; `54 - 24 - 20 = 10` — the
       jar's OWN `====` stripe contributes **10**, matching `Creole
       HorizontalLine.java` directly, NOT the `8` `creole-text-lines.ts`
       currently reports.
  - I did not reconcile these two sources within this pass's remaining
    budget: either `CREOLE_HR_HEIGHT=8`'s prior verification used a
    DIFFERENT upstream code path (not `CreoleHorizontalLine`, e.g. a
    graphviz-node-label-specific stripe-height method I have not yet
    located in `StripeSimple.java`/`Stripe.java`) and is correctly `8`
    for ITS fixture while activity genuinely needs `10` from a different
    atom — or one of the two readings is wrong. Changing the shared
    `creole-text-lines.ts` constant to `10` without re-verifying the
    OTHER fixture it was built against would risk a silent regression I
    have no budget left to measure this pass; keeping `8` leaves bigide's
    box height 2px short. **Per CLAUDE.md ("never fit a value") and
    diagnosis.md, I am reporting this unresolved rather than picking
    either number.** Next step: read `StripeSimple.java`'s own per-
    stripe height accumulation (not yet done) to determine which real
    class actually backs a MULTI-LINE `Display`'s HORIZONTAL_LINE
    stripe — `CreoleHorizontalLine` (standalone atom, used when an
    entire creole block IS one separator) may not be the same class
    `SheetBlock1` asks for a stripe's height WITHIN a longer, mixed-
    content Display; that distinction is the open question.
  - Not committed: no code was written for task 3 (height uncertainty
    blocks drawing it correctly either way) — `bigide-91-bise382`
    remains at its pre-pass-2 score (67; the row's OTHER diffs are a
    pre-existing, unrelated 0.5px global offset — see below).

**Unrelated finding, not mine to fix**: `bigide-91-bise382` also carries
a uniform ±0.5px horizontal offset across EVERY element (even the
unrelated start/end circles and arrows) that is NOT part of the STRIPE
mechanism and was present before any of this mission's edits (score 67
unchanged since the very first `before.json` measurement). Not
investigated further — flagging so the next STRIPE attempt does not
mistake it for part of this mechanism.

### Tasks 4/5 — not attempted

Not reached: task 3 is the prerequisite for `bigide`'s own row and
blocked the remaining budget. Per the brief's own instruction ("If 1-3
land but 4/5 need more than this pass, commit 1-3 and report the exact
blocker"), tasks 1-2 are committed and task 3's exact blocker is above;
tasks 4 (Sheet-route spike) and 5 (EMBED) were not started this pass.

## Pass 1 (original)

## Commits

- `f3c251ff4` `feat(add3-T2b): route activity inline creole through the
  real sheet lexer` — widened `gtile-action.ts#creoleLineWidth` and
  `activity-renderer-text.ts#drawActivityText`/`drawCreoleLine` (renamed
  from `drawCreoleUrlLine`) from the pre-existing `[[url]]`/`|table|`
  triggers to EVERY non-table line, routing through `creoleTextLines`
  (`core/svek/image/creole-text-lines.ts`), which calls the SAME
  `buildLineAtoms` lexer (`core/klimt/creole/legacy/StripeSimple.ts`) a
  real `Sheet`/`SheetBlock1` would use. Fixed two latent bugs the
  widening exposed (`fontConfigForRun`'s color fallback,
  `isPlainSingleRun`'s dy guard — see Mechanisms below).

## Decision D5 — what "route through that sheet" means here

D5 as written names the literal `SheetBuilder`/`SheetBlock1`/
`SheetBlock2` pipeline (`ISkinSimple.sheet(...).createSheet(label)`),
the one `FtileBoxOld.ts` already wires up for mindmap/wbs
(`ftile/vertical/FtileBoxOld.ts`, built on `UGraphic`/`TextBlock`/
`StringBounder` from `klimt/`). The activity engine's own `tiles/`
pipeline (`GtileAction`, `Theme`-based sizing, string-returning
renderers) is NOT built on that stack at all — it has no `ISkinParam`/
`ISkinSimple`, no `Display`, no `UGraphic`. Wiring a REAL
`ISkinSimple` adapter for activity (mirroring
`diagrams/mindmap/mindmap-skin-param.ts`'s ~280-line `SkinParam` class)
to reach `SheetBlock1`/`SheetBlock2` would mean re-deriving activity's
entire box-sizing/positioning model on top of a second, parallel
layout engine — the exact "second builder" pattern this codebase's own
ADRs reject, and far outside a "spike."

A prior mission (`state-declared-size-fix`, D1) hit the identical wall
for the STATE engine and built `core/svek/image/creole-text-lines.ts`
as the sanctioned alternative: it calls the SAME real lexer
(`buildLineAtoms`/`StripeSimple.ts`, `CreoleStripeSimpleParser.ts`'s
classification) a Sheet's `SheetBlock1` would use, without the
`Sheet`/`Stripe`/`SheetBlock` wrapping — already proven in production
by the state engine (`state-sizing-creole.ts`) and three other
call sites (`gtile-action.ts`'s own pre-existing `[[url]]`/table
branches, `state-note-layout.ts`). I treated reaching for THAT seam,
widened from its two existing triggers to every line, as satisfying
D5's actual constraint ("no special-casing of `{{` or of individual
markup tokens") rather than literally instantiating `SheetBuilder` —
the real classifier runs either way; only the Sheet/Stripe wrapper
object graph differs, and that wrapper exists in this port for a
reason (`FtileBoxOld`'s `UGraphic`-based draw) that activity's `tiles/`
engine does not share. Flagging this as an amended interpretation of
D5, not a literal one, for review.

## Rows

| slug | before | after | mechanism |
|---|---|---|---|
| vimako-25-mega336 | 3 | **0** | CREOLE-INLINE, fixed |
| fatuzu-07-cevu894 | 53 | **0** | CREOLE-INLINE, fixed |
| bedezo-44-more709 | 86 | **0** | CREOLE-INLINE, fixed |
| pirofe-41-xama594 | 89 | **0** | CREOLE-INLINE, fixed |
| jagove-43-nako107 | 142 | 130 | CREOLE-ACT, improved (inline bold fixed; `=heading` line's HEIGHT still unfloored — see Not done) |
| letuke-04-poza319 | 159 | 138 | CREOLE-ACT, improved (inline `**creole**` in branch condition fixed; residual is the table-grid path, outside this change) |
| zejuso-92-kexo870 | 373 | 307 | CREOLE-ACT, improved (inline `**bold**` in branch/action text fixed; residual includes a `legend` block, a different diagram-wide feature, not activity-specific — not investigated further) |
| bigide-91-bise382 | 67 | 67 | STRIPE, **unchanged** — see Not done |

Probe Σ (125-row baseline, branch head Σ16362/224 pinned):
- before this commit: **16362**
- after this commit: **16008** (−354)

## Risers (0 unexplained)

- `vimoxa-78-zucu656` +10 — the NOTE-CREOLE reveal my task brief
  explicitly anticipated ("watch vimoxa +10 = NOTE-CREOLE reveal, owned
  by T2a"). Not investigated further; not my row.
- Two risers found and FIXED in this same commit before it landed
  (both confirmed resolved by direct before/after diffing, not left in
  the committed state):
  - `labala-74-juki864`, `levuma-67-cego489`, `loxija-71-joku558`,
    `zepima-96-peco612` (+3/+5/+1/+1 in an intermediate, uncommitted
    version) — **mechanism**: `creole-text-lines.ts
    #textAtomMeasured`/`baseFontConfiguration` (`leaf-sizing-text.ts:
    142-144`) sets every atom's base `FontConfiguration.color` to the
    fixed `JAR_DEFAULT_TEXT_COLOR` (`'#000000'`), never `null` — so
    `textAtomMeasured`'s `atom.font.color !== null` copy means
    `CreoleTextRun.color` is NEVER `undefined`. `fontConfigForRun`'s
    original `run.color ?? style.fill` therefore ALWAYS won with the
    hardcoded black, discarding the caller's real resolved
    `style.fill` whenever it differed from black (`!theme amiga`,
    `skinparam mode dark`, `skinparam activityFontColor red`). Fixed
    by treating `JAR_DEFAULT_TEXT_COLOR` as the "no explicit creole
    colour" sentinel.
  - `loxija-71-joku558`/`zepima-96-peco612` persisted at +1/+1 after
    the colour fix — **mechanism**: both fixtures set
    `skinparam activityFontSize 4`, below `creole-sea-line.ts
    #ATOM_TEXT_MIN_HEIGHT` (`=10`, this port's own `AtomText.java:
    179-181` floor). A lone plain run's measured height floors to 10
    inside `creoleTextLines`' `Sea` layout, which then reports a REAL
    non-zero `run.dy` for that run — but `gtile-action.ts`'s own box
    height (KLIMT-FLOOR, a sibling task's row, `gtile-action.ts:89`'s
    raw unfloored `lineHeight`) does not carry the matching floor yet,
    so the box stayed the SAME size while the text inside it moved,
    making `<text>/@y` MORE wrong (jar-verified: delta grew from 4→8,
    22→26, 6→12, 12→18, 18→24, 24→30 across the two fixtures' lines).
    Fixed by `isPlainSingleRun`: a line that is exactly one NORMAL,
    non-url, non-cascaded-size run draws via the pre-existing literal
    `drawRun` call (byte-identical to before this task), bypassing
    `dy`; every line that actually carries 2+ runs, a style flag, a
    url, or a cascaded size (the shapes this task's own rows need)
    still draws through the real per-run path.

Both fixes are committed in `f3c251ff4` alongside the main widening —
not a separate commit, since they were discovered DURING this
commit's own verification pass and are part of making the row-ledger
mechanism "no special-casing" claim actually hold for the full corpus,
not just the four target rows.

## Engine survey (rule 11)

Not run. No edit touched `src/core/**` on this commit — both changed
files are activity-only (`src/diagrams/activity/**`); `creole-text-
lines.ts`, `StripeSimple.ts`, `CreoleStripeSimpleParser.ts`,
`creole-sea-line.ts`, `leaf-sizing-text.ts`, `usymbol-resolve.ts` were
read but not modified.

## Test results

- `activity.golden.ratchet.test.ts` + `activity.harness-parity.test.ts`:
  **288/288 passed** — every pinned golden stays byte-equal (this
  task's hard acceptance bar).
- `activity.text-baseline.test.ts` + `activity.style-baseline.test.ts`:
  **31 failures across 24 fixtures** (bedezo, boxefe[pre-existing],
  citire, decudi, delide, fatuzu, jagove, jevoce, letuke, luxido,
  maduja, maketa, nuzugu, pezubu, pirofe, rujuxa, ruzica, sadovu,
  samavi, vimoxa, xidamu, xizola, zejuso, zinelo). These are
  EQUALITY-pin census gates (`textCount`/style-set per fixture), not
  byte-identity gates — their own assertion message states the
  intended remedy verbatim: "If this move is the intended effect of a
  deliberate change, re-pin ... FROM A FRESH MEASUREMENT (T6, once)".
  The move IS deliberate and correct: a line with 2+ creole runs
  (`**bold**`/`__underline__` mixed with plain text) now draws as
  MULTIPLE real `<text>` elements (one per run), matching how
  `DriverTextSvg` actually draws a multi-run stripe, instead of one
  undifferentiated literal string. **I did not re-pin
  `oracle/goldens/svg-activity/{text,style}-baseline.json`** — rule 5
  bans editing `oracle/goldens/**`/baseline JSONs from this worktree,
  and my own prior-mission memory
  (`.agent-notes/new-corpus-tree-trips-two-gates.md`) confirms this
  class of re-pin is orchestrator-only. `boxefe-81-situ725` in the
  style-census failure list is the ALREADY-known pre-existing red my
  task brief itself named (rule 10's "known pre-existing census reds
  awaiting orchestrator re-pin").
- typecheck (`tsc --noEmit -p tsconfig.json`, `tsconfig.node.json`):
  clean. `eslint` on both changed files: clean.

**Action needed from the orchestrator**: re-pin
`oracle/goldens/svg-activity/text-baseline.json` and
`oracle/goldens/svg-activity/style-baseline.json` from a fresh
measurement on this branch head, covering the 24 fixtures listed
above (23 new + 1 pre-existing).

## Not done — residuals, with mechanism (no guessing)

1. **STRIPE (`bigide-91-bise382`, Σ67, unchanged).** `CreoleStripeSimpleParser
   .java:92-109` classifies a `____`/`====` line as `HORIZONTAL_LINE`
   (empty captured label) — already correctly classified by our own
   port's `classifyStripeLine` (`creole-text-lines.ts
   #buildPhysicalLine` already returns `kind: 'hr'`, `width: 0`,
   `height: CREOLE_HR_HEIGHT` = 8 for it). Two things block drawing it
   as a real rule in this task's write-set:
   - **No HR drawing primitive activity can use.** Upstream's own HR
     atom (`CreoleHorizontalLine.ts`) draws via `UGraphic.draw
     (UHorizontalLine.infinite(...))` — a `UGraphic`/`Stencil`-based
     "infinite" line resolved against a clip region. Activity's
     renderer draws plain SVG-string primitives
     (`core/svg.ts#line`); it has no `UGraphic`/Stencil context. A
     faithful box-bounded equivalent (a literal `<line>` spanning the
     box's own padded content width, at the stripe's own vertical
     slot) is a small, well-understood primitive to add to
     `activity-renderer-text.ts`, but:
   - **Heterogeneous per-physical-line height.** `gtile-action.ts`'s
     `GtileAction` constructor sizes EVERY physical line at one
     uniform `lineHeight = bounder.getDimension('M', fontSize).height`
     (12 for the default font), and
     `activity-renderer-text.ts#drawActivityTextLines`/
     `activity-renderer-shapes.ts#renderMultilineText` advance each
     line's Y by that SAME uniform stride. An HR line's real height
     (8) differs from a text line's (12 at default size, bigger still
     for a `=heading` line in jagove/CREOLE-ACT below) — drawing the
     rule at the box's OWN padded width without ALSO summing each
     line's own `creoleTextLines`-reported height (replacing the
     uniform `lineHeight * lineCount` sum) and threading that
     per-line height through the renderer's Y-advance would size the
     box wrong and/or draw the rule at the wrong Y, very likely
     regressing other already-passing rows whose current correctness
     depends on the uniform-height assumption. I did not attempt this
     within this task's remaining time budget — it is a real,
     bounded, two-file change (`gtile-action.ts` height sum,
     `activity-renderer-text.ts`/`activity-renderer-shapes.ts` Y
     advance), not a structural blocker, but it touches every
     existing pinned row's box-height math and needs its own
     measured, incremental verification pass rather than being rushed
     at the end of this one.

2. **CREOLE-ACT heading height (`jagove-43-nako107`, Σ130 residual).**
   Same heterogeneous-height blocker as STRIPE: `:=condition1\n...` 's
   first line classifies as `HEADING` (`fontConfigurationForHeading`,
   `StripeSimple.ts`), which both grows the font SIZE (bold + a size
   delta) and therefore the line's real height above the uniform
   `lineHeight`. The DRAWING side already renders it correctly sized/
   styled (bold, bigger) via this commit's widening — the residual is
   purely the box's total height and the SUBSEQUENT lines' Y position,
   both needing the same per-line height sum named in (1).

3. **GLYPH family (`zaloze-31-jibo311`, `nipuxu-11-tefa314`,
   `vilecu-41-tete416`) — report only, confirmed, not fixed.**
   `DriverCenteredCharacterSvg.java:64-81`: the `fileFormat ==
   FileFormat.SVG_DETERMINISTIC` check that would emit a plain
   `<text>` element does NOT fire under this port's oracle flags.
   `FileFormat.java:179-192` (the project's own injected "[plantuml-ts
   oracle seam] dev-only" comment) shows `-DPLANTUML_DETERMINISTIC_TEXT`
   only swaps the `StringBounder` used for MEASUREMENT
   (`StringBounderFromWidthTable`) when the ACTUAL export `FileFormat`
   is `SVG` or `SVG_DETERMINISTIC` — it does not change the export
   `FileFormat` object itself, which `oracle-render.sh`'s invocation
   leaves as plain `SVG`. `DriverCenteredCharacterSvg#draw` branches on
   that unchanged `fileFormat`, so it takes the ELSE branch
   (`java:72-81`): a real AWT `UFont.createTextLayout(c)
   .getOutline(null)` glyph path, drawn via `svg.drawPathIterator`.
   Confirmed directly against the golden SVG
   (`test-results/dot-cache/activity/zaloze-31-jibo311/in.svg`
   contains a `<path d="M107.108,67.631 L105.385,63.27...">`, not a
   `<text>`). **This is a genuine accepted-divergence CANDIDATE**: a
   platform-font AWT glyph outline is inherently JVM/OS-font-dependent
   (exactly the class of thing `-DPLANTUML_DETERMINISTIC_TEXT` exists
   to avoid for ordinary text, but this ONE code path is outside that
   seam's reach) and this port has no AWT/canvas to reproduce it from
   (CLAUDE.md's architecture rule: pure SVG, no DOM/canvas). I have
   NOT added it to `oracle/accepted-divergences.json` (not my call,
   not in my write-set) — flagging for the orchestrator to decide,
   same treatment as the existing LaTeX/KaTeX-vs-JLaTeXMath entry in
   `DIVERGENCES.md`.

## Write-set discipline

Touched only `src/diagrams/activity/activity-renderer-text.ts` and
`src/diagrams/activity/tiles/gtile-action.ts`, both named in my
write-set. Read-only elsewhere (`core/svek/image/creole-text-lines.ts`,
`core/klimt/creole/legacy/StripeSimple.ts`,
`core/klimt/creole/legacy/CreoleStripeSimpleParser.ts`,
`core/svek/image/creole-sea-line.ts`,
`core/svek/image/leaf-sizing-text.ts`,
`core/decoration/symbol/usymbol-resolve.ts`,
`diagrams/mindmap/mindmap-skin-param.ts`,
`diagrams/activity/ftile/vertical/FtileBoxOld.ts`,
`diagrams/activity/tiles/gtile-diamond.ts`, the Java sources cited
throughout). Did not touch `gtile-diamond*.ts` — vimako's branch-label
fix needed only the two files above (confirmed via `--align`: element
counts unchanged, 17/17, for that fixture both before and after); no
row in my assignment needed `tiles/gtile-diamond*.ts` changes. No
Serena MCP tool call made (per rule 1). No `git stash` used; a
save-patch/`git checkout --`/`git apply` round-trip on the two
tracked files was used once, mid-task, to isolate a pre-existing vs.
newly-introduced diff on `loxija-71-joku558` — both files were
restored to their edited state via `git apply` of the saved patch
before any further edits, confirmed via `git status`.
