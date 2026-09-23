# T28 — chrome creole at the shared seam

**Agent:** typescript-pro (opus) · **Depends on:** — · Worktree. Highest
blast radius in the batch: this seam is shared by every diagram type.

## Context

D5 / `diagnosis/A4-text.md` §2b (HIGH mechanism, MEDIUM reach):
`activitydiagram3/ftile/EntityImageLegend.java:47-56`
(`createTextBlockBordered` runs the `Display` through
`CreoleParser.createSheetSlow`) and `core/DiagramChromeFactory.java:
340-413` (title/caption/header/footer, same path) run FULL creole on every
chrome line. This port's `src/core/annotations/blocks.ts
#buildAnnotationBlock:394-421` calls `measureLines`/`drawLines`
(`blocks.ts:186,355`) on raw strings — zero creole recognition (no
`buildStripeAtoms`/`classifyStripeLine`/`StripeTable`/`StripeTree`/
`manageGuillemet` reference anywhere in the file); `chrome.ts:161-211`
(`addLegend`/`addTitle`/`addCaption`/`headerFooterSlot`) all funnel through
it. Confirmed reach: `kacico-91-bati232` (legend table+tree,
`childCount exp=34 act=10`), `galili-87-zivo129` (`<back:red>` in footer
and legend, `filter`/`defs` absent), `manube-50-xora983` (legend table with
`<back:>` swatches — `diagnosis/A3-style.md` §M7's note: this is a
STRUCTURAL creole-PARSING gap inside a table cell, "creole isn't parsed AT
ALL", NOT the same `<filter>` mechanism as `beruje-75-jimu270`'s wave
underline — do not conflate the two, and do not "fix" manube by chasing
M7's filter). Suspect, unattributed: `nucite-98-kuga991`, `nufini-44-
jofo787` (`<style>` block + creole, empty-text off-by-one),
`repuga-78-xora226`, `ropera-76-jico895` (legend cascade). Route each
chrome line through the EXISTING stripe/creole pipeline
(`src/core/klimt/creole/legacy/` — read-only for this task; T26 owns those
files) rather than rebuilding creole locally. The report is a lead:
re-read the cited bodies before editing.

## Task

1. TDD: write failing tests for `kacico-91-bati232`, `galili-87-zivo129`,
   `manube-50-xora983` against `test-results/dot-cache/class/<slug>/
   in.svg`, PLUS one test per non-class engine chrome fixture already
   covered by existing suites (description/state/sequence/activity) to
   catch an unintended mover before it reaches CI.
2. Change `buildAnnotationBlock` (`blocks.ts:394-421`) to run each
   `displayLines` entry through the same creole atom pipeline member rows
   use (table, tree, `<back:>`, bold, `----` horizontal rule — reuse the
   EXISTING `src/core/klimt/creole/legacy/` primitives; import, do not
   reimplement). `measureLines`/`drawLines` become creole-aware or are
   replaced by calls into the shared pipeline's own measure/draw
   equivalents.
3. Instrument `nucite-98-kuga991`, `nufini-44-jofo787`, `repuga-78-
   xora226`, `ropera-76-jico895` against the new pipeline; fix if the
   mechanism is this seam, or name and journal a different one (fixtures.md
   currently hints `nucite`/`nufini` at T24 — if this task's instrumentation
   shows the mechanism is chrome-text creole, correct that hint in
   `fixtures.md`'s mechanism column, not just the `after B7` column).
4. GATE (D5's condition): run the FULL `npm test` plus every engine's own
   ratchet/diff-baseline/oracle-conformance check (description, state,
   sequence, activity, json/yaml/hcl) after step 2 lands. Any mover
   outside `class` needs a `decision-journal.md` row naming its mechanism
   before being accepted (stop 4); an un-mechanised mover is stop 5 — halt.
5. `npx tsx tools/render-diff.mts` on `kacico-91-bati232`,
   `galili-87-zivo129`, `manube-50-xora983`; record before/after in
   `.agent-notes/cdd-T28.md`.

## Read-set

`activitydiagram3/ftile/EntityImageLegend.java:47-56`; `core/
DiagramChromeFactory.java:340-413`; `src/core/annotations/blocks.ts`
(whole file); `src/core/annotations/chrome.ts:155-215`; `src/core/klimt/
creole/legacy/` primitives used by `class-member-creole.ts` (read-only —
`classifyStripeLine`, `buildStripeAtoms`, `StripeTable.ts`,
`StripeTree.ts`); `diagnosis/A4-text.md` §2b; `diagnosis/A3-style.md` §M7
(the manube/beruje distinction); `diagnosis/A2b-entity-groups.md` §E13
(`----` rule, folded into this task's "table, tree, `<back:>`, bold,
`----`" scope).

## Write-set

`src/core/annotations/blocks.ts`, `src/core/annotations/chrome.ts`, their
test files, PLUS every non-class engine's test/oracle files that a
journaled, accepted mover touches (name them in the commit), `fixtures.md`
(mechanism-column correction for nucite/nufini only, if warranted),
`.agent-notes/cdd-T28.md`, `plans/class-divergence-drive/
decision-journal.md` (append-only).

## Acceptance criteria

- Given `kacico-91-bati232`, when rendered, then the legend group has 34
  children (table + tree fully drawn)
- Given `galili-87-zivo129`, when rendered, then `<back:red>` becomes a
  `filter` with its `<defs>` entry present
- Given `manube-50-xora983`, when rendered, then the legend-table cells
  are drawn as colour swatches (creole parsed inside the table cell)
- Given description/state/sequence/activity suites, when re-run after this
  change, then each is unmoved OR every mover carries a journaled
  mechanism
- Given `nucite-98-kuga991`/`nufini-44-jofo787`/`repuga-78-xora226`/
  `ropera-76-jico895`, when instrumented, then each is re-measured and
  classified (fixed or named-open) in the journal

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test` (every engine, not a path filter), `npm run typecheck`, `npm
run lint`, `npm run build`; `npx tsx tools/render-diff.mts` on the three
named class fixtures before/after; hooks: ≤500-line files, ≤30 NLOC
functions, CCN ≤10, ≤5 params.

## Boundaries

Always: run the full suite, not `vitest run tests/unit` (memory: full
suite catches catalog drift); treat any non-class mover as stop-4/stop-5
until journaled. Ask first: any README stop condition; touching a file
outside `blocks.ts`/`chrome.ts`. Never: rebuild the oracle cache (D12);
reimplement creole locally instead of importing the shared pipeline;
conflate manube with M7's wave-filter mechanism.

## Commit

`fix(cdd-T28): route chrome text through the shared creole pipeline`

Body: cites `EntityImageLegend.java`/`DiagramChromeFactory.java` line
ranges; lists every non-class fixture that moved and its journaled
mechanism, or states none moved.
