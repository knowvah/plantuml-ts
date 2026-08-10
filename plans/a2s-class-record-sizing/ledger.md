# A2s ledger — named non-conformant remainder (updated 2026-08-06, SI1 T12)

Current: **711/712 conformant (99.9%), widened 0** (the ratchet gained one
authored golden since round-2 close); conformant + this ledger = 712
(ADR-3 reconciled). The one open row is a TRACKED follow-up (backlog pin
retained, shrink-only), not a divergence declaration.

| Slug | Delta (in) | Mechanism | Evidence | Follow-on |
|------|------------|-----------|----------|-----------|
| ~~rotisi-30-loge424~~ CLOSED 2026-08-10 | 0.014957 -> 0 | Toto (enhanced body with sprite rows): height 1.0769px = 14·(14/13−1) over golden — a sprite-scale/text-height interaction in the enhanced-body row heights. Orchestrator FALSIFIED the raster−1 hypothesis (applying it broke lozego-15's jar-pinned raw-raster height and did not move rotisi — reverted). Width exact; badge + note nodes exact (R2i/R2h). | R2i report + orchestrator experiment (journal 2026-08-05) | targeted probe of the jar's enhanced-body sprite row height (isolated fixture: one sprite row, one text row, vary font size) |

## Closed by follow-on missions

| Slug | Was | Closed | Mechanism |
|------|-----|--------|-----------|
| rotisi-30-loge424 | 0.014957 | 2026-08-10, delta 0 CONFORMANT, backlog row deleted (class now 712/712, backlog EMPTY) | `layoutPlainDividerRows`/`layoutTitledDividerRows` computed a block's content height as `lines.length * fontSize`; upstream sums each ROW's own height (`MethodsOrFieldsArea#calculateDimensionOnlyMembers`, java:161-166). A 15px sprite row is `15*(fontSize/13)` = 16.154 and the 2x2 `$point` row is 2.154, so the flat 14 was wrong in BOTH directions. `class-member-rows.ts` got this in R2i; the enhanced-body path kept the flat stepping. Per-row errors (-4.308, -2.154, -2.154, 0, +11.846, -2.154) nearly cancelled to the +1.0769 net -- which is why it looked like a single `14*(14/13-1)` scale bug and why the raster-1 hypothesis was chasing the wrong quantity. ISOLATED single-row probes all matched the jar; only a cumulative 1..7-row probe exposed it. |
| gujigi-63-roki030 | 0.152778 | SI1 T12 (2026-08-06), delta 0 CONFORMANT, backlog row deleted | The `package "Elektronisk dokument"` leaf now routes through `tryMeasureDescriptionLeaf` → `measureFolderLeaf` (F-D exclusion dropped), whose SHOWN title measures via the faithful `BodyFactory.create2` → `BodyEnhanced1` route (`leaf-sizing-folder-title.ts`): title = MethodsOrFieldsArea width + `getMarginX()=6` both sides (BodyEnhancedAbstract.java:107-109) — jar-probe-verified 171.9375×37px = (129.9375+12) + [30,23] folder margin, <0.01px. The old F-D height widening (0.1528→0.1944) no longer reproduces: the class AST's id==display for a quoted package leaves the label slot empty, exactly as upstream's empty-`desc` package branch. |

## Round-2 closure record (22 of 24 closed)

R2a-R2j closed: roputo-88, rozudo-79, xadado-92 (TIM sentinel/embedded),
lecelo-92 (emoji atom + header creole routing), curupe-50 (monospace +
quoted-alias), lozego-15 (member-row atom heights), julixi-10 + rulite-35 +
dibinu-95 (generic-tag \n split; quoted-name member), cukaze-78 (24×24
association diamond), pasova-33 (forced {method}/{field} bucketing),
puvono-84 + sekame-22 (icon zone = radius+3; stereo height floor 10),
jecopa-66 (package-scoped hide, direct children), rakuci-96 (nested-alias
quoted display), pejone-71 + xonamo-50 (enhanced-body blank rows),
ponono-25 + sumocu-27 (bullet wrap budget), daxeno-00 (package USymbol
stereotype + display newlines), mizupo-59 (defaultFontSize tier + aws-orange
fonts), sovuxo-25 (classAttributeFontSizeByStereo).
