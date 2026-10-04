# Batch 3 — drive round on the b2 cohort (D5)

Written at the b2 close from `measurements/b3-cohort-a.md` (73 rows, ws <= 10)
and `measurements/b3-cohort-b.md` (109 rows, ws 11-150): every cohort row has a
named family + Java mechanism (journal row 36). Two waves; write-sets disjoint
within a wave. Paths under `src/diagrams/activity/` unless shown. Rules for every
task: [../batch-1p/common.md](../batch-1p/common.md) plus: no Serena (read or
write), no `git stash` in any form, no raw `&` background jobs, worktree-absolute
paths, report to `.agent-notes/<ID>.md`. Close per
[close-procedure.md](../close-procedure.md) (`b3`).

| ID | Families (census) | Writes | Wave | Done |
|---|---|---|---|---|
| [T3a](T3a-edge-canvas.md) | C/EMMID emphasize arrow, A/H1 height, B/ORD line order, P, Q, E chrome x | `layout/{canvas-origin,assign-coordinates-full}.ts`, `layout/compress/compress-geometry.ts`, `activity-geometry.types.ts`, `renderer.ts`, `activity-renderer-terminals.ts` | 1 | [x] |
| [T3b](T3b-loops.md) | WORD, EMPHB, WSPEC, RNOOUT, BACKLBL | `layout/{walk-while-branch,walk-while-backward,walk-repeat,walk-repeat-backward,walk-repeat-weldings,walk-repeat-back-shapes,tile-layout,tile-layout-backward,tile-layout-structural}.ts`, `tiles/{gtile-while,gtile-repeat}.ts`, `{node-dispatch,list-backward-dispatch,ast}.ts` | 1 | [x] |
| [T3c](T3c-parallel-compress-x.md) | PARX, S, lapura, gevaxi, bazuma | `layout/compress/{shapes-of,slot*}.ts` (+ other `compress/**` except `compress-geometry.ts`), `layout/walk-fork-branches.ts`, `tiles/{gtile-fork,gtile-split,gtile-merge}.ts` | 1 | [x] |
| [T3d](T3d-if-shapes.md) | IFNL, MLJOIN, CSTYLE, T2G zaloze, IFDS, vimako, I, D, J/kafevi, PAINT/dakesa, L | `{if-dispatch,parser}.ts`, `layout/{conditional-builder,walk-if-down,walk-if-with-links,walk-if-long-horizontal,walk-if-long-vertical}.ts`, `tiles/{gtile-if-down,gtile-if-with-links,gtile-if-long-horizontal,gtile-diamond*}.ts`, `activity-renderer-{if-shapes,shapes,bars}.ts`, `activity-style-defaults*.ts` | 1 | [x] |
| [T3e](T3e-core-style.md) | G preserveAspectRatio, F hyperlink fields, K FontName, DARK, H numbered-list floor (if not klimt) | `src/core/{theme*,skinparam-*}.ts`, `src/core/svg.ts`, `src/core/dispatcher.ts`, `activity-{text-style,renderer-text}.ts` | 1 | [x] |
| [T3f](T3f-cross-lane-swimlanes.md) | XLANE, O lane colour, M title stroke, SLURL, ELSEIFIN, N end-fork label | `layout/{swimlane-*,walk-if-*,walk-repeat-backward}.ts`, `activity-renderer-swimlanes.ts`, `{dispatch-support,parallel-dispatch,if-dispatch,ast}.ts`, `activity-renderer-bars.ts` | 2 | [x] |
| [T3g](T3g-note-partition.md) | NOTE wrapper (Opale), PART partition tab | `layout/{tile-layout*,tile-coordinates}.ts`, `tiles/{gtile-top-down,gtile-note,gtile-group,gtile-partition}.ts`, `layout/compress/**`, `activity-renderer-shapes.ts` | 2 | [x] |
| [T3h](T3h-style-wiring.md) | F/K/DARK consumers, PAINT, CSTYLE (if rows) | `activity-renderer-shapes.ts` (not renderComposite), `activity-renderer-if-shapes.ts`, `activity-style-defaults*.ts`, core theme/skinparam, `conditional-builder.ts`, if/diamond tiles | 2 | [x] |
| b3w1 | interim pin round after wave 1 (journal row 43) | orchestrator | — | [x] |
| [T3i](T3i-leftovers.md) | wave-3 leftovers (ELSEIFIN, BACKLBL, CSTYLE repeat/links, xabesu, N, O, levuma) | `src/diagrams/activity/**` | 3 | [ ] |
| T3-close | b3, all-engine diff, re-pins, pin round 2 | per close-procedure | — | [ ] |

open -> add3 (not in batch 3): GLYPH `UCenteredCharacter` path outline
(`DriverCenteredCharacterSvg.java:57-81`) lives in `src/core/klimt/**` (stop 8);
EMBED `{{ }}` (T2g, genuinely large + separable); STRIPE creole stripes in action
labels (`CreoleStripeSimpleParser.java:92-116`) unless a wave-2 task has capacity.
UNK rows (lapura + 9 in cohort-b) are re-measured after wave 1.
