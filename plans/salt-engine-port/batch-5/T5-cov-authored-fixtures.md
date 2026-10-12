# T5-cov: authored salt fixtures for the corpus's thin spots (maintainer-approved 2026-10-12, journal row 28)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

The 51 cached salt oracles are the work queue **and not a ceiling** (CLAUDE.md "The long tail is
the deliverable"); `~/git/pdiff` holds exactly those 51 and no more (journal row 28). This task
widens the queue with ORIGINAL fixtures where the corpus is thin, each with a jar oracle. No
markup may be copied from any third-party collection — the one surveyed
(`Foadsf/plantuml-salt-examples`) is CC BY-NC-SA 4.0, not MIT-compatible; its *topic list* was
used only as a checklist. Runs after the batch-4 close (the plugin must be registered so every
fixture renders through `renderSync`).

## Task
1. Author one `.puml` per thin spot below under `tests/fixtures/salt/<slug>.puml` (slug: a short
   kebab name, e.g. `include-macro-button.puml`); render its oracle with
   `scripts/oracle-render.sh tests/fixtures/salt/<slug>/ tests/fixtures/salt/<slug>.puml` so the
   pair sits at `tests/fixtures/salt/<slug>/{in.puml,in.svg}` exactly like a dot-cache row (read
   `scripts/oracle-render.sh` and `scripts/capture-oracle-cache.ts` for the layout the harness
   expects; if the survey/ratchet only read `test-results/dot-cache/salt/`, extend
   `render-fixture-salt.ts` + the two ratchet tests to ALSO walk `tests/fixtures/salt/` — a
   second, committed root — and say so).
2. Thin spots (one fixture each unless noted; keep every fixture ≤ 25 lines, one idea per file):
   - `!include` of a shared fragment + a `!procedure` macro that emits a button row (topics 014/015;
     corpus has only `donogu-83`, `tisaje-59`). The include target lives beside the fixture and
     resolves through `tests/helpers/fixture-include-store.ts`.
   - Menu bar with THREE popups (journal row 19: the jar's popup order is nondeterministic — pin
     the fixture only if three consecutive `oracle-render.sh` runs agree; otherwise record the
     orders seen in `.agent-notes/sep-T5-cov.md` and mark the row `jar-flake` in the manifest).
   - Vertical tab bar (`{/` with `isVertical`), and a tab bar inside a `{+` border.
   - Scroll variants: `{S`, `{SI`, `{S-` (`ScrollStrategy.java:42-50`), each with content taller
     than wide.
   - `{^` titled border with creole in the title.
   - A tree table `{T#` with a `|`-separated multi-column row AND a `{T` nested inside `{+`.
   - Pseudo-sprite `<<name>>` defined by a `sprite $name` block with a `{` grid (D4 path through
     `UPixel`, T2g), plus the same sprite twice in one row.
   - A `..`/`==`/`~~`/`--` separator in every column kind (`ElementLine`).
   - The `salt` keyword as the first line inside `@startuml` (`CommandAnything.java:70`,
     "This is not needed anymore." — jar error page; classify per the 2026-10-10 rule and
     `oracle/goldens/stock-error-pages.json`'s shape).
   - A `scale 2` fixture and a `title`+`caption` fixture (D2 chrome through the shared path).
3. Seed each new row into `oracle/goldens/svg-salt/diff-baseline.json` from a fresh measurement
   (status `baseline` with its score, or `error` with a reason); pins stay orchestrator-only.
4. Fix inside your write-set whatever a new fixture reveals in `src/diagrams/salt/**` with a
   stated mechanism + Java quote; anything in `src/core/` is a stop (report, do not edit).

## Write-set
`tests/fixtures/salt/**`, `tests/oracle/svg-conformance/{render-fixture-salt.ts,salt.golden.ratchet.test.ts,salt.diff-baseline.ratchet.test.ts}`,
`oracle/goldens/svg-salt/diff-baseline.json`, `src/diagrams/salt/**` (mechanism-backed fixes only),
`tests/unit/salt/**`, `.agent-notes/sep-T5-cov.md`, `docs/catalog.md`.

## Acceptance
- Given each authored fixture, then a jar oracle exists beside it, rendered by `oracle-render.sh`
  (never a hand-typed `java -jar`), and the diff-baseline manifest has its row.
- Given the extended harness, then the shape test counts dot-cache rows + authored rows exactly.
- Given the batch-5 close, then every authored row is either conformant (pinned at the close) or
  carries a mechanism in `fixtures.md`.

**Observability:** N/A. **Rollback:** Reversible (new files; manifest rows removable).
