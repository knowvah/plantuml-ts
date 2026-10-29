# T1c — diagnosis artifact: json/yaml title chrome offset (D6)

Agent: `debugger` (opus, effort high), worktree `ddc-T1c`. Commit:
`docs(ddc): diagnosis — json/yaml title chrome offset (T1c)`. Writes NO code.
Read [../task-contract.md](../task-contract.md) and `~/.claude/rules/diagnosis.md`.

## Symptom
`planning/next-missions.md` S2b: "json/yaml title chrome offset" — a json
or yaml diagram with `title` (and `caption`/`header`/`footer`/`legend`) has
chrome placed differently from the jar. Reproduce first: author a scratch
`@startjson` with `title Hello` and one with `caption`, render the oracle
with `scripts/oracle-render.sh <ABSOLUTE scratch dir> <puml>`, run
`npx tsx $T/diff-one.mts json <slug>` on the scratch pair (the tool reads
authored roots; copy the pair into `tests/fixtures/json/` locally but do NOT
commit fixtures — T1e owns that directory). State the exact diffs.

## Artifact → `diagnosis/title-chrome.md`
- Mechanism (one or two sentences) and origin `file:line` in ours.
- Causal chain from `JsonDiagram`/`TitledDiagram`/`DiagramChromeFactory`
  (jar: `net/sourceforge/plantuml/jsondiagram/JsonDiagram.java`,
  `core/DiagramChromeFactory.java`, `TextBlockExporter`) to ours
  (`src/diagrams/json/json-diagram-factory.ts`, `src/core/annotations/*`,
  `src/core/TextBlockExporter.ts`).
- Ruled out, with evidence: Smetana geometry (does the offset survive when
  the body dimension is forced equal?), `scale`, the handwritten path.
- Verdict: PORT-CONTROLLED (then the minimal write-set for T2a, naming
  whether a `src/core/` file is involved — stop 14 if a json-only branch
  would be needed) or SMETANA GEOMETRY (then the Java quote that closes the
  item; no T2a).
- Whether yaml shares the mechanism (same `layoutJson`/`renderJson`).

## Write-set
`plans/data-diagram-conformance/diagnosis/title-chrome.md` only.

## Acceptance
- Given the artifact, then it carries all five bullets with `file:line` on both sides and a reproduction command.
- Given the verdict PORT-CONTROLLED, then the proposed write-set is ≤ 3 files and each is named with the lines to change.

Observability: N/A. Rollback: N/A (no code).
