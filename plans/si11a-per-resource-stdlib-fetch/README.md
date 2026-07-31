# Mission: si11a-per-resource-stdlib-fetch

**Status:** DONE 2026-07-31 · **Branch:** `main` (maintainer practice)
**Created:** 2026-07-31 · **Predecessor:** `si8-stdlib-registration` (closed)

## Objective

SI8 shipped per-**bundle** lazy registration. It made `@plantuml-ts/stdlib-aws`
and `-tupadr3` opt-in instead of eager, but it cannot shrink them: each is a
SINGLE bundle, 7.93 MB and 19.54 MB. This mission makes a consumer pay for the
**resources a diagram actually names** — `<tupadr3/font-awesome-5/ban>` costs
~2.9 KB, not 19.54 MB — by publishing each bundle as a small manifest plus
individually fetchable `.puml` assets.

**This is the SI11a half of a split.** SI11b (bootstrap per-sprite splitting)
is deferred and depends on the manifest/asset shape this mission establishes —
see [ADR-6](decisions.md#adr-6) for why per-resource loading does nothing for
bootstrap.

## The numbers that shaped the design (verified 2026-07-31 — do not re-derive)

| bundle | resources | content | manifest (key→path) | per-resource median |
|---|---|---|---|---|
| `tupadr3` | 6,849 | 18.93 MB | 383.0 KB raw / **49.6 KB gzip** | 2,889 B (max 3,387) |
| `awslib14` | 891 | 7.86 MB | 64.8 KB raw / **8.3 KB gzip** | 5,122 B (max 455,460) |

Replacing a 19.54 MB chunk with a 49.6 KB gzip manifest is a **99.7%**
reduction, and the manifest stays a static `import()` — so SI8's registration
mechanism, its bundler analyzability and its alias handling all survive
untouched.

**The decisive measurement: 890 of 891 `awslib14` paths contain uppercase**
(`Storage/SimpleStorageService.puml`) while `derivePumlKey` lowercases. So paths
cannot be derived from keys by convention without renaming vendored files —
hence [ADR-3](decisions.md#adr-3) ships a key→path map, and **this mission
therefore transforms no vendored file at all.**

## Quality gates

| Command | Pass | On fail |
|---|---|---|
| `npm test` | exit 0 | fix_and_rerun |
| `npm run typecheck` | exit 0 | fix_and_rerun |
| `npm run lint` | exit 0 | fix_and_rerun |
| `npm run build` | exit 0 | fix_and_rerun |
| `npx tsx scripts/vendor-stdlib.ts --verify` | all sha256 match | **stop** |
| `npx tsx scripts/measure-description-size-deltas.ts` | 320/351, widened 0 | stop |
| 389 svg-class/object/state goldens | byte-identical | stop |
| svg-description ratchet (54 fixtures) | all zero-diff | stop |

Baseline at mission start: **459 test files / 11,219 tests**.

The `vendor-stdlib --verify` gate is **new for this mission** and is the one
that proves stop condition 5 has not been violated.

## Batches

| Batch | Tasks | Theme | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 ∥ T5 | Remote source module; generator emits manifests | [x] |
| [2](batch-2/overview.md) | T2 ∥ T6 ∥ T7 | Registry resource path; regenerate packages; exports | [x] |
| [3](batch-3/overview.md) | T3 | Per-resource routing into the prefetch walk | [x] |
| [4](batch-4/overview.md) | T4 | Concurrent fetch + in-flight dedup | [x] |
| [5](batch-5/overview.md) | T8 | End-to-end verification; measure the win | [x] |
| [6](batch-6/overview.md) | T9 | Close the mission | [x] |

Batches 1 and 2 contain genuinely independent work — `src/` and `scripts/`
never share a file, and T6/T7 touch neither. T3 and T4 are separate batches
only because they rewrite the same file.

## Documents

- [`decisions.md`](decisions.md) — the seven approved ADRs. **Read before any
  task.** ADR-3 and ADR-4 are the ones with teeth.
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — eager vs remote resolution
- [`diagrams/component-map.md`](diagrams/component-map.md) — what is touched

## Stop conditions

**Architectural — these protect constraints that outrank the mission**

1. A Node built-in (`fs`, `path`, `os`, `http`, `child_process`), `process.env`,
   or `require()` reaches `src/`. The fetch path uses global `fetch` through the
   injected `IncludeFetcher` — never `node:http`.
2. `renderSync` would become async, or its signature change.
3. An ADR in `decisions.md` is contradicted. Watch **ADR-4**: the tempting
   violation is defaulting `baseUrl` to jsDelivr to make a test simpler.
4. `BundleData`, `stdlibStore`, `withStdlib`, `stdlibRegistry`, or `resolve()`'s
   signature changes. The eager offline path must keep working untouched.

**Vendored-asset integrity — this is why SI11a is the safe half of SI11**

5. Any vendored file's **content changes, or a vendored file is renamed.**
   SI11a is a pure checksummed file copy. A rename to make path-by-convention
   work is exactly the ADR-3 violation — if it looks necessary, that is SI11b's
   territory, not a workaround here.
6. `assets/stdlib.manifest.json` gets re-pinned.

**Oracle integrity**

7. Editing a `golden.svg` to make a test pass.
8. Re-pinning `oracle/goldens/description/size-backlog.json` or
   `diff-baseline.json`. SI8 hit exactly this and it required a maintainer
   ruling — escalate, never self-approve.
9. A ratcheted fixture drops below zero-diff.

**Network — new for this mission**

10. A test requires **real egress to a third-party host.** Every test injects a
    fetcher over local `assets/`; nothing in CI may reach jsDelivr or unpkg.
11. `fetchInclude`'s CORS/CSP differentiation does not behave as documented in
    the test environment. Do not work around it — stop and report what it does.

**Scope**

12. A task needs a file outside its write-set AND outside every other task's.
13. Two consecutive gate failures on the same check, or the same location
    changed 3× without resolving it.
14. **Publishing.** `npm publish` is maintainer-gated (SI5b) and is not part of
    this mission. If verifying something appears to require publishing, stop.
15. **T8's measurement does not show the projected win** — a 3-icon tupadr3
    diagram not reaching a ≳99% payload reduction against 19.54 MB. Report the
    real numbers and stop; per ADR-6, measure and state, never assert success.

## Push-forward conditions

- Internal structure, naming and helpers inside the new modules.
- **Complexity-hook friction:** `#lizard forgives` near a large function's END,
  or a ~500-line split. Do NOT edit `complexity-ignore`. **Expect this** —
  `src/index.ts` and `src/core/include-resolver.ts` both sit AT the 500-line
  cap, and SI8 hit it four times.
- Extra test cases beyond the stated acceptance criteria.
- **A line or path citation here is off.** Follow the code, note the correction
  in the journal, continue. A wrong line number is not a wrong mechanism.
- A task is simpler than scoped — log why in the journal, then proceed.
- **T4's concurrency primitive** is yours to choose (`Promise.all` vs a bounded
  pool), but the choice must be **recorded with its reasoning**, not guessed.
  Guidance: unbounded is fine at the measured N (a typical icon diagram is <50
  resources); if a source can cascade past ~100 concurrent (e.g.
  `<awslib14/Compute/all>`), add a bound and record the number.

## Two method rules — spec, not preamble

Both were earned at cost on this mission line.

1. **Trace dependency cascades TWO levels** before ruling on scope. SI8's T1
   fix was incomplete until the SECOND consumer of the store was traced.
2. **Verify any "already fixed / already wired / it will just work" claim
   against the CURRENT call graph.** Third-party extensibility was *verified*
   working before ADR-7 was written, not assumed.

## Mission summary — closed 2026-07-31

**9 of 9 tasks completed**, in 14 commits on `main`.

### The measured result (T8, end-to-end against the real packages)

A 3-icon tupadr3 diagram, rendered through `render()` with a disk-backed
fetcher:

| | bytes |
|---|---|
| manifest (`tupadr3.remote.js`, gzip) | 51,415 |
| resources actually fetched (4 files) | 9,564 |
| **total over the wire** | **60,979** |
| eager `tupadr3.js` baseline | 20,488,276 |
| **reduction** | **99.702%** |

Four resources, not three: `common.puml` plus one per icon. The projection
in this brief was 99.7% — the measurement landed on it, so **stop condition
15 was never engaged and nothing was adjusted to make it pass.**

Per-bundle manifest floors, measured on real emitted output: tupadr3
433,420 B raw / 51,803 B gzip; awslib14 71,848 B / 11,116 B gzip.

### Gate results

463 files / 11,266 tests · typecheck, lint, build exit 0 ·
`vendor-stdlib --verify` verbatim across 34,587 files · size-deltas
**320/351, widened 0** · 389 goldens byte-identical · 54-fixture ratchet
zero-diff. Baseline at mission start was 459 files / 11,219 tests.

### Where the brief was wrong

Four corrections, all verified against code rather than reasoned about:

1. **`assets/stdlib/tupadr3` contains ZERO `!include` directives.** T3's
   "a tupadr3 icon `!include <tupadr3/common>`" example does not exist;
   `C4/C4_Context.puml` is the real analog and the tests use it.
2. **ADR-6's concurrency cascade example is wrong.** `Compute/all.puml` has
   no `!include` lines — its 455,460 bytes are inline sprite bodies. It is a
   payload concern, not a fan-out one. Real worst-case fan-out is 38
   (`k8s/OSS/all.puml`), which is why T4 chose unbounded concurrency.
3. **ADR-6's awslib14 manifest figure is low** — 11.1 KB gzip, not 8.3 KB.
4. **A bare `StdlibRemoteManifest` is structurally identical at runtime to a
   `BundleData`.** Registering one directly would serve file PATHS as file
   CONTENT. T2's task item asking `harvest` to recognise a bare manifest is
   not achievable; the working idiom pre-wraps via `remoteStdlib()`.

### Decisions flagged for maintainer review

- **The packages roughly double**: stdlib-aws 8.3 → 15.9 MB, stdlib-tupadr3
  20.5 → 38.9 MB. This follows directly from ADR-1 (keep the eager module)
  plus ADR-4 (also ship raw assets) — each bundle's content now exists twice
  in two encodings, deliberately. Worth revisiting before publish.
- **`npm publish` was never run** (maintainer-gated, SI5b). The `.remote`
  subpaths exist in-repo but are not installable from the registry, and
  `docs/stdlib-remote.md` says so plainly.

### Stops, and how each resolved

Three scope stops plus one gate stop:

| Stop | Resolution |
|---|---|
| Generator never called T5's emitters; the wiring file was in no task's write-set | Maintainer authorized `fix(T5)` |
| The `Stdlib.java` key transform was private to `StdlibStore.ts`, in no task's write-set | Maintainer chose a shared `src/core/tim/stdlib-path.ts` |
| `PACK_CEILINGS` overran | **Not** stop-12 — the file is in T5's write-set, so resolved in-mission |
| Condition 13: two failures on the pack check | Two nested races; maintainer chose build-once in `globalSetup` |

**One diagnosis I got wrong and corrected:** the first pack failure was
called a timeout and "fixed" by raising the budget. The real mechanism was a
directory race, visible in npm's stderr the whole time — I had inferred load
from a standalone timing without capturing it. The timeout was kept only
where it is now honest. Recorded because a symptom-shaped fix that makes a
gate green *often enough* is exactly what the repo's diagnosis rule exists
to catch.

### Follow-ups

- **SI11b** is registered in `planning/mission-index.md` with its three
  distinguishing constraints.
- `copy-assets.mjs` needs Node ≥20.12 (`entry.parentPath`); the repo
  declares no `engines`. Only runs at pack/publish time.
- The awslib14 `*/all.puml` aggregators (116–445 KB) remain the weakest case
  for this design, as ADR-6 predicted.

## Deviation from the `/plan-mission` template

`plans/` is **tracked** in this project, not gitignored. The predecessor's brief
is on `main` and `planning/mission-index.md` links into it. Established practice
wins. (`.claude/` IS gitignored, as the template expects.)
