# T8 — End-to-end verification and the measured win

## Context

See [batch-5/overview.md](overview.md#why-this-task-exists-separately).

Every prior task tested its own layer against fabricated inputs. This one runs
the whole path — real emitted manifest, real vendored `.puml` files, real
transitive walk, real render — and produces the number the mission is judged on.

## Task

1. Write `tests/integration/stdlib-remote-e2e.test.ts`:
   - build a registry from the **real** regenerated tupadr3 remote manifest
     (`packages/stdlib-tupadr3/generated/...`)
   - inject a fetcher that reads from the local package/assets tree — **no
     network** (stop condition 10)
   - render a 3-icon diagram end to end through `render()`
2. Assert the resource count and that the icons actually draw.
3. Measure and record: manifest gzip size + the bytes of the resources actually
   fetched, against the 19.54 MB the eager module costs. Log the numbers so the
   journal entry can quote them.
4. Add the same shape for `awslib14` at a smaller scale, including one
   `Storage/SimpleStorageService`-style multi-slash, uppercase-path key — the
   case ADR-3 exists for.

## Write-set — write NOTHING outside these

- `tests/integration/stdlib-remote-e2e.test.ts` (create)

If this task finds a defect in `src/` or the generator, that is a **fix commit
against the owning task's file** (`fix(T3): …`), not an edit smuggled into this
one. Log it in the journal either way.

## Read-set

- `packages/stdlib-tupadr3/generated/**`, `packages/stdlib-aws/generated/**` —
  T6's regenerated output
- `assets/stdlib/tupadr3/`, `assets/stdlib/awslib14/` — the vendored resources
  the fetcher will serve. Note `assets/stdlib/stdlib` is a **self-referential
  symlink**; a naive recursive walk loops.
- `tests/unit/stdlib-remote-prefetch.test.ts` — T3/T4's unit-level expectations
- `src/index.ts` — `render`, `RenderOptions.stdlibRegistry`
- [`../decisions.md#adr-6`](../decisions.md#adr-6) — what must be stated, not
  asserted

## Architecture decisions (locked)

- [ADR-6](../decisions.md#adr-6) — measure and state; record what is NOT solved
- [ADR-4](../decisions.md#adr-4) — `baseUrl` is supplied by the test, never
  defaulted

## Interface contract

None produced. Consumed by T9, which quotes the measurement.

## Acceptance criteria

1. Given the real regenerated tupadr3 manifest and a local fetcher, when a
   3-icon diagram renders through `render()`, then ≤ 5 resources are fetched and
   the SVG contains the icons' drawn output.
2. Given that run, then the measured payload is logged: manifest gzip + fetched
   resource bytes, and the ratio against 19.54 MB.
3. Given an `awslib14` key with an uppercase, multi-slash path
   (`storage/simplestorageservice` → `Storage/SimpleStorageService.puml`), then
   it resolves — the exact case path-by-convention would have broken.
4. Given a resource named in the diagram but absent from the manifest, then the
   error names bundle and key and no request is made for it.
5. Given the full suite, then all existing gates are unmoved: 320/351 widened 0,
   389 goldens byte-identical, 54-fixture ratchet zero-diff.

## Quality bar

All four gates exit 0. The integration test must run offline and must not be
flaky — no timing assertions, no real network, no dependence on fetch ordering.

## Observability

N/A — a test. But criterion 2's logged measurement IS this mission's headline
evidence; make it easy to read and quote, not buried in an assertion message.

## Rollback

**Reversible** — revert the commit. Test-only.

## Boundaries

**Always:** inject the fetcher; read from disk.

**Never:** reach a third-party host (stop condition 10). Never relax an
assertion to make the number look better — **stop condition 15** applies: if the
reduction is not ≳99%, report the real figures and STOP rather than adjusting
the test to pass.

## Method rules

1. **Trace dependency cascades TWO levels.** This exercises T1→T2→T3→T4 plus
   T6's packaging; a failure here can originate in any of them, so diagnose
   before attributing.
2. **Verify against the REAL generated packages**, never a fabricated manifest —
   that is the entire point of this task, and SI8 was twice bitten by a shape
   assumed rather than read.

## Commit

One commit: `test(T8): verify per-resource fetching end to end and record the win`
