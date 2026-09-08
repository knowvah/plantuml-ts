/**
 * `ELEMENT_BUCKET_SNAMES` — the activity SNames added by the
 * `activity-style-defaults` mission (T1, D3), and the blast-radius proof
 * that adding them moves nothing else.
 *
 * The project's existing homes for this machinery are
 * `tests/unit/core/style-map-element.test.ts` (selector routing) and
 * `tests/unit/skinparam.test.ts` (key translation); neither is in T1's
 * write-set, so this file carries T1's own assertions and defers to those
 * two for everything that predates the mission.
 *
 * WHY THESE FOUR AND NO OTHERS (D3): `activity`, `activityBar`, `diamond`
 * and `swimlane` are EXCLUSIVE to activitydiagram3, so admitting them
 * cannot change which selector spellings resolve for any other engine.
 * `arrow`, `note`, `circle` and `composite` are SHARED SNames already
 * routed by description/class/state — activity reads its own DEFAULTS for
 * those from `diagrams/activity/activity-style-defaults.ts` (D2), because
 * the bucket map is FLAT (`style-map-element.ts#resolveElementBucketSelector`
 * collapses `<diagramType>.<sname>` to the bare `sname`) and so cannot hold
 * a diagram-scoped default.
 */
import { describe, it, expect } from 'vitest';

import {
  ELEMENT_BUCKET_SNAMES,
  matchElementColorKey,
  matchElementFontSizeKey,
} from '../../../src/core/skinparam-element-buckets.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { resolveTheme } from '../../../src/core/theme.js';
import { resolveSkinparam, parseStyleBlock } from '../../../src/core/skinparam.js';
import type { StyleMap } from '../../../src/core/skinparam.js';
import { applyStyleMap } from '../../../src/core/style-map-theme.js';
import { resolveElementFontSize, resolveElementLineThickness } from '../../../src/core/theme-element-resolve.js';
import type { Theme } from '../../../src/core/theme.js';

/** Resolves a fixture's theme through the same stages the engine helpers
 * use (`render-fixture-activity.ts#buildThemeForFixture`, minus the skin
 * layer this file has no fixture for): skinparam, then the flat root style
 * block, then the style map. */
function themeFor(markup: string): Theme {
  const first = buildBlockUmls(markup)[0];
  if (first === undefined) throw new Error('no diagram block');
  if (!first.ok) throw first.failure.cause;
  const pre = first.preprocessed;
  const withSkinparam = resolveSkinparam(pre.skinparam, resolveTheme(pre.theme ?? 'default')).theme;
  const styleMap = pre.styles.map(parseStyleBlock).reduce<StyleMap>((acc, m) => {
    m.forEach((props, selector) => {
      const existing = acc.get(selector) ?? new Map<string, string>();
      props.forEach((v, k) => existing.set(k, v));
      acc.set(selector, existing);
    });
    return acc;
  }, new Map());
  const withStyles = resolveSkinparam(styleMap.get('') ?? new Map<string, string>(), withSkinparam).theme;
  return applyStyleMap(styleMap, withStyles);
}

describe('ELEMENT_BUCKET_SNAMES — activity SNames (T1, D3)', () => {
  it('carries exactly the four activity-exclusive SNames', () => {
    for (const sname of ['activity', 'activitybar', 'diamond', 'swimlane']) {
      expect(ELEMENT_BUCKET_SNAMES.has(sname), `${sname} must be a bucket SName`).toBe(true);
    }
  });

  it('does NOT carry the shared SNames D3 forbids', () => {
    for (const sname of ['arrow', 'circle', 'composite']) {
      expect(
        ELEMENT_BUCKET_SNAMES.has(sname),
        `${sname} is a SHARED SName: admitting it here would change which selector spellings ` +
          `resolve for description, class and state too, not just activity (D3). Activity's own ` +
          `default for it lives in diagrams/activity/activity-style-defaults.ts (D2).`,
      ).toBe(false);
    }
  });

  it('leaves `note` exactly as G2 N34 left it — present, and NOT added by this mission', () => {
    // `note` was already a bucket SName for the CLASS diagram (G2 N34). D3
    // forbids activity from *relying* on it, not from its existing presence.
    expect(ELEMENT_BUCKET_SNAMES.has('note')).toBe(true);
  });
});

