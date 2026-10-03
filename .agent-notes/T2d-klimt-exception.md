## T2d — the two klimt fixes (D8)

- **Context**: add2 batch-2b, T2d. Two D8-authorized klimt edits:
  `document-shell.ts` (setecu-78-cuko533, `preserveAspectRatio`) and
  `CommandCreoleUrl.ts` (laxibe-66-teme800, creole tooltip boundary).
- **Commits** (worktree `add2-T2d`, branch `add2/T2d`):
  - `2f4c02f05` feat(klimt): thread preserveAspectRatio through
    ShellFragment (D8)
  - `1129510f4` fix(klimt): require a whitespace/end boundary after a
    creole {tooltip}
  - `966093665` docs(add2): close laxibe-66-teme800, re-slot
    setecu-78-cuko533

### setecu-78-cuko533 — NOT closed, re-slotted (mechanism done, data source missing)

- Java → ours: `SkinParam.java:1086-1088`
  (`getPreserveAspectRatio() { return getValue("preserveaspectratio",
  DEFAULT_PRESERVE_ASPECT_RATIO); }`), default `SkinParam.java:119`
  (`DEFAULT_PRESERVE_ASPECT_RATIO = "none"`), cascade
  `TextBlockExporter.java:380-386` (`fileFormatOption` override, else
  `skinParam`, else the constant), consumed at
  `SvgGraphics.java:815`/`:813` (`finalizeRootAttributes`:
  `root.setAttribute("preserveAspectRatio", option.getPreserveAspectRatio())`).
- Before: `src/core/klimt/document-shell.ts:197-200` hardcoded the
  literal `'none'` unconditionally for every klimt-shaped engine
  (class/state/activity/sequence/json/yaml/hcl/mindmap/description/error).
- After: `ShellFragment.preserveAspectRatio?: string` (new field) and a
  named `DEFAULT_PRESERVE_ASPECT_RATIO = 'none'` constant replace the
  literal: `fragment.preserveAspectRatio ?? DEFAULT_PRESERVE_ASPECT_RATIO`.
  `RenderFragment` (`src/core/dispatcher.ts`) grew the matching optional
  field so a producer CAN forward a resolved value; `assemble-svg.ts`'s
  per-`diagramType` finalize functions already spread `{ ...fragment,
  ... }` (verified in `finalizeActivityFragment` and siblings), so the
  field would flow through unmodified with zero further plumbing.
- **Why the row stays open**: no `RenderFragment` producer anywhere in
  `src/diagrams/**` sets the field (`grep -rn preserveAspectRatio
  src/diagrams/ src/core/*.ts src/index.ts` returns only the plumbing
  doc comments) because there is no `Theme` field for `skinparam
  preserveaspectratio` to read from, and `src/core/theme.ts` + the
  skinparam key handlers (`src/core/skinparam-key-handlers-table-{a,b}
  .ts` and friends) are explicitly outside T2d's write-set. Forcing a
  value here would mean either editing those files (outside write-set,
  stop) or inventing a non-upstream fallback (fitting a value — banned).
  The row's diff (`svg/@preserveAspectRatio`, `maxDelta: 0`) is
  byte-for-byte unchanged before/after both edits.
- **Owning file / mechanism for the re-slot**: a new `Theme
  .preserveAspectRatio` field, a skinparam key handler recognizing
  `preserveaspectratio` (free-string key, same pattern as other
  `getValue(key, default)` skinparams — no parser registration needed,
  `SkinParam.getValue` is generic), and `renderActivity` (plus the
  class/state/sequence/json/mindmap producers, all of which currently
  hardcode the same default) reading `theme.preserveAspectRatio` into
  their returned `RenderFragment`. Owner: whichever task/agent owns
  `src/core/theme.ts` (T2c in this batch, per the brief's own
  instruction to re-slot theme-field work to it).
- `fixtures.md` row updated to `open -> add3 (...)` naming this exact
  mechanism + owning file.

### laxibe-66-teme800 — CLOSED, conformant

