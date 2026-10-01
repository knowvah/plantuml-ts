/**
 * T3d: `defaultTheme.colors.noteBackground` corrected from the unsourced
 * `#FEFECE` to upstream's actual light-mode default -- the root
 * `note { BackGroundColor: var(--note-background) }` block
 * (`plantuml.skin:3,324`), NOT the `@media (prefers-color-scheme:dark)`
 * override (`:678-680`, a separate `#714137`) and NOT the legacy
 * `ColorParam.COL_FBFB77` (`#FBFB77`) `plans/skinparam/decision-journal
 * .md` row 1 compared against -- the same class of mistake D2 already
 * caught for `classBackground` (the Style-system skin file wins over the
 * older ColorParam default).
 *
 * `noteBackground` is a SHARED field (`activity-renderer-shapes.ts`,
 * `description/renderer-note-opale.ts`, `description/renderer-entity.ts`,
 * `sequence/renderer.ts` all read it) -- covered end-to-end per consumer
 * below, not just the raw default.
 */
import { describe, it, expect } from 'vitest';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderSync } from '../../../src/index.js';

describe('T3d: defaultTheme.colors.noteBackground', () => {
  it('is #FEFFDD (plantuml.skin:3,324 root note{}), not the unsourced #FEFECE', () => {
    expect(defaultTheme.colors.noteBackground).toBe('#FEFFDD');
  });

  it('a plain sequence note fills with #FEFFDD', () => {
    const svg = renderSync('@startuml\nAlice -> Bob: hi\nnote right: a note\n@enduml');
    expect(svg).toContain('#FEFFDD');
    expect(svg).not.toContain('#FEFECE');
  });

  it('a plain description/entity note fills with #FEFFDD', () => {
    const svg = renderSync('@startuml\nusecase UC\nnote right of UC: a note\n@enduml');
    expect(svg).toContain('#FEFFDD');
    expect(svg).not.toContain('#FEFECE');
  });
});
