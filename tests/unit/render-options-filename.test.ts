import { afterEach, describe, expect, it, vi } from 'vitest';
import * as builder from '../../src/core/BlockUmlBuilder.js';
import { render, renderPages, renderSync } from '../../src/index.js';

vi.mock('../../src/core/BlockUmlBuilder.js', async (importOriginal) => {
  const actual = await importOriginal<typeof builder>();
  return { ...actual, buildBlockUmls: vi.fn(actual.buildBlockUmls) };
});

const SRC = '@startuml\nA -> B\n@enduml';
const FILENAME = 'a.puml';

function lastOptions(): { filename?: string } | undefined {
  const calls = vi.mocked(builder.buildBlockUmls).mock.calls;
  return calls[calls.length - 1]![1] as { filename?: string } | undefined;
}

describe('RenderOptions.filename plumbing', () => {
  afterEach(() => vi.mocked(builder.buildBlockUmls).mockClear());

  it('reaches PreprocessOptions.filename from renderSync', () => {
    renderSync(SRC, { filename: FILENAME });
    expect(lastOptions()?.filename).toBe(FILENAME);
  });

  it('reaches PreprocessOptions.filename from render', async () => {
    await render(SRC, { filename: FILENAME });
    expect(lastOptions()?.filename).toBe(FILENAME);
  });

  it('reaches PreprocessOptions.filename from renderPages', async () => {
    await renderPages(SRC, { filename: FILENAME });
    expect(lastOptions()?.filename).toBe(FILENAME);
  });

  it('is undefined when the option is absent', () => {
    renderSync(SRC);
    expect(lastOptions()?.filename).toBeUndefined();
  });
});
