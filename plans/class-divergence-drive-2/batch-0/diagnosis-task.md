# Diagnosis task skeleton (T1–T5)

The orchestrator builds each diagnosis agent's prompt from THIS file plus
the group's `T<n>-diagnose-<group>.md`. Subagents start blank: pass both
files' full text, not links.

## Context (every group)

plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the canonical spec. Grep
`src/main/java/net/`, never only `net/sourceforge/plantuml/` (misses
`net/atmp/`). The class SVG parity survey compares our `renderSync` output
against cached jar SVGs in `test-results/dot-cache/class/<slug>/`
(`in.puml`, `in.svg`, `svek-N.dot`). The fixtures below are not conformant.
Their group was assigned from diff SIGNATURES only — it is a lead, not a
finding. Your job is to find the mechanism for each fixture, not to
confirm the group.

Read `CLAUDE.md` ("READ THE JAVA FIRST") and `~/.claude/rules/diagnosis.md`
before starting.

## Task

For EVERY fixture listed in your group file:

1. `npx jiti plans/class-divergence-drive/tools/render-diff.mts <slug>` —
   read every `S`/`N` line; `measurements/out/<slug>.{ours,jar}.svg` are
   written for inspection.
2. Find the first element where ours departs from the jar, not where the
   diff count is largest. For a uniform shift, find which element's
   position/ink the shift is keyed off.
3. Open the Java that produces that element: the method body AND the
   constructor that built its inputs. Open our TS counterpart (`@see`
   JSDoc tags point at the Java; `docs/catalog.md` lists modules).
4. Instrument before hypothesising: a throwaway script under
   `plans/class-divergence-drive-2/diagnosis/scratch/` (never committed)
   that prints the actual intermediate values on our side. Where the jar's
   value is needed, derive it from `in.svg`/`svek-N.dot`; to render a NEW
   probe `.puml` with the jar use ONLY `scripts/oracle-render.sh
   <out-dir> <puml>` (never `java -jar` by hand).
5. Write the artifact.

## Artifact (one per fixture, in `diagnosis/<group>.md`)

```
### <slug>
- mechanism-id: <GROUP>-<n>  (shared id when two fixtures share a cause)
- mechanism: one or two sentences
- java: <file:line> (quote the line)
- ts: <file:line> where we diverge
- causal chain: why the observed diff follows
- ruled out: what you eliminated + the evidence
- probe: the command/script and the values it printed
- fix shape: files a fix would touch; whole Java method(s) to port
- owner: this mission | dot-engine (issue draft) | other engine | out-of-mission (why)
- confidence: HIGH (probe-verified) | MEDIUM | LOW
```

Top of the report: a table `mechanism-id | fixtures | files | est. size`,
so T6 can build write-sets from it.

## Boundaries

- Always: quote Java `file:line`; say LOW when a claim is unverified.
- Never: edit `src/`, `tests/`, `oracle/`, or `test-results/`; rebuild the
  oracle cache; fit a value; report a mechanism without a probe as HIGH.
- A fixture you cannot resolve: write what you ruled out and what to
  instrument next. That is a valid artifact; a guess is not.

## Observability · Rollback

N/A — read-only diagnosis, no observable operations. Reversible: the only
artifact is a report file.

## Output

Write `plans/class-divergence-drive-2/diagnosis/<group>.md`. Do NOT
commit — five agents share one checkout; the orchestrator commits each
report (`docs(cdd2-T<n>): diagnose group <group>`) as it arrives.
`render-diff.mts` writes its SVGs under
`plans/class-divergence-drive/measurements/out/` (per slug, no collision
between groups). Return only the summary table — no preamble, no trailing
summary.
