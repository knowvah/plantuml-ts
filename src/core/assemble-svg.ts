/**
 * The single central document-assembly choke point — extracted from
 * `src/index.ts` (mission A5 / T4), which sits at the repo's 500-line hook cap.
 *
 * `assembleSvg` stays exported from `src/index.ts`, the package's only
 * "exports" subpath, so this move is invisible to consumers.
 */
import type { AssembledSvg } from './dispatcher.js';
import { svgRoot } from './svg.js';
import { assembleDocumentShell } from './klimt/document-shell.js';
import { assembleKlimtShell } from '../diagrams/description/renderer.js';
import { assembleClassShell } from '../diagrams/class/renderer-shell.js';
import { assembleStateShell } from '../diagrams/state/renderer-shell.js';

/**
 * The single central `svgRoot` call site (decisions.md D2): every plugin
 * hands back an `AssembledSvg` — either a `RenderFragment` (the common
 * case, assembled here via `svgRoot`) or a `CompleteSvg` escape hatch for
 * engines that already emit a full document themselves (klimt/description;
 * chart's inline error path; `@startdot`'s graphviz passthrough) and must
 * not be re-wrapped.
 *
 * G1 I1: a `RenderFragment` carrying `klimtShell: true` (set ONLY by
 * `description/renderer.ts#unwrapKlimtSvg`, i.e. an ANNOTATED
 * description-diagram fragment) is reassembled via
 * `description/renderer.ts#assembleKlimtShell` instead of `svgRoot` —
 * klimt's own root-attribute/prolog/defs shell, not the generic one every
 * other engine uses.
 *
 * G2 N1: a `RenderFragment` carrying `classShell: true` (set ONLY by
 * `class/renderer.ts#renderClass`, EVERY class-diagram fragment,
 * annotated or not) is reassembled via
 * `class/renderer-shell.ts#assembleClassShell` instead of `svgRoot` --
 * jar's class-diagram root-attribute/prolog/defs shell (the SAME literal
 * shape `assembleKlimtShell` uses, shared via `core/klimt/document-
 * shell.ts#assembleDocumentShell`). Unlike description, class has no
 * `CompleteSvg` escape hatch for the unannotated case -- every class
 * fragment reaches this function, so `classShell` is unconditional.
 *
 * mission G4 S1: a `RenderFragment` carrying `stateShell: true` (set ONLY
 * by `state/renderer.ts#renderState`, unconditional like `classShell`) is
 * reassembled via `state/renderer-shell.ts#assembleStateShell` -- the SAME
 * shared `assembleDocumentShell` mechanics, parameterized `'STATE'`.
 *
 * mission A5 T4: a `RenderFragment` carrying `jsonShell` (set by the
 * `json`/`yaml`/`hcl` PLUGINS, which each know their own type) goes
 * straight to that same shared `assembleDocumentShell`. It is the only one
 * of the four that is a STRING rather than `true`, because one renderer
 * serves three diagram types and it carries the jar's `data-diagram-type`
 * (`JSON`/`YAML`/`HCL`). Before this, json fell through to `svgRoot` and
 * lost every jar root attribute while gaining 13 arrowhead `<marker>` defs
 * the jar does not emit — a root `childCount` mismatch that stopped the
 * conformance comparator recursing, leaving all 92 fixtures' interiors
 * unmeasured.
 */
export function assembleSvg(fragment: AssembledSvg): string {
  if ('completeSvg' in fragment) return fragment.completeSvg;
  if (fragment.klimtShell === true) return assembleKlimtShell(fragment);
  if (fragment.classShell === true) return assembleClassShell(fragment);
  if (fragment.stateShell === true) return assembleStateShell(fragment);
  if (fragment.jsonShell !== undefined) return assembleDocumentShell(fragment, fragment.jsonShell);
  return svgRoot(fragment.width, fragment.height, [fragment.body], fragment.background, fragment.extraDefs);
}
