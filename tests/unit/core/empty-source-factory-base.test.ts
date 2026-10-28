/**
 * T2g (ddc): the empty-source test belongs to the factory base, not to every
 * block (plans/data-diagram-conformance/diagnosis/empty-source.md).
 *
 * Upstream `PSystemBuilder#createPSystem` tries each candidate factory in
 * order and keeps the first whose result `isOk` (`PSystemBuilder.java:257-287`,
 * `:298-303`). `PSystemCommandFactory#createSystem` answers an empty source
 * with `buildEmptyError` (`PSystemCommandFactory.java:117-122`);
 * `PSystemAbstractFactory` defines `buildEmptyError` (`:59-65`) but its direct
 * subclasses (`FilesDiagramFactory`, `JsonDiagramFactory`, `YamlDiagramFactory`,
 * `HclDiagramFactory`) never call it and build their diagram from the empty
 * source; `PSystemBasicFactory` runs its own test
 * (`PSystemBasicFactory.java:89-90`).
 *
 * Expected end-to-end values are the jar's, rendered with
 * `scripts/oracle-render.sh` (deterministic text) from the two-line
 * `@start<t>` / `@end<t>` probes.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DiagramRegistry, type SyncPlugin } from '../../../src/core/dispatcher.js';
import { upstreamTypeOf, type DiagramType, type UmlSource } from '../../../src/core/block-extractor.js';
import type { PSystemFactoryBase } from '../../../src/core/dispatcher-types.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';
import { renderSync } from '../../../src/index.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

/** A plugin of `type` whose parse always succeeds, declaring `factoryBase` (absent when undefined). */
function pluginOf(type: DiagramType, factoryBase?: PSystemFactoryBase): SyncPlugin {
  return {
    type,
    ...(factoryBase === undefined ? {} : { factoryBase }),
    parse: () => ({ owner: type }),
    layoutSync: () => ({}),
    render: () => ({ completeSvg: '<svg/>' }),
  };
}

function sourceFor(...types: DiagramType[]): UmlSource {
  return { lines: [], type: types[0]!, types: new Set(types.map(upstreamTypeOf)) };
}

describe('DiagramRegistry#isEmptyDescription -- PSystemCommandFactory.java:117-122', () => {
  it('is true when every candidate is a command factory (factoryBase absent)', () => {
    const registry = new DiagramRegistry();
    registry.register(pluginOf('sequence'));
    registry.register(pluginOf('class', 'PSystemCommandFactory'));
    registry.register(pluginOf('json', 'PSystemAbstractFactory'));
    // `@startuml`'s set holds no json factory (`DiagramType.java:198-200`).
    expect(registry.isEmptyDescription(sourceFor('sequence', 'class'))).toBe(true);
  });

  it('is false when a candidate extends PSystemAbstractFactory directly (FilesDiagramFactory.java:53-59)', () => {
    const registry = new DiagramRegistry();
    registry.register(pluginOf('sequence'));
    registry.register(pluginOf('files', 'PSystemAbstractFactory'));
    expect(registry.isEmptyDescription(sourceFor('files'))).toBe(false);
  });

  it('is false for a PSystemBasicFactory candidate, which runs its own test (PSystemBasicFactory.java:89-90)', () => {
    const registry = new DiagramRegistry();
    registry.register(pluginOf('dot', 'PSystemBasicFactory'));
    expect(registry.isEmptyDescription(sourceFor('dot'))).toBe(false);
  });

  it('is true when there is no candidate at all (nothing builds; the hoisted test keeps its page)', () => {
    const registry = new DiagramRegistry();
    registry.register(pluginOf('files', 'PSystemAbstractFactory'));
    expect(registry.isEmptyDescription(sourceFor('sequence'))).toBe(true);
  });
});

describe('DiagramRegistry#resolve on an empty source -- PSystemBuilder.java:258-273', () => {
  it('skips the command-factory candidates, which would each answer buildEmptyError', () => {
    const registry = new DiagramRegistry();
    registry.register(pluginOf('sequence'));
    registry.register(pluginOf('files', 'PSystemAbstractFactory'));
    const source = sourceFor('sequence', 'files');
    expect(registry.resolve(source, undefined, undefined, true).plugin.type).toBe('files');
    // A non-empty source keeps the plain first-ok order.
    expect(registry.resolve(source).plugin.type).toBe('sequence');
  });
});

const measurer = (): DeterministicMeasurer => new DeterministicMeasurer();
const rootSize = (svg: string): string => /width="([\d.]+)px" height="([\d.]+)px"/.exec(svg)!.slice(1).join('x');
const texts = (svg: string): string[] => [...svg.matchAll(/<text[^>]*>([^<]*)/g)].map((m) => m[1]!);
/** The jar writes text spaces as U+00A0 (as ours does); the oracle bytes carry the same code point. */
const NBSP = '\u00a0';

describe('renderSync on an empty body -- each engine as its jar factory does', () => {
  it('@startfiles: FilesDiagram over an empty listing, byte-equal to the jar (21x21)', () => {
    const jar = readFileSync('tests/fixtures/files/empty-diagram.svg', 'utf8');
    const ours = renderSync('@startfiles\n@endfiles\n', withJarCompatibleStyleInput({ measurer: measurer() }));
    expect(compareSvg(ours, jar, 'deterministic').diffs).toEqual([]);
    expect(rootSize(ours)).toBe('21x21');
  });

  it.each([
    ['json', 'JSON', '288x39'],
    ['yaml', 'YAML', '289x39'],
  ])('@start%s: a null payload draws "does not sound like" (JsonDiagram.java:116-122)', (tag, upper, size) => {
    const ours = renderSync(`@start${tag}\n@end${tag}\n`, withJarCompatibleStyleInput({ measurer: measurer() }));
    expect(rootSize(ours)).toBe(size);
    expect(ours).toContain(`data-diagram-type="${upper}"`);
    expect(texts(ours)).toEqual([`Your data does not sound like ${upper} data`.replaceAll(' ', NBSP)]);
  });

  it('@starthcl: HclParser over no lines yields one empty node (HclDiagramFactory.java:61-94), 35x40', () => {
    const ours = renderSync('@starthcl\n@endhcl\n', withJarCompatibleStyleInput({ measurer: measurer() }));
    expect(rootSize(ours)).toBe('35x40');
    expect(ours).toContain('data-diagram-type="HCL"');
    expect(texts(ours)).toEqual([NBSP]);
  });

  it("@startdot: the dot plugin's own PSystemBasicFactory refusal draws the jar's page, 532x284", () => {
    const ours = renderSync('@startdot\n@enddot\n', { measurer: measurer() });
    expect(rootSize(ours)).toBe('532x284');
    // The jar's trace lists both lines (PSystemBasicFactory.java:89-90, `it.getTrace()` after `@end`).
    expect(texts(ours)).toEqual(expect.arrayContaining(['@startdot', '@enddot']));
    expect(texts(ours)).toContain('Empty description (Assumed diagram type: dot)');
  });

  it('@startuml/@enduml keeps the Welcome page (PSystemWelcomeFactory.java:49-56), 532x227', () => {
    const ours = renderSync('@startuml\n@enduml\n', { measurer: measurer() });
    expect(rootSize(ours)).toBe('532x227');
    expect(texts(ours)[0]).toBe('Welcome to PlantUML!');
  });
});
