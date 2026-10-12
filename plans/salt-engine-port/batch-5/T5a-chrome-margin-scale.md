# T5a: salt export margin + scale through the shared chrome path (stop 10, awaiting maintainer approval)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

Residual family from the batch-4 close (journal row 34): `mejeki-64-buvo994` (title/caption/
legend/header/footer, weightedScore 16), `vuxibo-96-tago783` (caption, 6), and the T4a probes
`tests/fixtures/salt/{common-commands,mainframe}.puml` (title + `scale 2`; mainframe). Every one
is a core-side gap, so this task edits `src/core/` (D3/D4 "klimt pieces go into their upstream
home"), never salt.

## Mechanism (verified against the Java at the b4 close)
- Upstream: `UgDiagram.java:123-131` builds the chrome around the margin-less block
  (`addChrome`), then `TextBlockExporter.exportTo` (`core/TextBlockExporter.java:159-180`)
  translates by `margin.getLeft()/getTop()` and scales by `computeScaleFactor`
  (`:205-209`, `scale.getScale(w, h) * dpi / 96`). The margin is
  `Builder#calculateMargin` (`:510-516`): the merged `{root, document}` style's `Margin` when
  present, else `diagram.getDefaultMargins()` — `same(5)` for salt (`PSystemSalt.java:238-240`).
- Port: `src/core/annotations/chrome-export.ts#applyExportedChrome` re-applies a margin only for
  the types in `src/core/document-margin.ts:74-79` (`DOCUMENT_MARGIN_BY_DIAGRAM_TYPE`: CLASS,
  STATE, DESCRIPTION, SEQUENCE); `src/core/assemble-svg.ts:405-406` routes only `MINDMAP`
  through `finalizeTitledDiagramFragment`, whose margin is the hard-coded
  `TITLED_DIAGRAM_MARGIN = 10` (`src/core/TextBlockExporter.ts:81`, used at `:243` and
  `:288-289`). A `SALT: same(5)` entry in the table alone took mejeki and vuxibo to 0 diffs
  (T4a probe, reverted as out of write-set) but leaves `scale` + chrome wrong, because the
  cuca margin path never scales.

## Task (TDD; jar values from the cached rows and the two probes)
1. Make `finalizeTitledDiagramFragment` take its margin from the fragment (the producer's
   `calculateMargin` result: style `Margin` else `getDefaultMargins()`), mirroring
   `TextBlockExporter.java:510-516`; the mindmap plugin keeps exporting 10 (`TitledDiagram.java:274-277`)
   and the salt plugin 5 — state where the value is threaded (a `RenderFragment` field or an
   argument) and cite the line.
2. Route `SALT` through that path in `assemble-svg.ts#finalizeShellFragment` (next to `MINDMAP`),
   so chrome, margin and `scale` compose in the jar's order (`exportTo`: border → translate(margin)
   → draw; scale from `computeScaleFactor`).
3. Remove whatever salt-local margin handling T4a added to `src/diagrams/salt/index.ts` /
   `PSystemSalt.ts` if the shared path now owns it (one owner per constant), keeping the salt
   plugin's `calculateMargin` read of the style `Margin` (`ributi-22-dogi775`, `.agent-notes/sep-T4a.md`).
4. Re-measure mejeki, vuxibo, `common-commands`, `mainframe`, every mindmap golden (142 pins must
   hold byte-for-byte) and the three class/unknown embed pins; report per-row before → after.

## Write-set
`src/core/assemble-svg.ts`, `src/core/TextBlockExporter.ts`, `src/core/document-margin.ts` (only if
the cuca table is the chosen seam — say which and why), `src/diagrams/salt/{index,PSystemSalt}.ts`
(removal only), `src/diagrams/mindmap/index.ts` (only to thread the margin value), their tests,
`docs/catalog.md`, `.agent-notes/sep-T5a.md`. Any OTHER file is a stop: report, do not edit.

## Acceptance
- Given `mejeki-64-buvo994` and `vuxibo-96-tago783`, then both are byte-conformant (pinnable).
- Given `common-commands` (title + `scale 2`) and `mainframe`, then each matches its jar probe.
- Given the 142 mindmap pins, the 47 salt pins and the 3 embed pins, then none changes.
- Given the full suite at `--maxWorkers=6`, then collected equals on-disk and nothing else moves.

**Observability:** N/A. **Rollback:** Reversible (revert).
