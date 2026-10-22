Measurement method: I copied src/ and the test harness into scratch and prototyped each mechanism there. Each mechanism has an env toggle (NO_INCL, NO_STAIRS, NO_SELFX, NO_NOTEMSG, NO_PAR, NO_VMERGE). I scored all 1128 non-error fixtures with compareSvg. With every toggle off, the copy reproduces final-classify.json exactly (0 mismatches, 419 zero).

- **All six on:** 419 → 478 zero-diff, 0 pinned rows lost, 0 rows rose. Diff count went from 59400 to 52531.
- **"Alone":** only that one mechanism switched on.
- **"LOO":** fixtures that stop going to zero when only that mechanism is switched off.
- **Upstream engine:** it is always teoz. `SequenceDiagram.java:311-312` returns `SequenceDiagramFileMakerTeoz` unconditionally, so the teoz tiles are the spec. The port's D4 premise (ast.ts:73-76, "the classic renderer reads neither `parallel` nor `anchor`") is false.

## One line per mechanism
ID | rows confirmed | rows to zero (alone / LOO) | upstream file:line | port file(s) to change | confidence

**NOTEMSG — note left/right on a message is stacked below the message instead of drawn beside it.**
103 measured rows have the feature (85 geometry, 18 structural); none is zero today | alone 15, LOO 24 (e.g. metano, lojore, paruvi (with STAIRS), gidibo, mizugi, zofini) | `teoz/TileBuilder.java:102-119`; `CommunicationTileNoteLeft.java:84-91,124-133,135-139`; same in `CommunicationTileNoteRight.java:97,139,144-147` and `CommunicationTileSelfNote{Left,Right}.java:87,128-133` | `sequence-layout-note.ts:184-212` (`handleNoteEvent`), plus `sequence-layout-message.ts` and `sequence-layout-exo.ts`, which must publish the message tile's top and height | HIGH
- Upstream draws the note at the message tile's top (gauge min). The wrapped tile's height is `max(messageTileH, noteH)`.
- The port lays the `onMessage` note out as a normal tile after the message: `cursor.y += noteH`.
- metano example: message tile top 47, height 27. Jar note box is at 47+5=52; port puts it at 47+27+5=79. Delta 27 (= message tile height), and the canvas is 27 taller.

