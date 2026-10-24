# T2e — salt: `getlengthAdjust()`, option and fragment

Agent: `typescript-pro` (sonnet), worktree `lad-T2e`. Commit:
`fix(salt): honour skinparam lengthAdjust via the diagram's SkinParam`.
Read [../task-contract.md](../task-contract.md), decisions D1 and D3.

## Task
Same shape as T2c, on salt: `index.ts:287 render(geo)` → `renderSalt(geo.
diagram, measurer)`; `PSystemSalt extends TitledDiagram` upstream
(`PSystemSalt.java:87`), so `TextBlockExporter.java:306` applies.
1. `src/diagrams/salt/PSystemSalt.ts` `class SaltSkinParam` (`:117`;
   `getValue` at `:127`): add `getlengthAdjust(): RootLengthAdjust |
   undefined` mirroring `SkinParam.java:1258-1269`.
2. `index.ts:129` `basicSvgOption({...})`: add `lengthAdjust` mapped to the
   klimt enum (local mapping; exit dedupes).
3. `index.ts:161` fragment: spread `lengthAdjust` when defined.

## Write-set
`src/diagrams/salt/PSystemSalt.ts`, `src/diagrams/salt/index.ts`,
`tests/unit/salt/lengthadjust-lad-t2e.test.ts`.

## Read-set
`src/diagrams/salt/index.ts:120-170,280-295`; `PSystemSalt.ts:105-140,
190-210`; `src/core/klimt/drawing/svg/svg-option.ts:25-60`; Java
`SkinParam.java:1258-1269`, `TextBlockExporter.java:306-307`,
`SvgGraphics.java:155-158,699-705`, `salt/PSystemSalt.java:87`.

## Acceptance
- Given `skinparam lengthAdjust none` on `{ Login }`, then the root `<g>` has
  no `lengthAdjust` and no `<text>` has `textLength`.
- Given `spacingAndGlyphs`, then the root `<g>` carries that value.
- Given no skinparam, then the output is byte-identical to the pre-change
  render; `salt.golden.ratchet.test.ts` and `salt.diff-baseline.ratchet.
  test.ts` green (50 pins).
- Given the authored rows `salt-*`, then all four are `rootExact` and
  `textLengthMatch`; salt survey vs b0 shows 0 movers.

Observability: N/A. Rollback: Reversible.
