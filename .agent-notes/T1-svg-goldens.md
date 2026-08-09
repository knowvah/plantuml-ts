# T1 — SVG goldens for bodyenhanced-atom-seams (2026-07-29)

## Observation: zero of the 22 candidate fixtures reach zero-diff today
- **Context**: Authoring SVG goldens (before ADR-1's `decorate`/`BodyFactory`
  port) for 11 known-affected + 11 separator-bearing fixtures.
- **Finding**: Using `render-fixture.ts#renderFixture` +
  `compareSvg(..., 'deterministic')` against each fixture's
  `test-results/dot-cache/<type>/<slug>/in.svg`, ALL 22 candidates produced
  nonzero diffs (range: 3 to 388). Control check on 2 already-pinned
  fixtures (`buduni-98-bima526`, `vacuxi-18-baxu582`) confirmed zero-diff,
  so the harness itself is not the cause.
  - 8 of 11 group-1 (folder/package) fixtures fail with a `[childCount]`
    structural bail inside the package/folder cluster `<g>` — matches the
    already-documented README "Known gap" (no conformant package/cluster
    fixture yet).
  - All 11 separator-bearing fixtures (titled + bare) fail because
    `src/diagrams/description/` has no `decorate`/`isBlockSeparator`/
    `TextBlockLineBefore` equivalent — grep-verified: that logic exists
    ONLY under `src/diagrams/class/` (`class-body-enhanced.ts`,
    `class-body-enhanced-layout.ts`). The separator line's width never
    contributes to the entity body's sizing, so the whole box undersizes
    and every downstream child position cascades. Confirmed on
    `dexigu-24-deru622`: our `rect[1]/@width=59.425` vs jar's `240`.
  - `usecase/bootstrap-0` and `usecase/ruziru-69-xixo434` additionally
    ERROR (not just diff) in this harness: `render-fixture.ts` wires no
    stdlib `includeStore`, unlike `scripts/svg-conformance-census.ts`
    which does via `censusIncludeStore()`. Moot for pinning — both are
    `dotEqual=false` in `parity.json`, already AC3-ineligible.
  - `usecase/fepuvo-06-rugi981` (titled separator) additionally has a
    malformed-XML jar `in.svg` (xmldom: "comment is not well-formed at
    position 2937") — also `dotEqual=false`, ineligible regardless.
  - `usecase/jecici-56-bimu826` has `skinparam svgDimensionStyle false`;
    the jar's root `<svg>` omits `width`/`height` entirely (viewBox only)
    while our renderer always emits them — a separate, previously
    undocumented divergence, secondary to this fixture's dominant diffs.
- **Impact**: This gate, as scoped by ADR-5, currently pins 0 new
  fixtures — the 48 pre-existing pins are unaffected and remain the only
  coverage. The mission's later `decorate` port batches should re-run this
  exact 22-fixture check (list below) once that port lands; that is the
  population expected to start reaching zero-diff.
- **Confidence**: High — verified via direct render + compare, controls
  confirmed harness correctness, `src/diagrams/description/` grep
  confirmed absence of separator support, `parity.json` confirms
  ineligibility for the 3 already-excluded fixtures.

## Group definitions and slugs checked

**Group 1 (11, given)**: component/bozana-38-xufi750,
component/bozoju-49-kufo528, component/gucefa-91-pume734,
component/kanute-77-lacu414, component/lotofa-28-rudo664,
component/sevage-80-seva382, component/texacu-57-daci050,
usecase/cobuju-30-paxo591, usecase/bootstrap-0,
usecase/ruziru-69-xixo434, usecase/jecici-56-bimu826.

**Group 2 (titled separator, found via grep — 4, not the ledger's claimed
3)**: component/codabo-50-mupa164, component/xufexu-38-fola855,
usecase/fepuvo-06-rugi981, usecase/nixura-77-bina738.
`plans/s1l-leaf-sizing/ledger.md` names only `codabo-50-mupa164` for
S1L-i despite claiming a count of 3 (line 58) — the other 2 are never
named anywhere in that file (verified: only 1 grep hit for
`codabo-50-mupa164` context, S1L-a's "two re-bucketed" note names
`codabo` for S1L-i and `tajadu-40-juro990` for S1L-j, nothing else).
Independent enumeration (see method below) found 4 fixtures whose creole
lines match `BodyEnhancedAbstract#isBlockSeparator` AND carry non-empty
title text after the 2-char/2-char strip — one more than the ledger's
stale count.

**Group 3 (bare separator, found via grep — 7)**:
component/babafi-51-dixi026, component/butebe-90-dozo380,
component/dexigu-24-deru622, component/kenece-24-juku624,
component/tajadu-40-juro990, component/zifaji-87-raki559,
usecase/pivudu-29-pele178.

## Enumeration method (group 3, and the correction to group 2)

Scanned every `.puml` in `tests/corpus/{component,usecase}` (158 files)
AND `test-results/dot-cache/{component,usecase}/*/in.puml` (355 dirs),
splitting each file's content on both real newlines and literal `\n`
escape sequences (creole lines can arrive via either — multi-line quoted
displays use literal `\n`, bracket bodies use real newlines). Applied
`BodyEnhancedAbstract.isBlockSeparator` verbatim (line starts+ends with
`--`/`==`/`__`, or `..`/`..` excluding exactly `...`, length >= 4) to each
line, then classified `titled` vs `bare` by whether the 2-char-stripped,
trimmed interior is non-empty (mirrors `getTitle`'s `s.length() <= 4`
early-return null). `tests/corpus` was a strict subset — 0 slugs found
there that weren't already in `dot-cache`; `dot-cache` is the
enumeration-complete source for this pass. Script:
`/private/tmp/.../scratchpad/find-separators2.mjs` (not committed,
scratch-only).

## Tamper verification performed
- Perturbed `oracle/goldens/svg-description/component/buduni-98-bima526/
  golden.svg` on disk (`rect x="7"` -> `rect x="507"`, one occurrence).
- `npx vitest run tests/oracle/svg-conformance/description.golden.ratchet.test.ts -t buduni-98-bima526`
  FAILED: `component/buduni-98-bima526: conformance regression — first
  diff: svg/g[1]/g[1]/rect[1]/@x — {"path":"svg/g[1]/g[1]/rect[1]/@x",
  "actual":"7","expected":"507","delta":500,"tolerance":0.01}`.
- Restored the file from a scratchpad backup; `git diff --stat` on the
  golden showed no diff; re-ran the same test — passed (1 passed, 50
  skipped).

## What NOT to write here (per memory.md) — n/a, all findings above are novel
