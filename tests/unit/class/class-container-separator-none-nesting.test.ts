/**
 * cdd5-T4e (`separator-none-namespace-parent`, `unknown/cilibi-66-tasa181`):
 * under `set separator none`, `splitOnSeparator` returns `null`
 * unconditionally (`class-namespace-resolve.ts:78`: "if (sep === null ...)
 * return null;"), even for an id `qualifiedId` itself dot-joined as a
 * fallback (`class-namespace-resolve.ts:293`: "activeNamespace + (sep ??
 * '.') + name" -- the `?? '.'` fires precisely when `sep` is `null`). A
 * nested `namespace f2 { }` inside `namespace f1 { }` therefore builds
 * `effectiveId = 'f1.f2'` but takes `openNamespaceBlock`'s NON-chain branch
 * (`class-container.ts`), which pushed the new `Namespace` with no
 * `parentId` before this fix -- `f1` then looked empty (collapsed to a
 * leaf) and `f2` was emitted as a ROOT cluster instead of nested under `f1`.
 *
 * Upstream: `net/atmp/CucaDiagram.java:252-256` -- "if (sep == null) { final
 * Quark<Entity> result = this.firstWithName(full); if (result != null)
 * return Failable.ok(result); return
 * Failable.ok(getCurrentGroup().getQuark().child(full)); }" -- nests the
 * new, unresolved name under the CURRENT GROUP's quark when there is no
 * separator to split on.
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:252-256
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('nested namespaces under `set separator none` (cilibi-66-tasa181)', () => {
  it('nests f1.f2 under f1 instead of emitting f2 as a root cluster', () => {
    const ast = parse(`
      set separator none
      namespace f1 {
        namespace f2 {
          class f3
        }
      }
    `);
    const f1 = ast.namespaces.find((n) => n.id === 'f1');
    const f2 = ast.namespaces.find((n) => n.id === 'f1.f2');
    expect(f1).toBeDefined();
    expect(f1!.parentId).toBeUndefined();
    expect(f2).toBeDefined();
    expect(f2!.parentId).toBe('f1');
  });

  it('leaves a genuine top-level namespace parentless under separator none', () => {
    const ast = parse(`
      set separator none
      namespace root {
        class Leaf
      }
    `);
    const root = ast.namespaces.find((n) => n.id === 'root');
    expect(root).toBeDefined();
    expect(root!.parentId).toBeUndefined();
  });
});
