# add4-T1f: SWITCH-NOTE (fixed) and SWITCH-NL (blocked outside write-set)

Worktree `.claude/worktrees/add4-T1f`, branch `add4/T1f`, base `b74d6beb2`. No Serena tools,
no `git stash`, no `src/core/**` edits, so no all-engine survey was needed.

## Commits
- `5ca7c2cae` fix(add4-T1f): attach switch notes to the switch, top-aligned
- (this note) docs(add4-T1f): report

SWITCH-NL is NOT committed. See "Not done".

## Java -> ours (SWITCH-NOTE)
- `InstructionSwitch#addNote` (`InstructionSwitch.java:185-193`): `current == null || current.isEmpty()`
  makes the note the switch's own (`WithNote#addNote`, `WithNote.java:56-59`). Otherwise it goes to
  `current.addNote`. `ActivityDiagram3#addNote` (`ActivityDiagram3.java:478-480`) always targets
  `current()`, which is the switch for every line inside it.
  - Ours, pre-case notes: `switch-dispatch.ts#tryPreCaseNote`. It replaces the silent `'unexpected'`
    drop, which was information loss.
  - Ours, empty-case notes: `switch-dispatch.ts#extractLeadingCaseNotes`. It strips the case body's
    leading notes. `arrow-label` does not end the run because it is not an instruction.
  - Ours, AST: `ActivitySwitch.notes` (`ast.ts`).
- Note after `endswitch`: `InstructionList#addNote` -> `getLast().addNote` (`InstructionList.java:190-196`)
  -> `InstructionSwitch#addNote`. If the last case is empty, the note is the switch's own. Otherwise it
  recurses into that case's list, to its last instruction.
  - Ours: `note-dispatch.ts#redirectNoteOntoSwitch`. It recurses through the caller's `pushParsedNode`,
    passed in as a parameter, so a nested `if` or `switch` gets the same redirect.
  - **One wiring line outside the write-set**: `list-backward-dispatch.ts#redirectOntoIf` now calls
    it, plus its import.
- `InstructionSwitch#createFtile` `eventuallyAddNote(..., VerticalAlignment.TOP)` (`:125`) ->
  `FtileFactoryDelegatorAddNote#addNote` (`:56-71`) -> `FtileWithNoteOpale.create(tile, notes, true, TOP)`
  (`FtileWithNoteOpale.java:113-122`). Ours: `tile-layout-structural.ts#wrapSwitchNotes`.
  - 2+ notes build `GtileWithNotes`. 1 note builds a spiked `GtileNoteOpale`, spikeless if
    `FLOATING_NOTE` (`:132-133`).
- TOP alignment:
  - `FtileWithNotes#getTranslate*` (`FtileWithNotes.java:158-192`, `yDelta = 0` when TOP) ->
    `gtile-with-notes.ts#computeWithNotesPlacement`, which takes a new `verticalAlignment` parameter.
  - `FtileWithNoteOpale#getTranslateForOpale` (`:177-193`, `yForNote = 0` when not CENTER) ->
    `gtile-note.ts#GtileNoteOpale`. Its `getTranslate` `yForFtile` stays centred
    (`FtileWithNoteOpale.java:155-167`).
  - New type: `NoteVerticalAlignment`.

## Rows (probe score; element census delta vs jar)
| row | before | after | element delta before -> after | residual |
|---|---|---|---|---|
| giteso-65-mefo026 | 461 | 3 | polygon+2 line+4 path-2 text-1 -> exact | see 1, 2 below |
| rujixe-89-sumo552 | 116 | 1 | path-2 text-1 -> exact | see 1 |
| sojono-24-tufe806 | 175 | 137 | path-4 text-2 -> exact | see 3 |

Residuals, each with its mechanism:
1. **Merge hexagon (1 unit per switch).** The jar's diamond2 is `FtileDiamondInside(TextBlockUtils.empty(0,0))`
   (`FtileFactoryDelegatorSwitch.java:151-160`): a 6-point hexagon. Ours `'if-merge'` draws a 4-point
   diamond (`activity-renderer-shapes.ts` -> `renderIfMerge`). This is SWITCH-GEOM (census cezabi), not
   T1f.
2. **giteso `line[7]` y1 is 5.5 too low (319.5 vs 314).** `:second` carries two floating notes
   (`FtileWithNotes`, CENTER). The case exit is read as `GtileTopDown` SOUTH = its height, so it lands at
   the notes' bottom. Upstream uses `FtileGeometryMerger.java:49-50`, outY = the last child's own outY.
   This is the same defect as T1c "Not done 2": `tiles/gtile-top-down.ts:87-89`, a shared primitive
   outside the write-set.
3. **sojono 137 is the phantom compress slot.** `layout/compress/shapes-of.ts:367` (`edgeLabelShape`) adds
   an x+4 label box even for an edge with `labelAlign` and a real reservation. Everything right of case
   1 shifts +4. Scratch check (reverted): `edge.labelAlign !== undefined -> undefined` takes sojono
   137 -> 2, giteso stays 3, rujixe stays 1. Owner: T1e (compress).

## Probe Σ (93 rows)
| point | Σ |
|---|---|
| base `b74d6beb2` | 10272 |
| after `5ca7c2cae` | 9661 (−611) |

0 risers. Only giteso, rujixe and sojono moved. Element census: all three are now exact, and no row
moved away from the jar.

