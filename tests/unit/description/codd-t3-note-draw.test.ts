/**
 * codd-T3 -- `EntityImageNote#drawU` for a description note: ONE entity group
 * holding the outline, the fold and the body text (`EntityImageNote.java:154-233`,
 * `drawNormal` :272-286), fill from the entity `#color` / the `.tag` style.
 * Expected strings are the jar's: component/basetu-75-xevi153 (plain note),
 * component/gekato-87-lisi598 (`#red`/`#blue`), component/tijexo-10-zipo222
 * (`<<green>>` + `<style> note { .green { BackgroundColor green } }`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(src: string): string {
  return renderSync(src, { measurer: new DeterministicMeasurer() });
}

/** Every `<path>`'s `fill`, in document order. */
function pathFills(svg: string): string[] {
  return [...svg.matchAll(/<path [^>]*fill="(#[0-9A-Fa-f]+)"/g)].map((m) => m[1]!);
}

describe('description note drawing', () => {
  it('draws a standalone note as polygon + fold + text inside one group', () => {
    const svg = render('@startuml\ncomponent dummy\nnote as tott\ntoto\nend note\n@enduml');
    expect(svg).toContain(
      '<g class="entity" data-qualified-name="tott" id="ent0002">' +
        '<path d="M127.62,17.5 L127.62,40.5 L170.232,40.5 L170.232,27.5 L160.232,17.5 L127.62,17.5" ' +
        'style="stroke:#181818;stroke-width:0.5;" fill="#FEFFDD"/>' +
        '<path d="M160.232,17.5 L160.232,27.5 L170.232,27.5 L160.232,17.5" ' +
        'style="stroke:#181818;stroke-width:1;" fill="#FEFFDD"/>' +
        '<text x="133.62" y="32.611" fill="#000" font-size="13" textLength="21.612">toto</text></g>',
    );
  });

  it('fills a note with its #color token', () => {
    const svg = render('@startuml\n() "a"\nnote left of ()"a" #red : this is a note\n@enduml');
    expect(pathFills(svg)).toEqual(['#F00', '#F00']);
  });

  it('fills a note from the .tag style of its <<stereotype>>', () => {
    const svg = render(
      '@startuml\n<style>\nnote {\n  BackGroundColor #fff\n  .green {\n    BackgroundColor green\n  }\n}\n</style>\n' +
        'node n\nnote left of n <<green>>: note that is green\n@enduml',
    );
    // the node's own paths are #F1F1F1; the note's two are the jar's #008000
    expect(pathFills(svg).slice(-2)).toEqual(['#008000', '#008000']);
  });
});
