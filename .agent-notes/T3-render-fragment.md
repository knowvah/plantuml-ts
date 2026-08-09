## Observation: Math.random() in production render paths (pre-existing)
- **Context**: T3 byte-stability proof (RenderFragment refactor) — diffing
  renderSync() output for the same source across two process runs.
- **Finding**: `src/diagrams/board/renderer.ts` (`shadowId`),
  `src/diagrams/json/renderer.ts` (`diagramSalt`/`markerId`), and
  `src/diagrams/description/renderer.ts` use `Math.random().toString(36)`
  directly for gradient/shadow/marker id salts. This violates the project
  invariant in CLAUDE.md ("No Date.now() / Math.random() in rendering
  paths -- every non-determinism ... is seeded so output is reproducible").
  Output for identical input differs byte-for-byte between separate
  renderSync() calls (only the random id suffix changes; structure is
  otherwise identical).
- **Impact**: Not introduced by T3, not in T3's write-set (would be a
  behavior change, forbidden by the "zero output byte change" refactor
  bar). Blocks naive before/after diffing for byte-stability checks --
  had to normalize `-[0-9a-z]{6}` id suffixes before comparing. Future
  work seeding these ids (like `description`'s `seedOf`/UGraphicSvg
  pattern) would both fix the invariant violation and make snapshot/golden
  tests for board and json fully deterministic.
- **Confidence**: High (read the source directly; reproduced the diff).
