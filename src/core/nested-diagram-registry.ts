/**
 * nested-diagram-registry.ts — CDD B7FU-R2 (coordinator design correction,
 * journal row 160): the chrome `{{ }}`-embed registration slot, moved here
 * FROM `src/diagrams/class/class-nested-diagram-renderer.ts` so that
 * `src/core/annotations/blocks-creole.ts` (a diagram-agnostic, shared chrome
 * seam) never imports `src/diagrams/class/*` — that edge is exactly what
 * `tests/architecture/layering.test.ts`'s Rule 1 forbids, and D9 keeps the
 * `EmbeddedDiagram.ts` seam diagram-agnostic.
 *
 * This file holds ONLY the registration slot (a plain get/set pair over the
 * `NestedDiagramRenderer` interface `EmbeddedDiagram.ts` already declares)
 * — no render/strip-PI/measure/depth-guard logic lives here. That logic
 * stays in `class-nested-diagram-renderer.ts#createNestedDiagramRenderer`
 * ("never inside `EmbeddedDiagram.ts` itself, which stays diagram-type-
 * agnostic", that file's own module doc comment — a registry slot is not
 * the render logic that doc comment scopes). The DEPENDENCY DIRECTION now
 * matches the class-body registration's own precedent exactly: `src/
 * diagrams/class/class-nested-diagram-renderer.ts` (diagrams -> core, the
 * normal direction) calls {@link registerNestedDiagramRenderer} to populate
 * this slot; `blocks-creole.ts` (core) only ever reads it via {@link
 * getNestedDiagramRenderer} (core -> core).
 */
import type { NestedDiagramRenderer } from './EmbeddedDiagram.js';

/** `undefined` until something has called {@link registerNestedDiagramRenderer}
 *  (production: `src/index.ts#prepareBlock`, indirectly via `class-nested-
 *  diagram-renderer.ts`'s own combined registration helper) — a unit test
 *  that imports `blocks-creole.ts` directly, bypassing `src/index.ts`,
 *  sees `undefined` and falls back to the pre-existing unconditional
 *  throw, which `EmbeddedDiagram.ts`'s own `calculateDimensionSlow`/`drawU`
 *  catch degrades to the `(42, 42)` fixed-size fallback. */
let registeredRenderer: NestedDiagramRenderer | undefined;

/** Populates the chrome-seam nested-diagram renderer slot. Called once per
 *  `renderSync` invocation (see `class-nested-diagram-renderer.ts#register
 *  NestedDiagramRenderers`'s own doc comment for why registration happens
 *  per-call rather than once at module load). */
export function registerNestedDiagramRenderer(renderer: NestedDiagramRenderer): void {
  registeredRenderer = renderer;
}

/** Read by `blocks-creole.ts#blockedEmbeddedRenderer` — see {@link
 *  registerNestedDiagramRenderer}'s own doc comment for the `undefined`
 *  case. */
export function getNestedDiagramRenderer(): NestedDiagramRenderer | undefined {
  return registeredRenderer;
}
