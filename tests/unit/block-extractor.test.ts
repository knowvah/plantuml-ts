import { refuse } from '../../src/core/parse-refusal.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { extractBlocks, upstreamTypeOf } from '../../src/core/block-extractor.js';
import { DiagramType as UpstreamDiagramType } from '../../src/core/diagram-type-set.js';
import {
  DiagramRegistry,
  type SyncPlugin,
} from '../../src/core/dispatcher.js';
import type { UmlSource, DiagramType } from '../../src/core/block-extractor.js';
import { defaultTheme } from '../../src/core/theme.js';
import { FixedMeasurer } from '../../src/core/measurer.js';
import { assembleSvg } from '../../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * T12: a plugin no longer declares interest with `accepts()`; it declares it
 * by PARSING, and declines by returning a `ParseRefusal`. `wantsFn` keeps
 * every test below reading the same way -- true means "this plugin claims the
 * source", which is now expressed as a successful parse.
 */
function makePlugin(
  diagramType: DiagramType,
  wantsFn: (lines: readonly string[]) => boolean,
): SyncPlugin {
  return {
    type: diagramType,
    parse: (source: UmlSource) =>
      wantsFn(source.lines) ? {} : refuse('syntax', 0, 0, 'Syntax Error?'),
    layoutSync: (_ast: unknown) => ({}),
    render: (_geo: unknown) => ({ completeSvg: '<svg/>' }),
  };
}

function linesToBlocks(src: string): UmlSource[] {
  return extractBlocks(src.split('\n'));
}

// ---------------------------------------------------------------------------
// Block extraction — structural
// ---------------------------------------------------------------------------

