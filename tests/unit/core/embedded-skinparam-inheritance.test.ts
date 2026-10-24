/**
 * sdd3-T8h: a nested `{{ }}` diagram inherits the enclosing skinparams.
 *
 * `TitledDiagram.java:106-109`: `this.skinParam = SkinParam.create(...); if
 * (previous != null) this.skinParam.copyAllFrom(previous);` -- and
 * `EmbeddedDiagram.java:88-90` builds `previous` from the ENCLOSING
 * diagram's `skinParam.values()`. So menoke's nested note (its own text says
 * the opposite) is drawn handwritten: the golden's decoded payload carries
 * jiggled `<polygon>`/`<path>` where the port drew plain `<rect>`/`<line>`.
 * compareSvg exempts image href bytes, so the decoded payload is the witness.
 *
 * The nested diagram's own skinparam commands run after the constructor
 * (`SkinParam.java:242` `params.put`) and so win over an inherited key.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { sequenceFixtureOptions } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const PAYLOAD = /data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)/g;
const MENOKE = 'test-results/dot-cache/sequence/menoke-22-luxo044/in.svg';

/** `$T/svg-hashes.mts#canonicalize`: `<?plantuml-src?>` dropped, `style=` expanded
 *  into attributes, every tag's attributes sorted. */
function canonicalize(svg: string): string {
  const withoutPi = svg.replace(/<\?plantuml-src[\s\S]*?\?>/g, '');
  // A payload inside a payload is decoded and canonicalised the same way.
  const nested = withoutPi.replace(
    PAYLOAD,
    (_m, b64: string) => `data:image/svg+xml;canon,${canonicalize(Buffer.from(b64, 'base64').toString('utf8'))}`,
  );
  return nested.replace(
    /<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g,
    (_m, tag: string, attrs: string, close: string) => {
      const pairs: [string, string][] = [];
      for (const [, name, value] of attrs.matchAll(/([\w:-]+)="([^"]*)"/g)) {
        if (name !== 'style') pairs.push([name!, value!]);
        else
          for (const decl of value!.split(';')) {
            const i = decl.indexOf(':');
            if (i > 0) pairs.push([decl.slice(0, i).trim(), decl.slice(i + 1).trim()]);
          }
      }
      pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
      return `<${tag}${pairs.map(([k, v]) => ` ${k}="${v}"`).join('')}${close}>`;
    },
  );
}

/** The first place two strings differ, with context; '' when equal. */
function firstDifference(a: string, b: string): string {
  if (a === b) return '';
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `at ${String(i)}: ours ...${a.slice(Math.max(0, i - 40), i + 80)} | jar ...${b.slice(Math.max(0, i - 40), i + 80)}`;
}

/** Every nested payload of `svg`, decoded. */
const payloadsOf = (svg: string): string[] =>
  [...svg.matchAll(PAYLOAD)].map((m) => Buffer.from(m[1]!, 'base64').toString('utf8'));

function render(puml: string): string {
  const { assetStore, includeStore } = sequenceFixtureOptions();
  return renderSync(puml, { measurer: new DeterministicMeasurer(), assetStore, includeStore });
}

const NESTED_NOTE = 'c->d\nnote right\n     skinparam\n     handwritten\n     is not\n     inherited\nend note';
const menoke = (outer: string, inner = ''): string =>
  `@startuml\n${outer}\n\na->b\nnote right\n\n{{\n${inner}${NESTED_NOTE}\n}}\nend note\n@enduml`;

/** The nested note, as the golden draws it: a jiggled polygon/path. */
const JIGGLED_LIFELINE =
  '<polygon points="17,39,17,39.07,18.6,38.862,20.2,39.064,21.8,39.133,23.4,38.762,25,39,24.922,39,';
const JIGGLED_DASH = '<path d="M20.5,39 L20.78,39 L19.948,49 L20.758,59 L21.033,69 L19.549,79 L20.396,89 L19.931,99';
const PLAIN_LIFELINE = '<line x1="20.5" y1="39" x2="20.5" y2="129"';
/** Banner-shifted variants (a nested `skinparam handwritten` LINE raises the
 *  jar's "use !option handwritten" warning, `CommandSkinParam.java:88-99`, which
 *  moves the body down): y-agnostic shapes. */
