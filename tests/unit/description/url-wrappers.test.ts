/**
 * DUR T2 (Family B): the description text drawers wrap each creole text run
 * and each inline atom that carries a url in its OWN `<a>`
 * (`AtomText.java:197-198,235-236`, `AtomSprite.java:73-80`). Expected
 * structure is the jar's (`test-results/dot-cache/unknown/gubexu-05-dufu787`,
 * `usecase/bivira-53-boja685`, `usecase/vivido-49-nisu863`).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const TARGET = 'https://scrumguides.org/scrum-guide.html#transparency';
/** Jar `<path d>` for the two-leaf probe below
 *  (`scripts/oracle-render.sh`, 2026-10-16). */
const JAR_CLOUD_D =
  'M34.055,18.944 C32.643,18.944 31.407,19.947 31.138,21.277 C29.855,21.277 28.805,22.327 28.805,23.611 C28.805,24.894 29.855,25.944 31.138,25.944 L36.388,25.944 C37.357,25.944 38.138,25.162 38.138,24.194 C38.138,23.436 37.648,22.689 36.972,22.444 L36.972,21.861 C36.972,20.251 35.665,18.944 34.055,18.944';
const NO_URL_GOLDEN = fileURLToPath(new URL('./fixtures/dur-t2-no-url.svg', import.meta.url));

function render(puml: string): string {
  return renderSync(puml, { measurer: new DeterministicMeasurer() });
}

function anchors(svg: string): string[] {
  return svg.match(/<a [^>]*>.*?<\/a>/g) ?? [];
}

describe('per-run url wrap in the description drawers', () => {
  it('wraps an archimate display run in one <a> carrying the tooltip title (gubexu)', () => {
    const svg = render(
      `@startuml\narchimate #MOTIVATION "[[${TARGET} {Transparency} Transparency]]" <<motivation-principle>> as T\n@enduml\n`,
    );
    const found = anchors(svg);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain(`href="${TARGET}"`);
    expect(found[0]).toContain('title="Transparency"');
    expect(found[0]).toMatch(/<text [^>]*fill="#00F"[^>]*text-decoration="underline">Transparency<\/text><\/a>$/);
  });

  it('leaves the text outside [[ ]] outside the <a> (usecase label run)', () => {
    const svg = render('@startuml\nusecase (m) as "You can click\\n[[http://www.google.com]] done"\n@enduml\n');
    const found = anchors(svg);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain('>http://www.google.com</text></a>');
    expect(found[0]).not.toContain('You can click');
  });

  it('gives the text run, the glyph and the trailing run each their own <a> (vivido ent0003)', () => {
    const svg = render('@startuml\nrectangle "x\\n[[http://plantuml.com before <&cloud> after]]"\n@enduml\n');
    const found = anchors(svg);
    expect(found).toHaveLength(3);
    expect(found[0]).toContain('>before</text></a>');
    expect(found[1]).toMatch(/^<a [^>]*><path d="M[^"]*" fill="#00F"\/><\/a>$/);
    expect(found[2]).toContain('>after</text></a>');
    for (const a of found) expect(a.match(/<a /g)).toHaveLength(1);
  });

  it('draws a non-url <&cloud> glyph exactly where the jar does (usecase probe)', () => {
    const svg = render('@startuml\nusecase (m) as "a <&cloud> b"\nrectangle "x <&cloud> y" as r\n@enduml\n');
    expect(svg).toContain(`<path d="${JAR_CLOUD_D}" fill="#000"/>`);
    expect(anchors(svg)).toEqual([]);
  });

  it('is byte-identical for a diagram with no [[ url', () => {
    const svg = render(
      '@startuml\nusecase (a) as "plain **bold** text\\nline <i>two</i>"\nrectangle r\nnote right of a : a note\na -> r : the label\n@enduml\n',
    );
    expect(svg).toBe(readFileSync(NO_URL_GOLDEN, 'utf8'));
    expect(anchors(svg)).toEqual([]);
  });
});
