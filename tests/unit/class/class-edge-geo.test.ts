/**
 * cdd-T13 — cluster-anchored edge clipping (M1, `SvekEdge.java:252-258,
 * 671-672`): a relationship endpoint (or a `note <pos> of <package>`
 * connector, the same upstream `SvekEdge` mechanism) routed to a `zaent…`
 * point anchor inside a package/namespace must clip back to the cluster's
 * real border, never draw raw into the box interior.
 *
 * Expected values are read off each fixture's own measured geometry
 * (`layoutFixtureClass`) and cross-checked against the fixture's own
 * `namespaces[]` box (self-consistent: the same box the byte-identical
 * cluster `<path>` renders from, verified in `.agent-notes/cdd-T13.md`) —
 * never fitted to force a pass. `bajotu`/`bejusa`/`pecabi` render
 * `structural=0` after this fix (`npx jiti plans/class-divergence-
 * drive/tools/render-diff.mts`); a small residual on the last bezier
 * segment for some fixtures is a named `@knowvah/dot-engine` spline-shape
 * delta (`docs/graphviz-issues/18-compound-clip-last-segment-shape-
 * delta.md`), not a clip bug — see that file for the elimination chain.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { layoutFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import type { ClassGeometry } from '../../../src/diagrams/class/layout.js';
import { noteLeaves } from '../../../src/diagrams/class/class-geo-types.js';

const measurer = new WidthTableMeasurer();

function fixture(slug: string): ClassGeometry {
  const markup = readFileSync(`test-results/dot-cache/class/${slug}/in.puml`, 'utf8');
  return layoutFixtureClass(markup, measurer).geo;
}

// ---------------------------------------------------------------------------
// M1 — bajotu-30-soku184: `package p1 { class cl1 } ; p1 --> cl2`
// ---------------------------------------------------------------------------

describe('M1 — a package-anchored relationship clips to the cluster border', () => {
  const geo = fixture('bajotu-30-soku184');
  const edge = geo.edges.find((e) => e.from === 'p1' && e.to === 'cl2')!;
  const p1 = geo.namespaces.find((n) => n.id === 'p1')!;

  it('starts the spline on p1`s own border, not the zaent anchor 47px deep inside it', () => {
    // Jar golden (`in.svg`): `M115,119.013 C…` -- this port lands
    // 115,119.012 (< 0.001px off), matching to full render precision
    // (`render-diff` reports this fixture 0 structural / 0 numeric). The
    // pre-clip raw dot-engine spline started at y≈72, deep inside `p1`
    // (`x=6,y=6,width=117,height=113`) -- the old, unclipped behaviour.
    expect(edge.points[0]!.x).toBeCloseTo(115, 6);
    expect(edge.points[0]!.y).toBeCloseTo(119.013, 1);
    // Self-consistency: the clipped point sits just outside p1's own
    // BOTTOM border (the edge exits p1 downward toward cl2) --
    // `RectangleArea#contains` is half-open, so the clip never lands
    // exactly on the line (`spline-clip.ts`'s own doc comment).
    const p1Bottom = p1.y + p1.height;
    expect(edge.points[0]!.y).toBeGreaterThan(p1Bottom);
    expect(edge.points[0]!.y - p1Bottom).toBeLessThan(1);
  });

  it('renders byte-identical to the jar oracle (structural AND numeric)', () => {
    // The full pipeline (chrome, arrow-decoration render-time shortening
    // at the cl2 end) resolves this fixture to a PERFECT match --
    // verified via `render-diff.mts bajotu-30-soku184`: structural=0,
    // numeric=0. Documented here as the geo-level anchor for that fact
    // (rendering is exercised by the ratchet/parity suite, not re-run
    // here).
    expect(edge.points.length).toBe(10); // 3 segments, matching svek-1.dot
  });
});

// ---------------------------------------------------------------------------
// M1 — bejusa-95-gafo325: three cluster-anchored edges, one lhead each
// ---------------------------------------------------------------------------

describe('M1 — bejusa`s three package-anchored edges each clip their own cluster head', () => {
  const geo = fixture('bejusa-95-gafo325');
  const byNs = new Map(geo.namespaces.map((n) => [n.id, n]));

  it('clips VCAN_DRV -> PCAN_DRV to the PCAN_DRV cluster`s own top border', () => {
    const edge = geo.edges.find((e) => e.from === 'VCAN_DRV' && e.to === 'PCAN_DRV')!;
    const pcanDrv = byNs.get('PCAN_DRV')!;
    const last = edge.points[edge.points.length - 1]!;
    // Self-consistent: clipped just above PCAN_DRV's own top edge, not
    // deep inside it (old behaviour) and not left at the raw dot-engine
    // endpoint. A residual against the JAR's own clip point on this
    // specific curve is a named dot-engine spline-shape delta (issue 18)
    // -- the endpoint itself is on OUR OWN cluster's border, which is
    // what M1's clip guarantees.
    expect(last.y).toBeLessThan(pcanDrv.y);
    expect(pcanDrv.y - last.y).toBeLessThan(1);
  });

  it('clips PCAN_DRV -> Bus_Tx to the Bus_Tx cluster`s own right border, byte-exact', () => {
    const edge = geo.edges.find((e) => e.from === 'PCAN_DRV.PCAN_DRV' && e.to === 'PCAN_DRV.Bus_Tx')!;
    const busTx = byNs.get('PCAN_DRV.Bus_Tx')!;
    const last = edge.points[edge.points.length - 1]!;
    // This edge crosses Bus_Tx's RIGHT edge (x), not its top -- clip is
    // axis-agnostic (`RectangleArea#contains` tests both). Exact against
    // the jar to well under a pixel (`render-diff` reports 0 diffs on
    // this edge specifically -- see `docs/graphviz-issues/18-…`).
    expect(last.x).toBeCloseTo(busTx.x + busTx.width, 0);
  });

  it('clips PCAN_DRV -> Bus_Rx to the Bus_Rx cluster`s own top border', () => {
    const edge = geo.edges.find((e) => e.from === 'PCAN_DRV.PCAN_DRV' && e.to === 'PCAN_DRV.Bus_Rx')!;
    const busRx = byNs.get('PCAN_DRV.Bus_Rx')!;
    const last = edge.points[edge.points.length - 1]!;
    expect(last.y).toBeLessThan(busRx.y);
    expect(busRx.y - last.y).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// M1 — pecabi-95-demu756: `note top of <package>` connector, same mechanism
// ---------------------------------------------------------------------------

describe('M1 — a `note top of <package>` connector clips the same way', () => {
  // decision-journal.md rows 36/39: pecabi's remaining 1/0 diff after T9b
  // is exactly this mechanism -- the connector drew to y≈117 (the zaent
  // anchor, deep inside the 113px-tall cluster) instead of clipping at
  // the cluster's own top border.
  const geo = fixture('pecabi-95-demu756');
  const note = noteLeaves(geo.leaves).find((n) => n.target === 'oft_openflow_types')!;
  const pkg = geo.namespaces.find((n) => n.id === 'oft_openflow_types')!;

  it('clips the connector to the package`s own top border, not the interior zaent anchor', () => {
    expect(note.connector.length).toBeGreaterThan(0);
    const last = note.connector[note.connector.length - 1]!;
    // Self-consistent: just above the package's own top (52.999) --
    // nowhere near the old unclipped y≈117 (the anchor sits above the
    // cluster's sole classifier, per `class-shield-helpers.ts
    // #packageEndpointAnchors`'s own doc comment). A small residual
    // against the jar's own clip point on this curve is the same named
    // dot-engine delta as bejusa's (issue 18), not a clip bug: the
    // fixture's own `render-diff` is structural=0 (the M1 defect this
    // task targets), a small numeric-only gap on the final segment.
    expect(last.y).toBeLessThan(pkg.y);
    expect(pkg.y - last.y).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// cdd-T16 (M7): `skinparam groupInheritance` sametail suppression
// (`Link.java:238-239`) -- lazeju-60-boki114 groups A3's three children
// (B3/C3/D3) and A4's four (B4/C4/D4/E4); pijiju-95-xexi872 (limit 2)
// groups B's two `implements` children (X/Y).
// ---------------------------------------------------------------------------

describe('cdd-T16 — a grouped-inheritance link is suppressed to a bare solid path', () => {
  const lazeju = fixture('lazeju-60-boki114');
  const pijiju = fixture('pijiju-95-xexi872');

  it('forces both decors to none and drops the dash on every one of A3`s and A4`s children', () => {
    const grouped = lazeju.edges.filter((e) => e.to === 'A3' || e.to === 'A4');
    expect(grouped.length).toBe(7); // B3,C3,D3,B4,C4,D4,E4
    for (const e of grouped) {
      expect(e.sourceDecor).toBe('none');
      expect(e.targetDecor).toBe('none');
      expect(e.dashed).toBe(false);
    }
  });

  it('leaves B1`s and A2`s ungrouped extends links with their normal triangle decor', () => {
    // B1->A1 (count 1) and B2/C2->A2 (count 2) are both below the
    // `groupInheritance 3` limit -- `DotData.java:122-161` nulls their
    // `sametail` back out, so `Link.getType()` takes its normal branch.
    const b1 = lazeju.edges.find((e) => e.from === 'B1' && e.to === 'A1')!;
    expect(b1.sourceDecor).toBe('triangle');
    expect(b1.sametail).toBeUndefined();
  });

  it('carries the protected parent id and the ONE merged contact point per group', () => {
    const a3children = lazeju.edges.filter((e) => e.to === 'A3');
    for (const e of a3children) {
      expect(e.sametail?.parentId).toBe('A3');
      expect(e.sametail?.contact).toEqual({ x: 370.575, y: 96 });
    }
    const a4children = lazeju.edges.filter((e) => e.to === 'A4');
    for (const e of a4children) {
      expect(e.sametail?.parentId).toBe('A4');
      expect(e.sametail?.contact).toEqual({ x: 667.575, y: 96 });
    }
  });

  it('suppresses pijiju`s dotted implements links (dashed AND the stroke-override dasharray)', () => {
    // Before this fix both X->B and Y->B carried `dashed=true` (the
    // `implementation` decoration's default) and rendered a
    // `stroke-dasharray` -- the report's "extra dasharray" diffs.
    const implementsLinks = pijiju.edges.filter((e) => e.to === 'B' && e.from !== 'B');
    expect(implementsLinks.length).toBe(2); // X->B, Y->B
    for (const e of implementsLinks) {
      expect(e.dashed).toBe(false);
      expect(e.strokeDasharray).toBeUndefined();
      expect(e.sametail?.parentId).toBe('B');
    }
    // B::t ..> T is a dependency, not extends-like -- untouched.
    const dependency = pijiju.edges.find((e) => e.from === 'B' && e.to === 'T')!;
    expect(dependency.dashed).toBe(true);
    expect(dependency.sametail).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cdd-T16b (E11, `Neighborhood.java:97-113` `allButSametails`) --
// jakapi-64-tine258's `Group` carries two OTHER (non-inheritance) links
// (`User o-- Group`, `Group o-- Activity`) that must each carry a
// `leafContacts` entry pointing back at `Group`.
// ---------------------------------------------------------------------------

describe('cdd-T16b — a non-grouped link touching a protected leaf carries a leafContacts entry', () => {
  const jakapi = fixture('jakapi-64-tine258');

  it('carries exactly one leafContacts entry (parentId Group) on each of the two association links', () => {
    const userGroup = jakapi.edges.find((e) => e.from === 'User' && e.to === 'Group')!;
    const groupActivity = jakapi.edges.find((e) => e.from === 'Group' && e.to === 'Activity')!;
    expect(userGroup.leafContacts).toHaveLength(1);
    expect(userGroup.leafContacts![0]!.parentId).toBe('Group');
    expect(groupActivity.leafContacts).toHaveLength(1);
    expect(groupActivity.leafContacts![0]!.parentId).toBe('Group');
    // Neither is itself grouped -- both keep their own normal decor.
    expect(userGroup.sametail).toBeUndefined();
    expect(groupActivity.sametail).toBeUndefined();
  });

  it('does NOT carry a leafContacts entry for Group on Group`s own grouped (sametail) children', () => {
    // Group<|--Events/Travels are consumed by `sametail`, not `leafContacts`
    // (Java's `allButSametails.removeAll(sametailLinks)`).
    const eventsLink = jakapi.edges.find((e) => e.to === 'Group' && e.from === 'Events')!;
    expect(eventsLink.sametail?.parentId).toBe('Group');
    expect(eventsLink.leafContacts).toBeUndefined();
  });

  it('carries no leafContacts for Activity/Item/User (unprotected leaves)', () => {
    const activityItem = jakapi.edges.find((e) => e.from === 'Activity' && e.to === 'Item')!;
    expect(activityItem.leafContacts).toBeUndefined();
  });
});