## Gates after `5ca7c2cae`
- `tests/diagrams/activity`: 1194 pass, 5 expected-fail (T1a's, unchanged).
- typecheck, eslint and prettier on touched files.
- golden ratchet and harness-parity: 393/393, pins byte-equal.
- swimlane census green.
- `docs/catalog.md` regenerated.

## Census movers (the orchestrator re-pins)
| row | census | ours before -> now | jar | equal? |
|---|---|---|---|---|
| giteso | style | fontSize13 7->8, strokeWidth1 24->20, textCount 19->20, width 500->723, height 588->543 | 8, 20, 20, 723, 543 | yes, all |
| giteso | text | fill/anchor/textCount 19->20 | 20 | yes |
| rujixe | style | fontSize13 0->1, textCount 8->9, width 247->367 | 1, 9, 367 | yes |
| rujixe | text | 8->9 | 9 | yes |
| sojono | style | fontSize13 0->2, textCount 12->14, width 318->512 | 2, 14, **508** | width toward, +4 = phantom slot (3) |
| sojono | text | 12->14 | 14 | yes |

## Authored fixtures (`tests/fixtures/activity/add4-T1f/<case>/{in.puml,in.svg}`, jar via oracle-render.sh)
| fixture | what it checks | compareSvg ws |
|---|---|---|
| pre-case-one | 1 note -> spiked Opale, TOP | 3 |
| pre-case-two | 3 notes L/R -> FtileWithNotes TOP | 1 |
| empty-case | empty-case note to the switch, later note to the action | 1 |
| after-endswitch | note -> the last case's last action | 3 |
| after-endswitch-empty | empty last case -> the switch | 33 |
| floating-one | spikeless | 3 |

- The 1-unit residual is the merge hexagon (1). The 3-unit residuals add the first/last case label y
  of 1.72, which is T1a's named "label placement after compression" family.
- `after-endswitch-empty` 33 is pre-existing and independent of notes. The same puml without the note
  also scores 33. The empty case is +4 x (phantom slot) and +1.5 y. Owner: SWITCH-GEOM.
- Tests:
  - `tests/diagrams/activity/switch-note.test.ts`: parse, plus every note's text count and Opale path
    equal to the jar.
  - `tiles/gtile-with-notes.test.ts`: TOP block.
  - `tiles/gtile-note-opale-align.test.ts`.

## Not done: SWITCH-NL (needs `renderer.ts`, which T1e owns)
- **Mechanism:**
  - `CommandCase.java:87` `Display.getWithNewlines` is a one-line parser fix
    (`switch-dispatch.ts`, `unescapeLabelNewlines`).
  - The case label is drawn as the connector's edge label, and `renderer.ts#renderEdgeLabelAligned`
    (`:118-120`) is single-line. A label with a real `\n` therefore draws ONLY its first line: the
    scratch small-2line drew `one` but not `line`.
  - Committing the unescape alone would drop information, so it is not committed.
  - The full chain needs four changes. Sandbox patch, reverted:
    `.agent-notes/add4-T1f-switch-nl.patch`.
    - (a) parser unescape (T1f)
    - (b) `tile-layout-inlabel.ts#inLabelReservation` reserves N lines (T1f)
    - (c) `renderer.ts#renderEdgeLabelAligned` draws one `<text>` per line, 11 apart (jar lines 97.556 /
      108.556), first baseline `centeredFirstBaselineY(top + N*size/2, size, N)` (T1e)
    - (d) `layout/canvas-origin-text-ink.ts#extendForEdgeLabelText` extends maxY by `(N-1)*size`
      (outside every listed write-set)
- **Measured:**

  | state | vimena | zivocu | T1a `it.fails` passing |
  |---|---|---|---|
  | base | 415 | 180 | 0 |
  | (a) only | 282 | 189 | 1 (small-mixed; but drops label lines) |
  | (a)+(b)+(c)+(d) | 184 | 162 | 4 (small-mixed, small-2line, big-mixed, one-link) |
  | (a)-(d) + phantom fix `shapes-of.ts:367` (T1e) | 184 | 90 | 5 |

  - small-3line's last 2.722 px y was the phantom slot. With it fixed, small-3line ws 164 -> 10.
  - Fixture ws with all five changes: small-1line 1, small-mixed 1, small-2line 7, small-3line 10,
    big-mixed 5, one-link 69.
  - one-link's 69 is OneLink draw order (`line` vs `text` tag swaps) plus the label y 1.444. Both are
    pre-existing.
  - vimena's remaining 184 includes `**bold**` measured raw (T1a's note).
- The 5 `it.fails` are left as `it.fails`: none can flip without (c).
- **Recommended owner:** T1e lands (c), plus (d) if T1e owns ink, then applies (a)+(b) from the patch and
  converts the `it.fails` to `it`. Alternatively, the orchestrator widens a write-set for a follow-up
  T1f.

## Observations
## Observation: activity edge labels are single-line end to end
- **Context**: SWITCH-NL.
- **Finding**: `renderEdgeLabelAligned`, `extendForEdgeLabelText`, `inLabelReservation` and
  `compress/shapes-of.ts#edgeLabelShape` all measure and draw an edge label as one line. `-> a\nb;` is not
  unescaped either (`node-dispatch.ts#tryArrowLabel`), so the gap stays latent until a parser unescapes.
- **Impact**: any parser fix that puts a real `\n` into an edge label silently drops its later lines.
- **Confidence**: High
## Observation: a note after a closed switch was treated as flow
- **Context**: SWITCH-NOTE.
- **Finding**: `pushParsedNode` only redirected notes onto `if`. After `endswitch`, the note became a
  sibling and `tileNote` fell back to a floating `GtileNote`, because `gtile-switch` is not in
  `WRAP_SAFE_KINDS`. `while`, `repeat` and `group` still have no redirect.
- **Impact**: COMPOSITE-NOTE (lebile) needs the same parse-time treatment for `while` and `group`.
- **Confidence**: High (switch); Medium (while/group, not measured here)
