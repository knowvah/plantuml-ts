## WIDTH family: structured result

**Instrument.** The scratch predictor is `/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/22654321-fb13-42ce-aa81-e8c390d76578/scratchpad/research-b/predict2.mts`. It takes the port's own `layoutSequence` geometry and recomputes the canvas width the upstream way. That means `PlayingSpace` max over each tile's `getMaxX`, plus `posD`, plus `posC2`; then +10 (`SequenceDiagramFileMakerTeoz.java:157`), +10 margins (`TextBlockExporter.java:199-203`), and `(int)(w+1)` (`SvgGraphics.java:129-135`). The port's label loop is left out.

The predictor was run over every row whose diff includes `svg/@width` (457 rows). Outputs are in the same directory: `widths.json`, `predict2b.json`, `selfgap.json`, and `zero/predict2.json` for the 419 pinned rows.

A row counts as **confirmed** when the predicted width equals the jar's width exactly and every lifeline x is identical between ours and the jar.

### M1: self-message reservation is not in the document width
| field | value |
|---|---|
| rows | 25 confirmed (all ours < jar) |
| examples | cexeju-49, bajocu-67, buximi-21, jobadi-87, pidici-36 |
| delta | −3 … −28 px |
| upstream | `teoz/CommunicationTileSelf.java:272-277`: `getMaxX = posC2 + getCompWidth()`. `skin/rose/ComponentRoseSelfArrow.java:326-328`: compWidth = `max(getTextWidth, arrowWidth+5=50)`, where textWidth = pure + 7 + 7 (`AbstractComponentRoseArrow.java:62`). `PlayingSpace.java:93-96` folds every tile's `getMaxX` into `max` |
| port | `src/diagrams/sequence/layout.ts:377-386`: the label loop's self branch uses `midX = fromX + 20`, plus `labelWidth/2 + 10` |
| mechanism | Upstream does `posC2 + max(text+14, 50)`. The port does a centred label guess, which falls short whenever the self message is on the last participant. Example, cexeju (`Bob -> Bob : hello`), jar: posC = 19.469, comp = max(27.544+14, 50) = 50, maxX = 69.469, +10+10 = 89.469, (int)(90.469) = **90**. Port: posD term 58.94, so the label term sets **75** |
| rows-to-zero | 15 (cluster A: bajocu, buximi, cexeju, jobadi, komibe, maxuzu, mobeji, noneda, pidici, rofate, rutipe, vataru, vujezi, xunolu, zoluna) |
| write-set | `layout.ts` (`computeTotalWidth`); `geo-message.ts` + `sequence-layout-message.ts` if compWidth / maxX is stored on `MessageGeo` |

### M2: the label loop over-widens (it has no upstream counterpart)
| field | value |
|---|---|
| rows | 10 confirmed (ours > jar) |
| examples | fuliko-66, gejoko-46, gutate-63, mobobu-53, sixifa-33, jacide-26, suleta-28 |
| delta | +7 … +49 px |
| upstream | `teoz/CommunicationTile.java:453-460`: `getMaxX = max(rightPoint, leftPoint + compWidth)`. `addConstraints` (`:404-427`) has already pushed rightPoint ≥ leftPoint + width, so a normal label never sets the canvas. `PlayingSpace.java:75-104` has no label term |
| port | `layout.ts:377-386` (`midX + labelWidth/2 + RIGHT_MARGIN`) |
| mechanism | Upstream takes the right participant's posC (≤ posD). The port centres the label at midX, and for a multi-line label it measures the whole label (gejoko: +49). Example, fuliko: jar = (int)(141.425+11) = **152**; ours **159** comes from the label loop |
| rows-to-zero | 5 (fuliko, gejoko, gutate, mobobu, sixifa) |
| write-set | `layout.ts` (delete the loop; `sequenceLabelLineWidth`/`fontSpecOf` imports may become dead) |

### M3: a group frame's `getMaxX` (+9) is not in the document width
| field | value |
|---|---|
| rows | 17 rows where the frame geometry is already right but the width is wrong (16 from the model, plus zujani-47 checked with predictor v1) |
| examples | cujoci-19, ducodo-45, fujodi-29, kizuga-51, lenamo-57, makatu-16, nubute-95, pixopo-04, zujani-47 |
| delta | −3 … −14 px |
| upstream | `teoz/GroupingTile.java:988-990`: `getMaxX = max + EXTERNAL_MARGINX2(9) + right-notes`. Frame max = child drawnMaxX + MARGINX 16 (`:211-214`). `PlayingSpace.java:93-96` |
| port | `computeTotalWidth` (`layout.ts:366-393`) has terms for ref, note, divider, delay and exo, but none for group frames. `minEventX` (`layout.ts:257`) does model the left side (−3) |
| mechanism | Upstream extends the canvas to frame right edge + 9, which is lifeline + 25. The port stops at the participant's posD. Example, cujoci: frame right = 16.225 + 83.694 = 99.919; +9 = 108.919; +11 → **119**. Port: posD 103.388 + 11 → **114** |
| rows-to-zero | 9 (the cluster-A rows listed) |
| write-set | `layout.ts` (`computeTotalWidth`) |

