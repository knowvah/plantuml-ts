/**
 * `PSystemSingleLineFactory` (command/PSystemSingleLineFactory.java) as a
 * plugin helper: `removeInitialNoise`, the 3-line gate, the empty and
 * syntax-error branches, the `SEQUENCE` candidate type, and registration
 * order deciding between plugins that share it (decisions.md D2).
 *
 * Jar probes (`scripts/oracle-render.sh`, 1.2026.8beta1, authored):
 * - `@startuml\nskinparam x y\n\nlicense\n@enduml` renders the license page:
 *   leading noise is dropped before the count.
 * - `@startuml\nlicense\nskinparam backgroundColor red\n@enduml` is a
 *   `Syntax Error? (Assumed diagram type: sequence)` page: trailing noise counts.
 * - `@startuml\n   license\n@enduml`, `\tcharlie` and `charlie  ` are syntax
 *   errors while `license   ` renders: `executeLine` receives the line
 *   UNtrimmed (`s.getString()`, java:95), and each factory's own pattern decides.
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../../src/core/block-extractor.js';
import { DiagramRegistry } from '../../../../src/core/dispatcher.js';
import type { CompleteSvg, SyncPlugin } from '../../../../src/core/dispatcher.js';
import { mergeRefusals, parseRefusalOf, refuse } from '../../../../src/core/parse-refusal.js';
import type { ParseRefusal } from '../../../../src/core/parse-refusal.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../../src/core/theme.js';
import type { PreprocessingArtifact } from '../../../../src/core/tim/PreprocessingArtifact.js';
import { singleLinePlugin } from '../../../../src/core/command/PSystemSingleLineFactory.js';
import type { RenderContext } from '../../../../src/core/command/PSystemSingleLineFactory.js';
import { classPlugin } from '../../../../src/diagrams/class/index.js';
import { sequencePlugin } from '../../../../src/diagrams/sequence/index.js';

/** What a fake factory's `executeLine` builds. */
interface Accepted {
  readonly who: string;
  readonly line: string;
}

/** A single-line plugin accepting exactly `keyword` (equalsIgnoreCase, the
 *  `PSystemCharlieFactory.java:48` shape) and recording every line it is given. */
function fake(who: string, keyword: string, seen: string[] = []): SyncPlugin<Accepted, unknown> {
  return singleLinePlugin<Accepted>({
    type: 'sequence',
    executeLine(_source: UmlSource, line: string, _preprocessing: PreprocessingArtifact) {
      seen.push(line);
      return line.toLowerCase() === keyword ? { who, line } : undefined;
    },
    render(diagram: Accepted, _ctx: RenderContext): CompleteSvg {
      return { completeSvg: `<svg>${diagram.who}</svg>` };
    },
  });
}

/** The pipeline's `UmlSource` for one block (`src/index.ts#umlSourceOfBlock`'s
 *  seed field included). */
function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function parsed(plugin: SyncPlugin<Accepted, unknown>, text: string): Accepted | ParseRefusal {
  return plugin.parse(sourceOf(text));
}

function refusalOf(value: unknown): ParseRefusal {
  const refusal = parseRefusalOf(value);
  if (refusal === undefined) throw new Error('expected a refusal');
  return refusal;
}

