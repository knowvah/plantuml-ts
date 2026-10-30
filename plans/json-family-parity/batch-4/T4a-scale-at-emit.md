# T4a — M5: `scale` applied after a 1x layout, as upstream does

Agent: `typescript-pro` (sonnet, effort high), worktree `jfp-T4a`. Commit:
`fix(json): apply scale at emit, after the 1x layout (T4a)`. Read
[../task-contract.md](../task-contract.md), [../decisions.md](../decisions.md)
(incl. amendments 2026-10-29/30) and `../diagnosis/yaml-hcl.md` "M4 — `scale`"
(= unified **M5** in `../diagnosis/ledger.md`).

## The mechanism (T1c, verified at the B1 close)
Upstream lays out and draws at 1x and multiplies at EMIT (`SvgGraphics#format`,
`SvgGraphics.java:468-475`); `ensureVisible` tracks UNSCALED coordinates
(`:129-131`, seeded by `withMinDim`, `TextBlockExporter.java:284`,
`SvgGraphics.java:142-143`) and the document size is `(int)(maxX · scale)`
(`:801-802`). Ours multiplies the layout's geometry (`scaleJsonGeometry`,
`src/diagrams/json/scale-geo.ts`), so four lengths come out wrong:
1. `ep` never scaled — `scaleEdge` copies only `points` (`scale-geo.ts:94-95`);
2. `VERY_FIRST_LINE` 13 applied to scaled points (`JsonCurve.ts:56`; upstream 1x, `SmetanaForJson.java:173`, `JsonCurve.java:119-121`);
3. `CELL_MARGIN_X` 5 added after scaling (`renderer.ts:91-92`; upstream `TextBlockUtils.withMargin(…, 5, 2)` at 1x);
4. document size `trunc((final+1)·k)` (`scale-geo.ts:110-111`) vs `(int)((int)(x+1)·k)`.

## Task
Mirror upstream's structure: every length computed at 1x, scale applied where
upstream applies it. FIRST check `docs/catalog.md` and other engines in
`src/diagrams/` for an existing emit-time scale (how does class/activity apply
`scale`?) — reuse it if it exists and needs no `src/core/` change; a needed core
change is stop 7 (halt and report). Fix all four sites; tests first, expected
values from the jar oracle (`test-results/dot-cache/yaml/nuzaje-74-kenu009/in.svg`,
`json/timafu-94-bixe774/in.svg`) or the Java arithmetic, cited. Correct
`scale-geo.ts`'s header claim that the structural gate catches every unscaled
numeric (positional values bypass it). Write-set may shrink (e.g. `scale-geo.ts`
deleted if the emit-time scale replaces it — delete, don't archive), never grow
outside `src/diagrams/json/` + its tests (stop 1).

## Write-set
`src/diagrams/json/{scale-geo.ts,JsonCurve.ts,renderer.ts,document-dimensions.ts,index.ts}`,
`tests/unit/json/scale-*.test.ts` (new or existing).

## Acceptance
- yaml/nuzaje-74-kenu009: `residue.mts` ≤ 0.475 / 0.475 / dw ≤ 1 (T1c sites 1-3), and dw 0 if site 4 lands as the arithmetic predicts — report the measured values.
- json/timafu-94-bixe774: positional magnitude ≈ 0.329 / 0.810 (T1c); still `aligned:false` is acceptable (its 37 structural diffs are U-REC's scale ratio, Smetana) — report its structural diff count before/after (must not rise).
- Every other cached row byte-identical (`k = 1` path); the 14/7/1 pins and the positional gate green.
- `extended-baseline.mts --check`: list every mover; each must be a scaled example, with the site that moved it.
