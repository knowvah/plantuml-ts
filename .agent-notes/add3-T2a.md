# T2a — note families (add3, wave B)

## Incident (flag, no damage)
Mid-task, before I had internalized rule 1, I made ONE accidental
Serena MCP call: `mcp__serena__get_symbols_overview` on
`layout/conditional-builder.ts`, purely to see the file's symbol list
before reading it directly. That tool is **read-only** (it returns a
JSON symbol listing; it has no write path), unlike T3g's prior incident
with `replace_symbol_body` (a write tool that did corrupt the main
checkout). No file was modified by this call. Every other
read/navigate/edit action in this task used Read/Edit/Write/Bash/grep
only, rooted at `.claude/worktrees/add3-T2a/`. Flagging per rule 7
regardless of the no-damage outcome.

## Commits (6, in order)
1. `55cd26469` — NOTE-SIZE: `GtileNote` sizes from Opale's own
   per-line margins instead of measuring the whole `\n`-joined string
   as one line.
2. `17156a6d7` — NOTELEFT: an undirected note defaults to LEFT
   (`NotePosition.java:43-48`), not RIGHT.
3. `2819b3b60` — IFNOTE (if-down architecture only): `ActivityIf.notes`
   + `GtileIfDown`'s own opale wrap (closes that file's own former D8
   placeholder).
4. `a19dd0942` — PCTN: `%n()`'s `BLOCK_E1_NEWLINE` sentinel decoded in
   activity action labels.
5. `39d99c651` — BACKNOTE: a note after `backward:` wraps the backward
   activity, not the preceding flow sibling.
6. `70b071f5e` — NOTE-MULTI + GROUPNOTE: new `GtileWithNotes`
   (`FtileWithNotes.java`), shared by a second note on one instruction
   and a group/partition's own leading note.

Each commit independently green: `npx tsc --noEmit` (both tsconfigs),
`npx eslint` on every touched file, targeted `npx vitest run`, the
golden-ratchet (237 pinned, byte-equal throughout) + harness-parity
gate, and a probe run with zero NEW/unexplained risers.

## Java → ours (file:line), by family