describe('singleLinePlugin — the 3-line gate (java:73-76)', () => {
  it('hands executeLine the one line of a 3-line source', () => {
    const seen: string[] = [];
    expect(parsed(fake('license', 'license', seen), '@startuml\nlicense\n@enduml')).toEqual({
      who: 'license',
      line: 'license',
    });
    expect(seen).toEqual(['license']);
  });

  it('hands the line over untrimmed (s.getString(), java:95)', () => {
    const seen: string[] = [];
    const plugin = fake('charlie', 'charlie', seen);
    expect(parseRefusalOf(parsed(plugin, '@startuml\n   charlie\n@enduml'))?.message).toBe('Syntax Error?');
    expect(parseRefusalOf(parsed(plugin, '@startuml\ncharlie  \n@enduml'))?.message).toBe('Syntax Error?');
    expect(seen).toEqual(['   charlie', 'charlie  ']);
  });

  it('drops leading noise first: blank, skinparam and !pragma lines after @start (UmlSource.java:79-106)', () => {
    const seen: string[] = [];
    const plugin = fake('license', 'license', seen);
    expect(parsed(plugin, '@startuml\nskinparam x y\n\nlicense\n@enduml')).toEqual({ who: 'license', line: 'license' });
    expect(parsed(plugin, '@startuml\n!pragma foo bar\nlicense\n@enduml')).toEqual({ who: 'license', line: 'license' });
    expect(seen).toEqual(['license', 'license']);
  });

  it.each([
    ['2 lines', '@startuml\n@enduml'],
    ['4 lines', '@startuml\nlicense\nlicense\n@enduml'],
    ['trailing noise still counts', '@startuml\nlicense\nskinparam backgroundColor red\n@enduml'],
  ])('refuses without calling executeLine: %s', (_name, text) => {
    const seen: string[] = [];
    const refusal = refusalOf(parsed(fake('license', 'license', seen), text));
    expect(seen).toEqual([]);
    expect(refusal.kind).toBe('incomplete');
    expect(refusal.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });

  it("the gate's null never wins a merge (PSystemErrorUtils.java:120-121 skips it)", () => {
    const gate = refusalOf(parsed(fake('license', 'license'), '@startuml\n@enduml'));
    const real = refuse('syntax', 1, 0, 'Syntax Error?');
    expect(mergeRefusals([gate, real])).toBe(real);
    expect(mergeRefusals([real, gate])).toBe(real);
  });
});

describe('singleLinePlugin — error branches (java:78-100)', () => {
  it('executeLine returning undefined is "Syntax Error?" on that line, its trace [start, line]', () => {
    expect(parsed(fake('license', 'license'), '@startuml\nfoo\n@enduml')).toEqual(
      refuse('syntax', 1, 1, 'Syntax Error?'),
    );
  });

  it('locates the error on its document line when the preprocessor dropped a line before it', () => {
    // TIM drops the comment: upstream's source is [@startuml, foo, @enduml], the file line is 2.
    expect(refusalOf(parsed(fake('license', 'license'), "@startuml\n' a comment\nfoo\n@enduml")).line).toBe(2);
  });

  it('an empty 3-line source is "Empty description" on the @start line (java:79-82)', () => {
    expect(parsed(fake('license', 'license'), '@startuml\n   \n@enduml')).toEqual(
      refuse('syntax', 0, 0, 'Empty description'),
    );
  });

  it('isEmpty skips comment lines (UmlSource.java:253-270)', () => {
    const source: UmlSource = { lines: [], type: 'sequence', seedSourceLines: ['@startuml', "  ' note", '@enduml'] };
    expect(fake('license', 'license').parse(source)).toEqual(refuse('syntax', 0, 0, 'Empty description'));
  });

  it('an @end line in the middle is "Empty description" on it (java:91-93)', () => {
    const source: UmlSource = { lines: [], type: 'sequence', seedSourceLines: ['@startuml', '@enduml', 'license'] };
    expect(fake('license', 'license').parse(source)).toEqual(refuse('syntax', 1, 1, 'Empty description'));
  });

  it('a first line that is not a start directive is UnsupportedOperationException (java:84-86)', () => {
    const source: UmlSource = { lines: [], type: 'sequence', seedSourceLines: ['license', 'license', 'license'] };
    expect(() => fake('license', 'license').parse(source)).toThrow('UnsupportedOperationException');
  });

  it('a hand-built source without seed lines is its interior between @startuml and @enduml', () => {
    const source: UmlSource = { lines: ['license'], type: 'sequence' };
    expect(fake('license', 'license').parse(source)).toEqual({ who: 'license', line: 'license' });
  });
});

describe('singleLinePlugin — plugin shape', () => {
  const measurer = new DeterministicMeasurer();

  it("is typed 'sequence', upstream's @startuml hack (java:58-61)", () => {
    expect(fake('license', 'license').type).toBe('sequence');
  });

  it('render hands the diagram and the layout measurer to spec.render', () => {
    const seen: RenderContext[] = [];
    const plugin = singleLinePlugin<Accepted>({
      type: 'sequence',
      executeLine: (_source, line) => ({ who: 'x', line }),
      render(diagram, ctx) {
        seen.push(ctx);
        return { completeSvg: diagram.line };
      },
    });
    const ast = plugin.parse(sourceOf('@startuml\nanything\n@enduml'));
    if (parseRefusalOf(ast) !== undefined) throw new Error('refused');
    const geo = plugin.layoutSync(ast as Accepted, defaultTheme, measurer);
    expect(plugin.render(geo, defaultTheme)).toEqual({ completeSvg: 'anything' });
    expect(seen).toEqual([{ theme: defaultTheme, measurer }]);
  });
});

describe('several plugins share the sequence candidate type; registration order decides (D2)', () => {
  /** `PSystemColorsFactory` before the UML factories, the others after
   *  (PSystemBuilder.java:134, :144-152). */
  function registry(): DiagramRegistry {
    const r = new DiagramRegistry();
    r.register(fake('colors', 'colors'));
    r.register(sequencePlugin);
    r.register(classPlugin);
    r.register(fake('license', 'license'));
    r.register(fake('license-too', 'license'));
    return r;
  }

  it('a plugin registered before sequencePlugin wins its line', () => {
    const resolution = registry().resolve(sourceOf('@startuml\ncolors\n@enduml'));
    expect(resolution.ast).toEqual({ who: 'colors', line: 'colors' });
  });

  it('of two plugins accepting the same line, the earlier-registered one wins', () => {
    const resolution = registry().resolve(sourceOf('@startuml\nlicense\n@enduml'));
    expect(resolution.ast).toEqual({ who: 'license', line: 'license' });
  });

  it('a single-line plugin ahead of sequencePlugin never steals a sequence diagram', () => {
    const resolution = registry().resolve(sourceOf('@startuml\nAlice -> Bob\n@enduml'));
    expect(resolution.plugin).toBe(sequencePlugin);
  });

  it("every candidate refusing: the earliest consumed-1 refusal owns the page, typed 'sequence' as in the jar", () => {
    const resolution = registry().resolve(sourceOf('@startuml\nfoo\n@enduml'));
    expect(resolution.refusal).toEqual(refuse('syntax', 1, 1, 'Syntax Error?'));
    expect(resolution.plugin.type).toBe('sequence');
  });

  it("a 4-line source: the gate's refusals never outrank the UML factories'", () => {
    const resolution = registry().resolve(sourceOf('@startuml\nfoo\nbar\n@enduml'));
    expect(resolution.plugin).toBe(classPlugin);
  });
});
