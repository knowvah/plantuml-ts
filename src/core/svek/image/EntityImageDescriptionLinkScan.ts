/**
 * The three link-scanning helpers `EntityImageDescription` delegates to
 * (`hasSomeHorizontalLinkVisible`/`isThereADoubleLink`/
 * `hasSomeHorizontalLinkDoubleDecorated`) -- split out of
 * `EntityImageDescriptionDelegates.ts` purely to stay under this
 * project's 500-line cap. Self-contained (pure functions over
 * `EntityImageDescriptionLinkInfo[]`, no other dependency), so they move
 * as one cohesive unit; `EntityImageDescriptionDelegates.ts` re-exports
 * all three, unchanged for `EntityImageDescription.ts`'s own import.
 */
import type { EntityImageDescriptionLinkInfo } from './EntityImageDescription.js';

/** Upstream: `EntityImageDescription#hasSomeHorizontalLinkVisible`. */
export function hasSomeHorizontalLinkVisible(links: readonly EntityImageDescriptionLinkInfo[]): boolean {
  return links.some((link) => link.length === 1 && !link.isInvis);
}

/** Upstream: `EntityImageDescription#isThereADoubleLink`. */
export function isThereADoubleLink(links: readonly EntityImageDescriptionLinkInfo[]): boolean {
  const seen = new Set<string>();
  for (const link of links) {
    if (seen.has(link.otherEntityId)) return true;
    seen.add(link.otherEntityId);
  }
  return false;
}

/** Upstream: `EntityImageDescription#hasSomeHorizontalLinkDoubleDecorated`. */
export function hasSomeHorizontalLinkDoubleDecorated(links: readonly EntityImageDescriptionLinkInfo[]): boolean {
  return links.some((link) => link.length === 1 && link.isDoubleDecorated);
}
