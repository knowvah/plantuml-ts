# T6 — End-to-end verification and the measured win

## Context

See [ADR-6](../decisions.md#adr-6).

Every prior task tested its own layer against fabricated inputs. This one runs
the whole path — the REAL split manifest, the REAL derived fragments, the real
transitive walk, a real `render()` — and produces the number the mission is
judged on.

## Task

1. Create `tests/integration/sprite-split-e2e.test.ts`:
   - build a registry from the **real** emitted split manifest
     (`packages/stdlib/generated/...`)
   - inject a fetcher reading fragments from the local package tree —
     **no network** (stop condition 11)
   - render a 3-sprite diagram end to end through `render()`
2. Assert the fetch count and that the sprites actually **draw** — count the
   emitted `<image>` elements, do not merely check the SVG rendered.
3. **Measure and log**: manifest gzip + fetched fragment bytes, against the
   1,085,342 B the whole-file path costs. Make it easy to read and quote.
4. Add a case proving the ADR-5(b) escape hatch works end to end: a sprite
   named only via `options.sprites` renders.

## Write-set — write NOTHING outside this

- `tests/integration/sprite-split-e2e.test.ts` (create)

If this task finds a defect in `src/` or the generator, that is a **fix commit
against the owning task's file** (`fix(T4): …`), not an edit smuggled into
this one. Stop, report the mechanism, and let the orchestrator route it.

## Read-set

- `packages/stdlib/generated/**` and `packages/stdlib/assets/**` — T1/T5's
  real output
- `tests/integration/stdlib-remote-e2e.test.ts` — **SI11a's equivalent task**;
  mirror its structure, its disk-backed fetcher and its logging block
- `src/index.ts` — `render`, `RenderOptions.stdlibRegistry`, `sprites`,
  `onWarning`
- `oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0/in.puml` — a
  real `<$bi-globe>` fixture
- [ADR-6](../decisions.md#adr-6) — what must be stated, not asserted

## Architecture decisions (locked)

- [ADR-6](../decisions.md#adr-6) — measure and state; record what is NOT solved
- [ADR-4](../decisions.md#adr-4) — `baseUrl` is supplied by the test, never
  defaulted

## Interface contract

None produced. Consumed by T7, which quotes the measurement.

## Acceptance criteria

1. Given the real split manifest and a local fetcher, when a 3-sprite diagram
   renders through `render()`, then **≤ 4** fetches occur and the SVG contains
   the sprites' drawn output (assert the `<image>` count, and the
   `data:image/...` shape the renderer emits).
2. Given that run, then the measured payload is **logged**: manifest gzip
   bytes, fragment bytes, total, the 1,085,342 B baseline read from disk (not
   hardcoded), and the reduction as a percentage.
3. Given a sprite named **only** in `options.sprites`, then it is fetched and
   drawn — the ADR-5(b) escape hatch, end to end.
4. Given a referenced sprite absent from the manifest, then the error names
   the sprite and no request is made for it.
5. Given the full suite, then all existing gates are unmoved: 320/351
   widened 0, 389 goldens byte-identical, 54-fixture ratchet zero-diff.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/integration/sprite-split-e2e.test.ts`, and `npx tsx
scripts/measure-description-size-deltas.ts` (still 320/351, widened 0). Do NOT
run the full `npm test` — the orchestrator runs the full gate set.

The test must run offline and must not be flaky: no timing assertions, no real
network, and **no dependence on fetch ordering** — the walk is concurrent.

**Do NOT add a `beforeAll` that rebuilds the generated tree**; it is built once
in vitest `globalSetup`. SI11a lost a stop-condition-13 escalation to exactly
that race.

## Observability

N/A — a test. But criterion 2's logged measurement IS this mission's headline
evidence; make it easy to read and quote, not buried in an assertion message.

## Rollback

**Reversible** — revert the commit. Test-only.

## Boundaries

**Always:** inject the fetcher; read fragments from disk.

**Never:** reach a third-party host. **Never relax an assertion to make the
number look better — stop condition 15 applies.** If the reduction lands
materially below ~98.7%, report the real figures and STOP rather than
adjusting the test to pass.

## Method rules

1. **Trace dependency cascades TWO levels.** This exercises T1→T2→T3→T4 plus
   T5's packaging; a failure here can originate in any of them, so **diagnose
   before attributing** — and capture the failing command's stderr before
   theorising about the cause.
2. **Verify against the REAL generated fragments**, never a fabricated
   manifest — that is the entire point of this task, and SI11a was twice
   bitten by a shape assumed rather than read.

## Commit

One commit: `test(T6): verify per-sprite fetching end to end and record the win`
