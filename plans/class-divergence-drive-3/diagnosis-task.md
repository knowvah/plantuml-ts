# Diagnosis task skeleton (T1–T5)

The orchestrator builds each diagnosis agent's prompt from THIS file plus
the group's task file (pass both in full; subagents start blank).

## Context

plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the canonical spec (grep
`src/main/java/net/`, never only `net/sourceforge/plantuml/`). The class SVG
survey compares our `renderSync` output with cached jar SVGs in
`test-results/dot-cache/class/<slug>/` (`in.puml`, `in.svg`, `svek-N.dot` =
the DOT the jar fed to graphviz). Read `CLAUDE.md` ("READ THE JAVA FIRST")
and `~/.claude/rules/diagnosis.md`. The `prior` column in `fixtures.md` is
a lead, never a finding: two prior dot-engine attributions and three
prior canvas attributions were disproved by measurement.

## Task, per fixture

1. `npx jiti plans/class-divergence-drive/tools/render-diff.mts <slug>`;
   read every S/N line (`<slug>.{ours,jar}.svg` land in
   `plans/class-divergence-drive/measurements/out/`).
2. Find the FIRST element where ours departs; for a uniform shift, the
   element whose position/ink the shift is keyed off.
3. Open the Java that produces it — method body AND the constructor of its
   inputs — and our TS counterpart (`@see` tags; `docs/catalog.md`).
4. Instrument before hypothesising: a throwaway script under
   `plans/class-divergence-drive-3/diagnosis/scratch/` (gitignored). A new
   jar render only via `scripts/oracle-render.sh <out-dir> <puml>`.
5. **Mandatory probes (D5):** naming `@knowvah/dot-engine` requires
   running real `dot -Tdot` (`/opt/homebrew/bin/dot`) on the cached
   `svek-N.dot` and comparing its `pos=` with dot-engine's raw layout
   points (they agree up to a constant frame offset when the engines
   agree; `plans/class-divergence-drive-2/diagnosis/scratch/raw-edges.mts`
   is a reusable probe). Naming a canvas/ink term requires computing our
   pre-truncation extent and the jar's implied extent. Remember the jar
   reads node positions from 2-dp `-Tsvg` text (D3).

## Artifact (per fixture, in `diagnosis/<file>.md`)

```
### <slug>
- mechanism-id: <GROUP>-<n>  (shared id when fixtures share a cause)
- mechanism: one or two sentences
- java: <file:line> (quote the line)
- ts: <file:line> where we diverge
- causal chain: why the observed diff follows
- ruled out: what you eliminated + the evidence
- probe: command/script and the values it printed
- fix shape: files a fix would touch; whole Java method(s) to port
- owner: this mission | dot-engine (issue draft) | proposed-accept (evidence)
- confidence: HIGH (probe-verified) | MEDIUM | LOW
```

Top of the report: `mechanism-id | fixtures | files | est. size`.

## Boundaries

Always quote Java `file:line`; say LOW when unverified. Never edit `src/`,
`tests/`, `oracle/`, `test-results/`; never rebuild the cache; never fit a
value; never report HIGH without a probe. An unresolved fixture gets what
was ruled out + what to instrument next — a valid artifact; a guess is not.
Do NOT commit: sibling agents share the checkout; the orchestrator commits
each report. Return only the summary table plus one line per unresolved
fixture.

## Observability · Rollback

N/A — read-only diagnosis. Reversible: the only artifact is a report file.
