/**
 * ddc T3a (decisions.md D8): `skinparam defaultFontColor` for json/yaml/hcl is
 * an EXTENSION. `FromSkinparamToStyle.java:157` converts it to
 * `root { FontColor }`; the jar drops the directive for these engines
 * (`StyleExtractor.java:88-96`), and the skin's `jsonDiagram { FontColor
 * black }` (`plantuml.skin:456-457`) is what it renders with. The extension
 * sets the family font colour as if the skin had no explicit FontColor.
 *
 * `red` is `#F00` in the SVG: the jar's `HColorSet` colour form
 * (`color-form.ts`), the same form the jar prints for `<style> root { FontColor
 * red }` (oracle: `scripts/oracle-render.sh`, key/value `fill="#F00"`).
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';

const OPTIONS = { measurer: new DeterministicMeasurer() };
const JAR_OPTIONS = withJarCompatibleStyleInput(OPTIONS);
const RED = '#F00';
const SKIN_BLACK = '#000';
const DIRECTIVE = 'skinparam defaultFontColor red';

const BODIES = {
  json: ['@startjson', '{"a":1}', '@endjson'],
  yaml: ['@startyaml', 'a: 1', '@endyaml'],
  hcl: ['@starthcl', 'resource "aws_instance" "web" {', '  ami = "ami-123"', '}', '@endhcl'],
} as const;

function source(engine: keyof typeof BODIES, directive: string | undefined): string {
  const [open, ...rest] = BODIES[engine];
  return [open, ...(directive === undefined ? [] : [directive]), ...rest].join('\n');
}

const textFills = (svg: string): string[] =>
  [...svg.matchAll(/<text\b[^>]*\bfill="([^"]*)"/g)].map((m) => m[1] as string);

describe.each(['json', 'yaml', 'hcl'] as const)('%s: skinparam defaultFontColor', (engine) => {
  it('extended mode draws every text in the directive colour', () => {
    const fills = textFills(renderSync(source(engine, DIRECTIVE), OPTIONS));
    expect(fills.length).toBeGreaterThanOrEqual(2);
    expect(new Set(fills)).toEqual(new Set([RED]));
  });

  it('the directive-free render keeps the skin black', () => {
    expect(new Set(textFills(renderSync(source(engine, undefined), OPTIONS)))).toEqual(new Set([SKIN_BLACK]));
  });

  it('jar-compatible mode is byte-identical to the directive-free render', () => {
    const plain = renderSync(source(engine, undefined), JAR_OPTIONS);
    expect(renderSync(source(engine, DIRECTIVE), JAR_OPTIONS)).toBe(plain);
    expect(plain).toBe(renderSync(source(engine, undefined), OPTIONS));
  });
});

describe('an explicit node FontColor beats the root default', () => {
  it('<style> jsonDiagram { node { FontColor blue } } wins over the directive', () => {
    const src = [
      '@startjson',
      DIRECTIVE,
      '<style>',
      'jsonDiagram { node { FontColor blue } }',
      '</style>',
      '{"a":1}',
      '@endjson',
    ].join('\n');
    expect(new Set(textFills(renderSync(src, OPTIONS)))).toEqual(new Set(['#00F']));
  });
});
