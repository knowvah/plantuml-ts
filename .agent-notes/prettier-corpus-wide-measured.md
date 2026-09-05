# Corpus-wide Prettier: measured, and why it was not run

2026-09-05. Prettier is now adopted, but **scoped to staged files** via
husky + lint-staged. A whole-repo `--write` was measured first and argued
against itself. The numbers are here so the decision does not have to be
re-derived.

## What a corpus-wide run would do

| scope | files | rewritten |
|---|---|---|
| everything tracked (`.ts .tsx .mjs .js .json .md`) | 4,257 | **2,982** |
| code only, after ignoring prose/generated | 1,881 | **1,153** |

Code-only churn: **45,160 changed lines across 1,153 files.**

## The blocker: it breaks this repo's own 500-line file cap

`hooks/check-complexity.py` blocks any Write/Edit to a file over 500 lines.
Prettier **adds** lines here — the codebase is hand-wrapped tighter than
Prettier's output — so a corpus-wide run pushes files across that cap and
makes them **un-editable by the very hook this repo enforces**. Measured
across the 1,150 code files that would change:

| printWidth | files crossing 500 | files that grow |
|---|---|---|
| 100 | **38** | 912 |
| 120 | **15** | 355 |
| 140 | **10** | 184 |

Widening does not fix it. The residue at 140 is irreducible: they are data
tables (`openiconic-glyphs-data.ts` 295 -> 614 at width 100,
`themes-builtin-p-v.ts`, `skinparam-key-handlers.ts` 450 -> 716) that
Prettier explodes one entry per line by design.

Every way out is worse than not doing it:

- **`hooks/complexity-ignore`** — its own header says it is for "code we port
  but do not own", "not for silencing an inconvenient limit in code we do
  own". Ten of our own files is exactly that.
- **Split the ten** — real refactoring of untouched files, against CLAUDE.md's
  "do not refactor while porting".
- **Raise the cap** — changes a project-wide quality budget to accommodate a
  formatter.

## The second cost, already flagged

1,153 files reformatted destroys `git blame` line provenance in a port whose
comments carry upstream `file:line` citations, and whose review discipline
leans on knowing which commit last touched a line.

## What was done instead

`lint-staged` formats only what you stage. Files get formatted as they are
touched, so the ten problem files are simply never reformatted until someone
edits one — at which point it is one file's problem, visible in that commit,
rather than ten landmines planted at once.

Config was measured against the tree, not defaulted: `singleQuote` (13,363
single-quote chars vs 2,905 double), `semi`, `trailingComma: all`,
`printWidth: 120` (the repo's own p95 line length is 82, p99 109).

Prose is ignored outright (`.agent-notes/`, `plans/`, `docs/`, `findings/`,
`planning/`, `*.md`): those documents are hand-wrapped, full of
alignment-sensitive tables and fenced PlantUML, and reflowing them is pure
churn. So are the vendored payloads and every pinned oracle JSON — Prettier
touching a gated measurement file would BE a re-pin.

## If you do want the corpus-wide run later

Do it as its own commit touching nothing else, at width 140 to minimise the
residue, and resolve the ten cap-crossers deliberately in the same change.
Do not let it ride along with feature work.
