# cdd3-T22 — OpenIconic atoms in member rows (E1-3, E2-3)

## Observation: vector altitude and the dy span must be the same Sea
- **Context**: porting `AtomOpenIconic#getStartingAltitude` (`-3*factor`,
  `AtomOpenIconic.java:72-74`) into `class-member-creole.ts#resolveMemberAtoms`.
- **Finding**: the row height, every text run's `dy` and the glyph's own top
  all come from ONE `Sea` reduction (`Sea.java:72-89`) over text + vector
  entries. The altitude alone makes the row taller but leaves text/icon high.
  The full span alone (the regression at the old `:247-256` comment) moves
  text with a 0-altitude icon. Only both together match the jar
  (cuzoga/jevuvi 28.875 tall, text top 14.875; rideze 22 tall, text top 8).
  `'image'` atoms (img/sprite/latex) stay out of the span because those rows
  are bottom-anchored (`class-member-rows.ts#buildSectionRows`). That anchor
  equals Sea only while every altitude on the row is 0.
- **Impact**: a row mixing an image atom with a vector glyph or `<sup>`/`<sub>`
  is still not exact Sea. Zero class-corpus reach was measured, so it is still
  open. The full fix is to drop the bottom anchor and place images at their
  Sea top as well.
- **Confidence**: High (3 fixtures 0/0; the text-dominated case reproduces the
  old fitted `openIconicOriginY` exactly: `14 - 11*factor` from the row top).

## Observation: visibility icon now placed from the member block top
- **Context**: rideze's ellipse was 4 px high after the Sea fix
  (diagnosis marked MEDIUM).
- **Finding**: `PlacementStrategyVisibility.java:62-67` computes
  `2 + y + (max(h1,h2) - h1)/2` from the member TOP. The old closed form
  shifted the baseline by `(blockHeight - fontSize)/2`, but it dropped the block
  height whenever it equalled the row's own height and assumed `fontSize`. The
  new `visibilityBlockTopDy` + `visibilityIconOriginYFromTop` port it whole.
  Measured: rideze cy 51.5 -> 55.5 (jar 55.5).
- **Impact**: two cases still use the T20 baseline formula: enhanced-body rows
  (`class-body-enhanced-layout.ts`, at 497 lines) and any row type other than
  `buildSectionRows`. `PlacementStrategyVisibility` also advances `y` by
  `max(h1,h2)` per member, but `calculateDimensionOnlyMembers` sums text
  heights only. So a member shorter than the icon block (font < 11) draws
  lower than our rowTop in the jar. That is not ported and has no fixture.
- **Confidence**: High for rideze; Medium for the font < 11 case (read, not
  measured).

## Observation: the note renderer keeps the legacy glyph origin
- **Context**: `renderer-note.ts` (T24-owned) calls `renderOpenIconicAtom`
  with atoms built by `resolveMemberAtoms`, which now carry `dy`.
- **Finding**: `dy` is measured against the member-row reference. Notes use
  a different baseline (`noteLineAtomDy`), so the dispatch on `dy` lives in
  a separate `renderRowOpenIconicAtom`. `renderOpenIconicAtom` is unchanged,
  and notes still exclude vector height (`noteLineHeight`).
- **Impact**: notes with a dominant `<&icon>` still carry the E2-3
  mechanism. Porting it needs `renderer-note.ts` +
  `note-layout-measure-rows.ts#noteLineHeight`.
- **Confidence**: High (code read; not measured on a note fixture).
