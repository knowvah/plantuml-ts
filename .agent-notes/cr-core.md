# cr-core (code-review Batch C) — 2026-09-21

## Observation: svg-nanoparser-transform.ts's console.warn sites are not a
## same-file fix (item 5, second half)
- **Context**: item 5 asked to route `console.warn('WARNING: ...')` at
  `svg-nanoparser-transform.ts:51,68` (`applyMatrix`/`applyRotate`, an
  unmatched `<g transform="...">` value) through `RenderOptions.onWarning`,
  with the same escape hatch used for yaml: collect on the AST/sprite result
  and surface in `index.ts` if full threading is too wide.
- **Finding**: `applyTransformAttribute` fires from `SvgNanoParser.drawU`,
  called during BOTH sizing and drawing (not parse), from three independent,
  unrelated call chains with no shared carrier in scope at any of them:
  `creole-atoms-image-resolver.ts#resolveSvgSpriteAtom` (sprite atoms — has a
  `SpriteDimsLookup`, itself derived from a `SpriteRegistry`, but that
  registry is not passed down to `SvgNanoParser`/`drawU` today),
  `EntityImageDescriptionEmoji.ts#drawEmojiAtom` (emoji artwork — no sprite
  registry in scope at all), and `EntityImageDescriptionDelegates.ts`
  (description delegates). Threading a warnings channel from any of these
  back to `RenderOptions.onWarning` means changing signatures across
  `leaf-sizing.ts`, `EntityImageDescriptionEmoji.ts`,
  `EntityImageDescriptionDelegates.ts`, `creole-atoms-image-resolver.ts`, and
  further upstream still (class-member-atom-resolve.ts,
  command-sprite.ts, parse-helpers-strings.ts, ...) — genuinely large and
  separable per CLAUDE.md's deferral bar, not an effort excuse.
- **Impact**: left the two `console.warn` calls as they were (unrouted).
  Recommend a standalone follow-up mission scoped to "thread a warnings
  sink through SvgNanoParser.drawU's three call chains" if this is wanted;
  it is not a Batch C item.
- **Confidence**: High (traced every call site via grep + Read, not guessed).

## Observation: index.ts's shared prepare sequence gave item 5 a single
## insertion point for free
- **Context**: item 1 (extract `prepareBlock`) landed before item 5.
- **Finding**: because `surfaceSpriteWarnings`/`surfaceParseWarnings` now
  live in the one `prepareBlock` helper shared by `renderPagesSync` and
  `renderBlockPages`, item 5's yaml half needed exactly one call site, not
  two.
- **Impact**: confirms doing item 1 first was the right order for this batch.
- **Confidence**: High.
