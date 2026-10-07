# T2a-2 — IFNOTE for the with-links if builder

## Mechanism (diagnosis, per CLAUDE.md's rule)

T2a's final report (`.agent-notes/add3-T2a.md`) claimed "every IFNOTE row
in the census dispatches to GtileIfDown ... all 14 fell". I re-verified
this by instrumenting `ifBuilderOf` (`conditional-builder.ts`) directly
against the 5 example fixtures and the full IFNOTE cohort — **false**.
`ConditionalBuilder.create`'s own dispatch (`ConditionalBuilder.java:
149-161`) sends an `if` to `createDown` only when at least one branch is
empty/a lone stop-or-spot; a two-REAL-branch `if` (both branches
non-empty, neither a lone stop/spot) always reaches `createWithLinks`
(`:161`). 7 of the 14 IFNOTE rows have a real `else` branch (javedu,
dotuzi, pokoro, zuxute, bolizi, ganaku, pifoni) and dispatch to
`'with-links'`; the other 7 (jipapo, jisema, nijipa, rucuga, vexula,
zakuke, tobajo) have NO `else` at all and correctly dispatch to `'down'`
(T2a's own fixed family, unaffected by this task).

`GtileIfWithLinks`/`GtileIfWithLinksBranch` (an existing, fully-built
geometry port from an earlier mission, `activity-if-tile-port`) never
read `ActivityIf.notes` at all — confirmed by reading the pre-task file
in full. T2a's parser-side capture (`if-dispatch.ts#extractIfOwnNotes`,
`list-backward-dispatch.ts#redirectNoteOntoIf`) populates
`ActivityIf.notes` regardless of which builder later consumes it; since
`buildIfWithLinks` never consumed it, the note was captured and then
unconditionally dropped for this whole family — a regression T2a's own
capture commit (`2819b3b60`) silently introduced for the with-links
subset (verified: `measuredAgainstCommit: "5859712e"` in the stale
`text-baseline.json`/`style-baseline.json` pins predates `2819b3b60`
— `git merge-base --is-ancestor` confirms it — so those pins still
reflect the PRE-capture state where the note was an ordinary flow
sibling, not the post-capture-but-undrawn state).

## Java → ours (file:line)

- `FtileIfWithDiamonds.java:79-111` (constructor: at most one LEFT and
  one RIGHT note, encounter order, each reading `getTranslateDiamond1
  ().getDx()` — recomputed after any prior note already changed
  `xDeltaNote` — via `clearCacheDimensionInternal()`) →
  `tiles/gtile-if-with-links-notes.ts#computeIfOwnNoteGeometry`
  (+`applyLeftNote`/`applyRightNote`), calling back into
  `gtile-if-with-links.ts#computeNudeAndMerge` (now exported) with TRIAL
  `xDeltaNote`/`suppWidthNode` the same way the Java re-reads its own
  memoized (then invalidated) dimension.
