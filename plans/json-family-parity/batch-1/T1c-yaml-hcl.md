# T1c — diagnosis ledger: yaml + hcl

Agent: `debugger` (opus, effort high), worktree `jfp-T1c`. Commit:
`docs(jfp): T1c diagnosis ledger`. Read [../task-contract.md](../task-contract.md),
[../decisions.md](../decisions.md) and [diagnosis-method.md](diagnosis-method.md) first.

## Scope
yaml 32 + hcl 2 — the 34 rows of fixtures.md "T1c" (yaml/hcl share json's layout; first check whether each row's mechanism is one T1a/T1b will also see, and say so).

## Task
Produce the ledger per diagnosis-method.md: one row per fixture, a class for
each, the M1+M2 probe residue, the D3 experiment where a row would be called
Smetana or dot-engine, and one section per new mechanism `Mn`.

## Write-set
`plans/json-family-parity/diagnosis/yaml-hcl.md` only. Probe edits under `src/`
and scratch under `diagnosis/scratch/` stay uncommitted (`git checkout -- src`
and delete scratch before committing).

## Read-set
`../fixtures.md` (your rows); diagnosis-method.md step 1 list;
`tests/oracle/layout-parity.ts:1-140`; `tests/oracle/svg-conformance/render-fixture-json.ts`.

## Acceptance
- Given every row in scope, then the ledger has exactly one line for it with a class from the method's set, a mechanism sentence and an origin pair (ours ↔ jar `file:line`).
- Given a row classed `Smetana`, then both D3 equalities are shown with the numbers compared.
- Given a row classed `dot-engine`, then a draft issue with the input DOT and both outputs is in the ledger.
- Given the M1+M2 probe, then every row has a measured probe residue, and `git diff HEAD -- src` is empty in the commit.

Observability: N/A. Rollback: Reversible.
