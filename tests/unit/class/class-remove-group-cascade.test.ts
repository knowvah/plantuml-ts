/**
 * cdd5-T5d remove-group-not-cascaded (jititi-15-maxe512, xamive-55-lipi586):
 * `remove`/`restore` folds over GROUPS too (`HideOrShow#isApplyable` matches
 * any entity's qualified name), and a removed group removes everything
 * inside it -- `Entity#isRemoved()` checks the parent container first:
 * "if (parentContainer != null && parentContainer.isRemoved()) return true;"
 * @see ~/git/plantuml/.../abel/Entity.java:443-455
 * @see ~/git/plantuml/.../abel/Entity.java:457-465 (group isAloneAndUnlinked)
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { computeRemovedIds, filterRemovedEntities } from '../../../src/diagrams/class/class-directives.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('remove folds over groups and cascades to their contents', () => {
  it('`remove *` removes the package, so `restore P.A` cannot bring A back (jititi)', () => {
    const ast = parse('package P {\nclass A $shared\nclass B\n}\nremove *\nrestore P.A');
    expect([...computeRemovedIds(ast)].sort()).toEqual(['P', 'P.A', 'P.B']);
    const filtered = filterRemovedEntities(ast);
    expect(filtered.classifiers).toEqual([]);
    expect(filtered.namespaces).toEqual([]);
  });

  it('`remove Foo.Bar` removes the nested namespace and its class only (xamive)', () => {
    const ast = parse('namespace Foo {\nnamespace Bar {\nclass Quz\n}\nclass Quz\n}\nnamespace Bar {}\nremove Foo.Bar');
    expect([...computeRemovedIds(ast)].sort()).toEqual(['Foo.Bar', 'Foo.Bar.Quz']);
    const filtered = filterRemovedEntities(ast);
    expect(filtered.classifiers.map((c) => c.id)).not.toContain('Foo.Bar.Quz');
    expect(filtered.classifiers.map((c) => c.id)).toContain('Foo.Quz');
    expect(filtered.namespaces.map((n) => n.id)).not.toContain('Foo.Bar');
    expect(filtered.namespaces.map((n) => n.id)).toContain('Foo');
  });

  it('`remove @unlinked` removes a group only when every child is unlinked', () => {
    const ast = parse('package P {\nclass A\n}\npackage Q {\nclass B\n}\nclass C\nB -- C\nremove @unlinked');
    expect([...computeRemovedIds(ast)].sort()).toEqual(['P', 'P.A']);
  });
});
