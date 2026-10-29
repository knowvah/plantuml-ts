# T2b — `#highlight` through duplicated keys fix (D6; only if T1d says PORT-CONTROLLED)

Agent: `typescript-pro` (sonnet), worktree `ddc-T2b`. Commit:
`fix(json): <mechanism from diagnosis/highlight-dup-keys.md> (T2b)`.
Read [../task-contract.md](../task-contract.md) and
`diagnosis/highlight-dup-keys.md` first — the artifact is the spec.

## Write-set
`src/diagrams/json/JsonObject.ts`, `src/diagrams/json/json-layout-prep.ts`,
`src/diagrams/json/json-renderer-highlight.ts`,
`tests/unit/json/JsonObject.test.ts`, `tests/unit/json/highlight-dup-keys.test.ts`.
A file outside these is stop 1 (T2d owns the rest of the family).

## Acceptance
- Given the T1e `duplicate-keys` and `highlight-nested` fixtures plus the artifact's reproduction, when `diff-one.mts --structural` runs, then the highlight rect count and rows match the jar (0 structural diffs).
- Given `JsonObject` with repeated keys, when iterated, then every pair is kept in source order (`json/JsonObject.java` — cite the lines).
- Pinned json/yaml/hcl goldens byte-equal; structural manifest unchanged.

Observability: N/A. Rollback: Reversible.
