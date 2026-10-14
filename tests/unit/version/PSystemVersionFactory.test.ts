/**
 * `PSystemVersionFactory` (version/PSystemVersionFactory.java): `about` /
 * `author` / `authors` (java:52), `version` (java:55, the port's own values —
 * decisions.md D14) and bare `stdlib` (java:59) through the single-line gate.
 * `testdot` and the key tools (java:62-83, D8) are not accepted.
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { CompleteSvg } from '../../../src/core/dispatcher.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseRefusalOf, refuse } from '../../../src/core/parse-refusal.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import type { PSystemVersion } from '../../../src/diagrams/version/PSystemVersion.js';
import { PSystemVersionFactory, versionPlugin } from '../../../src/diagrams/version/PSystemVersionFactory.js';

const measurer = new DeterministicMeasurer();

function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function linesOf(line: string): readonly string[] | undefined {
  const diagram = new PSystemVersionFactory().executeLine(
    sourceOf(`@startuml\n${line}\n@enduml`),
    line,
    new PreprocessingArtifact(),
  );
  return diagram?.getLines();
}

function renderOf(line: string): string {
  const diagram = versionPlugin.parse(sourceOf(`@startuml\n${line}\n@enduml`));
  if (parseRefusalOf(diagram) !== undefined) throw new Error('refused');
  const geometry = versionPlugin.layoutSync(diagram as PSystemVersion, defaultTheme, measurer);
  return (versionPlugin.render(geometry, defaultTheme) as CompleteSvg).completeSvg;
}

describe('PSystemVersionFactory#executeLine (java:49-90)', () => {
  it('about, author and authors build the authors page, any case, trailing whitespace allowed', () => {
    for (const line of ['about', 'author', 'authors', 'ABOUT', 'Authors \t'])
      expect(linesOf(line)?.[3], JSON.stringify(line)).toBe('<u>Original idea</u>: Arnaud Roques');
  });

  it('stdlib builds the stdlib page', () => {
    for (const line of ['stdlib', 'STDLIB', 'stdlib  ']) expect(linesOf(line)?.[0], line).toBe('<b>adaml');
  });

  it('version builds the version page, any case, trailing whitespace allowed (java:55-56)', () => {
    for (const line of ['version', 'VERSION', 'Version \t'])
      expect(linesOf(line)?.[2], JSON.stringify(line)).toBe('<b>Build Time</b> ""Unknown compile time""');
  });

  it('refuses testdot and the key tools (D8), and anything else', () => {
    for (const line of [
      'versions',
      ' version',
      'testdot',
      'keygen',
      'keydistributor',
      'keyimport abc',
      'keycheck a b',
      'abouts',
      ' about',
    ])
      expect(linesOf(line), JSON.stringify(line)).toBeUndefined();
  });
});

describe('versionPlugin', () => {
  it("is a 'sequence' candidate", () => {
    expect(versionPlugin.type).toBe('sequence');
  });

  it('renders the about page as a complete document', () => {
    const svg = renderOf('about');
    // 239 (the jar's page) + 12: the port-author credit line (user ruling 2026-10-14).
    expect(svg).toContain('width="393px" height="251px"');
    expect(svg).toContain('text-decoration="underline">Original idea</text>');
  });

  it('renders the stdlib page as govuca-53-mili511 does: 589 x 1655', () => {
    expect(renderOf('stdlib')).toContain('width="589px" height="1655px"');
  });

  it('renders the version page with the logo bottom-right', () => {
    const svg = renderOf('version');
    expect(svg).toContain('font-weight="700">Installation seems OK. File generation OK</text>');
    expect(svg).toMatch(/<image width="80" height="71" x="[\d.]+" y="\d+"/);
  });

  it('renders each page the same three times', () => {
    for (const line of ['about', 'stdlib', 'version'])
      expect(new Set([0, 1, 2].map(() => renderOf(line))).size).toBe(1);
  });

  it("refuses testdot with the gate's Syntax Error?", () => {
    expect(versionPlugin.parse(sourceOf('@startuml\ntestdot\n@enduml'))).toEqual(
      refuse('syntax', 1, 1, 'Syntax Error?'),
    );
  });

  it('refuses a 4-line source below every real refusal', () => {
    expect(parseRefusalOf(versionPlugin.parse(sourceOf('@startuml\nabout\nabout\n@enduml')))?.commandScore).toBe(
      Number.NEGATIVE_INFINITY,
    );
  });
});
