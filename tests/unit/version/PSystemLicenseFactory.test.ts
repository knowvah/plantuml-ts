/**
 * `PSystemLicenseFactory` (version/PSystemLicenseFactory.java): the
 * `(?i)^li[sc][ea]n[sc]e\s*$` line (java:51) through the single-line gate.
 *
 * Jar probes (T0c, `scripts/oracle-render.sh`): `license   ` renders the page,
 * `   license` is a `Syntax Error?` page — the line reaches `executeLine`
 * untrimmed (`PSystemSingleLineFactory.java:95`).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { CompleteSvg } from '../../../src/core/dispatcher.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseRefusalOf, refuse } from '../../../src/core/parse-refusal.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { PSystemLicense } from '../../../src/diagrams/version/PSystemLicense.js';
import { licensePlugin, PSystemLicenseFactory } from '../../../src/diagrams/version/PSystemLicenseFactory.js';

const measurer = new DeterministicMeasurer();

function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function accepts(line: string): boolean {
  return (
    new PSystemLicenseFactory().executeLine(
      sourceOf(`@startuml\n${line}\n@enduml`),
      line,
      new PreprocessingArtifact(),
    ) !== undefined
  );
}

function renderOf(text: string): string {
  const diagram = licensePlugin.parse(sourceOf(text));
  if (parseRefusalOf(diagram) !== undefined) throw new Error('refused');
  const geometry = licensePlugin.layoutSync(diagram as PSystemLicense, defaultTheme, measurer);
  return (licensePlugin.render(geometry, defaultTheme) as CompleteSvg).completeSvg;
}

describe('PSystemLicenseFactory#executeLine (java:48-58)', () => {
  it('accepts every li[sc][ea]n[sc]e spelling, any case', () => {
    for (const line of ['license', 'licence', 'lisense', 'lisance', 'LICENSE', 'LiCeNsE', 'lisanse'])
      expect(accepts(line), line).toBe(true);
  });

  it('accepts trailing Java whitespace (\\s*$)', () => {
    for (const line of ['license   ', 'license\t', 'license \x0B\f'])
      expect(accepts(line), JSON.stringify(line)).toBe(true);
  });

  it('refuses leading whitespace, other words and non-Java whitespace', () => {
    for (const line of ['   license', '\tlicense', 'licenses', 'license x', 'lic', 'license\u00a0'])
      expect(accepts(line), JSON.stringify(line)).toBe(false);
  });

  it('builds a PSystemLicense', () => {
    const diagram = new PSystemLicenseFactory().executeLine(
      sourceOf('@startuml\nlicense\n@enduml'),
      'license',
      new PreprocessingArtifact(),
    );
    expect(diagram).toBeInstanceOf(PSystemLicense);
  });
});

describe('licensePlugin', () => {
  it("is a 'sequence' candidate (the @startuml hack, PSystemSingleLineFactory.java:58-61)", () => {
    expect(licensePlugin.type).toBe('sequence');
  });

  it('renders the page as a complete document (581 x 881: the MIT edition, D13)', () => {
    const svg = renderOf('@startuml\nlicense\n@enduml');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="581px" height="881px"');
    expect(svg).toContain('>(C) Copyright 2009-2024, Arnaud Roques</text>');
  });

  it('renders the same document three times', () => {
    expect(new Set([0, 1, 2].map(() => renderOf('@startuml\nlicense\n@enduml'))).size).toBe(1);
  });

  it("refuses another line with the gate's Syntax Error? (java:96-97)", () => {
    expect(licensePlugin.parse(sourceOf('@startuml\nlicenses\n@enduml'))).toEqual(
      refuse('syntax', 1, 1, 'Syntax Error?'),
    );
  });

  it('refuses a 4-line source below every real refusal (java:75-76)', () => {
    const refusal = parseRefusalOf(licensePlugin.parse(sourceOf('@startuml\nlicense\nlicense\n@enduml')));
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