**PAR — `&` parallel messages and notes are stacked instead of sharing one arrow line.**
57 rows with `&` messages plus 4 with `& note`; none is zero today | alone 15, LOO 24 (cazipo, mepaxe, telizo, keluvo, texopo, gekapu …) | `YGauge.java:124-145` (`createParallel`); `CommunicationTile.java:114-117`; `CommunicationTileSelf.java:87-90`; `NoteTile.java:94-97`; contact points `CommunicationTile.java:180-182`, `NoteTile.java:72-74` | `sequence-layout-events.ts:107-112,145-187` (tile chain), `ast.ts:73-76,105,187` (drop "stored, not drawn"), `sequence-layout-message.ts`, `sequence-layout-note.ts` | HIGH
- Upstream: the shared arrow line sits at `origin + max(cr_i)` (cr_i = each tile's contact offset from its top). Each tile's top = contact − its cr; the group's bottom = max over its tiles.
- The port ignores `parallel` and stacks the tiles.
- mepaxe example: the second arrow should share y=66; the port puts it at 66+27=93. Delta 27.
- Still not modelled: parallel groups, and LiveBoxes `isParallelWith` (`LiveBoxes.java:298,311`).

**STAIRS — activation bar ends: the +5 nudge, per-participant binding, and self-message steps.**
Activation-height rows (TeozTimeline_0003, donuli, gojuro, nanedo, nocilo, tukivo, taduka, paruvi …) | alone 7, LOO 17 | `LiveBoxes.java:79-86` (`addStep`: a deactivate landing on a y already recorded gets y+5); `LiveBoxes.java:284-336` (`getStairs` position / seenActivate / seenDeactivate / Note resets); `SequenceDiagram.java:367-404` (every life event binds to `lastEventWithDeactivate`, not just the first); `CommunicationTileSelf.java:113-126` (self step at p2.y for activate/destroy, p1.y for deactivate); `LifeEventTile.java:65-71` | `sequence-layout-life-event.ts:53-91`, `sequence-layout-activation.ts`, `sequence-layout-message.ts:470-495` | HIGH
- The port's zero-height fallback ("use cursor.y", life-event.ts:68-91) has no +5.
- The port gives a message's arrow y only to the first life event that follows it (`cursor.lastMessageY = undefined` at :64,75). nocilo's second `activate` therefore starts 8 low.
- nanedo example: jar bar runs from 66 (arrow y) to 74+5=79, height 13. The port gives height 8.
- Prior finding "zero-height step fallback": confirmed.

**SELFX — self-message loop and label are drawn from the shifted line start instead of the component origin.**
5 rows (gesiba, comelo, kilili, nofola, pixima) | alone 0, with STAIRS 11, LOO 5 | `ComponentRoseSelfArrow.java:91-93,121-123` (only the outgoing segment starts at `deltaX1`; `xRight` and the label sit on the component origin, `CommunicationTileSelf.java:136-153`) | `renderer-message.ts:84-101` (`xRight = origin + loopWidth`), `sequence-layout-message.ts:188` (`labelLeftOf`, self branch) | HIGH
- The port anchors `xRight` and the label at `fromX = base + deltaX1`.
- With levels 1→2: loop end and label sit 5 px left (kilili: 89.288 vs jar 94.288).
- The bar-start half of this cluster (jar y=106 vs port 93, i.e. +13 at p2) is in STAIRS.
- The "jar-verified" claim at sequence-layout-message.ts:396-398 is contradicted: gesiba still diffs.

**INCL — `->(N)` inclination is missing from tile height and from the activation step.**
6 rows | alone 5, LOO 5 (fenoli, jajobi, letagi, vativa, celego); sisele's residual is X | `ComponentRoseArrow.java:342-343` (height includes incl1+incl2); `:313-318` (start point at y+incl2, which is the activation step via `CommunicationTile.java:194-198`); reverse arrows use the reversed configuration (`CommunicationTile.java:158-159`) | `sequence-layout-message.ts:65,115-120` (use `reverseArrowConfiguration` when direction is `'left'`), activation step y | HIGH
- letagi example: tile is 27+60; every later y is +60 (jar viewBox height 331 vs port 151).

**VMERGE — `/ note` is not merged into the previous note's row.**
8 rows | alone 1 (mozofa), LOO 2 | `SequenceDiagram.java:226-241` (`addNote` tryMerge → `Notes`); `NotesTile.java:124-137,192-197` (same top for all notes, height = max) | `sequence-layout-note.ts` (`ast.vmerge` is parsed, never read) | HIGH
- mozofa example: the second note should share y=79; the port puts it at 112. Delta 33 (= note tile height).

**RESPONSE-BELOW — unconfirmed, not prototyped.**
pukebe (and any `ResponseMessageBelowArrow` fixture) | — | `ComponentRoseArrow.java:330-332` (`isBelowForResponse` → yPoint = paddingY) is the suspected cause | `sequence-layout-message.ts:115` | LOW
- Delta 15 at the arrow line. I have not read the port side.

**DIVIDER binding (prior finding, `SequenceDiagram.java:265-275`).**
- No fixture surfaced. Not measured.

**`Math.max(createY, position)` (prior finding, `LiveBoxes.java:330`).**
- Not isolated by any prototype. Unconfirmed.

**Extra level-2 bar after `++ ++ destroy` (prior finding).**
- Not reproduced in this family. Unconfirmed.

## Polygon / path keys
- Polygons: 1137 of 1154 differing polygons are pure translations of the jar's polygon (downstream displacement). Only 15 fixtures have a real polygon shape change.
- Paths: 54 fixtures have a path shape change (mostly widths, i.e. the X family).
- All six on, over all 1128 rows: polygon diffs 9696 → 8457, fixtures with polygon diffs 389 → 323 (66 cleared). Path diffs 7448 → 5566, fixtures 242 → 195 (47 cleared). Y-axis diffs 12917 → 9155.
- Most of the cleared polygon rows are downstream of NOTEMSG or PAR.
- The per-mechanism-alone polygon split failed: my env-toggle runs came back identical. Only the all-off vs all-on totals above are valid.

## Unexplained remainder
- Y-only rows not cleared by the six mechanisms: camuxi-33, xinope-25, xucibo-16 (delay/space), pukebe-27 (RESPONSE-BELOW).
- Of the 235 XY rows, about 116 fell but are not zero. Their residuals are mostly X (participant/note widths, canvas width — gesiba width 92 vs 126) and are outside this family.
- 13 error rows were excluded.

## Pinned-row exposure
- 0 of 419 pinned rows lost in every run: each mechanism alone, all combined, and each leave-one-out. No row rose in any run except one leave-one-out run.
- That run is the combination without NOTEMSG: 3 non-zero rows rose there. So land NOTEMSG and PAR together, or re-measure after landing either one alone.
- Real risk: the STAIRS rewrite replaces the port's consume-once `cursor.lastMessageY` model. Re-run the all-engine survey after it lands.

## Ranked by rows-to-zero (leave-one-out, with alone in parentheses)
1. NOTEMSG 24 (15)
2. PAR 24 (15)
3. STAIRS 17 (7)
4. INCL 5 (5)
5. SELFX 5 (0 alone; 11 together with STAIRS)
6. VMERGE 2 (1)

## Scratch patches for an implementer
These are prototype quality: WeakMap side-state, no types, a generic y-shifter in PAR.
- /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/m_all.patch — all six combined, conflicts resolved. The `NO_*` toggles were added afterwards and are only in the working copy at /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/proto, not in the patch.
- /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/m_notemsg.patch
- /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/m_par.patch
- /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/m_stairs_selfx.patch — includes the new file proto-stairs.ts. m_stairs.patch is missing that file, so use this one or copy /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/proto-stairs.ts.
- /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/m_selfx.patch
- /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/m_incl.patch
- /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/m_vmerge.patch

Measurement harness: /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/proto/measure.mts and /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/cmp.py. Base counts are in /private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-c/base.json.

No repo files were touched.