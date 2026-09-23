/**
 * CDD T23 — per-member `[[[url]]]` anchors on the ENHANCED-BODY render
 * path (`isEnhancedBody`, `class-body-enhanced.ts:72-78` — any classifier
 * whose raw body has a `--`/`==`/`..`/`__` block separator or a `|_` tree
 * line, REPLACING the classic fields/methods split entirely).
 *
 * Mechanism (diagnosis `A2b-entity-groups.md` E10, `.agent-notes/
 * cdd-T23.md`): `buildBodyPrimitives`'s enhanced-body branch
 * (`renderer-classifier-box.ts`) used to collapse the WHOLE body into ONE
 * opaque string tagged with the classifier's OWN fallback url, discarding
 * every member row's OWN `[[[url]]]` (`class-body-enhanced-layout.ts:201`
 * already threads `m.ownUrl` onto each row — it was just never read by the
 * render side). Upstream draws each enhanced-body "rows" block via `new
 * MethodsOrFieldsArea(display, ...)` (`BodyEnhanced1.java:186-190`), the
 * SAME class the classic (non-enhanced) path uses — its `TextBlockTracer`
 * (`MethodsOrFieldsArea.java:305-323`) opens/closes each member atom's OWN
 * `Url` independently of the classifier-level `startUrl`/`closeUrl`
 * (`EntityImageClass.java:141-158`). `cutasu-32-zete658`'s `CarePlan`
 * (jar: nine `<a>`) and `xogixe-78-zuro619`'s `Observation` (jar: 50 `<a>`,
 * icon-bearing rows) are the corpus's only two enhanced-body fixtures that
 * carry `[[[url]]]`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:141-158
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:305-323
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:186-190
 */
import { describe, it, expect } from 'vitest';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(markup: string): string {
  return renderFixtureClass(markup, new DeterministicMeasurer());
}

/** Same extraction convention as `renderer-classifier-box-chrome-t20.test
 *  .ts#entityGroup`: entities are siblings at the same nesting depth, so
 *  the next `<!--` (or end of string) is a safe end bound. */
function entityGroup(svg: string, name: string): string {
  const marker = `<!--class ${name}-->`;
  const start = svg.indexOf(marker);
  if (start === -1) throw new Error(`entity "${name}" not found in rendered SVG`);
  const bodyStart = svg.indexOf('<g class="entity"', start);
  const next = svg.indexOf('<!--', bodyStart + 1);
  return svg.slice(bodyStart, next === -1 ? svg.length : next);
}

function anchorCount(group: string): number {
  return (group.match(/<a /g) ?? []).length;
}

function hrefs(group: string): string[] {
  return [...group.matchAll(/<a [^>]*?\bhref="([^"]*)"/g)].map((m) => m[1]!);
}

const CUTASU_CAREPLAN = [
  '@startuml',
  'class CarePlan << (R, #FF7700) >> {',
  'identifier : Identifier 0..1 [[[careplan-definitions.htm#CarePlan.identifier]]]',
  'patient : Resource(Patient) 1..1 [[[careplan-definitions.htm#CarePlan.patient]]]',
  'status : code 1..1 [[[careplan-definitions.htm#CarePlan.status]]]',
  'period : Period 0..1 [[[careplan-definitions.htm#CarePlan.period]]]',
  'modified : dateTime 0..1 [[[careplan-definitions.htm#CarePlan.modified]]]',
  'concern : Resource(Problem) 0..* [[[careplan-definitions.htm#CarePlan.concern]]]',
  'goal : string 0..1 [[[careplan-definitions.htm#CarePlan.goal]]]',
  '--',
  '}',
  'url of CarePlan is [[careplan-definitions.htm#CarePlan]]',
  '@enduml',
].join('\n');

describe('T23: cutasu-32-zete658 (CarePlan) — nine `<a>`, no visibility icons', () => {
  it('splits into exactly nine `<a>` elements (jar: g[2] childCount=9)', () => {
    const svg = render(CUTASU_CAREPLAN);
    const group = entityGroup(svg, 'CarePlan');
    expect(anchorCount(group)).toBe(9);
  });

  it('href sequence is [fallback, 7 member urls, fallback] in source order', () => {
    const svg = render(CUTASU_CAREPLAN);
    const group = entityGroup(svg, 'CarePlan');
    const fallback = 'careplan-definitions.htm#CarePlan';
    expect(hrefs(group)).toEqual([
      fallback,
      `${fallback}.identifier`,
      `${fallback}.patient`,
      `${fallback}.status`,
      `${fallback}.period`,
      `${fallback}.modified`,
      `${fallback}.concern`,
      `${fallback}.goal`,
      fallback,
    ]);
  });

  it('the header `<a>` bundles rect+ellipse+path+text+line (5 elements), never split', () => {
    const svg = render(CUTASU_CAREPLAN);
    const group = entityGroup(svg, 'CarePlan');
    const headerA = group.slice(group.indexOf('<a '), group.indexOf('</a>') + '</a>'.length);
    for (const tag of ['<rect', '<ellipse', '<path', '<text', '<line']) {
      expect(headerA).toContain(tag);
    }
  });

  it('the closing divider `<a>` (classifier fallback) wraps exactly one `<line>`, no `<text>`', () => {
    const svg = render(CUTASU_CAREPLAN);
    const group = entityGroup(svg, 'CarePlan');
    const lastAStart = group.lastIndexOf('<a ');
    const lastA = group.slice(lastAStart, group.indexOf('</a>', lastAStart) + '</a>'.length);
    expect(lastA).toContain('<line');
    expect(lastA).not.toContain('<text');
  });
});

