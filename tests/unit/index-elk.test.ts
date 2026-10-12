/**
 * cdd8 D2b: how `renderSync` / `render` hand an `ElkBackend` to a plugin's
 * layout. T1b gives the class plugin its real `requiresElk` (`!pragma layout
 * elk`, `CucaDiagram.java:478-479`); until then these cases stub the hook on
 * `classPlugin`, which is the plugin the seam exists for.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { classPlugin } from '../../src/diagrams/class/index.js';
import { ELK_RENDER_SYNC_UNSUPPORTED } from '../../src/core/elk/layout-services.js';
import type { ElkBackend } from '../../src/core/elk/elk-backend.js';
import { loadElk, render, renderAll, renderPages, renderPagesSync, renderSync } from '../../src/index.js';
import type { LayoutServices } from '../../src/core/elk/elk-backend.js';

const CLASS_SOURCE = '@startuml\nclass Foo\n@enduml';
const SEQUENCE_SOURCE = '@startuml\nAlice -> Bob : hi\n@enduml';

/** A backend that is never laid out: the cases only check it is handed through. */
const STUB_ELK: ElkBackend = {
  createGraph: () => {
    throw new Error('stub');
  },
  createNode: () => {
    throw new Error('stub');
  },
  createLabel: () => {
    throw new Error('stub');
  },
  createSimpleEdge: () => {
    throw new Error('stub');
  },
  layout: () => undefined,
};

/** The services argument of every class `layoutSync` call this test made. */
function servicesSeen(spy: { mock: { calls: unknown[][] } }): (LayoutServices | undefined)[] {
  return spy.mock.calls.map((call) => call[3] as LayoutServices | undefined);
}

describe('ELK layout services', () => {
  let layoutSpy: MockInstance<typeof classPlugin.layoutSync>;

  beforeEach(() => {
    layoutSpy = vi.spyOn(classPlugin, 'layoutSync');
  });
  afterEach(() => {
    layoutSpy.mockRestore();
    delete classPlugin.requiresElk;
  });

  describe('a plugin that requires ELK', () => {
    beforeEach(() => {
      classPlugin.requiresElk = () => true;
    });

    it('makes renderSync draw the error page naming render() and options.elk', () => {
      const svg = renderSync(CLASS_SOURCE);
      expect(ELK_RENDER_SYNC_UNSUPPORTED).toBe(
        '!pragma layout elk is not supported in renderSync without options.elk — use render(), or pass options.elk (await loadElk())',
      );
      expect(svg).toContain('!pragma layout elk is not supported in renderSync without options.elk');
      expect(svg).toContain('use render(), or pass options.elk (await loadElk())');
      expect(layoutSpy).not.toHaveBeenCalled();
    });

    it('hands renderSync the caller’s options.elk', () => {
      const svg = renderPagesSync(CLASS_SOURCE, { elk: STUB_ELK });
      expect(svg).toHaveLength(1);
      expect(servicesSeen(layoutSpy)).toEqual([{ elk: STUB_ELK }]);
    });

    it('hands render() the caller’s options.elk without loading elkjs', async () => {
      await render(CLASS_SOURCE, { elk: STUB_ELK });
      await renderPages(CLASS_SOURCE, { elk: STUB_ELK });
      await renderAll(CLASS_SOURCE, { elk: STUB_ELK });
      expect(servicesSeen(layoutSpy).map((s) => s?.elk)).toEqual([STUB_ELK, STUB_ELK, STUB_ELK]);
    });

    it('loads the elkjs backend for render() when options.elk is absent', async () => {
      await render(CLASS_SOURCE);
      const [services] = servicesSeen(layoutSpy);
      const root = services?.elk?.createGraph();
      expect(root?.getParent()).toBeNull();
      expect(root?.getLabels()).toEqual([]);
    });
  });

  describe('a plugin that does not require ELK', () => {
    it('passes no backend through render() and never loads one', async () => {
      await render(CLASS_SOURCE);
      expect(servicesSeen(layoutSpy)).toEqual([{ elk: undefined }]);
    });

    it('passes options.elk through renderSync unused', () => {
      renderSync(CLASS_SOURCE, { elk: STUB_ELK });
      expect(servicesSeen(layoutSpy)).toEqual([{ elk: STUB_ELK }]);
    });

    it('renders a diagram with no requiresElk hook exactly as before', () => {
      expect(renderSync(SEQUENCE_SOURCE, { elk: STUB_ELK })).toBe(renderSync(SEQUENCE_SOURCE));
    });
  });

  it('exports loadElk from the package entry', async () => {
    const elk = await loadElk();
    expect(elk.createGraph().getParent()).toBeNull();
  });
});
