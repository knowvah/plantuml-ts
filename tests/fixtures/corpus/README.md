# Pinned corpus fixtures

Six `.puml` files copied verbatim out of `tests/corpus/`, which is gitignored
and regenerable (`python3 scripts/populate-corpus.py`, sourced from
`~/git/pdiff`). CLAUDE.md says not to commit that tree — 4,400+ files of
local reference material — and this does not.

These six are here because unit and integration tests read them **directly**,
so on a clean checkout those tests either failed or silently skipped. CI found
both: `annotations-parsers-a` and `annotations.e2e` failed outright, while the
two `class-newpage-*` files logged a warning and skipped, which is worse —
green with less coverage than it looks.

| fixture | read by |
| --- | --- |
| `class/bajotu-30-soku184.puml` | `tests/unit/annotations-parsers-a.test.ts` |
| `class/A0005_Test.puml` | `tests/integration/annotations.e2e.test.ts` |
| `class/sadamo-18-siva346.puml` | `tests/unit/class/class-newpage-{parser,layout}.test.ts` |
| `sequence/A0001_Test.puml` | `tests/unit/annotations-parsers-a.test.ts` |
| `sequence/buveco-86-tibo673.puml` | `tests/integration/annotations.e2e.test.ts` |
| `state/fuxavu-11-goco024.puml` | `tests/unit/annotations-parsers-a.test.ts` |

Pinned copies rather than a gitignore exception at the original paths: this
directory survives `populate-corpus.py` rebuilding `tests/corpus/`, and keeps
committed content out of a directory whose whole point is that it is
regenerable.

They are upstream fixtures, not synthesized ones — CLAUDE.md's preference for
real corpus inputs still holds. Adding another means copying it here and
pointing the test at this directory, never at `tests/corpus/`.
