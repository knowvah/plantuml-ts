/**
 * SI20 T1 — publish-only: `MeasuredClassifier.portMemberSections` for
 * `object` leaves, populated from `class-object-sizing.ts
 * #buildFieldBasedObjectGeo`. Inert by construction — nothing reads this
 * field for an object leaf until T2 wires object into
 * `classPortShortNamesById` (`class-port-rows.ts`); see
 * plans/si20-object-row-ports/batch-2/T1-publish-port-bands.md and
 * ../decision-journal.md's T0 entry (`headerHeight` = T0's resolved `H` =
 * `title.height`, NOT `H + margin`).
 *
 * Calls `measureObjectClassifier` directly rather than going through
 * `layoutClass`: `ClassifierGeo` (class-geo-types.ts) does not carry
 * `portMemberSections` -- it is internal `MeasuredClassifier` plumbing
 * consumed only by `class-port-rows.ts`.
 */
import { describe, it, expect } from 'vitest';
import { measureObjectClassifier } from '../../../src/diagrams/class/class-object-sizing.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const theme = defaultTheme; // fontFamily 'sans-serif', fontSize 14

function objectClassifier(id: string, display: string, overrides?: Partial<Classifier>): Classifier {
  return { id, display, kind: 'object', typeParams: [], members: [], ...overrides };
}

describe('measureObjectClassifier — portMemberSections publish, visible fields', () => {
  it("carries T0's header value (title.height, not +margin) and each member's own build height", () => {
    const classifier = objectClassifier('user', 'user', {
      members: [
        { visibility: '+', name: 'name', type: '"Dummy"', isStatic: false, isAbstract: false },
        { visibility: '+', name: 'id', type: '123', isStatic: false, isAbstract: false },
      ],
    });
    const m = measureObjectClassifier(classifier, theme, measurer, false);
    // T0: plain object H = 18 = title.height, same value already published
    // via dividerYs[0] -- confirms this task surfaces an EXISTING term.
    expect(m.portMemberSections?.headerHeight).toBe(18);
    expect(m.portMemberSections?.headerHeight).toBe(m.dividerYs[0]);
    const fields = m.portMemberSections?.fields;
    expect(fields?.members).toHaveLength(2);
    expect(fields?.texts).toEqual(['name = "Dummy"', 'id = 123']);
    expect(fields?.builds).toHaveLength(2);
    expect(fields?.builds[0]!.height).toBe(14); // single text line -- fontSize
    expect(fields?.builds[1]!.height).toBe(14);
    expect(m.portMemberSections?.methods).toBeUndefined(); // object never has methods
  });

  it("raises headerHeight by the stereotype block's own height (T0's stereotyped control)", () => {
    const classifier = objectClassifier('foo3', 'foo3', {
      members: [{ visibility: '+', name: 'dummy', isStatic: false, isAbstract: false }],
      stereotype: 'azerty',
    });
    const m = measureObjectClassifier(classifier, theme, measurer, false);
    expect(m.portMemberSections?.headerHeight).toBe(30); // 18 + 12 stereotype block
  });
});

describe('measureObjectClassifier — portMemberSections publish, suppression', () => {
  it('OMITS the fields compartment entirely (not an empty one) when the member section is suppressed', () => {
    const classifier = objectClassifier('user', 'user', {
      members: [{ visibility: '+', name: 'name', isStatic: false, isAbstract: false }],
    });
    const m = measureObjectClassifier(classifier, theme, measurer, /* suppressMemberSection */ true);
    expect(m.portMemberSections?.headerHeight).toBe(18);
    expect(m.portMemberSections).not.toHaveProperty('fields');
  });

  it('keeps the fields compartment PRESENT, with zero members, for an empty-but-SHOWN field list', () => {
    const classifier = objectClassifier('foo', 'foo'); // no members; showFields defaults true
    const m = measureObjectClassifier(classifier, theme, measurer, false);
    // sanity: this control IS the shown-but-empty placeholder state, distinct
    // from suppression -- both are "empty" but must not collapse.
    expect(m.emptyFieldPlaceholder).toBe(true);
    expect(m.portMemberSections).toHaveProperty('fields');
    expect(m.portMemberSections?.fields?.members).toHaveLength(0);
    expect(m.portMemberSections?.fields?.builds).toHaveLength(0);
    expect(m.portMemberSections?.fields?.texts).toHaveLength(0);
  });
});

describe('measureObjectClassifier — portMemberSections publish, enhanced body (out of T1 scope)', () => {
  it('leaves portMemberSections undefined for the enhanced-body branch (buildEnhancedObjectGeo untouched)', () => {
    const classifier = objectClassifier('foo', 'foo', { rawBodyLines: ['--'] });
    const m = measureObjectClassifier(classifier, theme, measurer, false);
    expect(m.enhancedBody).toBeDefined(); // sanity: this control DID trigger the enhanced branch
    expect(m.portMemberSections).toBeUndefined();
  });
});
