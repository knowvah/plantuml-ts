# cdd2-T15 — circled-character glyph family (mechanism C-1)

## Re-run confirmation

`render-diff.mts` on all 7 fixtures reproduced the diagnosed diff exactly
before any edit: `structural=0 numeric=818` for
befasi-62-vimu310/mububu-79-nalu431/ribove-58-tefu515/soboro-52-pevi612/
zakuta-81-pese010/ziruni-05-fona846, `structural=0 numeric=886` for
zosaxa-86-mora157 (+68 from its extra `class dummy`). Diagnosis C.md's
mechanism C-1 (`lookupSizedGlyph`'s `letter !== 'C'` gate, plus 'C'
itself having no size-12 entry) reproduced without further instrumenting.

## Letters actually drawn at size 12

All 7 fixtures share the identical badge letter set (confirmed via
`diff` against befasi's source — the other 6 differ only by one
`skinparam layout`/`flashcode` line, or zosaxa's extra `dummy` class):
M (`DrawableAdapter`, `OSGWidget`), O (`WaterSurfaceGeom`, `BarrierGeom`,
`FaucetGeom`), W (`EWSMainWindow`, `SimulationEditor`,
`SimulationControls`), Q (`SimulationState`, `DripSource`, `Barrier`,
`WaveMedium`), C (`WaveModel`, `Lattice`, `Oscillator`,
`WavePropagator`, `CompositePotential`, `ConstantPotential`,
`SlitPotential`, `WallPotential`, + zosaxa's `dummy`), A
(`Potential`, abstract class default letter). No other letter appears.

## Fix shape

`lookupSizedGlyph`'s `letter !== 'C'` gate is now letter=='C' branches to
the pre-existing two-table (variant + size) path unchanged; every OTHER
letter looks up a new `BADGE_GLYPH_OTHER_LETTERS_BY_FONT_SIZE[letter][
fontSize]` table. Added a `12` entry to `BADGE_GLYPH_C_BY_FONT_SIZE` for
'C' itself (previously had 13-22 only). All 6 new captures (M, O, W, Q,
C@12, A) scraped verbatim from
`test-results/dot-cache/class/befasi-62-vimu310/in.svg`'s own
`<ellipse cx/cy>` + `<path d>` for the cited entity id (ent0004/ent0005/
ent0015/ent0025/ent0034/ent0043) — same "capture verbatim, translate by
reference center" methodology the existing 'C' table's doc comment and
G2 N38's ledger entry establish; no formula, no scale, no epsilon.

## Consumer survey (step 4)

`grep -rl "lookupSizedGlyph\|badgeGlyphPath" src/` returns only
`src/diagrams/class/*` (renderer-classifier-badge-tag.ts,
class-badge-sized-glyphs.ts, class-badge-glyph-data.ts, class-badge.ts).
No non-class engine imports either symbol — the badge glyph table is
class-diagram-only, so no cross-engine `svg:survey` was needed.

## Results

- `render-diff.mts` on all 7 slugs: `pass=true structural=0 numeric=0`
  for every one, before and after confirmed identically.
- `render-all.mts` + `pin-diff.mts` against
  `plans/class-divergence-drive-2/measurements/b2.json`: exactly the 7
  targeted fixtures transitioned `structural-match -> conformant`; no
  other fixture in the 723-row corpus moved (0 rises, 0 unrelated falls).
- Four gates: `npm test` 811 files / 22620 tests passed (2 skipped,
  6 todo, pre-existing); `npm run typecheck` clean; `npm run lint`
  clean; `npm run build` clean. `docs/catalog.md` untouched — no new
  exported symbol (the new table and its lookup branch are both
  module-private; `lookupSizedGlyph`'s signature is unchanged).

## Open

None. All 5 letters this fixture family needs at size 12 are captured;
widening to other sizes/letters/variants for these letters is
corpus-driven future work (no fixture in this family needs it), same
scope boundary the pre-existing 'C' table already drew for its own
13-22 size range.
