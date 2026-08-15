# T1 — excavate the Java: where does jar's extra 1.000 come from?

## Context

plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the specification. This task is a READ. You will write
notes and no source code.

**Read `plans/transition-label-ink/evidence.md` first.** It carries every
measurement and eight eliminated hypotheses, each with its `file:line`.
Re-deriving any of it is wasted work.

The one-line problem: **jar's composite ink is exactly 1.000 wider than the
rightmost thing jar draws.** Its SVG draws to absolute 374.335; its declared
composite width implies 375.335.

## Task

Trace, in the Java, the path from a composite's `IEntityImage` dimension to
the `width=` it declares on its DOT node, and account for the 1.000.

Start at `svek/SvekNode.java` around `:224` (`this.shield =
image.getShield(stringBounder)`) and read what the constructor does with the
image's dimension. Then follow outward: `svek/GroupMakerState.java`,
`svek/GeneralImageBuilder.java`, and whatever emits the node declaration.

Grep **all of** `src/main/java/net/`, never just
`net/sourceforge/plantuml/` — that scope silently misses `net/atmp/`, which
is where `CucaDiagram` lives.

Specific things to establish:

1. Is there a `+1`, a `ceil`, or a rounding between
   `InnerStateAutonom.calculateDimension` and the emitted `width=`? If so
   that IS mechanism (B), and it needs a `file:line`.
2. If there is not: **the premise is wrong.** `evidence.md` derives jar's
   ink as `392.335 − 15 − 20 = 357.335`. Say which of those three terms is
   wrong and why. That is an equally good answer and it closes the mission.
3. Does `TextBlockMemoized.calculateDimension` differ from
   `calculateDimensionSlow` in any way that matters here?

## What NOT to do

- Do not adopt `margin = 21` because it fits (decision D4). It has no
  upstream source. If the only way to make the number land is an uncited
  constant, report that and STOP.
- Do not re-test the eight dead hypotheses in `evidence.md` §5.
- Do not edit anything under `src/`.

## Read-set

- `plans/transition-label-ink/evidence.md` — start here
- `plans/state-composite-inner-canvas/decision-journal.md` — the STOP entry
  that opened this line of work
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java`
  (around `:224`), `.../svek/GroupMakerState.java`,
  `.../svek/GeneralImageBuilder.java`,
  `.../svek/InnerStateAutonom.java`, `.../svek/SvekResult.java`
- `test-results/dot-cache/state/bemena-23-zebu249/` — `in.puml`, `in.svg`,
  `svek-1.dot`, `svek-2.dot`. The `svek-2.dot` line to compare against is
  `sh0012 [shape=rect,style=rounded,label="",width=5.449097,height=3.555556,…]`

## Write-set

- `.agent-notes/transition-label-ink.md` (create)

Nothing else. Not `src/`, not `scripts/`.

## Interface contract (consumed by the checkpoint and T3)

The note must state, explicitly:

```
mechanism:   <one or two sentences>
origin:      <upstream file:line>   OR   "premise wrong: <which term, why>"
port fix:    <the exact file:line in src/ that must change, and to what>
write-set:   <the files T3 needs, to be approved by a human>
confidence:  High | Medium | Low, with what would raise it
```

## Acceptance criteria

1. Given the excavation, when the note is read, then it states either a
   mechanism with an upstream `file:line` or a specific, argued rejection of
   the `ink = 392.335 − 35` premise.
2. Given the note, when T3 reads it, then T3 needs no further Java reading
   to make the change.
3. Given the eight dead hypotheses, when the note is read, then none has
   been re-investigated.
4. Given `git status`, when this task finishes, then only
   `.agent-notes/transition-label-ink.md` is new or modified.

## Quality bar

All four gates still exit 0 (nothing changed, so this confirms the tree was
green). No rendered output moves.

If you instrument to test something, revert every probe before finishing and
verify with `git status`.

## Boundaries

- **Always:** cite `file:line` for every claim about upstream.
- **Ask first:** anything requiring a `src/` change — that is the
  checkpoint, and it is the whole point of this batch.
- **Never:** run a git command. Never adopt a constant that fits but has no
  upstream source.