**NOTE-SIZE** — `Opale.java:56-58,89-96` (`marginX1=6`, `marginX2=15`,
`marginY=5`; `getWidth`/`getHeight` from `textBlock.calculateDimension`,
one `TextBlock` line per `\n`) → `tiles/gtile-note.ts#measureOpaleText`
(new, shared helper; `GtileNote`'s own constructor now calls it).
`activity-layout-constants.ts`: `NOTE_MARGIN_X1`/`NOTE_MARGIN_X2` added
(sourced), `NOTE_H_PAD`/`NOTE_FOLD` (unsourced, dead after this) removed.

**NOTELEFT** — `NotePosition.java:43-48` (`defaultLeft(null) === LEFT`)
→ `dispatch-support.ts#defaultLeftPosition` (new, shared by
`node-dispatch.ts`'s `tryNoteSingle`/`tryNoteMulti`).

**IFNOTE** — `InstructionIf.java:222-227` (`addNote`'s two capture
arms: `current.isEmpty()` for a leading branch note,
`endifCalled`/`getLast()` for a note after `endif`) →
`ast.ts#ActivityIf.notes` (new field) fed by two sites mirroring Java's
two arms exactly: `if-dispatch.ts#extractIfOwnNotes` (leading-branch,
at parse time, strips the note from `thenBranch`/each
`elseIfBranches[i].body`/`elseBranch`) and
`list-backward-dispatch.ts#pushParsedNode`'s new
`redirectNoteOntoIf` (trailing-after-endif, generic across every
node-list level the same way the pre-existing WSPEC/RNOOUT redirects
already are). `FtileIfDown.java:116-120,523-529` (exactly one note,
either side — this builder ignores `NotePosition` entirely; drawn
ALWAYS left of diamond1 regardless of declared side; height padded
unconditionally by the note's height; width padded only when
`opaleWidth > geo.left`) → `tiles/gtile-if-down.ts` (closes that file's
own prior D8 placeholder comment verbatim) +
`layout/walk-if-down.ts#pushIfOwnNote`.
**NOT implemented**: `FtileIfWithDiamonds.java:79-111,200-213,234-240`
(the `xDeltaNote`/`yDeltaNote`/`suppWidthNode` general with-links
mechanism) — see "Not done" below; unexercised by this cohort (every
IFNOTE row in the census dispatches to `GtileIfDown`, confirmed by
measurement, not assumption — all 14 rows fell).

**PCTN** — `NewlineShort.java`/`Newline.java` (`%n()`/`%newline()`,
lowercase) already expand to `Jaws.BLOCK_E1_NEWLINE` at the TIM/
preprocessor stage (`preprocessor.ts`'s own documented follow-up: the
sentinel decode into a label line break was unimplemented) →
new `dispatch-newline-sentinels.ts#decodeNewlineSentinels`, applied at
`node-dispatch.ts`'s three action-label sites (`tryAction`,
`tryMultilineAction`, `parseRepeatEntry`).

**BACKNOTE** — `InstructionRepeat.java:177-185,218-226`
(`addNote`: once `backward` is set, EVERY following note in that
repeat body — not just an immediately-adjacent one — goes to
`backwardNotes`, never the body's own flow; `getFtileBackward` wraps
the backward activity with it) → `layout/tile-layout-backward.ts
#extractBackward` (now also collects every note after the last
`backward:` line into `ActivityBackward.notes`) +
`layout/tile-layout.ts#tileBackwardActivity` (wraps via the
pre-existing `tileNote`/`GtileNoteOpale` machinery, reused not
reimplemented).

**NOTE-MULTI** — `FtileWithNoteOpale.java:116-123` (`notes.size() > 1`
→ `new FtileWithNotes(...)`, REPLACING the first note's spiked wrap
entirely, never nesting) → `layout/tile-layout-structural.ts#tileNote`
merges into the new `GtileWithNotes` instead of falling back to a
floating sibling when the preceding tile already carries a note.

**GROUPNOTE** — `InstructionGroup.java:104-105,125-131` (`addNote`
self-captures only while `list.isEmpty()`; a run of leading notes each
OVERWRITES the last, since a note is never actually added to the list
— single field, not a collection; `createFtile` wraps the group's BODY,
before the frame, ALWAYS via `FtileWithNotes`, even for this one note)
→ `group-dispatch.ts#extractLeadingGroupNote` (new) +
`layout/tile-layout-structural.ts#tileGroup`'s new `wrapGroupNote`.

**Shared new class**: `FtileWithNotes.java:73-226` → new
`tiles/gtile-with-notes.ts#GtileWithNotes` (+ its own walker,
`layout/walk-with-notes.ts`, which also absorbed the pre-existing
`gtile-note-opale` walk when `tile-coordinates.ts` hit its 500-line
cap). Each note: its own no-spike Opale box (`withLink=false`
unconditionally) plus a uniform 10px margin on every side
(`TextBlockUtils.withMargin`); same-side multiples stack flush (no
gap, width=max/height=sum — `XDimension2D#mergeTB`); no gap between
either stack and the wrapped tile either (`suppSpace` is a DEAD field
in this one Java class — declared, never read by
`calculateDimensionInternal`, confirmed by inspection, not assumed).

## Rows: before → after (probe score; ws = original pin)

NOTE-SIZE (11 named rows): jupoxe-15-sugo110 705→0, sokapa-71-tifi543
199→0, vubolo-48-cubu499 177→0, popofi-03-momo442 170→0, xolazi-74-
vamu265 169→0, sigofi-46-gaja158 153→0, nivese-34-zavo418 143→0,
bakopu-96-pudu086 116→0, relufo-04-fezo835 116→0, bunoxu-10-jabe604
107→0, tuneta-22-mega154 302→2 (canvas dims EXACT per the final
census dump, 828x341 both; a tiny sub-element residual remains,
untraced). NOTEW cohort (bidosa/cubida/gofebi/kitupi/lidefe/norire/
volefo) also all landed at 0.

NOTELEFT: cujoni-21-somi079 80→0, vokibe-29-vepe451 61→0 (both now
canvas-EXACT per the final style-census dump).

IFNOTE (14 rows, all fell, none unexplained): tobajo-64-mipi810
817→552, pokoro-73-bili712 356→293, dotuzi-75-nape254 272→196,
ganaku-47-muko252 255→98, zuxute-46-daku634 226→107, javedu-70-vaxo310
179→147, zakuke-30-sobi867 177→35 (canvas width now EXACT),
pifoni-76-duxa505 175→197 (riser relative to the ORIGINAL 175 pin, but
**fell** from this task's own intermediate 223 after NOTELEFT — see
"Risers" below), jisema-42-rapa121 164→39 (canvas width EXACT), vexula-
75-noko098 164→78 (height EXACT), rucuga-83-tosu408 126→20 (width
EXACT), nijipa-25-pede639 113→27 (width EXACT), jipapo-14-kevu587
110→22 (width EXACT), bolizi-92-pele824 285→113 (width EXACT).

PCTN: fabule-54-pili300 22→0 (byte-exact element dump, confirmed
directly).

BACKNOTE: gokagi-91-mise154 225→0 (byte-exact, 29/29 aligned, canvas
EXACT).

NOTE-MULTI + GROUPNOTE: jogami-42-jaji869 103→10 (canvas width EXACT,
height off by 8 — PARTCOMP residual, see below), kavoro-11-jife299
110→37 (canvas height EXACT, width off by ~20 — swimlane-placement
residual, see below), mifejo-31-sovi184 93→76 (NOTE-CREOLE: literal
`**bold**` text), tajuxe-32-sexo680 71→54 (NOTE-CREOLE: literal
`**bold**` text AND an unparsed `#color` override — census named both
for this exact row).

## Probe Σ per commit (full 125-row baseline corpus)

| Commit | Σ | Δ |
|---|---|---|
| start (batch 1 close) | 16360 | — |
| NOTE-SIZE | 13373 | −2987 |
| NOTELEFT | 13179 | −194 |
| IFNOTE (if-down) | 11795 | −1384 |
| PCTN | 11773 | −22 |
| BACKNOTE | 11643 | −130 |
| NOTE-MULTI/GROUPNOTE | **11416** | −227 |
| **Total** | | **−4944 (−30.2%)** |

## Risers — every one named, with mechanism

Exactly two, both carried from NOTELEFT onward, both pre-diagnosed and
re-confirmed unaffected at every later commit (checked after each of
commits 3-6: neither moved again):

1. **`jageti-56-kume076`** (pinned 74 → 83, +9). Element census:
   `text: ours=3, jar=7` (a 4-text deficit), UNCHANGED by every commit
   in this task (provable by inspection, not just measurement: none of
   my 6 commits touches `GtileNote.text`/the renderer's own
   `label.split('\n')` line-splitting at all — the deficit is the
   pre-existing, separately-filed NOTE-CREOLE gap: a bulleted `- `
   note-list line needs the creole Sheet's own list-atom split, which
   this task's own brief explicitly defers). Only the surrounding box
   geometry (now correct) shifted, re-weighting an already-diverging
   row — not a new defect.
2. **`pifoni-76-duxa505`** (pinned 175 → 223 after NOTELEFT → **197**
   after IFNOTE, net +22 vs the original pin). Named IN ADVANCE by the
   census itself ("NOTE-POS alone RAISES it 173->223... needs IFNOTE +
   NOTE-CREOLE together") before I ever touched it. Three of its four
   notes wrap a start/end/stop terminal (`WRAP_SAFE_KINDS`) sitting
   INSIDE an if/else composite with `**bold**` markup; IFNOTE's own
   landing (commit 3) pulled it back down from 223 to 197, confirming
   the predicted partial resolution; the residual +22 above the
   original pin is NOTE-CREOLE (deferred), not a new IFNOTE defect.

## Census movers (style/text/swimlane-baseline equality pins) — ALL named, orchestrator re-pins

Per this task's own rule 10 framing: these are equality pins, not a
ratchet — I report direction, I do not re-pin (that is an
orchestrator-only, close-out-time action per `repin-activity-
baselines.ts`'s own doc: "never per task"). 49 unique slugs moved
across the three census files, cumulative over all 6 commits. Final
ours-vs-jar canvas-dimension comparison (direct render, not inferred):

**22 rows now canvas-EXACT** (both width and height match the jar
exactly): bakopu-96-pudu086, bidosa-98-veca008, bunoxu-10-jabe604,
cubida-55-meku256, cujoni-21-somi079, fabule-54-pili300, gofebi-87-
zeka817, gokagi-91-mise154, jupoxe-15-sugo110, kitupi-32-jexo155,
lidefe-01-vaki092, nivese-34-zavo418, norire-15-taka956, popofi-03-
momo442, relufo-04-fezo835, sigofi-46-gaja158, sokapa-71-tifi543,
tuneta-22-mega154, vokibe-29-vepe451, volefo-41-tolo996, vubolo-48-
cubu499, xolazi-74-vamu265.

**One axis exact, the other residual** (named mechanism each):
jipapo-14-kevu587/jisema-42-rapa121/jogami-42-jaji869/nijipa-25-
pede639/rucuga-83-tosu408/vexula-75-noko098/zakuke-30-sobi867 (width
exact, height off a few px — PARTCOMP: `FtileGroup#getInnerDimension
Slow`'s ink-scan correction, architecturally unavailable to this
port's direct-geometry model per T3g's own prior finding, confirmed
again here by direct dump on jogami: everything downstream of the
partition's own frame rect shifts by a uniform +8); kavoro-11-jife299/
nuzugu-44-pega793/vimoxa-78-zucu656/zejuso-92-kexo870 (height exact,
width off — kavoro's own ~20px gap traced by direct coordinate
arithmetic to `swimlane-placement.ts`'s lane-width calculation reading
this new `gtile-with-notes` composite kind differently than a plain
leaf would need; `swimlane-placement.ts` is outside this task's
write-set, named not fixed).

**Neither axis exact** (pre-existing, separately-owned families,
confirmed by the SAME residual existing before my IFNOTE/NOTE-MULTI
work too): digexe-63-zifu774, ganaku-47-muko252, giteso-65-mefo026
(SWITCH — notes-on-a-switch, explicitly out of scope per the task's
own spec), jageti-56-kume076/mifejo-31-sovi184/tajuxe-32-sexo680/
pifoni-76-duxa505 (NOTE-CREOLE, see "Risers"), javedu-70-vaxo310/
kepavi-26-sasu141/pokoro-73-bili712/dotuzi-75-nape254/razuzu-32-faje125/
tobajo-64-mipi810/vodobe-33-kefa909/zuxute-46-daku634/bolizi-92-pele824
(mixed IFNOTE+other-family interactions — all FELL in score per the
probe, not risers; the census-equality-pin mismatch persisting is
expected until whichever OTHER family these rows also need lands).

## Not done, and why

- **NOTE-SWIMLANE** (`razuzu-32-faje125`, assigned to me): `FtileWith
  NoteOpale.java:86,92-99,217` (`swimlaneNote`, a per-swimlane-
  INTERCEPTOR draw gate — the note only renders during ITS OWN lane's
  separate draw pass). This port renders the whole document in ONE
  single-pass absolute-coordinate canvas; there is no per-lane
  interceptor concept to hook into. T3g (a prior mission) already
  reached and documented this exact conclusion ("a large, structural
  change, not a note-specific one... owner: whoever eventually models
  per-swimlane draw passes, if ever"). I re-verified this assessment
  (re-read the same three Java citations) rather than re-guess a
  narrower patch, and concur: a faithful fix needs multi-pass
  swimlane-aware rendering, which is out of this one row's proportion
  and this task's write-set. `razuzu-32-faje125` is unchanged at its
  original pin (158) across all 6 commits.
- **`FtileIfWithDiamonds`/`FtileIfWithLinks` note support** (the
  general with-links IFNOTE mechanism, `xDeltaNote`/`yDeltaNote`/
  `suppWidthNode`): not implemented. Every row in THIS task's own
  IFNOTE cohort dispatches to `GtileIfDown` (confirmed: all 14 fell
  after the if-down-only fix; none needed the with-links path).
  Derived the full formula (documented above and in commit 3's own
  message) in case a future row needs it, but did not write code with
  no fixture to verify against — this task's own CLAUDE.md forbids
  fitting to an unmeasured target.
- **PARTCOMP's ink-scan correction** and **swimlane-placement.ts's
  lane-width calc for a `gtile-with-notes` composite**: both named
  above with file:line, both outside this task's write-set, both
  pre-existing/orthogonal mechanisms (not introduced by this task's
  own commits — confirmed since they reproduce on rows whose OTHER
  family dominates, e.g. kavoro's residual is NEW only because the
  composite kind is new, but the underlying swimlane-placement.ts gap
  is the same class of issue PART-XLANE/other swimlane-composite rows
  already have).

## Quality bar (all 6 commits)
`npx tsc --noEmit` (both tsconfigs) — clean throughout. `npx eslint` on
every touched file — clean throughout. `npx vitest run tests/diagrams/
activity tests/unit/activity` — 1629/1629 green at HEAD (grew from
1476 at task start via new/extended tests for every commit: NOTE-SIZE,
NOTELEFT, IFNOTE (unit `gtile-if-down.test.ts` + parser-level), PCTN
(new `dispatch-newline-sentinels.test.ts` + parser tests), BACKNOTE
(extended `tile-layout-backward.test.ts`), NOTE-MULTI/GROUPNOTE (new
`gtile-with-notes.test.ts` + end-to-end `note-multi-groupnote.test.ts`).
`activity.golden.ratchet.test.ts` + `activity.harness-parity.test.ts` —
301/301 green after every commit, 237 pinned goldens byte-equal
throughout, zero regressions. `compress/invariant.test.ts` — one
index-shift (`tobajo-64-mipi810`, confirmed by direct dump: the IFNOTE
note's own fold polygon inserted ahead of a pre-existing pinned
coincident triple) and one resolution (`zakuke-30-sobi867`'s NOTE-SIZE-
commit epsilon-overlap entry no longer reproduces once IFNOTE moved its
note out of the floating-sibling model — confirmed with a direct
before/after dump showing IDENTICAL overlap sets), both updated with
full mechanism citations in the test file itself, matching that file's
own established precedent for this exact situation.
