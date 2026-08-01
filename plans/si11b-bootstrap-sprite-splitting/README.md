# Mission: si11b-bootstrap-sprite-splitting

**Status:** COMPLETE (2026-07-31) · **Branch:** `main` (maintainer practice)
**Created:** 2026-07-31 · **Predecessor:** `si11a-per-resource-stdlib-fetch` (closed)

## Objective

SI11a made a consumer pay only for the stdlib **resources** a diagram names.
That does nothing for `bootstrap1.13.1`, because it is **one** resource:
`bootstrap.puml` is 1,085,342 B holding **2,078 sprites**. This mission makes
a consumer pay for the **sprites a diagram names** — `<$bi-globe>` costs
~431 B, not 1.06 MB — by deriving per-sprite fragments plus a name manifest,
and fetching only the sprites the source actually references.

## The numbers that shaped the design (measured 2026-07-31 — do not re-derive)

| quantity | value |
|---|---|
| `bootstrap.puml` | 1,085,342 B |
| sprite blocks | **2,078** (99.6% of the file) |
| block size mean / median / max | 520 B / 431 B / 4,705 B |
| name-list manifest | 34,338 B raw / **7,289 B gzip** |
| key→path map (rejected) | 104,005 B raw / 12,201 B gzip |

**All 2,078 names are unique, lowercase and filesystem-safe — zero
uppercase.** That is why [ADR-3](decisions.md#adr-3) **inverts** SI11a's
ADR-3 and uses path-by-convention: the condition that made convention
impossible for `awslib14` (890 of 891 paths carrying uppercase) is measurably
absent here, and the name list is 40% smaller than the map.

**Projected, honestly:** a 3-sprite diagram costs ~8.8 KB against 1,085,342 B
— about **98.7%**. Deliberately *not* SI11a's 99.7%: the 7.3 KB manifest
floor dominates at small N. [ADR-6](decisions.md#adr-6) requires T6 to
measure and state, never assert.

## What this mission is NOT (read before starting)

**It does not transform a vendored file.** The SI11b row in
`planning/mission-index.md` and SI11a's planning notes both said it would,
and needed a carve-out from SI5b's checksummed-copy rule. Checking the code
showed otherwise — see [ADR-1](decisions.md#adr-1). Fragments are **derived
output**, exactly as SI11a derives `.remote.js` and its asset copy. The
vendored tree stays byte-identical and **`vendor-stdlib --verify` needs no
change at all.** That removes the reason SI11b was called the dangerous half.

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

Baseline at mission start: **463 test files / 11,266 tests**.

## Batches

| Batch | Tasks | Theme | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 ∥ T2 ∥ T3 | Splitter+wiring; `<$name>` scan; collision warning | [x] |
| [2](batch-2/overview.md) | T4 ∥ T5 | Route the scan into prefetch; ship fragments | [x] |
| [3](batch-3/overview.md) | T6 | End-to-end; measure the win | [x] |
| [4](batch-4/overview.md) | T7 | Close the mission | [x] |

## Documents

- [`decisions.md`](decisions.md) — the seven approved ADRs. **Read before any
  task.** ADR-1 and ADR-3 are the ones that redefine the mission.
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — eager vs per-sprite
- [`diagrams/component-map.md`](diagrams/component-map.md) — what is touched

## Stop conditions

**Architectural**

1. A Node built-in, `process.env`, or `require()` reaches `src/`. **ADR-7's
   named temptation is `process.env.NODE_ENV` for the collision warning** —
   it is a callback, never an env read.
2. `renderSync` becomes async or changes signature.
3. An ADR in `decisions.md` is contradicted.
4. `BundleData`, `stdlibStore`, `withStdlib`, `stdlibRegistry`,
   `StdlibRemoteManifest`, `remoteStdlib` or `resolve()`/`resolveResource()`
   change signature. SI11a's surface is frozen; this mission is additive.

**Vendored-asset integrity**

5. Any vendored file's content changes or a file is renamed. **This mission
   derives, never transforms (ADR-1).** If a transform looks necessary, that
   is a re-plan, not a workaround.
6. `assets/stdlib.manifest.json` gets re-pinned.
7. The splitter is pointed at a bundle that is not explicitly MIT-allowlisted
   (ADR-2). `awslib14` carries **no** license field and must fail closed.

**Oracle integrity**

8. Editing a `golden.svg` to make a test pass.
9. Re-pinning `size-backlog.json` or `diff-baseline.json` — escalate.
10. A ratcheted fixture drops below zero-diff.

**Network**

11. A test requires real egress. Every test injects a fetcher over local
    files; nothing may reach a third-party host.

**Scope**

12. A task needs a file outside its write-set AND outside every other task's.
    **SI11a hit this twice** — escalate, never self-approve.
13. Two consecutive gate failures on the same check, or the same location
    changed 3× without resolving it.
14. **Publishing.** `npm publish` is maintainer-gated and out of scope.
15. **T6's measurement falls materially below ~98.7%.** Report the real
    numbers and stop; per ADR-6, measure and state, never assert success.

## Push-forward conditions

- Internal structure, naming and helpers inside the new modules.
- **Complexity/line-cap friction:** `#lizard forgives` near a function's END,
  or a ~500-line split. Do NOT edit `complexity-ignore`. **Expect it** —
  `src/index.ts` and `src/core/include-resolver.ts` are both AT 500 lines.
- Extra test cases beyond the stated acceptance criteria.
- **A line or path citation here is off.** Follow the code, note the
  correction in the journal, continue.
- A task is simpler than scoped — log why, then proceed.

## Three method rules — spec, not preamble

All three were earned at cost on this mission line.

1. **Trace dependency cascades TWO levels** before ruling on scope.
2. **Verify any "already fixed / already wired / it will just work" claim
   against the CURRENT call graph.** ADR-1 exists because this rule was
   applied to the mission's own founding premise and the premise was wrong.
3. **Capture a failing command's stderr before theorising about its cause.**
   SI11a diagnosed a directory race as a timeout and "fixed" it by raising a
   budget; the real mechanism was in npm's stderr the whole time.

## Deviation from the `/plan-mission` template

`plans/` is **tracked** in this project, not gitignored — established
practice, and `planning/mission-index.md` links into it. `.claude/` IS
gitignored, as the template expects.

---

# Mission summary (2026-07-31)

**Status: complete.** 7 of 7 tasks, 4 of 4 batches, 11 commits on `main`.

## The measured result

| quantity | measured |
|---|---|
| manifest (`sprites.json`, gzip) | 7,402 B |
| 3 fragments actually fetched | 2,066 B |
| **total over the wire** | **9,468 B** |
| whole-file baseline (read from disk) | 1,085,342 B |
| **reduction** | **99.128%** on 3 fetches |

Ahead of this brief's ~98.7% projection, so stop condition 15 never fired.
T7 quotes this figure, not the projection.

## Tasks completed vs planned

All seven as scoped, in the planned batches. Two additions the plan did not
name: a `fix(T4)` commit for a public-surface defect (below), and one
pre-authorized write-set expansion — `src/core/sprite-split-stdlib.ts`,
created because `include-resolver.ts` was at the hook-enforced 500-line cap.

## Gate results (final, batch 3)

`npm test` **468 files / 11,317 tests** (baseline 463 / 11,266) · typecheck,
lint, build exit 0 · `vendor-stdlib --verify` **34,587 files verbatim** ·
size deltas **320/351, widened 0** · 389 goldens byte-identical ·
54-fixture description ratchet zero-diff. Every batch gated clean; no gate
was run twice on the same failure.

## Decisions flagged for review

1. **ADR-1 overturned the mission's founding premise, and it held.** SI11b
   was recorded as requiring a vendored-file transform and an SI5b carve-out.
   It required neither. `vendor-stdlib --verify` was never touched.
   **SI11a's row in `planning/mission-index.md` still carries the superseded
   claim** — left unedited on purpose (T7 criterion 4: dated rows stay as
   taken); the correction lives in the SI11b row.
2. **T5 deliberately did NOT add a `copy-assets.mjs`/`prepack`,** unlike
   `stdlib-aws`/`stdlib-tupadr3`. The root generator already writes this
   package's `assets/` directly, so a per-package copy would make a second
   writer of one directory — the shape of the race that cost SI11a a stop.
3. **T3 held `src/index.ts` at exactly 500 lines** by reflowing blank spacer
   lines inside three pre-existing JSDoc blocks; `fix(T4)` later held the
   same cap by folding four type-only re-exports into their value exports.
   No wording was cut, but both are formatting edits to code neither task
   otherwise touched.
4. **T6 substituted criterion 1's `<image>` / `data:image` assertion.** That
   wording was inherited from SI11a's PNG-form tupadr3 test; bootstrap's
   sprites are SVG-form and render as inline `<path>`. Verified against the
   real golden — zero `<image>` tags. A stronger check replaced it, not a
   weaker one.

## Two defects caught in review — both the same shape

Code that worked in-repo and would have failed a consumer. Worth naming
together, because a third of this shape will look just as harmless:

1. **The ADR-5b escape hatch applied at one recursion level only.** Names
   were spliced into the top-level source, so a sprite-split `!include`
   reached through an author's own shared header dropped an option-named
   sprite **silently** — the outcome ADR-5a forbids, inside the valve
   ADR-5b exists to provide. Fixed by making the names walk-constant.
2. **`spriteSplitStdlib` shipped unreachable from the public API.**
   `package.json`'s `exports` has a single `"."` entry, so `src/index.ts` is
   the only importable surface; the helper was not re-exported, and its own
   doc comment advertised a deep `core/` path no export map serves. Every
   unit test passed, importing by relative path.

Both were found by asking what a CONSUMER sees, not what the tests see.
T1's criterion 4 encodes the same lesson from SI11a; it generalizes further
than "assert on the build output".

## Known issues and follow-ups

**Needs a maintainer decision — outside every task's write-set, so escalated
rather than self-approved (stop condition 12):**

- **`docs/stdlib-remote.md:174-177` is now wrong.** It tells readers
  "Bootstrap gets nothing from this… per-sprite splitting for bootstrap is a
  separate, deferred mission (SI11b)." True when written, false now. This is
  consumer-facing documentation actively pointing away from a shipped
  feature — the highest-value item in this list.

**Lower priority:**

- `tests/unit/stdlib-packages.test.ts`'s comment that `packages/stdlib` "has
  no prepack and no assets, so it cannot race" is half stale: the conclusion
  still holds (no prepack ⇒ `npm pack --dry-run` mutates nothing), the
  stated reason no longer does.
- `src/core/sprite-split-stdlib.ts` also holds the general
  `bundlesFor`/`stdlibContentFor` alias walk, moved there for line budget, so
  its name under-describes its contents.
- **`npm publish` is maintainer-gated and was not part of this mission.**
  The fragments are in `files` and the packaging gate resolves them against
  a real `npm pack --dry-run --json`, but nothing has been published.

## Deviations from the brief

- Manifest is `{name, sprites}` per the batch-1 contract, not a bare array,
  so it measures 7,402 B gzip against ADR-3's 7,289 B for a bare list —
  ~113 B for the declared shape, well under criterion 1's 8 KB bound.
- Line-number corrections in `T1`, `T2` and `T6` (paths and cited ranges had
  drifted); each is recorded in the decision journal. T6's manifest path was
  the substantive one: `packages/stdlib/assets/…/sprites.json`, not
  `packages/stdlib/generated/…`.
