# Mission: si11b-bootstrap-sprite-splitting

**Status:** ready to execute · **Branch:** `main` (maintainer practice)
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
| [3](batch-3/overview.md) | T6 | End-to-end; measure the win | [ ] |
| [4](batch-4/overview.md) | T7 | Close the mission | [ ] |

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
