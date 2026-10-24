# Batch 2 — core text and SVG fixes

Eight tasks in worktrees, after the batch 1 close. Every task writes core or
shared files, so every commit is followed by the all-engine survey (D1, D8,
stop 4) and the close reports every non-sequence mover row by row (stop 13,
expected at T2a, T2c). Mechanisms: `measurements/planning-open-rows.tsv`.
Write-set overlaps found while specifying (resolved): T2a, T2c and T2f all
reach `<text>`/shape emission (`svg-shapes*`, `sequence-text.ts`), so T2c owns
the sequence `textLength` switch and no `svg-shapes*` edit, T2a owns
`svg-shapes*` (post-T0b split) and no `svg.ts` edit, and T2f (the only task
that must carry a new attribute through to the `<text>` emitter) runs after
both (`Depends On`). T2a/T2b split the `kixani` mechanisms: T2b owns the
blotter file, T2a the shared emitters. Then the standard close as `b2` — pin
round 2.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-alpha-fill-strokeless.md) | `#RRGGBBAA` fill split + fore==back strokeless paths in the string emitters | typescript-pro (sonnet) | `src/core/svg-shapes*.ts` (T0b's split files) + tests | B1, T0b | [x] |
| [T2b](T2b-blotter-scaled-offset.md) | blotter else-band `+1` scaled; band paths strokeless | typescript-pro (sonnet) | `src/diagrams/sequence/renderer-frame-blotter.ts` + tests | B1 | [x] |
| [T2c](T2c-lengthadjust-skinparam.md) | `skinparam lengthAdjust` reaches the root `<g>` and `textLength` | typescript-pro (sonnet) | skinparam chain, `svg.ts`, `klimt/document-shell.ts`, `dispatcher.ts`, `sequence/renderer.ts`, `sequence-text.ts` + tests | B1 | [x] |
| [T2d](T2d-document-margin-style.md) | `root { Margin }` reaches the sequence exporter margin | typescript-pro (sonnet) | `src/core/document-margin.ts`, `sequence/renderer-document.ts`, `src/core/assemble-svg-sequence.ts` + tests | B1 | [x] |
| [T2e](T2e-url-label-split.md) | `[[url label]]` label split per line | typescript-pro (sonnet) | `CommandCreoleUrl.ts` (+ one new atom file) + tests | B1 | [x] |
| [T2f](T2f-creole-svg-attribute.md) | `CommandCreoleSvgAttributeChange` + `SvgAttributes` to the `<text>` | typescript-pro (sonnet) | new command/`SvgAttributes` files, `CommandCreoleBuilder.ts`, text-attribute chain + tests | T2a, T2c | [x] |
| [T2g](T2g-hsl-float32.md) | `HSLColor` arithmetic in float32 | typescript-pro (sonnet) | `src/core/tim/builtin/color-utils.ts` + tests | B1 | [x] |
| [T2h](T2h-sprite-font-colour.md) | `AtomSprite` takes the stripe's own font colour | typescript-pro (sonnet) | `blocks-creole-atoms.ts`, `Atom.ts` + tests | B1 | [x] |
| close | standard close, all-engine survey, pin round 2 | orchestrator | per close-procedure | T2a–T2h | [x] |

Paths: `src/core/...` unless prefixed `sequence/` (= `src/diagrams/sequence/`).
