# T1d — diagnosis artifact: `#highlight` through duplicated keys (D6)

Agent: `debugger` (opus, effort high), worktree `ddc-T1d`. Commit:
`docs(ddc): diagnosis — highlight paths through duplicated keys (T1d)`.
Writes NO code. Read [../task-contract.md](../task-contract.md) and
`~/.claude/rules/diagnosis.md`.

## Symptom
`planning/next-missions.md` S2b: "highlight paths through duplicated keys" —
a `#highlight "a" / "b"` whose path crosses an object with a repeated key
(json allows it; the jar keeps every pair) highlights a different node than
the jar, or none. Reproduce: scratch `@startjson` with `{"a": {"b": 1},
"a": {"b": 2}}` + `#highlight "a" / "b"`, and the yaml twin; oracle via
`scripts/oracle-render.sh`; `diff-one.mts`. State the exact diffs (highlight
rect present/absent, which row).

## Artifact → `diagnosis/highlight-dup-keys.md`
- Mechanism and origin `file:line` in ours (`src/diagrams/json/JsonObject.ts`,
  `json-layout-prep.ts`, `json-renderer-highlight.ts`, `TextBlockJson.ts`).
- Causal chain from the jar: `SmetanaForJson.upOneLevel` (`:147-155`),
  `Highlighted.upOneLevel`, `TextBlockJson`'s highlighted-row test, and how
  `JsonObject` (the port of `json/JsonObject.java`) stores duplicates.
- Ruled out, with evidence.
- Verdict: PORT-CONTROLLED (minimal write-set for T2b within
  `JsonObject.ts`, `json-layout-prep.ts`, `json-renderer-highlight.ts` — a
  file outside those three is reported, not assumed) or NOT A DEFECT (the
  jar behaves the same; Java quote closes the item).
- Yaml: does `MonomorphToJson` preserve duplicates the same way?

## Write-set
`plans/data-diagram-conformance/diagnosis/highlight-dup-keys.md` only.

## Acceptance
- Given the artifact, then it carries all five bullets with `file:line` on both sides and a reproduction command.
- Given PORT-CONTROLLED, then the proposed write-set names files and lines.

Observability: N/A. Rollback: N/A (no code).
