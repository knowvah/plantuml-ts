# aepp-T1b — our error-page signal (D7)

- Commits: 602d7f836 feat(error): add harness-only error page observer
- Java -> ours: PSystemError#getTextBlock (PSystemError.java:214-235) is drawn
  by `renderPSystemError` (src/core/error/error-renderer.ts); the observer
  fires at its top. Welcome/Unsupported renderers untouched (not PSystemErrors).
- Interface: `setErrorPageObserver(fn: (() => void) | undefined): void` from
  src/core/error/error-renderer.ts. Not exported from src/index.ts.
- Tests: tests/unit/core/error/aepp-T1b-error-page-observer.test.ts (5: syntax
  error -> 1, Empty -> 1, Welcome -> 0, valid activity -> 0, undefined -> 0).
  Fixture note: syntax error uses orphan `!endif` (`Bob -> ` alone is valid).
  Error tests + tests/integration/error-diagram.test.ts: 57 pass; typecheck, eslint clean.
- Rows before -> after: unchanged (observer only).
- Survey: all 28 engines, before = b0-eng, after = /private/tmp/claude-501/aepp-T1b/after;
  engdiff: movers=0 conformant-losses=0.
- Not done: nothing.
