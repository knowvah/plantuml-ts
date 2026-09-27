/**
 * `prefetchIncludes` and `!theme ... [from ...]` (cdd4-T7b): the async walk
 * fills the store keys `EaterTheme#getTheme` reads (`ThemeUtils#loadTheme`),
 * so `render()` resolves a non-bundled theme exactly as a host-filled
 * `renderSync` store would.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/theme/ThemeUtils.java#loadTheme
 */
import { describe, expect, it, vi } from 'vitest';
import { MapIncludeStore, prefetchIncludes, StdlibNotBundledError } from '../../src/core/include-resolver.js';

const MINI = '!$MINI = "1"';

describe('prefetchIncludes — !theme targets', () => {
  it('never fetches a bundled theme', async () => {
    const fetcher = vi.fn();
    await prefetchIncludes('@startuml\n!theme aws-orange\n@enduml', fetcher);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fetches a non-bundled theme as the local `puml-theme-<name>.puml` file', async () => {
    const fetcher = vi.fn().mockResolvedValue(MINI);
    const store = await prefetchIncludes('!theme mini', fetcher);
    expect(fetcher).toHaveBeenCalledWith('puml-theme-mini.puml');
    expect(store.get('puml-theme-mini.puml')).toBe(MINI);
  });

  it('fetches `from <dir|url>` at `<from>/puml-theme-<name>.puml`', async () => {
    const fetcher = vi.fn().mockResolvedValue(MINI);
    const store = await prefetchIncludes('!theme mini from https://x.test/t\n!theme other FROM dir/', fetcher);
    expect(fetcher.mock.calls.map((c: unknown[]) => c[0])).toEqual([
      'https://x.test/t/puml-theme-mini.puml',
      'dir/puml-theme-other.puml',
    ]);
    expect(store.get('https://x.test/t/puml-theme-mini.puml')).toBe(MINI);
  });

  it('resolves `from <lib>` through the stdlib channels, never the fetcher', async () => {
    const fetcher = vi.fn();
    const base = new MapIncludeStore({ '<C4/themes/puml-theme-C4_united.puml>': '!theme united' });
    const store = await prefetchIncludes('!theme C4_united from <C4/themes>', fetcher, base);
    expect(store.get('<C4/themes/puml-theme-C4_united.puml>')).toBe('!theme united');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("leaves a theme miss to the interpreter's `Cannot load theme` (EaterTheme.java:82-85)", async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline'));
    const store = await prefetchIncludes('!theme x from <nolib>\n!theme gone', failing);
    expect(store.get('<nolib/puml-theme-x.puml>')).toBeUndefined();
    expect(store.get('puml-theme-gone.puml')).toBeUndefined();
    expect(failing).toHaveBeenCalledWith('puml-theme-gone.puml');
  });

  it('still fails an unresolvable !include', async () => {
    await expect(prefetchIncludes('!include <nolib/x>', vi.fn())).rejects.toBeInstanceOf(StdlibNotBundledError);
  });

  it("walks the fetched theme's own directives", async () => {
    const fetcher = vi.fn((url: string) => Promise.resolve(url === 'puml-theme-a.puml' ? '!include inner.puml' : 'x'));
    const store = await prefetchIncludes('!theme a', fetcher);
    expect(store.get('inner.puml')).toBe('x');
  });

  it('skips a name or location only the interpreter can compute', async () => {
    const fetcher = vi.fn();
    await prefetchIncludes('!theme $T\n!theme mini from %dirpath()', fetcher);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