const XOGIXE_OBSERVATION = [
  '@startuml',
  'class Observation << (R, #FF7700) >> {',
  '+ name : CodeableConcept 1..1 [[[http://www/Observation/name {Definition}]]]',
  '+ value[x] : Quantity|CodeableConcept|Attachment|Ratio|Choice|Period|string 0..1 [[[http://www/Observation/value%5Bx%5D {Definition}]]]',
  '+ interpretation : CodeableConcept 0..1 [[[http://www/Observation/interpretation {Definition}]]]',
  '+ comments : string 0..1 [[[http://www/Observation/comments {Definition}]]]',
  '+ obtained[x] : Period|dateTime 0..1 [[[http://www/Observation/obtained%5Bx%5D {Definition}]]]',
  '+ issued : instant 0..1 [[[http://www/Observation/issued {Definition}]]]',
  '+ status : code 1..1 [[[http://www/Observation/status {Definition}]]]',
  '+ reliability : code 1..1 [[[http://www/Observation/reliability {Definition}]]]',
  '+ bodySite : CodeableConcept 0..1 [[[http://www/Observation/bodySite {Definition}]]]',
  '+ method : CodeableConcept 0..1 [[[http://www/Observation/method {Definition}]]]',
  '+ identifier : Identifier 0..1 [[[http://www/Observation/identifier {Definition}]]]',
  '+ subject : Resource(Patient|Group|Device|Animal) 0..1 [[[http://www/Observation/subject {Definition}]]]',
  '+ performer : Resource(Provider|Device|Organization) 0..1 [[[http://www/Observation/performer {Definition}]]]',
  '+ normalValue[x] : Range|string 0..1 [[[http://www/Observation/normalValue%5Bx%5D {Definition}]]]',
  '+ extension : Extension 0..* [[[http://www/Observation/extension {Definition}]]]',
  '+ text : Narrative 1..1 [[[http://www/Observation/text {Definition}]]]',
  '--',
  '}',
  'url of Observation is [[http://www/Observation {Observation definition}]]',
  '@enduml',
].join('\n');

describe('T23: xogixe-78-zuro619 (Observation) — 50 `<a>`, explicit-visibility icon rows', () => {
  it('splits into exactly 50 `<a>` elements (jar: g[2] childCount=50)', () => {
    const svg = render(XOGIXE_OBSERVATION);
    const group = entityGroup(svg, 'Observation');
    // 1 (header+leading divider) + 16 members * 3 (icon-bg, icon, text) + 1
    // (closing divider) = 50 -- MethodsOrFieldsArea.java:305-323's per-atom
    // TextBlockTracer wrap, reused unchanged by BodyEnhanced1.
    expect(anchorCount(group)).toBe(50);
  });

  it('the FIRST member row (icon-bearing) draws its 3-`<a>` triple: url-background rect, `<g data-visibility-modifier>`-wrapped icon, text', () => {
    const svg = render(XOGIXE_OBSERVATION);
    const group = entityGroup(svg, 'Observation');
    const href = 'http://www/Observation/name';
    const rowStart = group.indexOf(`href="${href}"`, group.indexOf('data-qualified-name'));
    // Back up to this <a>'s own opening tag, then take the next ~3 anchors.
    const tripleStart = group.lastIndexOf('<a ', rowStart);
    const triple = group.slice(tripleStart, group.indexOf('name : CodeableConcept') + 60);
    expect(triple).toContain('<rect');
    expect(triple).toContain('data-visibility-modifier');
    expect(triple).toContain('<ellipse');
    expect(triple).toContain('<text');
    // All three anchors in the triple share the SAME member-owned href
    // (excluding the `xlink:href` twin each `<a>` also carries).
    const hrefOnly = new RegExp(`(?<!xlink:)href="${href.replace(/[[\]]/g, '\\$&')}"`, 'g');
    expect((triple.match(hrefOnly) ?? []).length).toBe(3);
  });

  it('the header `<a>` and the closing-divider `<a>` both use the classifier fallback url', () => {
    const svg = render(XOGIXE_OBSERVATION);
    const group = entityGroup(svg, 'Observation');
    const fallback = 'http://www/Observation';
    const all = hrefs(group);
    expect(all[0]).toBe(fallback);
    expect(all[all.length - 1]).toBe(fallback);
  });
});

describe('T23 regression: enhanced body with NO member-owned url stays ONE `<a>`', () => {
  it('a bare `--` separator with only a classifier-level `[[url]]` merges to a single `<a>`', () => {
    const svg = render(
      ['@startuml', 'class Foo {', 'field1', 'field2', '--', '}', 'url of Foo is [[foo.htm]]', '@enduml'].join('\n'),
    );
    const group = entityGroup(svg, 'Foo');
    expect(anchorCount(group)).toBe(1);
    expect(hrefs(group)).toEqual(['foo.htm']);
  });

  it('a bare `--` separator with NO url at all draws zero `<a>` elements', () => {
    const svg = render(['@startuml', 'class Foo {', 'field1', 'field2', '--', '}', '@enduml'].join('\n'));
    const group = entityGroup(svg, 'Foo');
    expect(anchorCount(group)).toBe(0);
  });
});
