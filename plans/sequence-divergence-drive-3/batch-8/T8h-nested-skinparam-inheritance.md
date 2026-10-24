# T8h — a nested `{{ }}` diagram inherits the enclosing skinparams

Agent: `typescript-pro` (sonnet), worktree `sdd3-T8h`. Commit:
`fix(core): nested diagrams inherit the enclosing skinparams`.
Read [../task-contract.md](../task-contract.md) first, then
[../diagnosis/handwritten.md](../diagnosis/handwritten.md) F5 and the
per-target table (menoke). Spawned by journal row 94 (user ruling,
D5 Amendment 1 bundle); runs after T8f.

## Mechanism (T8a, HIGH)
`TitledDiagram.java:106-118` copies every skinparam of the enclosing
diagram into the nested one built for `{{ … }}`, so menoke's nested note
is drawn handwritten in the jar (the golden's decoded payload carries
jiggled `<polygon>`/`<path>`; trace ids 86 = the nested diagram's note on a
second root decorator). The port's nested render goes through
`renderSync(source, options)` and drops the skinparam argument
(`src/index.ts:322`; `EmbeddedDiagram.render(source, skinParam)`'s argument
is not forwarded). compareSvg exempts image href bytes, so the gates cannot
see it; the decoded payload is the witness.

## Targets
menoke-22-luxo044's nested payload: decoded, canonically equal to the
golden's decoded payload (byte test in the unit suite). No classify/survey
movement (exempt bytes). Any other corpus row with a `{{ }}` diagram whose
enclosing diagram sets a skinparam the nested one lacks today moves toward
the jar — enumerate them (grep `{{` in every engine's corpus) and explain
each mover.

## Write-set
The nested-render seam only: `src/index.ts` (the `{{ }}` render call),
`src/core/EmbeddedDiagram.ts` (or wherever the nested options are built),
the skinparam carrier type if one is needed (internal), tests
(`tests/unit/core/embedded-*.test.ts`), `docs/catalog.md`. Anything else =
stop 1. No public API change (stop 10).

## Read-set
`TitledDiagram.java:100-125`; `EmbeddedDiagram.java`; `src/index.ts:300-340`;
`src/core/EmbeddedDiagram.ts`; `src/core/skinparam*.ts` (how the merged
map reaches a theme); `diagnosis/handwritten.md` F5 and
`diagnosis/handwritten-stripped/menoke-22-luxo044/`.

## Gates
- Tests first: menoke's decoded nested payload equals the golden's decoded
  payload canonically (quote `TitledDiagram.java:106-118`); a nested diagram
  without `handwritten` is unchanged.
- `--canon-all` vs the pre-move snapshot: movers = exactly the rows whose
  nested diagram inherits a skinparam it lacked, each explained; raw
  `--all` likewise; golden ratchet green; classify 0 moved (exempt bytes —
  say so).
- Typecheck, eslint, prettier, `vitest run tests/unit/core
  tests/unit/sequence tests/architecture`, build, catalog.

## Acceptance
- Given menoke, then the nested payload is the jar's (decoded, canonical).
- Given every other engine, then no row changes except explained
  inheritance movers.

Observability: N/A. Rollback: Reversible.
