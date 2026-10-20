## Observation: every Theme field is reachable from the published types

- **Context**: sdd1 T3c, the stop-11 check before deleting Theme fields left
  without a reader (`colors.lifeline/activation/frame/participantBackground`,
  `sequence.participantPadding/messageSpacing/noteMargin/frameHeaderHeight/
  lifelineExtension`, `colors.graph.sequenceShadowing`).
- **Finding**: `Theme` is not re-exported by name from `src/index.ts`, but
  `RenderOptions` is (`src/index.ts:33`), and `RenderOptions.theme` is
  `'default' | 'dark' | 'sketchy' | 'monochrome' | Partial<Theme>`
  (`src/core/render-options.ts:27`). `Partial` is shallow, so every nested
  field (`colors.*`, `colors.graph.*`, `sequence.*`) is part of the option
  type. `vite.config.ts` rolls declarations into `dist/plantuml-ts.d.ts`
  (`bundleTypes: true`), and the built file does contain
  `participantPadding`. So deleting any Theme field changes an exported
  option type.
- **Impact**: a plan premise of the form "Theme is not re-exported, so a
  field deletion is internal" is false for this repo. Any Theme field
  deletion is a public API change (sdd1 stop 11) and needs a ruling first.
- **Confidence**: High — read the type chain and grepped the built d.ts.

## Observation: computeTotalWidth's label heuristic is not upstream and mostly hurts

- **Context**: sdd1 T3c, migrating `layout.ts#computeTotalWidth`'s
  `fontSpecOf(theme)` / `theme.colors.text` reads.
- **Finding**: the loop widens the document to `midX + labelWidth / 2 +
  RIGHT_MARGIN` per message (self: `midX = fromX + 20`), measured at the
  ambient theme font. Upstream has no such term: the width is
  `PlayingSpace`'s max of each tile's `getMaxX`
  (`CommunicationTile.java:453-460`, `CommunicationTileSelf.java:272-277`).
  A probe that skipped the loop (not committed) moved 12 rows: 11 fell (5 to
  zero: fuliko-66, gejoko-46, gutate-63, mobobu-53, sixifa-33) and
  jujigi-41 rose 68 -> 100 (its mechanism was not isolated; the self
  tile's `getMaxX`, `posC2 + compWidth`, is the unported term to check
  first).
- **Impact**: changing that loop's font would only tune a construct
  upstream does not have. The fix is to port `CommunicationTileSelf#getMaxX`
  (and the self tile's `addConstraints`, `:180`) and delete the loop.
- **Confidence**: High for the probe numbers; Low on what jujigi-41 needs
  (not instrumented).
