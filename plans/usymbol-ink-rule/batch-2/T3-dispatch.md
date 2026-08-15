# T3 — route symbol-drawn classifiers to the walk

## Context

Same project context as `batch-1/T1-baseline-and-family.md`. T1 pinned the
baseline and settled the family; T2 built `symbolInkExtent`. This task is
the dispatch, and it is where output moves.

`addClassifierInk` (`class-ink-box.ts:147-180`) currently ends:

```ts
if (c.kind === 'lollipop') { … return; }
addClassifierBoxInk(box, c);
addVisibilityIconInk(box, c, iconSize);
```

Everything that reaches `addClassifierBoxInk` gets `addRectInk`'s
`(x - 1, y - 1)` corner, including leaves upstream draws as a USymbol.

## Task

Before `addClassifierBoxInk`, consult `symbolInkExtent`. When it returns an
extent, contribute THAT to the ink box and return; when it returns
`undefined`, fall through to today's behaviour unchanged.

Keep the change additive. Every classifier that is not symbol-drawn must
take the identical path it takes now — that is what keeps the blast radius
to the family T1 enumerated rather than every class diagram.

**Leave `usecase` and `lollipop` alone unless you can show routing them
through the walk is byte-identical** (decision D2). Both are jar-verified
with evidence in their doc comments. If the general walk reproduces them
exactly, routing them is a genuine simplification worth taking and worth
recording; if it does not, that is evidence about the WALK, and the finding
goes in the journal rather than being smoothed over by re-baselining them.

Whichever you choose, the existing branches' doc comments must end up
accurate. A comment explaining why `usecase` dispatches away from the box
rule is misleading if the general mechanism now does that for everything.

## Read-set

- `src/diagrams/class/class-ink-box.ts:147-200` — the dispatch and what
  follows it.
- `src/diagrams/class/class-ink-symbol.ts` — T2's `symbolInkExtent`.
- `.agent-notes/usymbol-ink-family.md` — T1's list: which fixtures should
  move and which must not.
- `.agent-notes/class-ink-shared-offset-groups.md` item (b).

## Write-set

- `src/diagrams/class/class-ink-box.ts` (modify)
- its co-located test

## Acceptance criteria

1. Given `cacoma-43-poxu615`, when rendered and compared to jar, then the
   uniform 1.5 offset is **0**.
2. Given `cezaka-60-jado323`, likewise.
3. Given `shape-match-report.ts`, when run, then doc-size-exact is ≥ T1's
   baseline and matched shapes are strictly greater.
4. Given every fixture T1 marked `affected: false`, when rendered, then
   byte-identical to the pre-batch tree.
5. Given the `usecase` and `lollipop` fixtures, when rendered, then
   byte-identical (D2) — whichever implementation path they end up on.
6. Given class DOT-parity, when re-run, then 712/712.

## Quality bar

All four gates exit 0. Every class and object pin holds. Coverage 90/90/90.
The complexity hook BLOCKS on file length 500 / function 30 NLOC / CCN 10 /
5 params — `class-ink-box.ts` is already a split-out module, so check its
length before adding to it and split further if needed (the repo has
precedent: `class-ink-shapes.ts` exists for exactly that reason).

## Boundaries

- **Always:** keep the change additive; cite `file:line`.
- **Ask first:** changing `usecase`/`lollipop` behaviour; any write outside
  the write-set.
- **Never:** run a git command. Never re-baseline a pin to fit the new
  dispatch — a broken pin is a stop condition.
