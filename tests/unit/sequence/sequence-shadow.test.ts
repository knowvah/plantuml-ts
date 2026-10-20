/**
 * sdd1 T3b: the shadow `<filter>` def follows each element's OWN merged
 * style, captured when its command ran (D2), not one document-wide
 * resolution.
 *
 * `SvgGraphics#manageShadow` appends the filter the first time a shape with a
 * non-zero delta is drawn (`SvgGraphics.java:1071-1090`), so the def exists
 * exactly when some drawn shape is shadowed. Each component's delta is its
 * own style's `getShadowing()` (`Style.java:108-115`): the activation box
 * gates a fixed 1 on it (`ComponentRoseActiveLine.java:82-83`), the divider
 * draws it (`ComponentRoseDivider.java:74,100,115`), a grouping frame's
 * background rect reads the body style's symbol context
 * (`ComponentRoseGroupingHeader.java:81,126-131`), a ref its body's
 * (`ComponentRoseReference.java:73,89-94`).
 *
 * The end-to-end expectations were read off jar renders of the same sources
 * (`scripts/oracle-render.sh`, oracle jar, 2026-10-20): which elements carry
 * `filter=`, in document order, and whether `<defs>` holds the filter.
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { EventGeo, FrameGeo, ParticipantGeo } from '../../../src/diagrams/sequence/ast.js';
import { renderSync } from '../../../src/index.js';
import type { SequenceShadowing } from '../../../src/core/sequence-shadowing.js';
import type { SequencePaint } from '../../../src/diagrams/sequence/sequence-skin-param.js';
import {
  activationShadowFilter,
  frameShadowDelta,
  sequenceShadowDefs,
  sequenceShadowFilterDef,
} from '../../../src/diagrams/sequence/sequence-shadow.js';

const RE_DEFS = /<defs>.*?<\/defs>|<defs\/>/;
const RE_SHADOWED = /<(\w+)\b[^>]*filter="url\(#([^)]+)\)"/g;

interface ShadowSummary {
  /** Whether `<defs>` holds the shadow `<filter>`. */
  readonly filterDef: boolean;
  /** The shadowed elements' tags, in document order. */
  readonly shadowed: readonly string[];
  /** Every shadowed element references a filter the page defines. */
  readonly resolved: boolean;
}

function summary(body: string): ShadowSummary {
  const svg = renderSync(`@startuml\n${body}\n@enduml`, { measurer: new DeterministicMeasurer() });
  const defs = RE_DEFS.exec(svg)?.[0] ?? '';
  const refs = [...svg.replace(RE_DEFS, '').matchAll(RE_SHADOWED)];
  return {
    filterDef: defs.includes('<filter'),
    shadowed: refs.map((m) => m[1]!),
    resolved: refs.every((m) => defs.includes(`<filter id="${m[2]!}"`)),
  };
}

describe('sequence shadows per element (jar renders)', () => {
  it('draws no shadow and no filter under the default skin (plantuml.skin:18,92)', () => {
    const body = [
      'participant A',
      'actor B',
      'A -> B : one',
      'activate B',
      'note over A : n',
      '== div ==',
      'group g',
      'B -> A : two',
      'end',
      'ref over A, B : r',
      'deactivate B',
    ];
    expect(summary(body.join('\n'))).toEqual({ filterDef: false, shadowed: [], resolved: true });
  });

  it('shadows only the elements after a mid-diagram `skinparam shadowing true` (D2)', () => {
    // Jar: the activation box, the divider band and label, the later note;
    // not the heads, the first note or the messages.
    const body = [
      'participant A',
      'participant B',
      'A -> B : one',
      'note over A : before',
      'skinparam shadowing true',
      '== div ==',
      'A -> B ++ : two',
      'note over A : after',
      'B --> A -- : back',
    ];
    expect(summary(body.join('\n'))).toEqual({
      filterDef: true,
      shadowed: ['rect', 'rect', 'rect', 'path'],
      resolved: true,
    });
  });

  it('emits no filter when `skinparam shadowing true` follows every element', () => {
    // A document-wide resolution sees the skinparam and shadows nothing drawn.
    const body = ['participant A', 'A -> A : one', '== div ==', 'activate A', 'A -> A : two', 'deactivate A'];
    expect(summary([...body, 'skinparam shadowing true'].join('\n'))).toEqual({
      filterDef: false,
      shadowed: [],
      resolved: true,
    });
  });

  it('keeps the filter for a divider shadowed before a later `separator { Shadowing 0 }`', () => {
    const body = [
      '<style>',
      'separator { Shadowing 3 }',
      '</style>',
      'participant A',
      'A -> A : one',
      '== div ==',
      '<style>',
      'separator { Shadowing 0 }',
      '</style>',
      'A -> A : two',
    ];
    expect(summary(body.join('\n'))).toEqual({ filterDef: true, shadowed: ['rect', 'rect'], resolved: true });
  });

  it('keeps the filter for an activation shadowed before a later `activationBox { Shadowing 0 }`', () => {
    const body = [
      '<style>',
      'activationBox { Shadowing 3 }',
      '</style>',
      'participant A',
      'participant B',
      'A -> B : one',
      'activate B',
      'B -> A : back',
      'deactivate B',
      '<style>',
      'activationBox { Shadowing 0 }',
      '</style>',
      'A -> B : two',
    ];
    expect(summary(body.join('\n'))).toEqual({ filterDef: true, shadowed: ['rect'], resolved: true });
  });

  it('shadows a note and an rnote from `<style> note { Shadowing 4 }` (Note.java:75-82)', () => {
    const body = ['<style>', 'note { Shadowing 4 }', '</style>', 'participant A', 'A -> A : one'];
    expect(summary([...body, 'note over A : a note', 'rnote over A : an rnote'].join('\n'))).toEqual({
      filterDef: true,
      shadowed: ['path', 'rect'],
      resolved: true,
    });
  });
});

