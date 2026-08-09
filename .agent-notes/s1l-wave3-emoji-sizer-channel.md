## Observation: the description SIZER has TWO BoxSizingOpts construction sites, and only one was wired for emoji artwork

- **Context**: S1L-tail wave 3, closing `murava-69-tago286`
  (`usecase "<:rocket:> Implement the changes" as Implement`). The prior
  session's `RESUME.md` named the blocker as "`buildTextBlock` →
  `drawAtoms` still draws the platform glyph; thread `emojiArtwork` into
  that path." That diagnosis was **wrong** and cost the next session time.
- **Finding**: traced with a temporary `console.error` in
  `drawEmojiAtom`/`drawAtoms` plus a stack capture. Results:
  - `EntityImageDescriptionTextBlock.ts#drawAtoms` is **never reached** for
    this fixture. `USymbolUsecase#asSmall(_name, label, stereotype, …)`
    **discards its `name` argument** — a usecase draws `label` (= `this.desc`,
    the `buildDesc`/`BodyFactory.create3`/`descAtomOps` path), never
    `this.name`. Same for every other `USymbol` that merges stereo+label.
  - The desc path was already wired: 6 of 7 `drawEmojiAtom` calls resolved
    real artwork. All 6 were on `EntityImageDescription.drawInner` — the
    RENDERER.
  - The single failing call was the SIZER's:
    `calculateDimensionSlow → new TextBlockInEllipse → Footprint.getEllipse
    → … → drawEmojiAtom` with `resolveArtwork === undefined`.
- **Mechanism**: `BoxSizingOpts.emojiArtwork` is built in **two** places.
  `layout-helpers.ts#degenerateSingleLeaf` (the no-link single-leaf
  shortcut) set it; `layout-dot-tree.ts#buildDotNodes` — the normal DOT
  path, which builds its own `BoxSizingOpts` object literal from
  `ClassifyCtx` — did not, and `ClassifyCtx` carried no artwork channel at
  all (`ctx.sprites` is `spriteDimsLookupFor(...)`, which reduces the
  registry to sprite DIMS and drops `SpriteRegistry.emoji`). `murava-69`
  has a link (`[Company] --> Implement`), so it takes the normal path.
  `Footprint` fits the use-case ellipse to the points actually DRAWN, so
  the sizer measured the platform glyph while the renderer drew the real
  Twemoji artwork: 2.858848in vs the jar's 2.677193in, delta 0.181655.
- **Impact**:
  - **A renderer-side emoji/sprite wiring is only half the job.** Anything
    that changes what `Footprint` collects must be wired at BOTH
    `BoxSizingOpts` construction sites, not just the one whose fixture you
    happen to be looking at. `degenerateSingleLeaf` is easy to land against
    and easy to mistake for the only site — it only covers link-free,
    container-free, single-leaf diagrams.
  - **Three size harnesses must wire an identical `assetStore`**, not two:
    `scripts/measure-description-size-deltas.ts`,
    `scripts/audit-size-metric-identity.ts`, **and**
    `tests/oracle/description-parity.ratchet.test.ts`. The ratchet was the
    one left behind here — the measure reported delta 0 while the ratchet
    still asserted 0.181655. The tell is a conformant count in one harness
    that disagrees with another; that is a bug, never rounding.
  - Don't trust a handoff note's *diagnosis* section the way you trust its
    *measurements* section. The measured facts in `RESUME.md` (the
    `ContainingEllipse` fit at 2.677193in, the pin values) were all correct
    and reusable; the causal claim built on top of them was not.
- **Confidence**: High — traced with stacks, fix verified by re-measure
  (delta 0.181655 → 0, 351 → 352/356, widened 0) and the full suite.
