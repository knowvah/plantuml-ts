# T3 — One `<text>` per label line

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-element-granularity`. A faithful TypeScript port of PlantUML;
the Java at `~/git/plantuml` is the **canonical specification**. T1 and T2
have landed.

The jar emits **one `<text>` per line** of a multi-line label. Verified on
`boxoto-53-sifo232`:

```
JAR : <text x="342.35" y="139.333" font-size="12" textLength="157.35">Efficitur nibh vel, tempus magna
      <text x="342.35" y="151.333" font-size="12" textLength="118.65">Integer cursus erat nulla
OURS: <text …><tspan x="465.144" y="147.68">Efficitur nibh vel, tempus magna</tspan>
                <tspan x="465.144" y="167.28">Integer cursus erat nulla</tspan>
```

Across the corpus: `text` 1393 ours v 1915 jar.

## THIS TASK MAY HALT — read before starting
The jar's two lines above sit **12 apart at `font-size="12"`** — advance
equals font size. That is **one fixture**, and our font size differs (14), so
a coincidence is entirely plausible.

**You must locate the per-line advance in upstream's text-block layout and
cite it as `File.java:line`. If you cannot, HALT and report** ([D4],
user-confirmed). Never fit a value — especially not one that shrinks the
error. Grep `~/git/plantuml/src/main/java/net/`, never just
`net/sourceforge/plantuml/`; that scope misses `net/atmp/`, `gen/`,
`smetana/`. Start from how a `TextBlock` stacks `UText` lines.

Halting here is an accepted outcome. T1 and T2 stand on their own.

## Task
Split multi-line labels into one `<text>` element per line, at the label call
sites in `src/diagrams/activity/renderer.ts` (`:80`, `:91`, `:166`) and
`src/diagrams/activity/activity-renderer-shapes.ts` (`:177`, `:191`, `:351`).

**The split is per LINE, not per span** ([D3]). A single line carrying creole
markup still emits ONE `<text>` with `<tspan>` children — `tspan` is core
creole serialisation (`src/core/creole-svg.ts`), shared with sequence, and
inline styling legitimately produces one. `creole-svg.ts` is not in your
write-set.

**Do not** change font size. Ours 14 vs the jar's 12 is a theme default, out
of scope ([D5]) — changing it would move every fixture for an unrelated
reason and make this task's effect unattributable.

## Write-set
- `src/diagrams/activity/renderer.ts`
- `src/diagrams/activity/activity-renderer-shapes.ts`
- `tests/unit/activity/renderer.test.ts` (+ a shapes suite if T2 added one)

**Not** `src/core/creole-svg.ts`, `src/core/svg-shapes.ts`, or any theme file.

## Read-set
- `plans/activity-element-granularity/decisions.md` — D3, D4, D5
- the six label call sites listed above
- `src/core/creole-svg.ts` — what a `<tspan>` legitimately is
- `test-results/dot-cache/activity/boxoto-53-sifo232/in.svg` — the jar's shape
- `~/git/plantuml/src/main/java/net/` — the text-block line advance

## Architecture decisions
[D3] split per line, keep creole tspans within a line · [D4] cite the advance
or HALT · [D5] font size is out of scope.

## Interface contracts
None consumed downstream.

## Acceptance criteria
- Given an N-line label, when rendered, then N `<text>` elements are emitted.
- Given a single line carrying creole markup, then ONE `<text>` with
  `<tspan>` children — the split is per line, not per span.
- Given the y advance used, then the code comment carries an upstream
  `File.java:line` citation; absent one, the task HALTED instead.
- Given `src/core/creole-svg.ts` and every theme file, then `git diff` shows
  them unchanged.
- Given the ratchet, then no fixture's `weightedScore` rises.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** Six call sites across two files.

## Quality bar
All four gates green, `Test Files` **683**. Complexity hook enforced.

## Commit
`feat(aeg-T3): emit one text element per activity label line`

Body: the upstream citation for the advance, and that the split is per line
rather than per span.