- `FtileIfNude.java:58-60,98-99,107-108,147,152-153` (`xDeltaNote`/
  `yDeltaNote`/`suppWidthNode` fields; `getTranslateBranch1/2`;
  `calculateDimensionInternalSlow`'s width/left/height formulas) →
  `IfLinksFlags` widened with the three fields; `computeNudeAndMerge`'s
  `nude.left/.width/.height`; `computeCoreGeometry`'s `branchY0`/
  `tile2X0` (the latter subtracts `suppWidthNode` a SECOND time,
  mirroring `getTranslateBranch2`'s own cancellation — the right note
  widens the composite's own right edge without moving branch2).
- `FtileIfWithDiamonds.java:234-240` (`getTranslateDiamond1`'s own
  `y1 = yDeltaNote`) → `CoreGeometry.diamond1Y0`/`Placement.diamond1Y`.
- `FtileIfWithDiamonds.java:200-213` (`drawU`'s own `opaleLeft`/
  `opaleRight` draws, local `y = 0`, FIRST in draw order) →
  `layout/walk-if-with-links.ts#pushOwnNote`/`pushOwnNotes`, called
  before `pushDiamond1` in `walkIfWithLinks`; `Placement.noteY` is the
  frame this port bakes `addVerticalMargin`'s external wrap into
  directly (one single-frame composite, not a separate wrapper tile).
- `FtileIfWithLinks.java` (no constructor/drawU/getTranslate* override
  beyond `addLinks`'s own connectors) inherits `FtileIfWithDiamonds`'s
  note mechanism UNCHANGED — confirmed by reading the full file; no
  further porting needed there.
- `FtileIfLongHorizontal.java`/`FtileIfLongVertical.java`/
  `FtileFactoryDelegatorIf.java:85-91` — grepped both Long files for
  `notes`/`PositionedNote`: zero matches. `createIf`'s own dispatch only
  forwards `notes` to `ConditionalBuilder.create` when `thens.size() ==
  1`; for an elseif chain (3+ branches) `notes` is never passed to either
  Long builder at all. This is upstream's OWN silent-drop, not a port
  gap — proven by the Java source, not inferred. Out of this task's
  write-set (no fixture in the 14-row cohort needs it; T2a's own census
  already confirmed none of the 14 are elseif chains).
- A note at `TOP`/`BOTTOM`/`OVER` is silently ignored by
  `FtileIfWithDiamonds`'s own `if/else-if` (`:83-107`, no further
  `else`) — moot here: `ActivityNote.position` (`ast.ts:366`) is typed
  `'left' | 'right'` only; activity's own note grammar never parses the
  other `NotePosition` values.

## Files changed (commit `6514fde8d`)

- `src/diagrams/activity/tiles/gtile-if-with-links.ts` — `IfLinksFlags`
  widened (`xDeltaNote`/`yDeltaNote`/`suppWidthNode`, exported);
  `computeNudeAndMerge` exported; `CoreGeometry`/`Placement` gained
  `diamond1Y0`/`noteY`; `tile2X0`/`branchY0` formulas updated;
  `GtileIfWithLinksFields`/class gained `opaleLeft`/`opaleRight`;
  `create()`'s trailing params became `IfWithLinksCreateOptions`
  (`conditionEndStyle`/`notes`, exported) to stay under the 5-param
  limit; split `buildBranchGeos`/`resolvePlacement` out of `create()`
  for the same reason.
- `src/diagrams/activity/tiles/gtile-if-with-links-notes.ts` (NEW) — the
  note-geometry pre-pass, split out purely for the file's 500-line cap;
  safe circular import with the file above (function definitions only).
- `src/diagrams/activity/layout/conditional-builder.ts` —
  `buildIfWithLinks` now measures `node.notes` via
  `measureIfOwnNote` (already imported, used by `buildIfDown` too) and
  threads them into `GtileIfWithLinks.create`.
- `src/diagrams/activity/layout/walk-if-with-links.ts` — `pushOwnNote`/
  `pushOwnNotes`, called first in `walkIfWithLinks` (matches Java's
  `drawU` order).
- Tests: `tests/diagrams/activity/tiles/gtile-if-with-links.test.ts`
  (+28, hand-derived geometry for LEFT-only/RIGHT-only/both/second-note-
  dropped) and `tests/diagrams/activity/layout/walk-if-with-links.test.ts`
  (+3, end-to-end via `layoutActivity`, draw order + note placement) —
  also fixed the two pre-existing `'hline'` positional-arg call sites for
  the new options-bag signature.
- No new `.puml` fixtures authored — the existing corpus (javedu/dotuzi/
  pokoro/zuxute/bolizi/ganaku, each exercising LEFT-only, RIGHT-only, and
  a dropped second same-side note) plus the new unit/integration tests
  already cover every code path this task's own Java citations describe.

## Rows: before → after (probe `activity-probe.ts`, full 112-row corpus)

Branch head (before this task): Σ 10262. After this commit: **Σ 9220**
(−1042, −10.2%). Verified identical before and after `git commit`
(6514fde8d).

The 7 with-links rows, dimension-score probe + direct canvas-dimension
render check (both width AND height vs the jar's own cached `in.svg`):

| row | before (T2a exit) | after | canvas vs jar |
|---|---|---|---|
| javedu-70-vaxo310 | 147 | **0** | EXACT (227x226) |
| dotuzi-75-nape254 | 196 | **0** | EXACT (205x330) |
| pokoro-73-bili712 | 293 | **0** | EXACT (403x417) |
| zuxute-46-daku634 | 107 | **0** | EXACT (280x303) |
| bolizi-92-pele824 | 113 | **0** | EXACT (278x333) |
| ganaku-47-muko252 | 98 | **0** | EXACT (203x330) |
| pifoni-76-duxa505 | 197 | 100 | width 395 vs jar 365 (height exact, 188) |

6 of 7 land at exactly 0 (fully conformant). `pifoni`'s residual +100 is
the same pre-existing, separately-filed NOTE-CREOLE gap T2a already
named for this row (three of its four notes contain literal `**bold**`
markup Opale's plain-text measurer doesn't resolve) — confirmed by
`activity-probe-elements.ts`: `delta: {}` (zero element-COUNT deficit,
geometry-only residual), consistent with a sizing-not-content gap.

The other 7 IFNOTE rows (jipapo/jisema/nijipa/rucuga/vexula/zakuke/
tobajo, all `'down'`-dispatched, T2a's own family) are byte-identical to
T2a's own exit values — this task's write-set never touches
`gtile-if-down.ts`, confirmed by inspection and by the probe showing
zero movement on any of the seven.

## textCount/fontSize vs the pin's `jar` column (rule 10)

`style-baseline.json`/`text-baseline.json` are STALE equality pins
(`measuredAgainstCommit: "5859712e"`, which `git merge-base
--is-ancestor` confirms predates T2a's own IFNOTE capture commit
`2819b3b60`) — orchestrator re-pin territory, not mine to touch. Per
row, comparing my CURRENT measurement against the pin's own `jar`
column (the real upstream value, never stale):

| row | jar textCount | now (mine) | match |
|---|---|---|---|
| javedu | 4 | 4 | yes (unchanged by this task — restores a T2a-introduced regression back to its own historically-correct value, coincidentally identical) |
| dotuzi | 9 | 9 | yes |
| pokoro | 9 | 9 | yes |
| zuxute | 6 | 6 | yes |
| pifoni | 10 | 10 | yes |
| bolizi | 11 | 11 | yes — MOVED from the stale pin's 12 down to 11, now exactly matching jar (jar also drops bolizi's second same-side note — confirms the "at most one note per side" Java rule is faithful even on jar's own output) |
| ganaku | 8 | 8 | yes — MOVED from the stale pin's 9 down to 8, exactly matching jar, same mechanism as bolizi |

`fontSize` histograms: bolizi/ganaku's own `fontSize {13: ...}` count
moved down by 1 in lockstep with `textCount` (one fewer 13pt text run
when the second same-side note stops drawing) — no OTHER fontSize
bucket moved for any of the 7 rows.

## Risers

**Zero new risers.** The probe's only riser across the full 112-row
corpus, before and after this commit, is `jageti-56-kume076` — T2a's own
pre-existing NOTE-CREOLE deficit (unrelated node kind, a flow-sibling
note, never touched by this task's write-set).

## Quality bar

`npx tsc --noEmit` (both `tsconfig.json`/`tsconfig.node.json`) — clean.
`npx eslint` on every touched file — clean. `npx vitest run
tests/oracle/svg-conformance/activity.golden.ratchet.test.ts tests/
oracle/svg-conformance/activity.harness-parity.test.ts tests/diagrams/
activity tests/unit/activity` — 1958/1958 green (grew from T2a's own
1629-at-task-start by my 28 new tests: 46+21 in the two touched test
files above their own pre-task counts, plus the existing 301-test
golden-ratchet/harness-parity file bundled into this one combined run).
Of those 1958, 301 are the golden-ratchet + harness-parity pair:
byte-equal throughout, 237 pinned goldens, zero regressions.
`compress/invariant.test.ts` — 3/3 green, no new entries.

## Not done / out of scope

- `FtileIfLongHorizontal`/`FtileIfLongVertical` note support: proven
  (by grep, not assumption) that upstream itself never passes `notes`
  to either builder for an elseif chain — genuinely out of scope, not a
  port gap.
- `pifoni`'s NOTE-CREOLE residual: pre-existing, separately tracked,
  not this task's family.
- No new `.puml` fixtures: the existing corpus already exercises every
  branch this task's Java citations describe (confirmed by the 6
  exact-0 rows above).
