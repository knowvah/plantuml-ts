# Batch 3 — drive round + D9 sweep (written at the b2 close, 2026-10-07)

b2: 381 pinned; remaining baseline rows listed per task with ws at b2. Rules:
[../common-rules.md](../common-rules.md); worktrees via `measurements/mkwt.sh`;
same merge routine as batch 2 (stop 17, re-pin after pre-copy, D6, pin zero
rows, routing/refusal +N by derivation). Close `b3`. One wave, disjoint
write-sets.

| ID | Scope (rows, ws at b2) | Writes | Done |
|---|---|---|---|
| T3-gates | **D9 sweep** — retire `isActionSheetEligible` and every other staging gate/legacy fallback in the action/note text path: route non-LEFT alignment through the Sheet; draw creole `----`/`====` separators through the stencil structure upstream uses (`SheetBlock2` + `UGraphicStencil`, `FtileBox.java`/`FtileWithNotes.java:122-130` — upstream has NO `UHorizontalLine` SVG driver, see journal row 14); thread `[[url]]` hyperlink colour/underline (`skinparam HyperlinkColor`, `FromSkinparamToStyle.java:135`; `SkinParam#getHyperlinkColor`) into the activity ISkinSimple. Families on the same files: ACTION-TAB zejuso, CREOLE-TABLE letuke, ACTION-SHEET-CENTER fikuki / mufixi, SLURL nesozi, zocifu (HyperlinkColor), `""monospace""` font-family (zivocu) | `activity-creole-sheet.ts`, `activity-renderer-text.ts`, `tiles/gtile-action.ts`, named core klimt/svg/skinparam files (rule 11 survey) | [ ] |
| T3a | R2 + label slots — edge labels positioned on the RAW worm then translated through compression (`Snake.java:254-256`; `UGraphicCompressOnXorY.java:87-118`; `CompressionXorYBuilder.java:72-75`): SWITCH-INLABEL momala, sokomu, jazedo, xaxene, ruzazu, meguta, boxefe; HEX-LABEL-SLOT pekefu | `renderer.ts`, `layout/compress/**` | [ ] |
| T3b | core-seam rows — vimena (case labels `CreoleMode.SIMPLE_LINE`, `Branch.java:255-256`, `CommandCreoleBuilder.java:85-86`: mode option on core `creoleTextLines`), lisade ACT-SCALE (`ScaleWidth.java`; post-chrome scale in core `assemble-svg-activity.ts#finalizeActivityFragment`, `TextBlockExporter.java:160-166`), THEME-MARGIN with chrome (`layout/document-margin.ts#applyActivityChrome` from `src/index.ts`) | `src/core/svek/image/creole-text-lines.ts`, `tiles/gtile-switch.ts` (measure), core `assemble-svg-activity.ts`, `dispatch-common-commands.ts`, `dispatch-support.ts` (scale only), `ast.ts`/`parser.ts` (scale field), `src/index.ts` + harness (together), `layout/document-margin.ts` (rule 11 survey) | [ ] |
| T3c | composite + ink — lebile (`FtileGroup#getInnerDimensionSlow`, `FtileGroup.java:176-182`; T2g bisect: frame = orig + 6 around a while), bigide HRULE-INK, cemipu (SVG-ZERO-STROKE + 0.001), lane fudge for package/card in `swimlane-context.ts#measureLaneExtents` | `tiles/gtile-group.ts`, `layout/tile-layout-structural.ts`, `layout/canvas-origin*.ts`, `layout/swimlane-context.ts`, `svg-shapes.ts` | [ ] |
| T3d | leaves — PADDING fukika / zivege (`skinparam padding` moves note and diamond-label x), labala `!theme amiga` start/stop colours (`puml-theme-amiga.puml:34,38`), tobajo monochrome note fill (`ColorMapper.java:80-83`), GOTO-LINES gunuki / nuvumi | `activity-renderer-shapes.ts`, `activity-renderer-terminals.ts`, `activity-renderer-note-shapes.ts`, `tiles/gtile-note*.ts`, `tiles/gtile-diamond-inside.ts`, `tiles/gtile-goto.ts`, `tiles/gtile-label.ts` | [ ] |

## Open -> add5 (no task)
EMBED gufuma / pufuzi (D4 oracle seam; mufixi's EMBED part); bozido (wbs/salt/gantt
nested engines unported); jucidi (jar omits ConnectionLastElseIn across lanes,
`ConnectionCross.java:49-64` — needs a user ruling, journal row 20).