const ANY_PLAIN_LIFELINE = /<line x1="20\.5" y1="\d+" x2="20\.5"/;
const ANY_JIGGLED_LIFELINE = /<polygon points="17,\d+,17,\d+\.\d+,18\.6,/;
const WITHOUT_PAYLOADS = (svg: string): string => svg.replace(PAYLOAD, '');

describe('menoke-22-luxo044 (TitledDiagram.java:106-109)', () => {
  const [payload] = payloadsOf(render(menoke('skinparam handwritten true')));

  it('draws the nested lifelines through the handwritten decorator, to the golden values', () => {
    expect(payload).toContain(JIGGLED_LIFELINE);
    expect(payload).toContain(JIGGLED_DASH);
    expect(payload).not.toContain(PLAIN_LIFELINE);
  });

  it.skipIf(!existsSync(MENOKE))("is canonically equal to the golden's decoded payload", () => {
    const golden = payloadsOf(readFileSync(MENOKE, 'utf8'));
    expect(golden).toHaveLength(1);
    expect(firstDifference(canonicalize(payload!), canonicalize(golden[0]!))).toBe('');
  });
});

describe('what is inherited', () => {
  it('a nested diagram whose enclosing diagram sets no skinparam is drawn plain', () => {
    const [plain] = payloadsOf(render(menoke('')));
    expect(plain).toContain(PLAIN_LIFELINE);
    expect(plain).not.toContain('<polygon points="17,39,17,39.07');
  });

  it("the nested diagram's own skinparam wins over the inherited one (SkinParam.java:242)", () => {
    const [own] = payloadsOf(render(menoke('skinparam handwritten true', 'skinparam handwritten false\n')));
    expect(own).toMatch(ANY_PLAIN_LIFELINE);
    expect(own).not.toMatch(ANY_JIGGLED_LIFELINE);
  });

  it("a nested diagram's own skinparam is not pushed up into the enclosing one", () => {
    const svg = render(menoke('', 'skinparam handwritten true\n'));
    expect(WITHOUT_PAYLOADS(svg)).toMatch(/<line [^>]*stroke-dasharray/);
    expect(WITHOUT_PAYLOADS(svg)).not.toMatch(ANY_JIGGLED_LIFELINE);
    expect(payloadsOf(svg)[0]).toMatch(ANY_JIGGLED_LIFELINE);
  });

  it("is transitive: the middle diagram's params (inherited ones included) reach the innermost", () => {
    const inner = `{{\n${NESTED_NOTE}\n}}`;
    const [middle] = payloadsOf(
      render(
        `@startuml\nskinparam handwritten true\na->b\nnote right\n{{\nc->d\nnote right\n${inner}\nend note\n}}\nend note\n@enduml`,
      ),
    );
    const [innermost] = payloadsOf(middle!);
    expect(innermost).toContain(JIGGLED_LIFELINE);
  });
});

describe('golden payloads of the other engines whose enclosing diagram sets a skinparam', () => {
  const ROWS = [
    'activity/pixisi-38-kixa563',
    'activity/mufixi-71-koma752',
    'activity/runima-82-jigi009',
    'activity/fikuki-99-kulu790',
    'activity/romuru-66-samu329',
    'usecase/zidebi-71-nocu387',
    'usecase/kovaxi-11-reti348',
  ] as const;
  for (const row of ROWS) {
    const dir = `test-results/dot-cache/${row}`;
    it.skipIf(!existsSync(`${dir}/in.svg`))(`${row}: nested payload canonically equal to the jar's`, () => {
      const ours = payloadsOf(render(readFileSync(`${dir}/in.puml`, 'utf8'))).map(canonicalize);
      const jar = payloadsOf(readFileSync(`${dir}/in.svg`, 'utf8')).map(canonicalize);
      expect(ours).toHaveLength(jar.length);
      ours.forEach((payload, i) => expect(firstDifference(payload, jar[i]!)).toBe(''));
    });
  }
});