describe('extractBlocks — structural extraction', () => {
  it('extracts a single @startuml / @enduml block', () => {
    const blocks = linesToBlocks('@startuml\nAlice -> Bob\n@enduml');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.lines).toEqual(['Alice -> Bob']);
  });

  it('returns empty array when no @startuml is present', () => {
    const blocks = linesToBlocks('just plain text');
    expect(blocks).toHaveLength(0);
  });

  it('extracts multiple blocks from one string', () => {
    const src =
      '@startuml\nAlice -> Bob\n@enduml\n@startuml\nBob -> Carol\n@enduml';
    const blocks = linesToBlocks(src);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.lines).toEqual(['Alice -> Bob']);
    expect(blocks[1]?.lines).toEqual(['Bob -> Carol']);
  });

  it('trims leading and trailing blank lines inside a block', () => {
    const blocks = linesToBlocks('@startuml\n\nAlice -> Bob\n\n@enduml');
    const lines = blocks[0]?.lines ?? [];
    expect(lines[0]).not.toBe('');
    expect(lines[lines.length - 1]).not.toBe('');
    expect(lines).toEqual(['Alice -> Bob']);
  });

  it('ignores lines before the first @startuml', () => {
    const blocks = linesToBlocks('ignored\n@startuml\nAlice -> Bob\n@enduml');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.lines).toEqual(['Alice -> Bob']);
  });

  it('ignores lines after the last @enduml', () => {
    const blocks = linesToBlocks('@startuml\nAlice -> Bob\n@enduml\nignored');
    expect(blocks).toHaveLength(1);
  });

  it('returns empty array for unclosed block with no @end', () => {
    const blocks = linesToBlocks('@startuml\nAlice -> Bob');
    expect(blocks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Type detection — keyword-suffix markers (@start<type>)
// ---------------------------------------------------------------------------

describe('extractBlocks — @start<type> keyword detection', () => {
  it('detects mindmap type from @startmindmap / @endmindmap', () => {
    const blocks = linesToBlocks('@startmindmap\n* Root\n@endmindmap');
    expect(blocks[0]?.type).toBe('mindmap');
  });

  it('detects gantt type from @startgantt / @endgantt', () => {
    const blocks = linesToBlocks(
      '@startgantt\n[Task] lasts 3 days\n@endgantt',
    );
    expect(blocks[0]?.type).toBe('gantt');
  });

  it('detects wbs type from @startwbs / @endwbs', () => {
    const blocks = linesToBlocks('@startwbs\n+ Root\n@endwbs');
    expect(blocks[0]?.type).toBe('wbs');
  });

  it('stores lines without the @start/@end markers', () => {
    const blocks = linesToBlocks('@startmindmap\n* Root\n@endmindmap');
    expect(blocks[0]?.lines).toEqual(['* Root']);
  });

  it('returns "unknown" type for unrecognised @start<suffix>', () => {
    // @startfuturediagram is not in the suffix map
    const blocks = linesToBlocks(
      '@startfuturediagram\nsome content\n@endfuturediagram',
    );
    expect(blocks[0]?.type).toBe('unknown');
  });

  it('extracts @startyaml / @endyaml block with type yaml', () => {
    const blocks = linesToBlocks('@startyaml\nfruit: Apple\n@endyaml');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe('yaml');
    expect(blocks[0]?.lines).toEqual(['fruit: Apple']);
  });

  it('handles empty @startyaml / @endyaml block', () => {
    const blocks = linesToBlocks('@startyaml\n@endyaml');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe('yaml');
  });

});

// ---------------------------------------------------------------------------
// Type detection — content-based (@startuml blocks)
// ---------------------------------------------------------------------------

describe('extractBlocks — content-based type detection for @startuml', () => {
  it('detects sequence type when first content line contains ->', () => {
    const blocks = linesToBlocks('@startuml\nAlice -> Bob\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type when content contains -->', () => {
    const blocks = linesToBlocks('@startuml\nAlice --> Bob\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type when content contains ->>', () => {
    const blocks = linesToBlocks('@startuml\nAlice ->> Bob\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type when content contains -->>', () => {
    const blocks = linesToBlocks('@startuml\nAlice -->> Bob\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type from participant keyword', () => {
    const blocks = linesToBlocks('@startuml\nparticipant Alice\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type from actor keyword', () => {
    const blocks = linesToBlocks('@startuml\nactor Bob\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type from boundary keyword', () => {
    const blocks = linesToBlocks('@startuml\nboundary Web\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type from control keyword', () => {
    const blocks = linesToBlocks('@startuml\ncontrol Handler\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type from entity keyword', () => {
    const blocks = linesToBlocks('@startuml\nentity DB\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type from database keyword', () => {
    const blocks = linesToBlocks('@startuml\ndatabase Store\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type from collections keyword', () => {
    const blocks = linesToBlocks('@startuml\ncollections Items\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects sequence type from queue keyword', () => {
    const blocks = linesToBlocks('@startuml\nqueue Events\n@enduml');
    expect(blocks[0]?.type).toBe('sequence');
  });

  it('detects class type when first content line starts with "class "', () => {
    const blocks = linesToBlocks('@startuml\nclass Foo\n@enduml');
    expect(blocks[0]?.type).toBe('class');
  });

  it('detects class type from "abstract class"', () => {
    const blocks = linesToBlocks('@startuml\nabstract class Foo\n@enduml');
    expect(blocks[0]?.type).toBe('class');
  });

  it('detects class type from "interface"', () => {
    const blocks = linesToBlocks('@startuml\ninterface Foo\n@enduml');
    expect(blocks[0]?.type).toBe('class');
  });

  it('detects class type from "enum"', () => {
    const blocks = linesToBlocks('@startuml\nenum Color\n@enduml');
    expect(blocks[0]?.type).toBe('class');
  });

  it('detects state type from "[*] -->"', () => {
    const blocks = linesToBlocks('@startuml\n[*] --> Idle\n@enduml');
    expect(blocks[0]?.type).toBe('state');
  });

  // SI7: the fallback is 'class', not 'unknown'. `@startuml` selects EVERY
  // legacy-UML factory (`DiagramType.findStartTypes`), and `PSystemBuilder`
  // keeps the first that does not error: Sequence is tried first but a sequence
  // diagram with no participants is `isIncomplete()`, so ClassDiagramFactory
  // takes it. The jar tags `@startuml` + `title X` `data-diagram-type="CLASS"`.
  it('falls back to "class" when no pattern matches (upstream factory order)', () => {
    const blocks = linesToBlocks(
      '@startuml\nskinparam monochrome true\n@enduml',
    );
    expect(blocks[0]?.type).toBe('class');
  });

  it('only inspects the first 20 non-empty lines for type detection', () => {
    // Build 21 non-empty lines that match no type pattern, then add an arrow
    // on line 22. The arrow must NOT be detected because it's outside the window.
    const neutralLine = 'skinparam backgroundColor white';
    const padding = Array.from({ length: 21 }, () => neutralLine).join('\n');
    const blocks = linesToBlocks(`@startuml\n${padding}\nAlice -> Bob\n@enduml`);
    // Arrow is beyond the 20 non-empty line inspection window, so no probe
    // matches and the block takes the factory-order fallback.
    expect(blocks[0]?.type).toBe('class');
  });

  it('detects state type even when [*] --> contains arrow characters', () => {
    // Verifies that state probe runs before sequence probe
    const blocks = linesToBlocks('@startuml\n[*] --> Idle\nIdle --> Active\n@enduml');
    expect(blocks[0]?.type).toBe('state');
  });

  // T5 mechanism 1: a `sprite $name { ... }` multiline block (or its
  // `!include`-expanded equivalent -- both land as preprocessed content lines
  // by the time `finalizeBlock` sees them) must not consume the detection
  // window ahead of the real diagram body. Mirrors `stripSpriteRegions`
  // (descriptive-keywords.ts), which solved the identical problem for
  // `hasDescriptiveSignal`'s own SCAN_LINE_LIMIT (vivido-49-nisu863).
  describe('sprite regions do not consume the detection window (T5 mechanism 1)', () => {
    it('types on the body when a 24-row sprite block fills the window first', () => {
      const spriteRows = Array.from({ length: 24 }, () => '1234567890').join('\n');
      const src =
        `@startuml\nsprite $disk16 {\n${spriteRows}\n}\nAlice -> Bob : hello\n@enduml`;
      const blocks = linesToBlocks(src);
      expect(blocks[0]?.type).toBe('sequence');
    });

    it('types on the body when a multiline svg sprite fills the window first', () => {
      const svgRows = Array.from({ length: 24 }, (_, i) => `  <path d="M${i},0"/>`).join('\n');
      const src =
        `@startuml\nsprite complexsprite <svg width="1">\n${svgRows}\n</svg>\nAlice -> Bob : hello\n@enduml`;
      const blocks = linesToBlocks(src);
      expect(blocks[0]?.type).toBe('sequence');
    });

    it('still respects the window for content outside any sprite region', () => {
      // A sprite region does not grant an unlimited window: 21 neutral lines
      // AFTER the stripped sprite region still push the arrow out of range.
      const spriteRows = Array.from({ length: 3 }, () => '111').join('\n');
      const neutralLine = 'skinparam backgroundColor white';
      const padding = Array.from({ length: 21 }, () => neutralLine).join('\n');
      const src =
        `@startuml\nsprite $x {\n${spriteRows}\n}\n${padding}\nAlice -> Bob\n@enduml`;
      const blocks = linesToBlocks(src);
      expect(blocks[0]?.type).toBe('class');
    });
  });

  // T5 mechanism 2: real sequence-only tokens `probeSequence` never probed.
  // Each row cites the upstream command class that owns the grammar.
  describe('sequence-only tokens missed by the original probe (T5 mechanism 2)', () => {
    it.each([
      // CommandActivate.java:62 -- TYPE group `(activate|deactivate|destroy|create)`
      ['activate C', 'activate C'],
      ['deactivate A', 'deactivate A'],
      // FactorySequenceNoteCommand.java:83,100 -- POSITION alternative
      // `(right|left|over)`; "over" positioning is sequence-exclusive (no
      // other diagram family's note command supports it).
      ['note over A: Hello', 'note over A: Hello'],
      // CommandArrow.java:99-101 -- ARROW_DRESSING1's `<<?_?` alternative,
      // the reversed dressing of the already-probed right-pointing form.
      ['left-pointing arrow <-', 'Alice <- Bob'],
      ['left-pointing arrow <--', 'Alice <-- Bob'],
      ['left-pointing arrow <<--', 'Alice <<-- Bob'],
    ])('detects sequence type from %s', (_label, line) => {
      const blocks = linesToBlocks(`@startuml\n${line}\n@enduml`);
      expect(blocks[0]?.type).toBe('sequence');
    });

    it('detects the full todozi-34-jire490 shape (activate/note over/deactivate)', () => {
      const blocks = linesToBlocks(
        '@startuml\nactivate A\nnote over A: Hello\ndeactivate A\n@enduml',
      );
      expect(blocks[0]?.type).toBe('sequence');
    });

    it('detects the full zicadi-21-koje636 shape (activate/left arrow/deactivate)', () => {
      const blocks = linesToBlocks(
        '@startuml\nactivate Test\nTest <<-- Test : msg\ndeactivate Test\n@enduml',
      );
      expect(blocks[0]?.type).toBe('sequence');
    });

    it('does not treat "note left of X" as sequence-exclusive (over-only widening)', () => {
      // D3 bounds the widening to "note over" specifically -- "note left"/
      // "note right" are shared across diagram families and must stay out
      // of the sequence-only probe.
      const blocks = linesToBlocks('@startuml\nnote left of A: Hello\n@enduml');
      expect(blocks[0]?.type).toBe('class');
    });
  });
});

// ---------------------------------------------------------------------------
// DiagramRegistry
// ---------------------------------------------------------------------------

describe('DiagramRegistry', () => {
  let registry: DiagramRegistry;
  const measurer = new FixedMeasurer(8, 16);

  beforeEach(() => {
    registry = new DiagramRegistry();
  });

  it('resolves a registered plugin by attempting the parse', () => {
    const plugin = makePlugin('sequence', (lines) =>
      lines.some((l) => l.includes('->')),
    );
    registry.register(plugin);

    const source: UmlSource = {
      lines: ['Alice -> Bob'],
      type: 'sequence',
    };

    const resolved = registry.resolve(source).plugin;
    expect(resolved.type).toBe('sequence');
  });

  it('returns an error-sentinel plugin when no candidate parses', () => {
    const source: UmlSource = {
      lines: ['some unknown syntax'],
      type: 'unknown',
    };

    // No plugins registered — should not throw
    const resolved = registry.resolve(source).plugin;
    expect(() => resolved.render({}, defaultTheme)).not.toThrow();
    const svg = assembleSvg(resolved.render({}, defaultTheme));
    expect(svg).toContain('<svg');
  });

  it('calls parse() on registered plugins to find a match', () => {
    let calledWith: readonly string[] | undefined;
    const plugin = makePlugin('class', (lines) => {
      calledWith = lines;
      return true;
    });
    registry.register(plugin);

    const source: UmlSource = {
      lines: ['class Foo'],
      type: 'class',
    };
    void registry.resolve(source).plugin;
    expect(calledWith).toEqual(['class Foo']);
  });

  it('tries plugins in registration order (first match wins)', () => {
    const calls: string[] = [];
    const p1 = makePlugin('sequence', () => {
      calls.push('sequence');
      return false;
    });
    const p2 = makePlugin('class', () => {
      calls.push('class');
      return true;
    });
    const p3 = makePlugin('state', () => {
      calls.push('state');
      return true;
    });

    registry.register(p1);
    registry.register(p2);
    registry.register(p3);

    const source: UmlSource = { lines: [], type: 'unknown' };
    const resolved = registry.resolve(source).plugin;

    // Should stop after p2 matched
    expect(calls).toEqual(['sequence', 'class']);
    expect(resolved.type).toBe('class');
  });

  it('error-sentinel plugin renders an SVG containing error text', () => {
    const source: UmlSource = { lines: ['???'], type: 'unknown' };
    const sentinel = registry.resolve(source).plugin;
    const svg = assembleSvg(sentinel.render({}, defaultTheme));
    // Must be valid SVG and communicate an error
    expect(svg).toContain('<svg');
    expect(svg.toLowerCase()).toMatch(/error|unknown/);
  });


  it('parse() on sentinel plugin returns empty object without throwing', () => {
    const source: UmlSource = { lines: [], type: 'unknown' };
    const sentinel = registry.resolve(source).plugin;
    expect(() => sentinel.parse(source)).not.toThrow();
  });

  it('error-sentinel plugin is a SyncPlugin (has layoutSync, no async layout)', () => {
    // The sentinel uses layoutSync; it does not expose an async layout method.
    const source: UmlSource = { lines: [], type: 'unknown' };
    const sentinel = registry.resolve(source).plugin;
    expect('layoutSync' in sentinel).toBe(true);
    expect('layout' in sentinel).toBe(false);
  });

  it('layoutSync() on sentinel plugin returns without throwing', () => {
    const source: UmlSource = { lines: [], type: 'unknown' };
    const sentinel = registry.resolve(source).plugin;
    if ('layoutSync' in sentinel) {
      expect(() =>
        sentinel.layoutSync({}, defaultTheme, measurer),
      ).not.toThrow();
    } else {
      throw new Error('Expected sentinel to be a SyncPlugin');
    }
  });
});

// ---------------------------------------------------------------------------
// T3 -- the candidate set replaces the single guessed type as the routing
// input. `type` survives one batch longer as `resolve()`'s tier-3 fallback
// (see plans/dispatch-by-parse-attempt/decision-journal.md); T12 removes it.
// ---------------------------------------------------------------------------

function typesOf(lines: readonly string[]): ReadonlySet<string> {
  const block = extractBlocks(lines)[0];
  if (block === undefined) throw new Error('no block extracted');
  if (block.types === undefined) throw new Error('finalizeBlock must populate types');
  return block.types;
}

describe('UmlSource.types -- findStartTypes of the @start line', () => {
  it('@startuml names all ten legacy-UML factories, never one guess', () => {
    // DiagramType.java:198-201. The whole point of D5: upstream does not
    // guess, so neither does this field -- even though `type` still carries
    // detectUmlType's guess alongside it until T12.
    expect([...typesOf(['@startuml', 'Alice -> Bob: hi', '@enduml'])].sort()).toEqual([
      'ACTIVITY', 'CLASS', 'COMPOSITE', 'DESCRIPTION', 'HELP',
      'OBJECT', 'SEQUENCE', 'SPRITES', 'STATE', 'TIMING',
    ]);
  });

  it('is a singleton for every tag the corpus actually uses', () => {
    expect(typesOf(['@startjson', '{}', '@endjson'])).toEqual(new Set(['JSON']));
    expect(typesOf(['@startyaml', 'a: 1', '@endyaml'])).toEqual(new Set(['YAML']));
    expect(typesOf(['@starthcl', 'a = 1', '@endhcl'])).toEqual(new Set(['HCL']));
    expect(typesOf(['@startdot', 'digraph g {}', '@enddot'])).toEqual(new Set(['DOT']));
  });

  it('an unrecognised tag is {UNKNOWN}, which is a real answer', () => {
    expect(typesOf(['@startfoo', 'x', '@endfoo'])).toEqual(new Set(['UNKNOWN']));
  });

  it('keeps this port-only tag routing where it routes today', () => {
    // @startcomponent is one of EIGHT tags in START_SUFFIX_MAP that upstream
    // has never had -- the jar types it UNKNOWN and renders PSystemUnsupported.
    // The divergence is PRE-EXISTING; T3 carries it forward unchanged rather
    // than repairing it, because repairing it would move fixtures and this
    // task's whole property is that it moves none.
    expect(typesOf(['@startcomponent', '[A] --> [B]', '@endcomponent'])).toEqual(
      new Set(['DESCRIPTION']),
    );
  });
});

describe('upstreamTypeOf -- the port type union mapped onto the enum', () => {
  it('is total: every port type has an upstream member', () => {
    const PORT_TYPES: readonly DiagramType[] = [
      'sequence', 'class', 'state', 'description', 'activity', 'object',
      'timing', 'mindmap', 'gantt', 'wbs', 'json', 'yaml', 'hcl', 'board',
      'chronology', 'files', 'packetdiag', 'chart', 'dot', 'unknown',
    ];
    for (const t of PORT_TYPES) {
      expect(Object.values(UpstreamDiagramType)).toContain(upstreamTypeOf(t));
    }
  });

  it('maps packetdiag to PACKET -- the plugin is named for the tag, the enum for the diagram', () => {
    expect(upstreamTypeOf('packetdiag')).toBe(UpstreamDiagramType.PACKET);
    expect(upstreamTypeOf('description')).toBe(UpstreamDiagramType.DESCRIPTION);
  });
});