- Java → ours: `~/git/plantuml/.../url/UrlBuilder.java:76-80`:
  ```java
  private static final String S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL = START_PART + //
          "([^%s%g\\[\\]]+?)" + // Link
          "(?:[%s]*\\{([^{}]*)\\})?" + // Optional tooltip
          "(?:[%s]([^%s\\{\\}\\[\\]][^\\[\\]]*))?" + // Optional label
          END_PART;
  ```
  The Link group is lazy and does NOT exclude `{`/`}`; the tooltip group
  is optional and the label group's first element is REQUIRED
  whitespace. For `http://testLink1.com{dd}sss`, trying tooltip at the
  only `{` position leaves `sss` before the required `]]`/whitespace —
  neither the label branch (needs leading whitespace) nor `END_PART`
  (needs `]]` immediately) can consume it, so that parse dead-ends and
  the lazy Link is forced to keep growing PAST the brace pair, swallowing
  `{dd}sss` whole as literal link text. No tooltip, no separate label —
  `Url`'s label-defaulting ctor falls back to the whole string.
- Before: `CommandCreoleUrl.ts`'s `resolveLabel`/`resolveUrlAndTooltip`
  used `/\{[^}]*\}/g` (global, unconditional) to strip ANY `{...}`
  anywhere in `inner`, with no boundary check — `{dd}` was always
  treated as a tooltip regardless of what followed.
- After: a shared `extractTooltip()` helper using `TOOLTIP_RE =
  /\{([^{}]*)\}(?=\s|$)/` — a `{...}` only counts as the tooltip when
  immediately followed by whitespace or the end of `inner` (end of
  `inner` IS "immediately before `]]`", since `inner` is already
  everything between the delimiters). `resolveLabel` and
  `resolveUrlAndTooltip` both call it, so both read the same rule.
- Row, before → after (`npx tsx scripts/activity-probe.ts --dump
  laxibe-66-teme800`):
  - OURS `href`/label-derived box: `x=96.9125` (href was
    `http://testLink1.comsss`, 4 chars short) → `x=107.5625` (href now
    `http://testLink1.com{dd}sss`, byte-identical to jar).
  - All 11 dumped elements now match the jar exactly (`x` values
    identical to 4 decimal places on every row).
  - `svg:survey activity` verdict: `diverged` → `conformant`.
  - `svg/@href`/label text before: `http://testLink1.comsss`; after:
    `http://testLink1.com{dd}sss` (matches
    `test-results/dot-cache/activity/laxibe-66-teme800/in.svg`'s two
    `href="http://testLink1.com{dd}sss"` occurrences exactly).
- Pinned with a new test: `tests/unit/core/klimt/creole/command
  /CommandCreoleL2.test.ts` — "a {brace} glued to trailing text is not a
  tooltip -- stays literal in the url". The pre-existing adjacent test
  ("an optional {tooltip} block is stripped before label resolution",
  `[[http://www.yahoo.com{This is Dog}]]`, brace immediately followed by
  `]]` i.e. end-of-`inner`) still passes unchanged — confirms the
  boundary rule doesn't regress the clean case.
- `fixtures.md` row updated to `pinned (conformant)`.

### Per-edit all-engine survey (27 engines: `ls tests/oracle/svg-conformance/parity-*.json`)

All runs from `npm run svg:survey -- <engine> --out <dir>/parity-<engine>.json`
per engine, diffed per-slug verdict (not just aggregate counts).

- **Before any edit** (commit `46fd243c5`): captured into
  `T2d-before/parity-*.json` (scratchpad). Baseline probe
  `npx tsx scripts/activity-probe.ts --json ...`: `aggregate=25086`,
  commit `46fd243c`.