describe('activity SNames reach the skinparam key matchers', () => {
  it('`skinparam DiamondFontSize N` matches the diamond bucket', () => {
    expect(matchElementFontSizeKey('diamondfontsize')).toEqual({ sname: 'diamond', role: 'fontSize' });
  });

  it('`skinparam ActivityBackgroundColor X` matches the activity bucket', () => {
    expect(matchElementColorKey('activitybackgroundcolor')).toEqual({ sname: 'activity', role: 'background' });
  });

  it('`skinparam SwimlaneFontSize N` matches the swimlane bucket', () => {
    expect(matchElementFontSizeKey('swimlanefontsize')).toEqual({ sname: 'swimlane', role: 'fontSize' });
  });

  it('`skinparam ActivityBarBackgroundColor X` matches the activityBar bucket', () => {
    expect(matchElementColorKey('activitybarbackgroundcolor')).toEqual({ sname: 'activitybar', role: 'background' });
  });
});

describe('end-to-end: an activity override reaches resolveElement*', () => {
  it('`skinparam DiamondFontSize 40` resolves to 40 — the filed activity-diamond-font-skinparams', () => {
    const theme = themeFor('@startuml\nskinparam DiamondFontSize 40\nif (a?) then (y)\n:x;\nendif\n@enduml');
    expect(resolveElementFontSize(theme, 'diamond', 'title')).toBe(40);
  });

  it('the NESTED `<style> activityDiagram { activity { FontSize 20 } }` form resolves to 20', () => {
    // T1's AC1. This needed `activitydiagram` in `DIAGRAM_TYPE_SELECTOR_NAMES`
    // (`style-map-element.ts`): `parseStyleBlock` yields the selector
    // `activitydiagram.activity`, and before that entry existed the selector
    // matched neither a bare bucket name nor a recognized prefix and was
    // silently dropped. Upstream's own signature is diagram-scoped in exactly
    // this shape -- `StyleSignatureBasic.of(root, element, activityDiagram,
    // activity)`, `activitydiagram3/ftile/vertical/FtileBox.java:98`.
    const theme = themeFor(
      '@startuml\n<style>\nactivityDiagram {\n  activity { FontSize 20 }\n}\n</style>\n:hello;\n@enduml',
    );
    expect(resolveElementFontSize(theme, 'activity', 'title')).toBe(20);
  });

  it('the nested form reaches `diamond` too — a SIBLING of activity in the skin, not a child', () => {
    // `plantuml.skin:358-385` writes `diamond` beside `activity` inside the
    // `activityDiagram { }` block, so the selector is
    // `activitydiagram.diamond` and NOT `activitydiagram.activity.diamond` --
    // even though upstream's runtime signature for the rhombus is the longer
    // `of(root, element, activityDiagram, activity, diamond)`
    // (`ftile/FtileFactoryDelegator.java:80`). The skin's own spelling is
    // what a user copies, and it is the one this resolves.
    const theme = themeFor(
      '@startuml\n<style>\nactivityDiagram {\n  diamond { FontSize 9 }\n}\n</style>\nif (a?) then (y)\n:x;\nendif\n@enduml',
    );
    expect(resolveElementFontSize(theme, 'diamond', 'title')).toBe(9);
  });

  it('the nested form carries `RoundCorner` into the bucket, raw and unhalved (D4)', () => {
    const theme = themeFor(
      '@startuml\n<style>\nactivityDiagram {\n  activity { RoundCorner 25 }\n}\n</style>\n:hello;\n@enduml',
    );
    expect(theme.colors.elements?.['activity']?.roundCorner).toBe(25);
  });

  it('a bare `<style> activity { FontSize 20 }` block resolves to 20', () => {
    const theme = themeFor('@startuml\n<style>\nactivity { FontSize 20 }\n</style>\n:hello;\n@enduml');
    expect(resolveElementFontSize(theme, 'activity', 'title')).toBe(20);
  });

  it('a bare `<style> swimlane { LineThickness 3 }` block resolves to 3', () => {
    const theme = themeFor('@startuml\n<style>\nswimlane { LineThickness 3 }\n</style>\n|a|\n:hello;\n@enduml');
    expect(resolveElementLineThickness(theme, 'swimlane')).toBe(3);
  });

  it('the default theme declares NO activity bucket — the caller applies its own default (D2)', () => {
    const theme = resolveTheme('default');
    for (const sname of ['activity', 'diamond', 'swimlane', 'activitybar']) {
      expect(
        resolveElementFontSize(theme, sname, 'title'),
        `seeding defaultTheme.colors.elements.${sname} is D2's forbidden move: the bucket is FLAT, ` +
          `so a default there would move every other engine that shares the SName.`,
      ).toBeUndefined();
      expect(resolveElementLineThickness(theme, sname)).toBeUndefined();
    }
  });
});

