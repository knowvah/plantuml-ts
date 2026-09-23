# cdd-T35 — canvas `minDim` off by 1-9px (edge-label margin ink)

Status: **executed**, ready for review (branch `cdd/t35`, worktree
`.claude/worktrees/cdd-t35`, based on `e7a96725`). Full decision-journal
diagnosis artifact + fix summary + residual table: `plans/
class-divergence-drive/decision-journal.md` rows 214-217.

## Confirmed mechanism

`class-ink-box.ts#addEdgeTextInk` (G9/T16) modeled only the edge label's
own glyph ink (`LimitFinder#drawText`). It never modeled a SECOND,
independent ink source the SAME label draws: `SvekEdge
#addVisibilityModifier`'s closing `TextBlockUtils.withMargin(block,
marginLabel, marginLabel)` (`svek/SvekEdge.java:372-373`, `marginLabel
= startUid.equalsId(endUid) ? 6 : 1`) wraps the label in a
`TextBlockMarged`, whose `drawU` (`klimt/shape/TextBlockMarged.java
:76-84`) draws an invisible `UEmpty` sized to the MARGINED block —
`LimitFinder#drawEmpty` (`klimt/drawing/LimitFinder.java:159-162`)
walks it with no inset, reaching `marginLabel` px further on X than the
glyph alone.

`class-layout-edge-labels.ts#withLabelMargin` already modeled this EXACT
margin for the label's GRAPHVIZ LAYOUT box size (so the label's own
drawn POSITION already matched jar to sub-0.01px) — nothing fed the
SAME margin into the document's own ink walk. Confirmed via a
debug-instrumented local oracle build (`~/git/plantuml`, `dot-output`
branch, temporary `CDD_T35_TRACE` env-gated `System.err` prints in
`LimitFinder.java`/`SvekResult.java`/`TextBlockExporter.java`/
`SvgGraphics.java` — added, used, then REVERTED; nothing committed to
that repo) against `camupi-97-gezi072`.

## Fix

`class-ink-box.ts` adds `addEdgeLabelMarginInk`, called once per edge
(after the existing `addEdgeTextInk` loop). `class-layout-edge-labels.ts`
exports its pre-existing `SELF_LINK_LABEL_MARGIN`/`LINK_LABEL_MARGIN`/
`labelMarginOf` (previously module-private) for reuse rather than
re-declaring the same jar constant a second time.

**Write-set deviation, flagged for review**: the fix landed in
`class-ink-box.ts`/`class-layout-edge-labels.ts`, not
`layout-ink-extent.ts` itself, per the brief's own "stop 1 if outside
this file" clause — `layout-ink-extent.ts` no longer contains the
ink-walk logic at all (`class-ink-box.ts`'s own header: "Split out of
`layout-ink-extent.ts` (line cap)"), so there was no version of this fix
that could stay inside the literal write-set. Proceeded rather than
block, since the read-set already names `class-ink-box.ts`'s sibling
`renderer-arrowhead.ts` as in-scope. Not reverted; the orchestrator
should confirm this is acceptable or file a file-move follow-up.

## Measurements

- 9 of the 13 named pure cases now conformant with zero other diffs:
  `camupi-97-gezi072`, `kexaca-03-situ523`, `siteza-47-lixe343`,
  `tamixa-86-jiku308`, `tebore-53-tese080`, `tenomi-61-ceta987`,
  `ticuxa-26-tixo262`, `tilipa-86-suxi130`, `vafaka-92-xose973`.
- `lacote-58-sozu269` (self-loop, `class -> class`) also conformant —
  independently proves the `marginLabel=6` self-loop branch.
- 3 BONUS fixtures the named list didn't enumerate, found via full-corpus
  `render-all.mts`/`pin-diff.mts` (723 fixtures, zero regressions
  anywhere): `gikipi-69-pepo172`, `kutazo-40-texe886`,
  `tedeba-19-lisi250`.
- `dot-sync-report.ts class` unchanged 711/712 (ink never touches DOT).

## Residuals (named, not folded into this fix)

**4 of the 13 named pure cases do NOT close** — a DIFFERENT, pre-existing
mechanism, ruled out as this task's defect (byte-identical before/after
via stash/pop):
- `gatula-10-bifu561` (zero edges — `addEdgeLabelMarginInk` cannot apply)
  overshoots on width (225 vs 224) because `qux`'s own rendered rect `x`
  is `155.425` here vs jar's `155.42` — a ~0.005px POSITIONING rounding
  drift, not an ink-rule gap, that tips `ensureVisible`'s truncation over
  the boundary for this specific 3-container layout.
- `jixamu-89-ribo225`, `xosiza-60-sobu480` show the SAME sub-0.01px
  positional-drift signature on their own rects — same family.
- `jubobo-22-fapu993` overshoots on HEIGHT with byte-identical rects
  before/after — a third, unexamined mechanism (stereotype tag or
  `hide members` divider ink), unrelated to edge-label margin.

**8 sub-pixel-text cases**, two groups:
- Group A (multi-line `e.labelLines`, unchanged by this fix as expected
  since it only reads `e.label`): `dofima-22-kofe334` (0+4),
  `jireze-84-loti743` (0+4), `sicile-99-pefa679` (0+11),
  `lapoma-04-vaga142` (0+22), `xefeme-77-fagu709` (0+112, confirmed
  byte-identical, a pre-existing ~5.001px uniform ink-shift defect).
  dofima/jireze/sicile each ALSO carry a 0.195-0.349px `text/@x`
  residual — confirms the task's own framing: a separate
  text-measurement gap, not a margin-ink gap.
- Group B (single-line, partially resolved): `tijira-61-fere730`
  (0+4 -> 0+2) — the WIDTH component is FIXED (518 -> 519, exact); the
  remaining residual (one label's `@x`/`@y` off by 0.312/0.134) is the
  SAME text-position class as Group A, now isolated cleanly.
  `nenepe-70-keri784` (0+2, unchanged) carries NO label text at all
  (`CC::USA --> users::3`, a bare port association) — different
  mechanism by construction.

**3 `scale` fixtures** (`cagace-55-libu760`, `nadaba-37-zaku242`,
`kujiji-68-cujo036`, row 188's "~1px unscaled gap" hypothesis):
byte-identical before/after, zero edge labels between them — the
hypothesis that they share this task's mechanism is REFUTED. Their
large structural diffs point to the `scale` transform pipeline itself.

## Next steps for a future task

1. Multi-line label margin (`e.labelLines`) — needs the SAME
   `withMargin` term applied ONCE to the combined block's overall
   bounding box (not per line), but the 0.195-0.349px text-position gap
   should be resolved FIRST (it dominates/entangles the symptom).
2. The Y-axis margin term (`UEmpty`'s real top, not derivable from
   `label.y`'s baseline without deeper `class-edge-label-anchor.ts`
   wiring) — deferred, documented as NOT modeled in `class-ink-box.ts`.
3. gatula/jixamu/xosiza's ~0.005px classifier/namespace positional
   rounding drift — needs its own diagnosis (likely a float rounding
   difference upstream of the ink walk, possibly in namespace/package
   width accumulation given T31 touched this area recently).
4. jubobo's byte-identical-rects height overshoot — unexamined,
   likely `<<even>>` stereotype tag or `hide members` divider ink.
5. nenepe's bare member-port association width gap — unexamined.
6. cagace/nadaba/kujiji's `scale`-pipeline structural diffs — unexamined,
   clearly NOT this task's mechanism.
