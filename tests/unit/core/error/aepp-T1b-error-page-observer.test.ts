/**
 * aepp-T1b: the harness-only error-page observer fires once per
 * `PSystemError` page drawn (`renderPSystemError`) and never for Welcome.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemError.java#getTextBlock
 */

import { afterEach, describe, expect, it } from 'vitest';
import { setErrorPageObserver } from '../../../../src/core/error/error-renderer.js';
import { renderSync } from '../../../../src/index.js';

const SYNTAX_ERROR = '@startuml\nBob -> Alice : hi\n!endif\n@enduml\n';
const EMPTY = '@startuml\n\n@enduml\n';
const WELCOME = '@startuml\n@enduml\n';
const VALID_ACTIVITY = '@startuml\nstart\n:a;\nstop\n@enduml\n';

/** Install a counting observer and return a reader of its call count. */
function count(): () => number {
  let calls = 0;
  setErrorPageObserver(() => {
    calls += 1;
  });
  return () => calls;
}

describe('setErrorPageObserver', () => {
  afterEach(() => setErrorPageObserver(undefined));

  it('fires exactly once for a syntax-error source', () => {
    const calls = count();
    renderSync(SYNTAX_ERROR);
    expect(calls()).toBe(1);
  });

  it('fires once for the Empty description page', () => {
    const calls = count();
    renderSync(EMPTY);
    expect(calls()).toBe(1);
  });

  it('never fires for the two-line Welcome source', () => {
    const calls = count();
    renderSync(WELCOME);
    expect(calls()).toBe(0);
  });

  it('never fires for a valid activity diagram', () => {
    const calls = count();
    renderSync(VALID_ACTIVITY);
    expect(calls()).toBe(0);
  });

  it('makes no call once cleared with undefined', () => {
    const calls = count();
    setErrorPageObserver(undefined);
    renderSync(SYNTAX_ERROR);
    expect(calls()).toBe(0);
  });
});
