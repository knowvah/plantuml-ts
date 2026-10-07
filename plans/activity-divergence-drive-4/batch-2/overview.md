# Batch 2 — census families (written at the b1 close, 2026-10-07)

b1: 85 baseline rows Σ 8130, old-48 Σ 2429, 327 pinned. Families from
`measurements/census-{a,b}.md` re-scored at `b1.json` (verify every census
claim — census-b's switch label-height lead was wrong, row 9). Rules:
[../common-rules.md](../common-rules.md). Worktrees via `measurements/mkwt.sh`.
Each merge: stop-17 gate, re-pin into the goldens after a pre-copy, D6
`census-away.py`, pin zero rows, routing/refusal +N by derivation. Close `b2`.

## Wave 1 (parallel, write-sets disjoint)

| ID | Family (rows, ws at b1) | Writes | Done |
|---|---|---|---|
| T2a | VIF-ORDER + VIF-INLABEL: gelixa 621, fuleno 619, gexuko 544, meguta 373, gafuxi 306, bejeta 286, divinu 274, xovigi (VIF part). Node+connection draw order (`FtileIfLongVertical.java:492-502,172-203`), else label CENTER (`:319-320`, landed), inlabel west margin + ConnectionVertical label (`:141,153-157,164,182-189`). Census sandbox −2791 | `layout/walk-if-long-vertical.ts`, `tiles/gtile-if-long-vertical.ts`, `layout/conditional-builder-long.ts`, tests, `tests/fixtures/activity/add4-T2a/**` | [ ] |
| T2b | PARTITION: somome 152 (GROUP-USYMBOL, `CommandPartition3.java:72-104` BACK1/BACK2/STEREO), tetako 34 + kilavo 19 (PART-COLOR), zocifu 34 (PART-TITLE-CREOLE), mudobi 64 + dulusu 42 + sifite 18 (FRAME-TITLE-SLOT — must land with PART-COLOR/PART-TITLE-CREOLE, census), popome 4 + zoxazu 4 (PARTITION-LINECOLOR), mabove 53 (PARTITION-SKINPARAM) | `group-dispatch.ts`, `dispatch-support.ts` (partition regex only), `tiles/gtile-group.ts`, `tiles/gtile-partition.ts`, `activity-renderer-composite.ts`, `layout/tile-coordinates-group.ts`, `layout/compress/shapes-of*.ts`, `activity-style-defaults.ts`, named core skinparam tables (rule 11 survey) | [ ] |
| T2c | NOTES: razuzu 158 (NOTE-SWIMLANE: floating note attaches to the preceding instruction with its own lane, `InstructionList.java:190-195`, `Swimlanes.java:342`), kavoro 37 (note margin box counts toward lane width, `FtileWithNotes.java:134`), japeku 18 + cofubo 17 (FLOATING-NOTE), giteso 3 / sojono 2 residuals | `note-dispatch.ts`, `node-dispatch.ts` (note branches), `layout/tile-layout-structural.ts`, `layout/walk-with-notes.ts`, `tiles/gtile-note*.ts`, `tiles/gtile-with-notes.ts`, `layout/swimlane-placement.ts`, `layout/swimlane-context.ts` | [ ] |
| T2d | SMALL LEAVES: TOPDOWN-OUTY cokoja/jusama/dabulu/jageti (+giteso exit y; `FtileGeometryMerger.java:49-50`, `tiles/gtile-top-down.ts:87-89`), CONDSTYLE-EMPTY xefalo 289 (`vertical/FtileDiamond.java`, `tiles/gtile-diamond-empty.ts`), KLIMT-FLOOR loxija/zepima, HEX-LABEL-SLOT pekefu 8 if not in shapes-of (else report), SWITCH-GEOM merge hexagon (`FtileFactoryDelegatorSwitch.java:151-160`: mazoka 20, lipiki 1, …) | `tiles/gtile-top-down.ts`, `tiles/gtile-diamond-empty.ts`, `tiles/gtile-switch*.ts`, `layout/walk-switch.ts`, `activity-text-style.ts`, `activity-renderer-shapes.ts`, `activity-renderer-if-shapes.ts`, tests | [ ] |
| T2e | CHROME: WARN-BANNER tozecu 562 / fukika 150 / zivege 140 (`CommandSkinParam.java:96-99`; reuse `src/core/annotations/WarningBannerBlock.ts`; the partition/close-group emitters `CommandPartition3.java:157`, `CommandCloseGroupLegacy3.java:75` are T2b's files — expose the channel, report the two call sites), THEME-MARGIN labala 120 (core `calculateMargin`, `TextBlockExporter.java:510-516`), ACT-SCALE lisade 66, EMPH-STROKE xovano 2 (`Worm.java:126-139,177-181`) | `src/diagrams/activity/index.ts` + `tests/oracle/svg-conformance/render-fixture-activity.ts` (together; harness-parity), `dispatch-common-commands.ts`, `activity-layout-constants.ts`, `renderer.ts`, `layout/canvas-origin*.ts` (canvas-origin.ts is at 500 lines: split first), named core files (rule 11 survey) | [ ] |

## Wave 2 (after wave 1 merges)

| ID | Family | Writes | Done |
|---|---|---|---|
| T2f | LANE: tobajo 380 (FORK-XLANE, `ParallelBuilderFork.java:81-99`), taredi 328 (SWIMLANE-GATE), bizeti 158 (PART-IN-FORK), cakeca 123 (LANE-INK, 10 vs 19.538 split gap), gesogi 76 (LANE-RESERVATION), SWIM-LABEL pubeza/bubefi/podobi/famiki 138, nikivo 2 | `tiles/gtile-fork.ts`, `layout/walk-fork-branches.ts`, `layout/swimlane-*.ts`, `layout/assign-coordinates-full.ts`, reservation producers | [ ] |
| T2g | lebile 223 (COMPOSITE-NOTE, `InstructionGroup.java:102-106,125-131`, `InstructionWhile.java:126-127,162-167`) + wiring T2e's warning channel into the partition/close-group emitters | `group-dispatch.ts`, `layout/tile-layout-structural.ts`, `node-dispatch.ts` | [ ] |

## Deferred to batch 3 (with the D9 sweep, same files)
ACTION-TAB zejuso 148, CREOLE-TABLE letuke 138, ACTION-SHEET-CENTER fikuki 87,
GOTO-LINES gunuki/nuvumi 28, SLURL nesozi 20, R2 label-on-raw-points
(`renderer.ts#renderEdgeLabelAligned`), SWITCH-INLABEL residuals momala 49 / sokomu 47.

## Open -> add5 (no task)
EMBED mufixi 236, gufuma/pufuzi 58 (D4 oracle seam); bozido 80 (wbs/salt/gantt
nested engines unported); jucidi 31 (jar omits ConnectionLastElseIn across lanes,
`ConnectionCross.java:49-64` — needs a user ruling, journal row 20).
