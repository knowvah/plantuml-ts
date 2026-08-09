/**
 * renderer-shell.ts — A5 ledger mechanism **M2/M4**: gives the json family the
 * same "exactly one top-level content `<g>`" guarantee the three sibling
 * klimt-shaped shells already have (`class/renderer-shell.ts
 * #assembleClassShell`, `state/renderer-shell.ts#assembleStateShell`,
 * `description/renderer.ts#assembleKlimtShell`).
 *
 * Before this, `assemble-svg.ts` handed `assembleDocumentShell` json's RAW
 * body — a concatenation of one `<g transform>` per node plus loose edge
 * `<path>`/`<ellipse>` elements. The jar emits `<defs/>` plus ONE content
 * `<g>` and nothing else (every cached golden under
 * `test-results/dot-cache/json/`), so the
 * root carried 5/8/17/44/95 children against the jar's 2. That is M2. It also
 * caused M4: `document-shell.ts#withRootGroupAttributes` only upgrades a body
 * that IS a single bare `<g>`, and silently returns anything else unchanged,
 * so the root group's `font-family`/`lengthAdjust` landed nowhere.
 *
 * The consequence was worse than the two mechanisms themselves —
 * `tests/oracle/svg-conformance/compare.ts` stops recursing at a structural
 * mismatch, so with the root mismatched on every one of the 92 fixtures, no
 * fixture's INTERIOR had ever been compared. Every diff count in the A5
 * ledger was a floor.
 *
 * `bodyWrapped` handling is `assembleStateShell`'s verbatim: an annotated
 * diagram has already been wrapped by `annotations/chrome.ts#applyChrome`
 * (which sets the flag), and wrapping it twice would restore the very
 * nesting this module exists to remove.
 *
 * @see plans/a5-json-family-conformance/ledger.md (M2, M4)
 */

import type { RenderFragment } from '../../core/dispatcher.js';
import { group, rect } from '../../core/svg.js';
import { assembleDocumentShell } from '../../core/klimt/document-shell.js';

/** The default (unset) diagram background — matches `theme.ts`'s own
 *  `colors.background: '#FFFFFF'` default. */
const DEFAULT_BACKGROUND = '#FFFFFF';

/**
 * The explicit content-level background rect the jar draws as the FIRST child
 * of the content `<g>` whenever the resolved background is non-default — on
 * top of (not instead of) the root `style="…background:…;"` attribute
 * `assembleDocumentShell` already emits. The identical mechanism
 * `assembleStateShell#maybeBackgroundRect` carries for state diagrams.
 *
 * jar-verified against all five non-default-background fixtures in this
 * family's cached corpus — `json/dapinu-10-dida560` (`#0B58A8`),
 * `yaml/gipoxa-19-bico146` (`#C0C0C0`), `yaml/najoba-05-nino350`,
 * `yaml/vapoda-87-piku740`, `yaml/tadari-70-nare798` — each
 * `<rect x="0" y="0" width="W" height="H" fill="{bg}" style="stroke:none;"/>`
 * with W/H the document's own final (truncated) dimensions. Fixtures with the
 * default background carry no such rect.
 *
 * Note the emitted style is `stroke:none;` ALONE, with no `stroke-width`:
 * that falls out of `core/svg.ts#strokeDecorationOf`, which drops both
 * `stroke-width` and `stroke-dasharray` under `stroke:none` exactly as
 * upstream's own single `if ("none".equals(stroke) == false)` guard does.
 */
function maybeBackgroundRect(fragment: RenderFragment): string {
  const background = fragment.background ?? DEFAULT_BACKGROUND;
  if (background === DEFAULT_BACKGROUND) return '';
  return rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), {
    fill: background,
    stroke: 'none',
  });
}

/**
 * @param fragment    - the json/yaml/hcl render fragment.
 * @param diagramType - the jar's `data-diagram-type` value. A STRING, not a
 *   boolean flag, because ONE renderer serves three diagram types — see
 *   `assemble-svg.ts`'s own note on why `jsonShell` is the odd one out.
 */
export function assembleJsonShell(fragment: RenderFragment, diagramType: string): string {
  const backgroundRect = fragment.bodyWrapped === true ? '' : maybeBackgroundRect(fragment);
  const body = fragment.bodyWrapped === true ? fragment.body : group(backgroundRect + fragment.body);
  return assembleDocumentShell({ ...fragment, body }, diagramType);
}
