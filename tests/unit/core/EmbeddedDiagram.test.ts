/**
 * EmbeddedDiagram.test.ts — T10f: coverage for `EmbeddedDiagram.java`'s
 * port (`net.sourceforge.plantuml.EmbeddedDiagram`, root package).
 * Covers `getEmbeddedType`'s text-scan dispatch, `createAndSkip`'s
 * line-collection algorithm (including the nested-`{{ }}` case), and the
 * `Line`/`Atom` surface bound to an injected `NestedDiagramRenderer`.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  EmbeddedDiagram,
  getEmbeddedType,
  type NestedDiagramRenderer,
} from '../../../src/core/EmbeddedDiagram.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { Back } from '../../../src/core/klimt/Back.js';
import type { TextBlock } from '../../../src/core/klimt/shape/TextBlock.js';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import type { ISkinSimple } from '../../../src/core/style/ISkinSimple.js';

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

interface DrawCall {
  readonly shape: UShape;
  readonly translate: UTranslate;
  readonly bg: string | undefined;
}

/** Records every `draw(shape)` call together with the active translate and
 *  background paint -- this project's established per-file UGraphic-double
 *  convention (`AtomTable.test.ts`'s `RecordingUGraphic`). */
class RecordingUGraphic implements UGraphic {
  constructor(
    readonly draws: DrawCall[] = [],
    private readonly translate: UTranslate = UTranslate.none(),
    private readonly bg?: string,
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.draws, this.translate.compose(change), this.bg);
    if (change instanceof Back) return new RecordingUGraphic(this.draws, this.translate, change.getBackColor() as string);
    return this;
  }

  draw(shape: UShape): void {
    this.draws.push({ shape, translate: this.translate, bg: this.bg });
  }

  getParam(): never {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return sb;
  }
}

/** A minimal `TextBlock` double a `NestedDiagramRenderer` might return. */
function fakeTextBlock(width: number, height: number): TextBlock & { drawCalls: UGraphic[] } {
  const drawCalls: UGraphic[] = [];
  return {
    drawCalls,
    calculateDimension: (): XDimension2D => new XDimension2D(width, height),
    drawU: (ug: UGraphic): void => {
      drawCalls.push(ug);
      ug.draw({});
    },
  };
}

function iterOf(lines: readonly string[]): Iterator<string> {
  return lines[Symbol.iterator]();
}

// ---------------------------------------------------------------------------
// getEmbeddedType (java:257-366)
// ---------------------------------------------------------------------------