describe('blast radius: no other engine s resolved theme moves (D3)', () => {
  it('the default theme resolves no element bucket at all, for any SName', () => {
    // The proof D3's acceptance criterion asks for, at its root: adding a
    // name to the ALLOWLIST cannot change a resolved value unless some
    // source actually declares that name. `defaultTheme` declares none, so
    // every engine's untouched default is untouched by construction.
    expect(resolveTheme('default').colors.elements).toBeUndefined();
  });

  it('a class-diagram `<style> class { FontSize 30 }` still resolves through the class bucket', () => {
    const theme = themeFor('@startuml\n<style>\nclass { FontSize 30 }\n</style>\nclass A\n@enduml');
    // `class` is NOT a bucket SName (it keeps its own explicit
    // resolveSkinparam case, see ELEMENT_BUCKET_SNAMES' doc comment), so
    // this asserts the pre-existing routing is untouched, not that it
    // suddenly buckets.
    expect(ELEMENT_BUCKET_SNAMES.has('class')).toBe(false);
    expect(resolveElementFontSize(theme, 'class', 'title')).toBeUndefined();
  });

  it('a description-diagram `<style> component { FontSize 30 }` still resolves to 30', () => {
    const theme = themeFor('@startuml\n<style>\ncomponent { FontSize 30 }\n</style>\ncomponent A\n@enduml');
    expect(resolveElementFontSize(theme, 'component', 'title')).toBe(30);
  });

  it('adding the `activitydiagram` prefix widens the SHARED note bucket — upstream behavior, asserted not accidental', () => {
    // Recording the one cross-engine consequence of admitting
    // `activitydiagram` to `DIAGRAM_TYPE_SELECTOR_NAMES`: the nested form now
    // feeds the SAME `note` bucket a class diagram's bare `note { ... }`
    // feeds. That IS upstream -- a note inside an activity diagram carries
    // `SName.note` under `SName.activityDiagram`
    // (`ftile/vcompact/FtileWithNoteOpale.java:89`). Pinned so a future
    // reader meets it as a decision rather than as a surprise.
    const theme = themeFor(
      '@startuml\n<style>\nactivityDiagram {\n  note { FontSize 13 }\n}\n</style>\n:hello;\nnote right\n  n\nend note\n@enduml',
    );
    expect(resolveElementFontSize(theme, 'note', 'title')).toBe(13);
  });

  it('an UNRECOGNIZED diagram-type prefix is still dropped — the allowlist is still an allowlist', () => {
    const theme = themeFor(
      '@startuml\n<style>\nmindmapDiagram {\n  node { FontSize 30 }\n}\n</style>\nclass A\n@enduml',
    );
    expect(resolveElementFontSize(theme, 'node', 'title')).toBeUndefined();
  });
});
