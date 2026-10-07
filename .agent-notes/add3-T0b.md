## Observation: core/url/ seam already existed before this move
- **Context**: D9 task (add3-T0b) — move `resolveInlineLinks` to
  `src/core/url/inline-links.ts`.
- **Finding**: `src/core/url/` already contained a full `UrlBuilder.ts`/
  `Url.ts`/`UrlMode.ts`/`Check.ts` port (upstream
  `net/sourceforge/plantuml/url/`), used by `cucadiagram/Member.ts`'s
  class-diagram link grammar. `resolveInlineLinks` is a DIFFERENT,
  narrower function (a regex-based `[[...]]` -> label text replacer
  used only for label-width measurement) — not a redundant duplicate
  of `UrlBuilder.getUrl`. The move places both under the same upstream
  package boundary without merging their logic.
- **Impact**: Future work unifying `[[...]]` resolution across engines
  should look at `core/url/UrlBuilder.ts` + `Url.ts` as the canonical
  grammar port, and `core/url/inline-links.ts` as the lighter
  text-only helper that activity/description label measurement uses.
- **Confidence**: High (read both files directly).

## Report (D9, add3-T0b)

**Commit**: `refactor(add3-T0b): move resolveInlineLinks to core url seam`
(1 commit, on branch `add3/T0b`).

**Files moved**:
- `git mv src/diagrams/description/parse-helpers-inline-links.ts
  src/core/url/inline-links.ts` (doc comment updated to describe the
  second move + added `@see` lines to `UrlBuilder.java`/`Url.java`;
  function bodies unchanged).
- No dedicated test file existed for the old module (it was exercised
  only via `tests/unit/description/parse-helpers.test.ts` importing the
  `parse-helpers.ts` facade) — nothing to `git mv` for tests.

**Files edited (import line / re-export only, no logic change)**:
- `src/diagrams/description/parse-helpers-strings.ts` — import +
  re-export of `resolveInlineLinks` now points at
  `../../core/url/inline-links.js`; doc comment updated.
- `src/diagrams/activity/activity-renderer-swimlanes.ts` — import now
  `../../core/url/inline-links.js` (was `../description/parse-helpers.js`).
- `src/diagrams/activity/layout/swimlane-placement.ts` — import now
  `../../../core/url/inline-links.js` (was
  `../../description/parse-helpers.js`).
- `tests/architecture/layering.test.ts` — removed the two add2
  allowlist entries (`activity-renderer-swimlanes.ts` ->
  `description/parse-helpers.ts` and `swimlane-placement.ts` ->
  `description/parse-helpers.ts`); the edge no longer exists.
- `docs/catalog.md` — regenerated via `npm run catalog`.

**Verification**:
- `npx vitest run tests/architecture/layering.test.ts
  tests/unit/description/parse-helpers.test.ts` — 30/30 passed.
- `npx vitest run tests/unit/activity tests/diagrams/activity
  tests/unit/description tests/architecture` — 2405/2405 passed
  (121 files).
- `npx vitest run tests/architecture/catalog.test.ts` — 2/2 passed
  (no drift after `npm run catalog`).
- `npm run typecheck` — clean (both tsconfigs).
- `npx eslint` on all 5 changed/moved source+test files — clean.
- `npx tsx scripts/activity-probe.ts --json
  /private/tmp/claude-501/add3-T0b-probe.json` — **Σ = 16937**,
  0 risers, 0 fallers — matches the add2 baseline (b0) exactly, as
  expected for a pure import-path move with zero behavior change.

**Not done / deviations**: none. All acceptance criteria met as
specified.
