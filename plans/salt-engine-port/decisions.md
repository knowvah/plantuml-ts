# Decisions: salt-engine-port (locked 2026-10-12, maintainer-approved during planning)

A finding that contradicts any of these triggers stop 3: amend this file, then halt.

| ID | Decision |
|---|---|
| D1 | Mirror upstream layout, one file per Java file, upstream names |
| D2 | `PSystemSalt` is a TitledDiagram on the shared chrome path |
| D3 | No style engine: black ink + `ISkinSimple`, skinparam lines dropped |
| D4 | Reuse the klimt sprite port; a missing piece is a stop |
| D5 | No ready factory ⇒ refusal ⇒ our error page |
| D6 | Mindmap-shape harness lands first (T0b), SVG-only |
| D7 | Embedded `{{salt}}`: no new seam |
| D8 | Exit bar: 51/51, seed rows pinned, 0 losses |
| D9 | Batch order core → elements → factories → wiring; worktrees; `fable` executor |

## D1: layout
`src/diagrams/salt/` mirrors `net/sourceforge/plantuml/salt/`: `salt/*.ts`,
`salt/element/*.ts`, `salt/factory/*.ts`, one TS file per Java file, upstream class and
member names (including `ElementFactoryRetrieveFromDictonnary`'s spelling). Every ported
symbol carries `@see` to its Java line; every constant a `file:line`.

## D2: diagram shell
`PSystemSaltFactory` registers `addCommonCommands2`, `addCommonScaleCommands`,
`addTitleCommands` and `CommandAnything` (`PSystemSaltFactory.java`). `PSystemSalt` extends
`TitledDiagram`; `getDefaultMargins()` is `ClockwiseTopRightBottomLeft.same(5)`. Chrome
(title, scale, margins) is composed by the shared path every engine uses
(`core/annotations/chrome-export.ts#applyExportedChrome`), as mindmap does.
`getTextBlock` draws the element twice: z-index 0 then 1, at the preferred dimension.

## D3: styling
Upstream salt reads no style (`grep StyleSignature|SName salt/` is empty). Ink is
`HColors.BLACK`; fonts and colours come through `ISkinSimple`. `manageSprite` drops
`hide stereotype` and `skinparam …` lines and applies `scale N` (`PSystemSalt.java`).

## D4: sprites
`sprite $name …` blocks go through the port of `CommandFactorySprite.createMultiLine`;
`ElementImage`/`SaltDictionary` use the existing klimt sprite port. A missing or divergent
piece is stop 10, not a salt-local re-implementation.

## D5: refusal
`PSystemSalt#createElement` throws `IllegalArgumentException` when no factory is
`ready()`. Mirror it as a thrown refusal so `renderSync` returns our error page; under the
2026-10-10 error-page rule that is conformant wherever the jar errors.

## D6: harness
T0b mirrors mindmap-engine-port T0b: `render-fixture-salt.ts`, `salt.golden.ratchet.test.ts`
(ratchet `oracle/goldens/svg-salt/ratchet.json`, empty at T0b, pinning orchestrator-only at
closes), `salt.diff-baseline.ratchet.test.ts` (manifest `oracle/goldens/svg-salt/diff-baseline.json`,
51 rows seeded at b0), `parity-salt.json` tracked. No DOT eligibility check: salt never
emits `svek-N.dot`. Routing: the 50 `SALT -> NONE` rows flip to agree when the plugin
registers (T4a close re-pins them with derivation comments).

## D7: embedded `{{salt}}`
No new seam. The nested renderer recurses through `renderSync`; oracle seam #3 fixed the
42×42 slot. The seed rows and the activity/gantt embed rows are measured as rows; the
`<image>` payload bytes stay under `compare.ts`'s existing data-URI exemption.

## D8: exit bar
51/51 salt conformant. A row may be left non-conformant only with a named library that
forces the divergence — none is expected (salt is pure klimt) — and that needs the
maintainer (stop 9). The 3 seed rows conformant and pinned. 0 conformant losses in any
engine against b0.

## D9: execution
Batches: foundations (B1) → elements + factory base (B2) → factories (B3) → wiring (B4) →
residual drive (B5, specs written at the B4 close from measured families). Tasks of 5–8
Java files with disjoint write-sets, each in its own worktree (`measurements/mkwt.sh`).
Executor model: `fable`. Subagents: typescript-pro (opus) for porting tasks.
