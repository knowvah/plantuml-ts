/**
 * `src/diagrams/gantt/index.ts` -- the gantt plugin: `GanttDiagramFactory` (parse), `TextBlockExporter`'s export of
 * `GanttDiagram#getTextBlock` (core/TextBlockExporter.java:159-209), the style helpers it shares with the other
 * titled diagrams (TitledDiagram.java:279-313, TextBlockExporter.java:510-516), the render `clock`
 * (decision D3), registration (PSystemBuilder.java:183) and the `{{gantt}}` nested path (EmbeddedDiagram.java:284-354).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { Clock } from '../../../src/core/clock.js';
import { DiagramRegistry } from '../../../src/core/dispatcher.js';
import { ColorMapper } from '../../../src/core/klimt/color/ColorMapper.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { BODY_ANCHOR } from '../../../src/core/TextBlockExporter.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import type { GanttDiagram } from '../../../src/diagrams/gantt/GanttDiagram.js';
import { parseGantt, type ParsedGantt } from '../../../src/diagrams/gantt/GanttDiagramFactory.js';
import {
  calculateBackColor,
  calculateMargin,
  ganttPlugin,
  isHandwritten,
  muteColorMapper,
  renderGantt,
} from '../../../src/diagrams/gantt/index.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import { internalEmojiAssetKey } from '../../../src/core/internal-emoji-store.js';
import { renderSync } from '../../../src/index.js';
import { registerPlugins } from '../../../src/registered-plugins.js';
import { withClock } from '../../../src/core/internal-render-options.js';

const measurer = new DeterministicMeasurer();
const TASK = '[A] lasts 5 days';

function parsed(body: string): ParsedGantt {
  const block = buildBlockUmls(`@startgantt\n${body}\n@endgantt`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  const result = parseGantt(
    {
      ...block.source,
      rawStyles: block.preprocessed.styles,
      stylePositions: block.preprocessed.stylePositions,
      styleSource: block.preprocessed,
    },
    new PreprocessingArtifact(),
  );
  if ('refused' in result) throw new Error(`refused: ${result.message}`);
  return result;
}

const diagramOf = (body: string): GanttDiagram => parsed(body).diagram;

function sides(d: GanttDiagram): number[] {
  const m = calculateMargin(d);
  return [m.getTop(), m.getRight(), m.getBottom(), m.getLeft()];
}

describe('calculateMargin (TextBlockExporter.java:510-516)', () => {
  it('no style Margin: GanttDiagram#getDefaultMargins() = none() (GanttDiagram.java:500-503)', () => {
    expect(sides(diagramOf(TASK))).toEqual([0, 0, 0, 0]);
  });

  it('a `root { Margin 30 }` style outranks same(10)', () => {
    expect(sides(diagramOf(`<style>\nroot {\n  Margin 30\n}\n</style>\n${TASK}`))).toEqual([30, 30, 30, 30]);
  });
});

describe('calculateBackColor (TitledDiagram.java:279-289)', () => {
  it('the default document background is white', () => {
    expect(calculateBackColor(diagramOf(TASK)).asPaint()).toBe('#FFFFFF');
  });

  it('`ganttDiagram { BackgroundColor pink }` is the merged root/document/ganttDiagram value (DiagramType.java:259-260)', () => {
    const style = `<style>\nganttDiagram {\n  BackgroundColor pink\n}\n</style>\n${TASK}`;
    expect(calculateBackColor(diagramOf(style)).asPaint()).toBe('#FFC0CB');
  });
});

describe('muteColorMapper (TitledDiagram.java:291-313)', () => {
  it.each([
    [TASK, ColorMapper.IDENTITY],
    [`skinparam monochrome true\n${TASK}`, ColorMapper.MONOCHROME],
    [`skinparam monochrome reverse\n${TASK}`, ColorMapper.MONOCHROME_REVERSE],
    [`skinparam reversecolor dark\n${TASK}`, ColorMapper.LIGTHNESS_INVERSE],
    [`skinparam reversecolor nonsense\n${TASK}`, ColorMapper.IDENTITY],
    [`skinparam mode dark\n${TASK}`, ColorMapper.DARK_MODE],
  ])('%j', (body, expected) => {
    expect(muteColorMapper(diagramOf(body))).toBe(expected);
  });
});

describe('isHandwritten (TitledDiagram.java:113-118)', () => {
  it('reads `skinparam handwritten true`, any case', () => {
    expect(isHandwritten(diagramOf(TASK))).toBe(false);
    expect(isHandwritten(diagramOf(`skinparam handwritten TRUE\n${TASK}`))).toBe(true);
  });
});

describe('renderGantt', () => {
  it('no chrome: a GANTT-typed fragment drawn in place with a white background', () => {
    const fragment = renderGantt(parsed(TASK), measurer);
    expect(fragment.diagramType).toBe('GANTT');
    expect(fragment.background).toBe('#FFFFFF');
    expect(fragment.exportMargin).toBeUndefined();
    expect(fragment.body).toContain('<rect');
    expect(fragment.width).toBeGreaterThan(20);
    expect(fragment.height).toBeGreaterThan(20);
  });

  it('with a title: the raw block around BODY_ANCHOR, carrying the margin and a drawBodyAt', () => {
    const fragment = renderGantt(parsed(`title T\n${TASK}`), measurer);
    expect(fragment.body).toBe(BODY_ANCHOR);
    expect(fragment.exportMargin?.getTop()).toBe(0);
    expect(fragment.drawBodyAt?.(1, 0, 0)).toContain('<rect');
    expect(fragment.frameInk).toBeUndefined();
    expect(fragment.scaleSpec).toBeUndefined();
  });

  it('a mainframe carries the ink and `scale` carries the scale spec', () => {
    const fragment = renderGantt(parsed(`mainframe M\nscale 2\n${TASK}`), measurer);
    expect(fragment.frameInk).toBeDefined();
    expect(fragment.scaleSpec).toEqual({ kind: 'simple', factor: 2 });
  });

  it('`scale` without chrome multiplies the canvas (TextBlockExporter.java:205-209)', () => {
    const plain = renderGantt(parsed(TASK), measurer);
    const scaled = renderSync(`@startgantt\nscale 2\n${TASK}\n@endgantt`, { measurer });
    expect(scaled).toContain(`viewBox="0 0 ${plain.width * 2} ${plain.height * 2}"`);
  });
});

describe('ganttPlugin', () => {
  it('is the `gantt` plugin and parses through the factory', () => {
    expect(ganttPlugin.type).toBe('gantt');
  });

  it('renders `[A] lasts 5 days` to a non-error SVG whose root carries data-diagram-type="GANTT"', () => {
    const svg = renderSync(`@startgantt\n${TASK}\n@endgantt`);
    expect(svg).toMatch(/^<svg [^>]*data-diagram-type="GANTT"/);
    expect(svg).not.toContain('Syntax Error?');
    expect(svg).toContain('>A</text>');
  });

  it('draws the title chrome around the chart', () => {
    const svg = renderSync(`@startgantt\ntitle My Gantt Title\n${TASK}\n@endgantt`);
    expect(svg).toContain('data-diagram-type="GANTT"');
    expect(svg).toContain('>My Gantt Title</text>');
  });

  it('renders the over-20-years error page at the first body line (PSystemCommandFactory.java:122-125,150-153)', () => {
    const svg = renderSync('@startgantt\nProject starts 2020-01-01\n[A] lasts 8000 days\n@endgantt');
    expect(svg).toContain('Gantt diagrams cannot last more than 20 years (Assumed diagram type: gantt)');
    expect(svg).toContain('(line 2)');
    expect(svg).not.toContain('data-diagram-type="GANTT"');
  });

  it('renders a stock error page for a crashing command (bare `footbox`)', () => {
    const svg = renderSync('@startgantt\nfootbox\n@endgantt');
    expect(svg).not.toContain('data-diagram-type="GANTT"');
    expect(svg).toContain('Cannot read properties of undefined');
  });
});

describe('the render clock reaches GanttDiagram (decision D3)', () => {
  const SOURCE = '@startgantt\nProject starts 2026-10-01\ntoday is colored in #ff8080\n[A] lasts 30 days\n@endgantt';
  const TODAY_FILL = 'fill="#FF8080"';
  const at = (iso: string): Clock => ({ nowMillis: () => Date.parse(`${iso}T12:00:00Z`), zone: 'UTC' });
  const render = (clock: Clock): string => renderSync(SOURCE, withClock({ measurer }, clock));

  it('draws the today column when the injected clock falls inside the project', () => {
    expect(render(at('2026-10-10'))).toContain(TODAY_FILL);
  });

  it('draws no today column when the injected clock is years away', () => {
    expect(render(at('2036-10-10'))).not.toContain(TODAY_FILL);
  });

  it('the plugin hands ParseOptions.clock to the diagram: the same source differs between clocks', () => {
    expect(render(at('2026-10-10'))).not.toBe(render(at('2036-10-10')));
  });
});

describe('registration (PSystemBuilder.java:183)', () => {
  it('registers the gantt plugin after charlie and before chronology', () => {
    const registry = new DiagramRegistry();
    const seen: string[] = [];
    registerPlugins({
      register: (plugin) => {
        seen.push(plugin.type);
        registry.register(plugin);
      },
    });
    expect(seen.indexOf('gantt')).toBeGreaterThan(seen.indexOf('rip'));
    expect(seen.indexOf('gantt')).toBe(seen.indexOf('chronology') - 1);
  });
});

describe('{{gantt}} nested in another diagram (EmbeddedDiagram.java:284-354)', () => {
  const nestedSvg = (svg: string): string => {
    const m = /href="data:image\/svg\+xml;base64,([^"]+)"/.exec(svg);
    if (m === null) throw new Error('no embedded image');
    return Buffer.from(m[1]!, 'base64').toString('utf8');
  };

  it('renders the nested gantt as an embedded GANTT image inside a class note', () => {
    const svg = renderSync(
      '@startuml\nclass A\nnote right of A\n{{gantt\n[Nested] lasts 3 days\n}}\nend note\n@enduml',
      { measurer },
    );
    expect(svg).toContain('data-diagram-type="CLASS"');
    const inner = nestedSvg(svg);
    // The embedded image is the flat nested render (no root `data-diagram-type`): the task bar and its label.
    expect(inner).toContain('>Nested</text>');
    expect(inner).toContain('fill="#E2E2F0"');
  });

  it('renders the nested gantt inside a sequence note', () => {
    const svg = renderSync('@startuml\nA -> B\nnote right\n{{gantt\n[Nested] lasts 3 days\n}}\nend note\n@enduml', {
      measurer,
    });
    expect(nestedSvg(svg)).toContain('>Nested</text>');
  });
});

/**
 * T8c: `options.assetStore` reaches the milestone label's sprite container, so `<:innocent:>` draws the Twemoji
 * artwork (`Emoji.java:175-181`, `TaskDrawDiamond.java:183-205`) instead of a dropped text run.
 */
describe('gantt plugin -- emoji artwork through options.assetStore', () => {
  const INNOCENT_UNICODE = '1f607';
  const ARTWORK_FILL = '#123456';
  const ARTWORK = `<circle cx="18" cy="18" r="18" fill="${ARTWORK_FILL}"/>`;
  const store: AssetStore = {
    get: (key) =>
      key === internalEmojiAssetKey(INNOCENT_UNICODE)
        ? { bytes: new TextEncoder().encode(ARTWORK), mimeType: 'image/svg+xml' }
        : undefined,
    has: (key) => key === internalEmojiAssetKey(INNOCENT_UNICODE),
  };
  const MILESTONE =
    "@startgantt\n[A] requires 10 days.\n[M] happens at [A]'s end.\nIt is displayed as <:innocent:>\n@endgantt";

  it('draws the artwork when the store carries it', () => {
    const svg = renderSync(MILESTONE, { measurer, assetStore: store });
    expect(svg).toContain(`fill="${ARTWORK_FILL}"`);
  });

  it('draws no artwork without a store (the jar has no text fallback either)', () => {
    const svg = renderSync(MILESTONE, { measurer });
    expect(svg).not.toContain(ARTWORK_FILL);
  });
});
