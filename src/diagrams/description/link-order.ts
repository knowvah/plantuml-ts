/**
 * `CucaDiagramFileMakerSvek#getOrderedLinks`/`addLinkNew` (`svek/CucaDiagramFileMakerSvek.java:90-114`): the link list
 * the svek pipeline lays out and draws (`DotData.links` -> `Bibliotekon#allLines` -> `SvekResult#drawU` :97-101). A link
 * whose endpoints match an earlier one (`Link#sameConnections`, `abel/Link.java:462-470`: same pair, either direction,
 * self loops included) is inserted after that earlier link's contiguous run of matches; otherwise it is appended. The
 * `lnkN` uid is assigned at creation, so it is unaffected.
 */
import type { DescriptiveLink } from './ast.js';

type Ends = Pick<DescriptiveLink, 'from' | 'to'>;

function sameConnections(a: Ends, b: Ends): boolean {
  return (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from);
}

/** @see CucaDiagramFileMakerSvek.java:98-114 `addLinkNew` */
function addLinkNew<T extends Ends>(result: T[], link: T): void {
  const first = result.findIndex((other) => sameConnections(other, link));
  if (first === -1) {
    result.push(link);
    return;
  }
  let at = first;
  while (at < result.length && sameConnections(result[at]!, link)) at++;
  result.splice(at, 0, link);
}

/** @see CucaDiagramFileMakerSvek.java:90-96 `getOrderedLinks` */
export function orderLinks<T extends Ends>(links: readonly T[]): T[] {
  const result: T[] = [];
  for (const link of links) addLinkNew(result, link);
  return result;
}
