/**
 * Unit tests for `class-body-enhanced-ports.ts` -- CDD B7FU-R2 item (a)
 * (coordinator, journal row 161): the enhanced-body half of the
 * `::member` port-election seam. `enhancedBodyPortRows` reproduces
 * `MethodsOrFieldsArea#getPorts`'s election (java:194-211) over ALREADY-
 * absolute `{text, top, height}` triples; `buildPortMembers`/
 * `translatePortMembers` reproduce the accumulate-then-shift shape
 * `class-body-enhanced-layout.ts#buildRowsBlockRows`'s own `rows[]`/
 * `embeds[]` already use.
 *
 * `juxora-90-fisu720`'s own jar-verified shape (FlatBar::prop, one
 * elected row among six) is reproduced end-to-end via `render-diff.mts`
 * in the class-divergence-drive mission tooling (0 structural/0 numeric
 * after this fix); the tests below isolate the PURE functions this file
 * exports.
 */
import { describe, it, expect } from 'vitest';
import {
  buildPortMembers,
  translatePortMembers,
  enhancedBodyPortRows,
  type EnhancedPortMemberInput,
} from '../../../src/diagrams/class/class-body-enhanced-ports.js';
import { Ports } from '../../../src/core/svek/Ports.js';
import type { Member } from '../../../src/diagrams/class/ast.js';
import type { MemberRowBuild } from '../../../src/diagrams/class/class-member-creole.js';

function member(name: string): Member {
  return { visibility: '+', name, isStatic: false, isAbstract: false };
}

function build(height: number): MemberRowBuild {
  return { atoms: [], width: 10, height };
}

describe('buildPortMembers', () => {
  it('accumulates each row from startTop by its OWN build height, pre-increment (MethodsOrFieldsArea#getPorts, java:194-211)', () => {
    const members = [member('a'), member('b'), member('c')];
    const texts = ['a', 'b', 'c'];
    const builds = [build(14), build(16.1538), build(14)];

    const rows = buildPortMembers(members, texts, builds, 32);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ text: 'a', top: 32, height: 14 });
    expect(rows[1]).toEqual({ text: 'b', top: 46, height: 16.1538 });
    expect(rows[2]!.text).toBe('c');
    expect(rows[2]!.height).toBe(14);
    expect(rows[2]!.top).toBeCloseTo(62.1538, 4);
  });

  it('returns [] for an empty member list', () => {
    expect(buildPortMembers([], [], [], 32)).toEqual([]);
  });
});

describe('translatePortMembers', () => {
  it('shifts every top by contentTop, leaving height/text untouched', () => {
    const rows: readonly EnhancedPortMemberInput[] = [
      { text: 'a', top: 0, height: 14 },
      { text: 'b', top: 14, height: 18 },
    ];

    expect(translatePortMembers(rows, 4)).toEqual([
      { text: 'a', top: 4, height: 14 },
      { text: 'b', top: 18, height: 18 },
    ]);
  });

  it('is a no-op (same array) for contentTop === 0, mirroring translateRows/translateEmbeds', () => {
    const rows: readonly EnhancedPortMemberInput[] = [{ text: 'a', top: 0, height: 14 }];
    expect(translatePortMembers(rows, 0)).toBe(rows);
  });
});

describe('enhancedBodyPortRows', () => {
  // juxora-90-fisu720's own shape: `FlatBar { **Bar (Model)** / prop /
  // prop2 / prop3 / prop3.1 / prop4 :( / -- }`, edge `FlatWorks::prop3 -r->
  // FlatBar::prop` -- ONE declared port short name, "prop", which must
  // elect row 2 ("prop") over row 4 ("prop3") and row 5 ("prop3.1") --
  // `getScore`'s own whole-word-first rule (`cs.matches(".*\\bshortName\\b.*")`
  // scores 100, a bare `contains` scores 50).
  const juxoraFlatBarRows: readonly EnhancedPortMemberInput[] = [
    { text: '**Bar (Model)**', top: 32, height: 14 },
    { text: 'prop', top: 46, height: 14 },
    { text: 'prop2', top: 60, height: 14 },
    { text: 'prop3', top: 74, height: 14 },
    { text: 'prop3.1', top: 88, height: 14 },
    { text: 'prop4 :(', top: 102, height: 14 },
  ];

  it('elects the whole-word "prop" row (top 46/height 14), not "prop3"/"prop3.1" (bare contains, lower score)', () => {
    const result = enhancedBodyPortRows(juxoraFlatBarRows, ['prop']);
    expect(result).toEqual([{ id: Ports.encodePortNameToId('prop'), position: 46, height: 14 }]);
  });

  it('returns [] when portShortNames is empty (ADR-4: shape flip is on declared-name count, not election)', () => {
    expect(enhancedBodyPortRows(juxoraFlatBarRows, [])).toEqual([]);
  });

  it('returns [] when no row matches any declared short name', () => {
    expect(enhancedBodyPortRows(juxoraFlatBarRows, ['nonexistent'])).toEqual([]);
  });

  it('elects multiple declared names independently, sorted ascending by position (Ports#getAllPortGeometry)', () => {
    const result = enhancedBodyPortRows(juxoraFlatBarRows, ['prop2', 'prop']);
    expect(result).toEqual([
      { id: Ports.encodePortNameToId('prop'), position: 46, height: 14 },
      { id: Ports.encodePortNameToId('prop2'), position: 60, height: 14 },
    ]);
  });
});
