# Batch 1p — rules every task prompt carries

- Repo: plantuml-ts, a faithful TypeScript port of PlantUML. The Java at
  `~/git/plantuml/src/main/java` is the canonical spec. READ THE JAVA FIRST —
  the method body and the constructor that built its inputs. Every ported
  symbol gets a JSDoc `@see` to its Java origin; every constant cites its
  upstream `file:line`. Never fit a value. Preserve upstream names. Do not
  refactor while porting. Grep `~/git/plantuml/src/main/java/net/`.
- Work ONLY in your worktree `.claude/worktrees/add2-<ID>` (branch `add2/<ID>`).
- Input: `plans/activity-divergence-drive-2/measurements/connection-census.md`
  (§1 rows for your builder, §5 implementation notes) and `decisions.md` D12.
- Each Java `Connection*` you port: in a comment at the push site, record the
  Java class, file:line and its `MergeStrategy` (default FULL, or the
  `withMerge(...)` value) — T1b wires `mergeable` from these; do NOT add a
  `mergeable` field yourself.
- Oracle: `scripts/oracle-render.sh <out-dir> <puml>` only (deterministic
  text). Corpus fixtures: `test-results/dot-cache/activity/<slug>/{in.puml,in.svg}`.
  Where the corpus has no fixture, author minimal `.puml` files in
  `tests/fixtures/activity/<ID>/` and commit the jar SVG beside each; a test
  asserts our render against it (element geometry for the connectors you
  ported; `compareSvg`/`weightedScore` from
  `tests/oracle/svg-conformance/compare.ts` where whole-diagram parity holds).
  Do NOT add files to the gated corpus or `oracle/goldens/**`.
- Measure: `npx tsx scripts/activity-probe.ts --json <scratch>` before/after;
  report every baseline row whose ws moved, with mechanism. A pinned golden
  must stay byte-equal (`tests/oracle/svg-conformance/activity.golden.ratchet.test.ts`).
- Quality bar: targeted vitest (`tests/diagrams/activity`, `tests/unit/activity`
  as they exist, your new tests, `activity.golden.ratchet`, the activity
  diff-baseline test, `activity.harness-parity`), `npm run typecheck`,
  `npx eslint <files>`. Files <= 500 lines, functions <= 30 NLOC / CCN <= 10 /
  <= 5 params (a hook blocks violations; split helpers into new files).
- Never: Serena MCP tools, `git stash`, edits outside your write-set (stop and
  report instead), edits under `src/core/klimt/**`, pushes. Scratch files
  carry your task ID.
- Commits: Conventional Commits, lines <= 80, no attribution footer, one
  commit per mechanism (`feat(activity): ...`), each green.
- Return only: commits, the Java classes ported (file:line → our file:line),
  fixtures added, probe Σ before/after with every moved row + mechanism,
  anything you could not do and why. No preamble.