describe('getEmbeddedType', () => {
  it('returns null for a non-"{{"-prefixed line', () => {
    expect(getEmbeddedType('hello world')).toBeNull();
  });

  it('returns null for a line with no "{{" at all', () => {
    expect(getEmbeddedType('')).toBeNull();
  });

  it('bare "{{" (nothing else) is "uml"', () => {
    expect(getEmbeddedType('{{')).toBe('uml');
  });

  it('leading/trailing whitespace is skipped before matching', () => {
    expect(getEmbeddedType('   {{salt   ')).toBe('salt');
  });

  it('matches every declared keyword exactly', () => {
    expect(getEmbeddedType('{{board')).toBe('board');
    expect(getEmbeddedType('{{creole')).toBe('creole');
    expect(getEmbeddedType('{{chronology')).toBe('chronology');
    expect(getEmbeddedType('{{chen')).toBe('chen');
    expect(getEmbeddedType('{{chart')).toBe('chart');
    expect(getEmbeddedType('{{ditaa')).toBe('ditaa');
    expect(getEmbeddedType('{{ebnf')).toBe('ebnf');
    expect(getEmbeddedType('{{files')).toBe('files');
    expect(getEmbeddedType('{{gantt')).toBe('gantt');
    expect(getEmbeddedType('{{json')).toBe('json');
    expect(getEmbeddedType('{{mindmap')).toBe('mindmap');
    expect(getEmbeddedType('{{nwdiag')).toBe('nwdiag');
    expect(getEmbeddedType('{{packetdiag')).toBe('packetdiag');
    expect(getEmbeddedType('{{regex')).toBe('regex');
    expect(getEmbeddedType('{{salt')).toBe('salt');
    expect(getEmbeddedType('{{uml')).toBe('uml');
    expect(getEmbeddedType('{{wbs')).toBe('wbs');
    expect(getEmbeddedType('{{wire')).toBe('wire');
    expect(getEmbeddedType('{{yaml')).toBe('yaml');
  });

  it('an unknown keyword with a recognized first character returns null', () => {
    expect(getEmbeddedType('{{boardgame')).toBeNull();
  });

  it('a first character with no candidate keywords at all returns null', () => {
    expect(getEmbeddedType('{{zzz')).toBeNull();
  });

  it('closing "}}" alone is not an embedded-type opener', () => {
    expect(getEmbeddedType('}}')).toBeNull();
  });

  it('a leading non-breaking space (U+00A0) is NOT skipped as whitespace -- Java\'s isWhitespace excludes it too', () => {
    expect(getEmbeddedType(' {{salt')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createAndSkip (java:97-115)
// ---------------------------------------------------------------------------

describe('EmbeddedDiagram.createAndSkip', () => {
  it('construction alone never invokes the renderer (lazy, memoized on first use)', () => {
    const spy = vi.fn((): TextBlock => fakeTextBlock(1, 1));
    EmbeddedDiagram.createAndSkip('salt', iterOf(['a', 'b', '}}', 'unreached']), null, { render: spy });
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('the wrapped source is exactly @start<type>, collected lines, @end<type> (outer terminator excluded)', () => {
    let seenSource: readonly string[] | undefined;
    const capturing: NestedDiagramRenderer = {
      render: (source) => {
        seenSource = source;
        return fakeTextBlock(1, 1);
      },
    };
    const diagram = EmbeddedDiagram.createAndSkip('salt', iterOf(['{a}', 'b', '}}', 'unreached']), null, capturing);
    diagram.calculateDimension(sb);
    expect(seenSource).toEqual(['@startsalt', '{a}', 'b', '@endsalt']);
  });

  it('a NESTED embedded block\'s own "}}" is appended (only the outer terminator is swallowed)', () => {
    let seenSource: readonly string[] | undefined;
    const capturing: NestedDiagramRenderer = {
      render: (source) => {
        seenSource = source;
        return fakeTextBlock(1, 1);
      },
    };
    // "{{salt" opens a nested block (nested: 1 -> 2). The first "}}" closes
    // THAT nested block (nested: 2 -> 1, still > 0, so it IS appended). The
    // second "}}" closes the outer block (nested: 1 -> 0, swallowed).
    const lines = ['before', '{{salt', 'inner', '}}', 'after', '}}', 'unreached'];
    const diagram = EmbeddedDiagram.createAndSkip('uml', iterOf(lines), null, capturing);
    diagram.calculateDimension(sb);
    expect(seenSource).toEqual([
      '@startuml',
      'before',
      '{{salt',
      'inner',
      '}}',
      'after',
      '@enduml',
    ]);
  });

  it('bare "{{" also opens a nested block (getEmbeddedType returns "uml", non-null)', () => {
    let seenSource: readonly string[] | undefined;
    const capturing: NestedDiagramRenderer = {
      render: (source) => {
        seenSource = source;
        return fakeTextBlock(1, 1);
      },
    };
    const lines = ['{{', 'inner', '}}', '}}'];
    const diagram = EmbeddedDiagram.createAndSkip('uml', iterOf(lines), null, capturing);
    diagram.calculateDimension(sb);
    expect(seenSource).toEqual(['@startuml', '{{', 'inner', '}}', '@enduml']);
  });

  it('an iterator that runs out before a closing "}}" collects everything seen', () => {
    let seenSource: readonly string[] | undefined;
    const capturing: NestedDiagramRenderer = {
      render: (source) => {
        seenSource = source;
        return fakeTextBlock(1, 1);
      },
    };
    const diagram = EmbeddedDiagram.createAndSkip('salt', iterOf(['only', 'these']), null, capturing);
    diagram.calculateDimension(sb);
    expect(seenSource).toEqual(['@startsalt', 'only', 'these', '@endsalt']);
  });

  it('a "}}" surrounded by whitespace still terminates (trim2 semantics)', () => {
    let seenSource: readonly string[] | undefined;
    const capturing: NestedDiagramRenderer = {
      render: (source) => {
        seenSource = source;
        return fakeTextBlock(1, 1);
      },
    };
    const diagram = EmbeddedDiagram.createAndSkip('salt', iterOf(['x', '  }}  ', 'unreached']), null, capturing);
    diagram.calculateDimension(sb);
    expect(seenSource).toEqual(['@startsalt', 'x', '@endsalt']);
  });

  it('an empty-string line is never mistaken for the "}}" terminator (trim2\'s len===0 fast path)', () => {
    let seenSource: readonly string[] | undefined;
    const capturing: NestedDiagramRenderer = {
      render: (source) => {
        seenSource = source;
        return fakeTextBlock(1, 1);
      },
    };
    const diagram = EmbeddedDiagram.createAndSkip('salt', iterOf(['', 'x', '}}']), null, capturing);
    diagram.calculateDimension(sb);
    expect(seenSource).toEqual(['@startsalt', '', 'x', '@endsalt']);
  });

  it('a whitespace-only line (all chars <= 0x20) is not the terminator either (trim2\'s all-trimmed fast path)', () => {
    let seenSource: readonly string[] | undefined;
    const capturing: NestedDiagramRenderer = {
      render: (source) => {
        seenSource = source;
        return fakeTextBlock(1, 1);
      },
    };
    const diagram = EmbeddedDiagram.createAndSkip('salt', iterOf(['   ', 'x', '}}']), null, capturing);
    diagram.calculateDimension(sb);
    expect(seenSource).toEqual(['@startsalt', '   ', 'x', '@endsalt']);
  });
});

// ---------------------------------------------------------------------------
// Line / Atom surface
// ---------------------------------------------------------------------------

describe('EmbeddedDiagram.getHorizontalAlignment / getStartingAltitude (java:121-123, 248-250)', () => {
  it('always LEFT / always 0', () => {
    const diagram = EmbeddedDiagram.from(null, ['@startuml', '@enduml'], { render: () => fakeTextBlock(1, 1) });
    expect(diagram.getHorizontalAlignment()).toBe(HorizontalAlignment.LEFT);
    expect(diagram.getStartingAltitude(sb)).toBe(0);
  });
});

describe('EmbeddedDiagram.getNeutrons (java:252-255, ADR-9)', () => {
  it('throws -- Neutron is not ported (matches AbstractAtom/StripeCode precedent)', () => {
    const diagram = EmbeddedDiagram.from(null, ['@startuml', '@enduml'], { render: () => fakeTextBlock(1, 1) });
    expect(() => diagram.getNeutrons()).toThrow('UnsupportedOperationException');
  });
});

describe('EmbeddedDiagram.calculateDimensionSlow (java:126-152, TeaVM branch)', () => {
  it('delegates to the renderer TextBlock\'s calculateDimension, memoized (java:154-163)', () => {
    const spy = vi.fn(() => fakeTextBlock(30, 20));
    const diagram = EmbeddedDiagram.from(null, ['@startuml', '@enduml'], { render: spy });
    expect(diagram.calculateDimension(sb)).toEqual(new XDimension2D(30, 20));
    expect(diagram.calculateDimension(sb)).toEqual(new XDimension2D(30, 20));
    expect(spy).toHaveBeenCalledTimes(1); // getInternalTextBlock's own memoization
  });

  it('passes the collected source and skinParam through to the renderer', () => {
    const skinParam = {} as ISkinSimple;
    let seen: { source: readonly string[]; skinParam: ISkinSimple | null } | undefined;
    const diagram = EmbeddedDiagram.from(skinParam, ['@startuml', 'X', '@enduml'], {
      render: (source, sp) => {
        seen = { source: [...source], skinParam: sp };
        return fakeTextBlock(1, 1);
      },
    });
    diagram.calculateDimension(sb);
    expect(seen).toEqual({ source: ['@startuml', 'X', '@enduml'], skinParam });
  });

  it('a renderer failure degrades to the fixed (42, 42) placeholder (java:148-151)', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const diagram = EmbeddedDiagram.from(null, ['@startuml', '@enduml'], {
      render: () => {
        throw new Error('boom');
      },
    });
    expect(diagram.calculateDimension(sb)).toEqual(new XDimension2D(42, 42));
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});

describe('EmbeddedDiagram.drawU (java:165-195, TeaVM branch)', () => {
  it('applies a transparent Back paint then draws through the rendered TextBlock', () => {
    const inner = fakeTextBlock(1, 1);
    const diagram = EmbeddedDiagram.from(null, ['@startuml', '@enduml'], { render: () => inner });
    const ug = new RecordingUGraphic();
    diagram.drawU(ug);
    expect(inner.drawCalls).toHaveLength(1);
    // `draws` is the shared recording array threaded through every `apply()`
    // copy, so the draw the inner TextBlock issues is visible here too --
    // it was issued through the Back-applied UGraphic, not the bare `ug`.
    expect(ug.draws).toHaveLength(1);
    expect(ug.draws[0]?.bg).toBe('none');
  });

  it('the UGraphic passed to the inner TextBlock carries a "none" background paint', () => {
    let capturedBg: string | undefined;
    const inner: TextBlock = {
      calculateDimension: () => new XDimension2D(1, 1),
      drawU: (ug: UGraphic): void => {
        ug.draw({});
        capturedBg = (ug as RecordingUGraphic).draws.at(-1)?.bg;
      },
    };
    const diagram = EmbeddedDiagram.from(null, ['@startuml', '@enduml'], { render: () => inner });
    diagram.drawU(new RecordingUGraphic());
    expect(capturedBg).toBe('none');
  });

  it('a renderer failure draws nothing and logs, rather than throwing (java:191-193)', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const diagram = EmbeddedDiagram.from(null, ['@startuml', '@enduml'], {
      render: () => {
        throw new Error('boom');
      },
    });
    const ug = new RecordingUGraphic();
    expect(() => diagram.drawU(ug)).not.toThrow();
    expect(ug.draws).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});
