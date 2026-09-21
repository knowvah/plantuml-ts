# T14 — empty-package double draw + phantom leaf

**Agent:** typescript-pro (sonnet) · **Depends on:** T12

## Context

An empty `package p {}` collapses to a leaf folder, drawn ungrouped (path +
line + text) — the jar does the same, once. This port emits that triple
TWICE, byte-identical (`diagnosis/A2b-entity-groups.md` E9, verified on
`mujopi-30-zadi566`: our output contains the path/line/text followed
immediately by an exactly-equal copy). Upstream creates a PACKAGE group only
when `countChildren > 0` (`net/atmp/CucaDiagram.java:325-337`) — a single
draw either way. The report could NOT localise the TS mechanism ("Not yet
localised on the TS side" — both a `Namespace` and a `Classifier` record
appear to survive the collapse in `class-namespace.ts
#collapseEmptyNamespace` + `renderer.ts`'s leaf loop); confidence is HIGH
for the duplication itself but only MEDIUM for the phantom-leaf half
(`pisobo-93-sipa138`/`cocube-46-tusu692` additionally emit a phantom
`<g class="entity">` for a NON-EMPTY package that is a link endpoint;
`runane-30-vena766`/`vusute-48-xono099` emit an extra `g.entity` for a
cluster-only namespace). This is diagnosis mode: instrument before
proposing a fix; do not guess which pass duplicates.

## Task

1. Instrument first: add temporary tracing (or use existing debug logging)
   around `class-namespace.ts#collapseEmptyNamespace` and `renderer.ts`'s
   leaf-drawing loop for `mujopi-30-zadi566`. Confirm which pass emits the
   duplicate record — walk `state.ast.namespaces` and `state.ast.classifiers`
   after collapse and find the surviving pair that both reference `p1`'s
   collapsed folder.
2. Produce the diagnosis artifact before touching code: mechanism (one or
   two sentences), origin `file:line`, causal chain, what was ruled out.
   Journal it in `.agent-notes/cdd-T14.md` even if the fix is a one-line
   dedup — this is a diagnosis-mode task per `~/.claude/rules/diagnosis.md`.
3. Tests first (once the mechanism is known): a `class-namespace.test.ts` /
   `renderer.test.ts` case for `package p {}` (single draw), one for
   `package p { }` linked from outside as `boo1.boo2 +--- foo1.foo2.foo3`
   where `foo1.foo2.foo3` is non-empty (no phantom leaf — the link must
   resolve to the cluster), and one for a cluster-only namespace with a
   contained leaf that upstream materialises only as the cluster (`runane`/
   `vusute` shape).
4. Fix at the origin: drop the duplicate record at collapse time (render-
   only for the doubling, per the report); for the phantom-leaf half, if
   distinct from the doubling, fix in `parser.ts` (link-endpoint resolution
   should point at the cluster id, not synthesize a leaf).
5. `.agent-notes/cdd-T14.md`: finalize with the confirmed mechanism (not the
   report's provisional MEDIUM-confidence guess) and origin `file:line`.

## Read-set

Java: `net/atmp/CucaDiagram.java:325-337` (group only when
`countChildren > 0`). TS: `src/diagrams/class/class-namespace.ts` (whole,
`collapseEmptyNamespace`); `src/diagrams/class/renderer.ts` (leaf-drawing
loop — search for where a collapsed namespace's leaf triple is emitted);
`src/diagrams/class/parser.ts` (link-endpoint resolution against
`ast.namespaces` vs `ast.classifiers`). Diagnosis: `diagnosis/A2b-entity-
groups.md` E9 (whole section).

## Write-set

`src/diagrams/class/class-namespace.ts`, `src/diagrams/class/renderer.ts`,
`src/diagrams/class/parser.ts`, their `*.test.ts` files,
`.agent-notes/cdd-T14.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Acceptance criteria

- Given `mujopi-30-zadi566`, when rendered, then each collapsed empty
  package (`p1`, `p3`) draws its path/line/text triple exactly once
- Given `pisobo-93-sipa138` / `cocube-46-tusu692`, when rendered, then the
  linked non-empty package `foo1.foo2.foo3` produces no phantom
  `<g class="entity">` (the link resolves to the cluster)
- Given `runane-30-vena766` / `vusute-48-xono099`, when rendered, then no
  extra `g.entity` is emitted for the cluster-only namespace
  (`javax.sound.sampled.AudioFormat`)
- Given the diagnosis artifact in `.agent-notes/cdd-T14.md`, then it names a
  mechanism with `file:line`, not a guess

## Observability

N/A — no new observable operations; parse/render dedup fix only.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npx tsx tools/render-diff.mts mujopi-30-zadi566 pisobo-93-sipa138 cocube-
46-tusu692 runane-30-vena766 vusute-48-xono099` before/after, structural
counts in the commit body. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10,
≤5 params.

## Boundaries

Always: instrument and confirm the mechanism before editing (diagnosis
mode — the report explicitly says it did not localise this). Ask first: any
stop condition in `../README.md`; if the doubling and the phantom-leaf half
turn out to share one root cause, note it and keep the fix scoped to that
shared origin rather than patching both symptom sites. Never: guess a fix
before the artifact is written; edit outside the write-set; touch T12's
files.

## Commit

`fix(cdd-T14): draw a collapsed empty package once, no phantom leaf`

Body: the confirmed mechanism (from `.agent-notes/cdd-T14.md`), since the
report could not localise it — state what instrumentation found.