/**
 * A paint whose only readable field is `shadowing`: the defs predicate must
 * read nothing else, since a style's other values can throw on read
 * (`paintOf`'s lazy getters, `sequence-skin-param.ts`).
 */
function shadowOnlyPaint(shadowing: number): SequencePaint {
  const handler: ProxyHandler<object> = {
    get(_target, key) {
      if (key === 'shadowing') return shadowing;
      throw new Error(`unexpected paint read: ${String(key)}`);
    },
  };
  return new Proxy({}, handler) as SequencePaint;
}

function activation(shadowing: number, height = 10): EventGeo {
  return {
    kind: 'activation',
    paint: shadowOnlyPaint(shadowing),
    participantId: 'A',
    lifelineX: 0,
    y: 0,
    height,
    level: 1,
  };
}

function divider(shadowing: number | undefined): EventGeo {
  return {
    kind: 'divider',
    ...(shadowing === undefined ? {} : { paint: shadowOnlyPaint(shadowing) }),
    text: 'd',
    lines: ['d'],
    y: 0,
    bandX: 0,
    bandWidth: 10,
    height: 10,
    textWidth: 5,
    textHeight: 5,
    labelRuns: [],
  };
}

function frame(frameType: string, shadowing?: number): FrameGeo {
  return {
    kind: 'frame',
    ...(shadowing === undefined ? {} : { paint: shadowOnlyPaint(shadowing) }),
    frameType,
    label: '',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    branchSeparators: [],
    refBody: [],
    tabText: '',
    tabTextWidth: 0,
    tabWidth: 0,
    tabHeight: 0,
    tabRuns: [],
  };
}

const SCALED = { ...defaultTheme, scaleK: 1 };
const NO_PARTICIPANTS: ParticipantGeo[] = [];

function defsOf(events: EventGeo[], theme = SCALED): string {
  return sequenceShadowDefs({ events, participants: NO_PARTICIPANTS }, theme);
}

describe('sequenceShadowDefs reads each element’s own paint', () => {
  it('emits the filter for a shadowed activation box', () => {
    expect(defsOf([activation(3)])).toBe(sequenceShadowFilterDef(1));
  });

  it('emits nothing for a zero-height activation box (ComponentRoseActiveLine.java:76-77)', () => {
    expect(defsOf([activation(3, 0)])).toBe('');
  });

  it('emits nothing for an unshadowed activation box or divider', () => {
    expect(defsOf([activation(0), divider(0)])).toBe('');
  });

  it('emits the filter for a shadowed divider, at the document scale', () => {
    expect(defsOf([divider(2)], { ...SCALED, scaleK: 0.5 })).toBe(sequenceShadowFilterDef(0.5));
  });

  it('throws for a divider layout left unpainted, as its renderer does', () => {
    expect(() => defsOf([divider(undefined)])).toThrow('divider "d" carries no paint');
  });

  it('emits the filter for a shadowed note and a shadowed head', () => {
    const note = { kind: 'note', shadow: 4 } as EventGeo;
    expect(defsOf([note])).toBe(sequenceShadowFilterDef(1));
    const head = { shadow: 3 } as ParticipantGeo;
    expect(sequenceShadowDefs({ events: [], participants: [head] }, SCALED)).toBe(sequenceShadowFilterDef(1));
  });

  it('ignores a message, which draws no shadow', () => {
    expect(defsOf([{ kind: 'message' } as EventGeo])).toBe('');
  });
});

describe('frameShadowDelta', () => {
  it("reads a painted frame's own style, for a group and a ref alike", () => {
    expect([frameShadowDelta(frame('group', 3), SCALED), frameShadowDelta(frame('ref', 2), SCALED)]).toEqual([3, 2]);
    expect(defsOf([frame('alt', 3)])).toBe(sequenceShadowFilterDef(1));
  });

  it('falls back to the document resolution for a frame layout has not painted yet', () => {
    const sequenceShadowing: SequenceShadowing = {
      group: 3,
      reference: 2,
      activation: 0,
      divider: 0,
      participant: () => 0,
      note: () => 0,
    };
    const theme = { ...SCALED, colors: { ...SCALED.colors, graph: { ...SCALED.colors.graph, sequenceShadowing } } };
    expect([frameShadowDelta(frame('group'), theme), frameShadowDelta(frame('ref'), theme)]).toEqual([3, 2]);
    expect(frameShadowDelta(frame('group'), SCALED)).toBe(0);
  });
});

describe('activationShadowFilter', () => {
  it('gates a fixed delta of 1 on the style (ComponentRoseActiveLine.java:82-83)', () => {
    expect(activationShadowFilter(shadowOnlyPaint(4))).toEqual({ filter: 'url(#sequenceShadow)' });
    expect(activationShadowFilter(shadowOnlyPaint(0))).toEqual({});
  });
});
