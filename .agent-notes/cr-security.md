# cr-security (code-review Batch A) — 2026-09-21

## Observation: upstream has no user-function recursion limit
- **Context**: item 6, recursive `!procedure` guard.
- **Finding**: `tim/` counts no call depth; only `CodeIteratorImpl.java:95`
  (999 jumps, loops only). The oracle jar dies with an uncaught
  `StackOverflowError` and writes no SVG (`-pipe` exit 1; file mode prints
  "No diagram found"). Countdown procedure: jar OK at 1000, overflows by 2000.
  The port's JS stack (vitest, Node 26) overflowed at 546 nested procedures /
  781 nested functions, surfacing as a bare "Fatal parsing error".
- **Impact**: port bound `MAX_CALL_DEPTH = 256` is port-local (DIVERGENCES.md).
- **Confidence**: High (measured both sides).

## Observation: the jar keeps the `<a>` for a javascript: link
- **Context**: item 1.
- **Finding**: `SvgGraphics.LinkData` sets url to `""` but keeps title
  (`Url.java:55` defaults tooltip to the url), so the jar emits
  `href="" xlink:href="" ... title="javascript:alert(1)"`. Oracle-verified on
  class url, sequence message url and creole note link.
- **Impact**: do not "fix" by dropping the `<a>`; that diverges.
- **Confidence**: High.

## Observation: default security profile differs JVM vs TeaVM
- **Context**: item 2.
- **Finding**: `SecurityProfile#init` returns LEGACY on the JVM
  (SecurityProfile.java:136) but INSECURE under TeaVM (:119-120), and
  `SURL#isUrlOk` returns true unconditionally under TeaVM. LEGACY is NOT
  unrestricted: it runs `URLCheck.isURLforbidden` (IP literals, dot-less
  hosts, `@`, encoded hosts, DNS inner-address check). The port mirrors the
  JVM default minus the DNS check.
- **Impact**: include tests using dot-less hosts (`https://c/d`) are refused
  by default now; use `*.example.com`.
- **Confidence**: High.

## Observation: prettier --write is not safe on every src file
- **Context**: formatting edited files.
- **Finding**: `src/index.ts` and `src/core/include-resolver.ts` are not
  prettier-clean at HEAD; `prettier --write` reformats ~70 unrelated lines of
  index.ts. Run `prettier --check` against the HEAD blob first
  (`git show HEAD:f | prettier --check --stdin-filepath f`).
- **Impact**: avoids blame-churn diffs.
- **Confidence**: High.

## Observation: fake timers and AbortSignal.timeout
- **Context**: item 3 timeout tests.
- **Finding**: the built-in fetch deadline uses AbortController + global
  `setTimeout` rather than `AbortSignal.timeout`, whose Node timer is not
  driven by vitest fake timers (and jsdom supplies its own AbortSignal).
  Same abort semantics, deterministic tests.
- **Impact**: keep new deadlines on the global `setTimeout`.
- **Confidence**: Medium (chose the testable mechanism; did not bisect
  AbortSignal.timeout under jsdom+fake timers).