### M4: frame extent is not ported (children ±16, header + 16, else tiles)
| field | value |
|---|---|
| rows | 35 confirmed (frame-driven width matches and frame x/width match the jar; ours differs). It also explains the nested-frame cluster X1 (29 rows, all have groups, 19 nested), which is not confirmed by the model because the lifelines differ |
| examples | bujuma-55, cabeve-16, fasafe-10, jaxige-32, xupozu-13 (header); badoba-13, rozove-84, zexili-92 (header + else); xovuse-55 (else label); selave-46 (`LifeEventTile` +5); bovugo-63 (self drawnWidth 42); dofefe-55 (frame spans only its children) |
| delta | −5 … −322 px |
| upstream | `teoz/GroupingTile.java:207-225`: min2/max2 = each child's `getDrawnMinX−16` / `getDrawnMaxX+16`; `max2.add(anElse.getMaxX())`; `max2.add(min + headerWidth + 16)`. `teoz/ElseTile.java:153-161`: `parent.getMinX() + elseWidth`. `ComponentRoseGroupingHeader.java:108-119`: textWidth (+15+30) + oldPaddingX1 + comment. `ComponentRoseGroupingElse.java:124-126`: text + 5 + 5. `LifeEventTile.java:151-158`: posC + level·5. `CommunicationTileSelf.java:303-312` with `ComponentRoseSelfArrow.java:348-352`: drawn = max(42, 7 + text) |
| port | `src/diagrams/sequence/sequence-layout-frame.ts:163-182`: `participantCenterXBounds(ctx.participantMap)` over ALL participants ±16, and notes only. No header, else or tile terms. Resolved before the branch walk (D2) |
| mechanism | Upstream bounds the frame by its own child tiles, the header and the else labels. The port bounds it by every lifeline in the diagram. Example, badoba: header = (13.731+45) + (15+57.406) = 131.137; width = 147.137; right = 168.743 + 9 = 177.743; +10+10 → (int)(188.74) = **188**. Port: frame 103.044 and canvas **144** |
| rows-to-zero | 22 (cluster B minus rexine = 15, and cluster C = 7). This needs M3 as well; M4 alone zeroes none of them |
| write-set | `sequence-layout-frame.ts` (compute x/width after `walkBranches`, then backfill `FrameGeo`, `ElseGeo.x/width` and `tabRuns`); `layout.ts` |

### M5: `posC2` (activation depth) is not in the document width
| field | value |
|---|---|
| rows | 2 confirmed |
| examples | rexine-04, rugoro-74 |
| delta | −22 px (rexine) |
| upstream | `teoz/PlayingSpace.java:98-101` adds each LivingSpace's `getPosD` and `getPosC2`. `LivingSpace.java:235-238`: posC2 = posC + `LiveBoxes.getMaxPosition` (`LiveBoxes.java:367-372`: width/2 × maxLevel) |
| port | `layout.ts:372-375`: only `lastParticipant.x + width` |
| mechanism | rexine, jar: 178.95 + 11 → **189**. Port: 156.175 + 11 → **167** |
| rows-to-zero | 1 (rexine; its `g/rect/@width` diff is the background rect) |
| write-set | `layout.ts` |

