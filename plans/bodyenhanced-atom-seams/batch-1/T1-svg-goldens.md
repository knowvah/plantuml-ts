# T1 — Author SVG goldens and wire their ratchet

## Context

`oracle/goldens/svg-description/` holds **4** goldens. `oracle/goldens/
description/` holds **352** size goldens. The mission's ADR-1 rewires
`EntityImageDescription`'s text-block construction, which changes RENDERED
output for every description diagram — and the size and DOT ratchets only
watch the SIZER. This task builds the gate that watches the renderer.

## Task

Author SVG goldens from the pinned oracle jar, and a ratchet that fails on
byte drift.

## Scope — three groups, the third needs enumeration

1. **The 11 known-affected fixtures**: the 8 folder/package ones T6's
   routing widened (`bozana-38`, `bozoju-49`, `gucefa-91`, `kanute-77`,
   `lotofa-28`, `sevage-80`, `texacu-57`, `cobuju-30`), plus `bootstrap-0`,
   `ruziru-69-xixo434`, `jecici-56-bimu826`.
2. **S1L-i's 3 titled-separator fixtures** (start from `codabo-50-mupa164`;
   find the others in `plans/s1l-leaf-sizing/ledger.md` § S1L-i).
3. **Existing separator-bearing fixtures** — ENUMERATE these; the list is
   not known. `decorate`'s separator path will change their output too, and
   nothing currently watches them. Grep the description corpus for lines
   that are creole separators (`--`, `==`, `..`, `__` forms, titled and
   untitled). Report the count you found.

## Write-set

- `oracle/goldens/svg-description/<slug>/` — one per fixture
- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts`

## Read-set

- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts` — the
  existing 4-golden ratchet; extend it, do not replace it
- `tests/oracle/svg-conformance/skin.golden.ratchet.test.ts` — the
  byte-exact SVG comparison pattern this project already uses for skins
- `scripts/oracle-corpus.ts#runOracle` — how goldens are generated
- `plans/s1l-leaf-sizing/ledger.md` — § S1L-i for group 2

## Golden generation

```sh
java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> \
     -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <file.puml>
```
Use the PINNED jar in `oracle/dist/`. Do not regenerate the existing 4.

## Acceptance criteria

- Given every in-scope fixture, when rendered by this port today, then its
  SVG matches its jar golden byte-for-byte
- Given the ratchet, when any golden's bytes drift, then it FAILS naming
  the fixture — **verify by perturbing one golden and observing the
  failure, then restoring it.** Report that you saw it fail.
- Given today's code, then the full suite passes: **this task changes no
  behaviour**
- Given group 3, then the enumeration method and the resulting count are
  reported, so the next task knows the true blast radius
- Given a fixture whose current output does NOT match the jar, then it is
  NOT pinned to our wrong value — report it as a pre-existing bug instead

## Observability / Rollback

N/A — this task IS the gate. Reversible: test-and-fixture-only addition.

## Quality bar

All four gates. The three size/DOT ratchets must be untouched — this task
adds goldens, it does not change sizing.
