/**
 * Draws a `PSystemError` (and the black-on-white Welcome / Unsupported pages)
 * to SVG.
 *
 * This is the drawing half of upstream's `PSystemError#getTextBlock` and
 * `GraphicStrings`, composed out of `error-block.ts`'s `TextBlock` model:
 * the error page proper (`error-page-exact.ts`), the Welcome block with the
 * PlantUML logo stacked on top of it when the source is shorter than 5
 * lines, and the Arecibo image beside it when the source mentions
 * "arecibo" (unwind2-S8). The document ROOT goes through
 * `core/klimt/document-shell.ts#assembleDocumentShell` (CDD T32) with
 * `diagramType: undefined`: the jar's error/Welcome/Unsupported pages carry
 * no `data-diagram-type` root attribute.
 *
 * The time-based decorations are not drawn: see {@link renderPSystemError}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemError.java#getTextBlock
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/GraphicStrings.java
 */

import type { StringMeasurer } from '../measurer.js';
import { ARECIBO_IMAGE } from './arecibo-image.js';
import { imageBlock, mergeLR, mergeTB, renderErrorBlock } from './error-block.js';
import type { ErrorBlock } from './error-block.js';
import { errorPageBlock } from './error-page-exact.js';
import { blackOnWhite } from './graphic-strings.js';
import type { GraphicPosition } from './graphic-strings.js';
import { PLANTUML_LOGO } from './plantuml-logo.js';
import type { PSystemError } from './PSystemError.js';
import { PSystemWelcome } from './PSystemWelcome.js';
import type { PSystemUnsupported } from './PSystemUnsupported.js';

// --- Public API ---------------------------------------------------------

/** Welcome block placement on an error page (`PSystemError.java:255-258`). */
const WELCOME_ON_ERROR: GraphicPosition = 'BACKGROUND_CORNER_TOP_RIGHT';

/** `getSource().containsIgnoreCase("arecibo")` (`PSystemError.java:230`). */
const ARECIBO = 'arecibo';

/**
 * Render the error diagram (`PSystemError#getTextBlock`,
 * `PSystemError.java:214-235`): the Welcome block (with the logo) on top for
 * a source of fewer than 5 lines, and the Arecibo image to the right when
 * the source mentions it.
 *
 * Upstream picks ONE decoration from the clock first --
 * `System.currentTimeMillis() / 60000L % 60`: a Patreon banner at minutes
 * 1/8/13/55, Liberapay at 15, a dedication at 30/39/48 -- and reaches the
 * Arecibo branch only on the other 52 minutes (`:221-231`). `src/` reads no
 * clock, and the oracle jar has no deterministic switch for it
 * (`PSystemError.disableTimeBasedErrorDecorations()` exists, `:87-89`, but
 * nothing calls it); this draws what the jar draws on those 52 minutes,
 * which is what every cached error-page golden shows.
 */
export function renderPSystemError(system: PSystemError, measurer: StringMeasurer): string {
  let result: ErrorBlock = errorPageBlock(system, measurer);
  if (system.getTotalLineCountLessThan5()) {
    const welcome = new PSystemWelcome(WELCOME_ON_ERROR);
    result = mergeTB(welcomeBlock(welcome, measurer), result);
  }
  if (system.containsIgnoreCase(ARECIBO)) result = mergeLR(result, imageBlock(ARECIBO_IMAGE));
  return renderErrorBlock(result);
}

/** `PSystemWelcome#getTextBlock`: the logo only when placed. @see PSystemWelcome.java */
function welcomeBlock(system: PSystemWelcome, measurer: StringMeasurer): ErrorBlock {
  const position = system.getPosition();
  return position === undefined
    ? blackOnWhite(system.getStrings(), measurer)
    : blackOnWhite(system.getStrings(), measurer, { img: PLANTUML_LOGO, position });
}

/** @see ~/git/plantuml/.../error/PSystemUnsupported.java#getTextBlock */
export function renderPSystemUnsupported(system: PSystemUnsupported, measurer: StringMeasurer): string {
  const position: GraphicPosition = 'BACKGROUND_CORNER_TOP_RIGHT';
  return renderErrorBlock(blackOnWhite(system.getStrings(), measurer, { img: PLANTUML_LOGO, position }));
}

/** @see ~/git/plantuml/.../eggs/PSystemWelcome.java#getTextBlock */
export function renderPSystemWelcome(system: PSystemWelcome, measurer: StringMeasurer): string {
  return renderErrorBlock(welcomeBlock(system, measurer));
}