### M6: the self message's spacing constraint is not ported (x axis)
| field | value |
|---|---|
| rows | 24 confirmed by an exact gap: jar posC(i) = jar posC2(i−1) + max(text+14, 50) to within 0.01 |
| examples | botoku-28, moxazi-74, sazaxe-79, socode-71, tetemo-66, tulece-76, Sequence-delay-destroy-newpage-style |
| delta | 21 … 117 px at the first diverging lifeline |
| upstream | `teoz/CommunicationTileSelf.java:166-184`: `next.getPosC().ensureBiggerThan(getMaxX())` (`:180`); the reverse case is at `:170-176` |
| port | `src/diagrams/sequence/sequence-layout-participants.ts:170`: `ev.from !== ev.to` skips every self message |
| mechanism | botoku: jar P2 posC = 78.862 + (251.144 + 14) = 344.006. Port: 226.587 |
| rows-to-zero | Likely 6 (cluster X3: all 6 rows are selfFwd and the diffs are x-only). **Unverified**: needs M1 too, and was not simulated |
| write-set | `sequence-layout-participants.ts` (a centre-to-centre span using the participant's global max level) |

### M7: reverse self message (`A <- A`) not ported
| field | value |
|---|---|
| rows | 9 width rows contain one: SequenceArrows_0002_Test, dipazo-97, keloje-58, kevaru-04, kumogu-10, sufevi-44, tapije-66, tifexe-26, tovese-18 |
| upstream | `CommunicationTileSelf.java:263-277` (min = posC − comp, max = posC2); `ComponentRoseSelfArrow` `drawLeftSide` |
| port | `src/diagrams/sequence/sequence-layout-message.ts:400-405` states it is not ported (`reverseDefine` is not recorded on self messages). kumogu draws the loop at x 83.9; the jar draws it at 41.9 |
| rows-to-zero | **Unconfirmed**. This is a geometry defect, not only a width defect. The port comment points to DIVERGENCES.md, but no library forces it, so under CLAUDE.md it is a bug |
| write-set | `command-arrow.ts`, `sequence-layout-message.ts`, `geo-message.ts`, `renderer-message.ts`, `sequence-layout-participants.ts` |

### Unconfirmed remainder (the model does not reproduce the jar)
- **Different first lifeline (160 rows; ours is usually left of the jar).** Features: group 74, box 56, note 44, exo 31, participant shapes 19, `ParticipantPadding` 9. A sample of `box` rows (bofovo, fugilu, cinula, demeli) points to Dolls/box englober extents (`Dolls.getMinX/getMaxX`, `PlayingSpace.java:81-84`). Not measured. Ruled out: M1–M5 alone.
- **Lifeline difference after the first, with no self gap (94 rows), and self present but gap not matching (10 rows).** Not diagnosed.
- **Lifeline count differs between ours and the jar (37 rows).** Not diagnosed.
- **Lifelines match but the model misses (44 rows).** 28 have notes; the note x placement differs (cetale, lezonu, xatotu), which belongs to the note family. Also 13 create, 6 divider, 2 exo; a ref margin the model approximates is a possible cause. Not diagnosed.

### Teoz vs puma
- **Jar (1.2026.8beta1, pin 97a5992):** teoz for every diagram. `SequenceDiagram.java:311-314` returns `SequenceDiagramFileMakerTeoz` unconditionally; the `if (modeTeoz())` guard and the Puma2 return are commented out. This has been the case since commit d087fc0c (2026-07-09), which is an ancestor of the pin. `modeTeoz()` (`:317-319`) is `GlobalConfig.FORCE_TEOZ || pragma`, and `FORCE_TEOZ` is `static final true` (`cli/GlobalConfig.java:46`). So `getDefaultMargins` (`SequenceDiagram.java:~629-633`) is always `same(5)`. **`!pragma teoz true` changes nothing in the jar.** The `graphic/` (puma) classes are compiled into the jar but never dispatched.
- **Port:** teoz semantics only, with no pragma branch. `src/core/document-margin.ts:62` sets `SEQUENCE_DOCUMENT_MARGIN = same(5)` for every sequence; `sequence-layout-participants.ts:54` sets `LEFT_MARGIN = 10`. This matches the jar.
- The 97 width rows that carry `!pragma teoz true` need no separate treatment.

### Risk to the 419 pinned rows
The full model (M1 + M3 + M4 + M5, label loop deleted) predicts the jar width exactly on 377 of 419 pinned rows. The 42 misses are all terms the scratch model leaves out: 34 chrome/scale, 4 ref-margin approximation, 3 exo, 1 delay. **None of them needs the label loop.** Only 7 pinned rows contain a self message, and in none of them does it set the width. Only 1 pinned row has a group frame. Expected risk is low. M6 must be non-binding on those 7 pinned rows, because they are byte-exact against a jar that applies the constraint.

### Ranked by rows-to-zero (near-zero clusters: 29 + 16 + 7 = 52 rows, all accounted for)
1. **M3 + M4 (frame):** 31 together (9 need M3 alone; 22 need both). 51 rows have a confirmed frame-driven width.
2. **M1 (self reservation in width):** 15. 25 confirmed.
3. **M2 (delete the label loop):** 5. 10 confirmed.
4. **M6 (self spacing constraint):** about 6, unverified. 24 confirmed.
5. **M5 (posC2):** 1. 2 confirmed.
6. **M7 (reverse self):** unconfirmed. 9 rows contain it.

Check: 15 + 5 + 9 + 22 + 1 = 52.

### Observations for `.agent-notes` (for the orchestrator to write)
- Since 2026-07, the jar and upstream HEAD always render sequence diagrams with teoz. The pragma is inert.
- `computeFrameBody` uses every lifeline in the diagram, not the frame's child tiles. That one mechanism accounts for most group-frame x/width diffs.
- A scratch "upstream-width predictor" built over port geometry reproduced 377 of 419 pinned widths with no label loop. It is a reusable instrument for this family.
