# T0c: jar probes

Return only the structured report: commit sha(s), files changed, per-check or per-fixture
before → after, residuals with mechanisms (Java + port `file:line`), write-set extensions,
test counts (collected files). No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(`src/main/java/net/sourceforge/plantuml/`) is the specification. Read `CLAUDE.md` first
("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting", "Preserve
upstream names"). The oracle is the 1.2026.8beta1 jar (`oracle/dist/plantuml-oracle.jar`);
mindmap goldens are cached at `test-results/dot-cache/mindmap/<slug>/in.svg`. Render new
oracles only via `scripts/oracle-render.sh <out-dir> <puml>`. Jar values for tests come
from the T0c probes (`plans/mindmap-engine-port/tools/probe/`), never from guesses.
Brief: `plans/mindmap-engine-port/` (README, decisions.md D1–D12).

## Task
Build Java probes compiled against the oracle jar (the cdd6 T3f `Probe.java` precedent),
with a runner script:
1. `StyleProbe`: input = style text (skin + `<style>`), a skin name, and a signature
   spec (SName list, stereotypes, level, star, deltaPriority); output = every `PName`
   value of `StyleBuilder.getMergedStyle` / `getMergedStyleSpecial`, one `name=value`
   line each (`StyleBuilder.java:86-160`).
2. `LayoutProbe`: input = a `.puml` mindmap; output per node: label, level, direction,
   phalanx dim, `getX12`, `SymetricalTee` values, the Tetris element y's, and each
   node's absolute translation (`FingerImpl.java` whole, `MindMap.java:63-112`).
   Obtain positions through the public API (`SourceStringReader` → `MindMapDiagram`)
   and reflection where fields are private; do not modify the jar.
3. `run-probe.sh <Probe> <args>`: compile (javac -cp jar) into `tools/probe/out/`, run
   with `-DPLANTUML_DETERMINISTIC_TEXT=true` (as `scripts/oracle-render.sh` does).
4. A `README.md` with 3 worked examples whose outputs are pasted from real runs.

## Write-set
`plans/mindmap-engine-port/tools/probe/**` (Java sources, runner, README). No `src/`.

## Read-set
`scripts/oracle-render.sh`; `~/git/plantuml/.../style/StyleBuilder.java:86-160`,
`mindmap/FingerImpl.java`, `mindmap/MindMap.java:63-152`, `mindmap/Idea.java:65-111`.

## Acceptance
- Given a style snippet and a signature, then `StyleProbe` prints the merged style.
- Given mindmap source, then `LayoutProbe` prints each node's size and translation.
- Given `-DPLANTUML_DETERMINISTIC_TEXT=true`, then text sizes match the cached goldens
  (check one fixture's root box against its `in.svg`).

## Architecture decisions (locked)
D8 (probes back every test value), D10.

## Quality bar
Each probe runs from a clean checkout via `run-probe.sh`; README outputs are real.

## Boundaries
- Always: quote the Java before claiming parity; `@see` the Java origin on every ported
  symbol and a `file:line` on every constant; keep upstream names.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move or a small unported helper on this path that no other task owns),
  or Java that contradicts the stated mechanism or a D-decision.
- Never: fit a value, touch the oracle jar/cache, dot-engine or the fork, push, edit the
  flat `StyleMap` or any existing engine's style resolution.

## Commit
`chore(mindmap): add jar style and layout probes`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