- **After edit 1 only** (document-shell.ts + dispatcher.ts, commit
  `2f4c02f05`): measured via a temporary detached worktree at that
  commit (`/tmp/T2d-edit1-only`, symlinked node_modules/oracle/dist/
  tests-corpus per `mkwt.sh`'s own loop, removed after). **Zero verdict
  changes on any of the 27 engines** (`NO_CONFORMANT_LOSS`, zero
  `change`/`LOSS` rows at all) — confirms the plumbing edit is a
  provable no-op: `grep -rn preserveAspectRatio src/diagrams/
  src/core/*.ts src/index.ts` shows no producer sets the new field
  anywhere, so `fragment.preserveAspectRatio ?? DEFAULT_PRESERVE_ASPECT_RATIO`
  always evaluates to the same literal the old hardcoded string did.
  Activity probe: `aggregate=25086` (unchanged).
- **After edit 1 + edit 2** (both edits, current HEAD): **exactly one
  verdict change across all 27 engines** — `activity`:
  `laxibe-66-teme800: diverged -> conformant`. `NO_CONFORMANT_LOSS`
  (zero rows turned FROM conformant TO anything else, on any engine).
  Activity probe: `aggregate=25060` (−26 from 25086), `risers (0)`,
  `fallers (1): laxibe-66-teme800`, `families (67)` (down from 71 —
  4 families fully zeroed out by this one fixture).
- `setecu-78-cuko533`'s own verdict is identical in all three captures:
  `diverged`, `maxDelta: 0`, `firstDiff: svg/@preserveAspectRatio` (as
  expected — no behavior change until the Theme field lands).

### Quality bar

- `npx tsc --noEmit -p tsconfig.json` and `npx tsc --project
  tsconfig.node.json --noEmit` (i.e. `npm run typecheck`): clean.
- `npm run lint` (eslint, repo-wide): clean.
- `tests/oracle/svg-conformance/activity.{diff-baseline,golden}.ratchet
  .test.ts` + `activity.harness-parity.test.ts`: 446/446 passed — the
  67+ pinned activity goldens stayed byte-equal (no re-pin needed, no
  `oracle/**` file touched: `git diff --stat 46fd243c5 HEAD --
  oracle/ tests/oracle/` is empty).
- `tests/unit/core/klimt/**` (80 files): 1215/1215 passed.
- `tests/unit/{activity,description,class,sequence,state}` (405 files):
  6739/6742 passed (3 pre-existing `todo`, none touched by this task).
- No `npm test` / full-suite run (forbidden by the task rules); all
  runs were targeted vitest invocations.

### Files touched

- `src/core/klimt/document-shell.ts` — `ShellFragment.preserveAspectRatio`
  field, `DEFAULT_PRESERVE_ASPECT_RATIO` constant, literal replaced.
- `src/core/dispatcher.ts` — matching `RenderFragment.preserveAspectRatio`
  field (plumbing between Theme and document-shell; no theme/skinparam
  file touched).
- `src/core/klimt/creole/command/CommandCreoleUrl.ts` — `TOOLTIP_RE`,
  `extractTooltip()`, both label/url resolvers rewritten to share it.
- `tests/unit/core/klimt/document-shell.test.ts` — 2 new cases (default,
  override).
- `tests/unit/core/klimt/creole/command/CommandCreoleL2.test.ts` — 1 new
  case (glued-brace boundary).
- `plans/activity-divergence-drive-2/fixtures.md` — both rows updated.

### Not done / why

- setecu-78-cuko533 is not closed — see above. Re-slotted to the owner
  of `src/core/theme.ts` + skinparam key handlers (explicitly outside
  this task's write-set per the brief: "src/core/theme*.ts and
  skinparam handlers are T2c's").
- No other klimt file was touched beyond the two named in D8
  (`document-shell.ts`, `CommandCreoleUrl.ts`) — confirmed by
  `git diff --stat` showing only those two `src/core/klimt/**` files
  plus the non-klimt `dispatcher.ts` plumbing file.
- Did not add the `Theme` field or skinparam handler myself even though
  it would have closed setecu-78-cuko533, per the explicit write-set
  boundary and "never force" rule — flagging it instead, as the
  acceptance criteria's second branch ("or the row is re-slotted with
  mechanism + owning file") permits.
