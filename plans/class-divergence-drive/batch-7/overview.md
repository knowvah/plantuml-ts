# Batch 7 — B7 text & creole

Five independent creole gaps, all downstream of `ClassifyStripeLine`/
`Display`-family text but touching disjoint files: member/body text (T24),
header-name and edge-label text (T25), inline image/sprite/openiconic/emoji
atoms (T26), the nested `{{ }}` diagram renderer (T27, D9), and chrome text
— title/legend/header/footer/caption — routed through the shared creole
seam for EVERY diagram type (T28, D5). All five run in parallel worktrees;
write-sets are disjoint by construction (T24 owns the member-row/tree/
generic-classifier files, T25 the header/edge-label files, T26 the
inline-atom-resolve + renderer files, T27 the embedded-diagram seam, T28
the shared `core/annotations/` chrome files — none overlaps another). T28
is the highest-risk task (shared seam, every engine's chrome) and carries
the batch's own full-suite gate; the other four are class-only and gated by
the standard four commands plus `render-diff.mts` on their named fixtures.

Two fixtures span two tasks by nature, not by write-set overlap: `bixogo-
47-xulu385`/`roxosu-00-pini153` embed `{{salt}}` inside a `legend` block —
T27 supplies the `NestedDiagramRenderer`, but the legend TEXT only reaches
it once T28's chrome-creole routing recognizes the `{{ }}` opener instead
of splitting it into literal `<text>` rows per line. Neither task edits the
other's files; the close task re-measures both fixtures after both land
and journals whichever one made the last-mile difference. `manube-50-
xora983` similarly carries two independently-fixed mechanisms (T26's
sprite-recolour `<filter>` for the swatch cells, T28's legend-table creole
parsing) — see `diagnosis/A3-style.md` M7's note distinguishing manube from
`beruje`'s unrelated wave-filter mechanism.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T24 | Member/body creole: tree leading-space, guillemet, sejuzo dividers, `~` role strip (A4 2a/4/7) | typescript-pro (sonnet) | `class-member-creole.ts`, `class-body-enhanced.ts`, `class-layout-generic-classifier*.ts`, `class-layout-helpers.ts`, tests | — | [ ] |
| T25 | Header/name + edge-label creole: `<size:>`/`<plain>`, xamule edge-label size, lecelo `<:name:>` (A4 5/6, xamule) | debugger then typescript-pro (sonnet) | `class-layout-header-creole.ts`, `class-edge-geo.ts`, `renderer-edge.ts`, `class-edge-label-lines.ts`, tests | — | [ ] |
| T26 | Inline images, sprites, openiconic, emoji atoms (A2b E12) | typescript-pro (sonnet) | `src/core/klimt/creole/` atom files (img/sprite/openiconic/emoji only), `renderer-openiconic.ts`, `renderer-bullet-atom.ts`, `class-member-atom-resolve.ts`, tests | — | [ ] |
| T27 | Nested `{{ }}` diagram renderer (A2b E7, D9) | typescript-pro (sonnet) | `EmbeddedDiagram.ts` wiring, `MethodsOrFieldsArea.ts` (config supply), `class-embedded-block.ts`, `class-multiline-element.ts`, `DIVERGENCES.md`, tests | — | [ ] |
| T28 | Chrome creole at the shared seam, every diagram type (A4 2b, D5) | typescript-pro (opus) | `core/annotations/blocks.ts`, `core/annotations/chrome.ts`, tests | — | [ ] |

Specs: [`T24-member-body-creole.md`](T24-member-body-creole.md),
[`T25-header-edge-label-creole.md`](T25-header-edge-label-creole.md),
[`T26-inline-images-sprites.md`](T26-inline-images-sprites.md),
[`T27-nested-diagram-renderer.md`](T27-nested-diagram-renderer.md),
[`T28-chrome-creole-seam.md`](T28-chrome-creole-seam.md). Batch close:
[`close.md`](close.md).
