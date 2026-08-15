# T1 — declared-composite-size harness, and the baseline it pins

## Prior observations (read these first, do not re-derive)

- `.agent-notes/class-ink-shared-offset-groups.md` item **(c)** — the
  measured evidence. It already RULED OUT, with evidence, three things you
  must not re-investigate: our emitted DOT is byte-correct against jar's,
  the engine reproduces real graphviz exactly on jar's own DOT, and node
  declaration order is not the cause here.
- `.agent-notes/g7-followup-pin-eligibility.md` — why the SVG census
  under-reports on state composites (it stops recursing at a `childCount`
  mismatch), and why `measure-state-size-deltas.ts` already exits 2 on a
  pre-existing `tumaba-64-tosu281` 1e-6 wobble. **That exit code is not
  yours and not a regression.**

## Context

plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the specification. State diagrams shell out to real
graphviz (via `@knowvah/dot-engine`), so jar's geometry IS a target on this
path — the Smetana carve-out does not apply here.

A state composite is declared to the outer graphviz pass as a plain node
with a `width`/`height` in inches. Jar's cached DOT records exactly what it
declared, which makes an exact, exhaustive, SVG-free oracle available.

## Task

Write `scripts/measure-composite-declared-size.ts`: for every fixture in
`test-results/dot-cache/state/` that carries a composite, compare the
`width`/`height` this port DECLARES for each composite node against the
value in jar's cached `svek-N.dot`, and report per-composite and in total.

The comparison is **exact equality on the emitted inches string**, not a
tolerance. We already emit a 6-decimal inches string
(`graph-layout-build.ts#addNodes`); jar's cached DOT carries the same form.

Capture our declared graph through the existing instrumentation seam,
`setLayoutInputObserver` (`src/core/graph-layout.ts`) — the same seam the
DOT-parity harness uses. Do NOT add a new seam.

Matching a composite to its `shNNNN` id: the ids are assigned per-scope and
this port appends synthetic nodes in a different ORDER than jar (a known,
recorded divergence — see item (c)'s "ruled out" list). So match by
STRUCTURE (scope + shape + the set of declared sizes), not by id equality,
and report any composite you cannot match rather than silently dropping it.
An unmatched composite is a finding.

## Read-set

- `test-results/dot-cache/state/bemena-23-zebu249/svek-2.dot` — the shape of
  the oracle. `sh0012 [shape=rect,style=rounded,label="",width=5.449097,
  height=3.555556,...]` is the composite.
- `src/core/graph-layout.ts` — `setLayoutInputObserver`.
- `scripts/dot-sync-report.ts` — the existing state harness; mirror its
  fixture enumeration and CLI shape rather than inventing another.
- `scripts/measure-state-size-deltas.ts` — the existing size harness; read
  it to see what it does NOT cover (it is backlog-gated).

## Write-set

- `scripts/measure-composite-declared-size.ts` (create)

Nothing under `src/`. This task changes no rendered output.

## Interface contract (consumed by T3/T5 and the close-out)

Per-composite JSON lines plus a summary object:

```
{"fixture":"bemena-23-zebu249","scope":"svek-2","composite":"Configuring",
 "ours":5.456412,"jar":5.449097,"deltaPx":0.527,"axis":"width","match":false}
{"summary":{"fixtures":141,"composites":N,"exact":N,"mismatched":N,"unmatched":N}}
```

`deltaPx` is `(ours - jar) * 72`, signed. Emit `axis` rows for width and
height separately — the note's evidence is a WIDTH delta and the height may
well already be exact; collapsing them would hide that.

## Acceptance criteria

1. Given the three named fixtures, when the harness runs, then each reports
   a width `deltaPx` of **0.527** (± float noise) on its `Configuring`
   composite. Reproducing the note's number is the proof the harness sees
   the right thing.
2. Given the full state cache, when the harness runs, then it reports a
   total over all composite-carrying fixtures with zero `unmatched`.
3. Given a composite whose declared size already equals jar's, when the
   harness runs, then it is counted `exact` and not listed as a mismatch.
4. Given the harness runs twice on an unchanged tree, then the output is
   byte-identical (no clock, no map-iteration nondeterminism).

## Quality bar

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all exit 0.
The script is under `scripts/`, so it may use Node built-ins — the
browser-safety rule binds `src/`, not `scripts/`.

**Do not tune anything to hit 0.527.** The number is a check that the
harness is wired correctly. If it comes out different, report the number
you actually measured and STOP; do not adjust the harness until it agrees.

## Boundaries

- **Always:** cite an upstream `file:line` for any constant.
- **Ask first:** any change under `src/`.
- **Never:** run a git command. The orchestrator commits.
