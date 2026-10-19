/**
 * gtc-T5b -- `CucaDiagramFileMakerSvek#getOrderedLinks` (CucaDiagramFileMakerSvek.java:90-114) builds the DotData link
 * list, hence `Bibliotekon#allLines` and `SvekResult#drawU`'s draw order (:97-101): a link joins the contiguous run of
 * the FIRST earlier link with `Link#sameConnections` (`abel/Link.java:462-470`, either direction), else it is appended.
 * The `lnkN` uids stay in creation order. Expected order: jar probe (scripts/oracle-render.sh) of the source below.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { orderLinks } from '../../../src/diagrams/description/link-order.js';

const SRC = [
  '@startuml',
  'left to right direction',
  'component a',
  'component b',
  'component c',
  'component d',
  'a --> b : 1',
  'b --> c : 2',
  'a --> a : 3',
  'c --> d : 4',
  'b ..> a : 5',
  'a --> a : 6',
  'd --> c : 7',
  'c --> b : 8',
  '@enduml',
].join('\n');

describe('svek link draw order', () => {
  it('groups links with the same connections, as the jar draws them', () => {
    const svg = renderSync(SRC, { measurer: new DeterministicMeasurer() });
    const links = [...svg.matchAll(/<g class="link"[^>]* id="(lnk\d+)"[\s\S]*?>(\d)<\/text>/g)].map((m) => [
      m[1],
      m[2],
    ]);
    expect(links).toEqual([
      ['lnk5', '1'],
      ['lnk9', '5'],
      ['lnk6', '2'],
      ['lnk12', '8'],
      ['lnk7', '3'],
      ['lnk10', '6'],
      ['lnk8', '4'],
      ['lnk11', '7'],
    ]);
  });
});

describe('orderLinks', () => {
  const l = (from: string, to: string) => ({ from, to });
  it('inserts after the contiguous same-connection run of the first match', () => {
    const ordered = orderLinks([l('a', 'b'), l('b', 'c'), l('b', 'a'), l('a', 'b'), l('c', 'b')]);
    expect(ordered.map((x) => `${x.from}${x.to}`)).toEqual(['ab', 'ba', 'ab', 'bc', 'cb']);
  });
});
