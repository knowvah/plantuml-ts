# Batch 4 — B4 clusters

USymbol containers, package `[[url]]`/style, cluster-anchored edge clipping,
and the empty-package double draw. T11/T13 are independent (disjoint write
sets: parse-side container fields vs. edge-geo clipping) and run in parallel
worktrees; T12 depends on T11's AST fields (`Namespace.usymbol/url/color`);
T14 depends on T12's cluster shape landing first (it edits the same
collapse/leaf path T12's render side touches). This batch moves layout:
USymbol clusters have different margins per symbol shape, and the edge clip
changes spline endpoints for 17 GEO1 fixtures.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T11 | Namespace `url`/`color`/`usymbol` AST fields + `<style> package {}` cascade (E4, STY M3) | typescript-pro (sonnet) | `class-command-containers.ts`, `ast.ts`, `class-container.ts` (parse only), tests | — | [x] |
| T12 | USymbol container shape + package paint (E3) | typescript-pro (opus) | `class-namespace-shape.ts`, `class-namespace-folder-outline.ts`, `class-namespace-title-table.ts`, `renderer-group.ts`, tests | T11 | [x] |
| T13 | Cluster-anchored edge clipping (GEO M1) | typescript-pro (sonnet) | `class-edge-geo.ts`, tests | — | [x] |
| T14 | Empty-package double draw + phantom leaf (E9) | typescript-pro (sonnet) | `class-namespace.ts`, `renderer.ts`, `parser.ts`, tests | T12 | [x] |

Specs: [`T11-namespace-fields.md`](T11-namespace-fields.md),
[`T12-usymbol-containers.md`](T12-usymbol-containers.md),
[`T13-cluster-edge-clip.md`](T13-cluster-edge-clip.md),
[`T14-empty-package-double-draw.md`](T14-empty-package-double-draw.md).
Batch close: [`close.md`](close.md).
