/**
 * cdd-T16 (M7/E11): `renderer-group.ts#renderGroupInheritanceNeighborhood`
 * -- the shared inheritance triangle + stub line(s) a `skinparam
 * groupInheritance`-protected parent draws (`dot/Neighborhood.java:
 * 69-96`'s `drawU`, sametail loop only). Direct unit tests on hand-built
 * geometry (per `~/.claude/rules/testability.md`), plus a full-pipeline
 * check against `lazeju-60-boki114`'s real, measured contact points.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { renderGroupInheritanceNeighborhood } from '../../../src/diagrams/class/renderer-group.js';
import type { ClassifierGeo, EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { renderFixtureClass, layoutFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { classifierLeaves } from '../../../src/diagrams/class/class-geo-types.js';

function makeClassifierGeo(overrides?: Partial<ClassifierGeo>): ClassifierGeo {
  return { id: 'A', kind: 'class', x: 0, y: 0, width: 80, height: 80, dividerYs: [], rows: [], ...overrides };
}

function makeEdgeGeo(overrides?: Partial<EdgeGeo>): EdgeGeo {
  return {
    id: 'edge-0',
    points: [],
    targetDecor: 'none',
    sourceDecor: 'none',
    dashed: false,
    from: 'B',
    to: 'A',
    ...overrides,
  };
}

describe('renderGroupInheritanceNeighborhood — hand-built geometry', () => {
  it('returns [] for a classifier with no grouped (sametail) edges touching it', () => {
    const geo = makeClassifierGeo();
    const edges = [makeEdgeGeo({ sametail: { parentId: 'OTHER', contact: { x: 20, y: 100 } } })];
    expect(renderGroupInheritanceNeighborhood(geo, edges, defaultTheme)).toEqual([]);
  });

  it('draws exactly one triangle + one stub line for a straight-down contact point', () => {
    // rect (inner box) = {x:20,y:20,width:40,height:40} (PROTECTED_BORDER=20
    // backed out of the 80x80 padded geo), center=(40,40). A contact point
    // directly below center (40,140) makes theta=atan2(0,+)=0 -- the
    // UNROTATED (0,0),(7,20),(-7,20) triangle -- and the center->contact
    // segment (a vertical line x=40) crosses the rect's own bottom edge
    // (y=60, x in [20,60]) at exactly (40,60) (`Neighborhood.java:132-152`'s
    // four-edge rect intersection, top/bottom/left/right in that order).
    const geo = makeClassifierGeo();
    const edges = [
      makeEdgeGeo({ id: 'e0', from: 'B', sametail: { parentId: 'A', contact: { x: 40, y: 140 } } }),
      makeEdgeGeo({ id: 'e1', from: 'C', sametail: { parentId: 'A', contact: { x: 40, y: 140 } } }),
    ];
    const parts = renderGroupInheritanceNeighborhood(geo, edges, defaultTheme);
    expect(parts.length).toBe(2); // ONE triangle + ONE stub -- both e0/e1 share the SAME contact
    const [triangle, stub] = parts;
    expect(triangle).toContain('<polygon');
    expect(triangle).toContain('fill="none"');
    // Triangle apex at inter=(40,60); base corners (47,80)/(33,80).
    expect(triangle).toContain('points="40,60,47,80,33,80"');
    expect(stub).toContain('<line');
    // Stub: base midpoint (40,80) -> the real contact (40,140).
    expect(stub).toContain('x1="40"');
    expect(stub).toContain('y1="80"');
    expect(stub).toContain('x2="40"');
    expect(stub).toContain('y2="140"');
  });

  it('draws one triangle+stub PER unique contact point when a parent`s children fan to two spots', () => {
    const geo = makeClassifierGeo();
    const edges = [
      makeEdgeGeo({ id: 'e0', sametail: { parentId: 'A', contact: { x: 40, y: 140 } } }),
      makeEdgeGeo({ id: 'e1', sametail: { parentId: 'A', contact: { x: -60, y: 40 } } }),
    ];
    const parts = renderGroupInheritanceNeighborhood(geo, edges, defaultTheme);
    expect(parts.length).toBe(4); // two (triangle, stub) pairs
    expect(parts.filter((p) => p.includes('<polygon')).length).toBe(2);
    expect(parts.filter((p) => p.includes('<line')).length).toBe(2);
  });

  // cdd-T16b (E11, `Neighborhood.java:97-113` `allButSametails`)
  it('draws a plain (non-triangle) stub, AFTER the triangle+stub, for a non-sametail link touching the same leaf', () => {
    const geo = makeClassifierGeo();
    const edges = [
      makeEdgeGeo({ id: 'e0', sametail: { parentId: 'A', contact: { x: 40, y: 140 } } }),
      makeEdgeGeo({ id: 'e1', from: 'A', to: 'Other', leafContacts: [{ parentId: 'A', contact: { x: 100, y: 40 } }] }),
    ];
    const parts = renderGroupInheritanceNeighborhood(geo, edges, defaultTheme);
    expect(parts.length).toBe(3); // triangle, stub, THEN the plain allButSametails stub
    expect(parts[0]).toContain('<polygon');
    expect(parts[1]).toContain('<line');
    const other = parts[2]!;
    expect(other).toContain('<line');
    expect(other).not.toContain('<polygon');
    // center(40,40) -> contact(100,40) is horizontal; crosses the inner
    // rect's own RIGHT edge (x=60, `rect ∩ (center, contact)`) at (60,40).
    expect(other).toContain('x1="60"');
    expect(other).toContain('y1="40"');
    expect(other).toContain('x2="100"');
    expect(other).toContain('y2="40"');
  });

  it('draws no allButSametails stub for a link whose OTHER end is protected but this leaf is not', () => {
    const geo = makeClassifierGeo();
    const edges = [makeEdgeGeo({ leafContacts: [{ parentId: 'NOT-A', contact: { x: 100, y: 40 } }] })];
    expect(renderGroupInheritanceNeighborhood(geo, edges, defaultTheme)).toEqual([]);
  });
});

describe('cdd-T16 — lazeju-60-boki114 full pipeline', () => {
  const markup = readFileSync('test-results/dot-cache/class/lazeju-60-boki114/in.puml', 'utf8');
  const measurer = new WidthTableMeasurer();

  it('draws exactly one shared triangle + stub for A3 and for A4, at their real merged contact', () => {
    const { geo } = layoutFixtureClass(markup, measurer);
    const classifiers = classifierLeaves(geo.leaves);
    const a3 = classifiers.find((c) => c.id === 'A3')!;
    const a4 = classifiers.find((c) => c.id === 'A4')!;
    const a3Parts = renderGroupInheritanceNeighborhood(a3, geo.edges, defaultTheme);
    const a4Parts = renderGroupInheritanceNeighborhood(a4, geo.edges, defaultTheme);
    expect(a3Parts.length).toBe(2);
    expect(a4Parts.length).toBe(2);
    expect(a3Parts[1]).toContain('x2="370.575"');
    expect(a4Parts[1]).toContain('x2="667.575"');
  });

  it('renders every one of A3`s/A4`s 7 grouped links as a bare solid path, no polygon, in its own <g class="link">', () => {
    const svg = renderFixtureClass(markup, measurer);
    for (const child of ['B3', 'C3', 'D3', 'B4', 'C4', 'D4', 'E4']) {
      const linkMatch = new RegExp(`<!--link ${child} to A[34]-->(.*?)</g>`, 's').exec(svg);
      expect(linkMatch).not.toBeNull();
      expect(linkMatch![1]).not.toContain('<polygon');
      expect(linkMatch![1]).toContain('<path');
    }
    // Exactly TWO shared triangles total in the whole document (one per
    // protected parent), not one per grouped child (7).
    expect((svg.match(/<polygon/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

// cdd-T16b (E11, `Neighborhood.java:97-113`): jakapi's `Group` is the
// harder shape lazeju never reaches -- TWO distinct sametail contact
// points (real graphviz did NOT merge all 3 children to one spot either,
// jar-verified: 2 `<polygon>` before any allButSametails line) PLUS two
// other (non-inheritance) links touching the same protected leaf (`User
// o-- Group`, `Group o-- Activity`).
describe('cdd-T16b — jakapi-64-tine258 full pipeline (allButSametails)', () => {
  const markup = readFileSync('test-results/dot-cache/class/jakapi-64-tine258/in.puml', 'utf8');
  const measurer = new WidthTableMeasurer();

  it('draws 2 triangle+stub pairs THEN 2 plain allButSametails stubs for Group, in that order', () => {
    const { geo } = layoutFixtureClass(markup, measurer);
    const group = classifierLeaves(geo.leaves).find((c) => c.id === 'Group')!;
    const parts = renderGroupInheritanceNeighborhood(group, geo.edges, defaultTheme);
    expect(parts.length).toBe(6); // 2*(triangle+stub) + 2 plain stubs
    expect(parts[0]).toContain('<polygon');
    expect(parts[1]).toContain('<line');
    expect(parts[2]).toContain('<polygon');
    expect(parts[3]).toContain('<line');
    expect(parts[4]).toContain('<line');
    expect(parts[4]).not.toContain('<polygon');
    expect(parts[5]).toContain('<line');
    expect(parts[5]).not.toContain('<polygon');
    // Self-consistent: the last two stubs' far endpoints (x2/y2) are
    // exactly the two OTHER links' own leafContacts entries for 'Group' --
    // read off the SAME geo.edges this render call consumed, not fitted.
    const otherContacts = geo.edges.flatMap((e) => e.leafContacts ?? []).filter((c) => c.parentId === 'Group');
    expect(otherContacts.length).toBe(2);
    const stubEnds = parts.slice(4).map((p) => {
      const m = /x2="([\d.]+)" y2="([\d.]+)"/.exec(p)!;
      return { x: Number(m[1]), y: Number(m[2]) };
    });
    for (const c of otherContacts) {
      const match = stubEnds.some((e) => Math.abs(e.x - c.contact.x) < 0.01 && Math.abs(e.y - c.contact.y) < 0.01);
      expect(match).toBe(true);
    }
  });

  it('renders Group`s grouped inheritance links bare, and its two association links undisturbed', () => {
    const svg = renderFixtureClass(markup, measurer);
    // PLACEHOLDER is `hide`-n -- its own `Group <|-- PLACEHOLDER` edge
    // draws no `<g class="link">` at all (`Link.java:459`'s isHidden OR),
    // so only Events/Travels are checked here.
    for (const child of ['Events', 'Travels']) {
      const linkMatch = new RegExp(`<!--link ${child} to Group-->(.*?)</g>`, 's').exec(svg);
      expect(linkMatch).not.toBeNull();
      expect(linkMatch![1]).not.toContain('<polygon');
    }
    // The two association links (`o--`) keep their own decor -- untouched
    // by the grouped-inheritance suppression.
    expect(svg).toContain('<!--reverse link User to Group-->');
    expect(svg).toContain('<!--reverse link Group to Activity-->');
  });
});
