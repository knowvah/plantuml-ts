# T1 — pin the baseline, and settle what the family is

## Prior observations (read first, do not re-derive)

`.agent-notes/class-ink-shared-offset-groups.md` item **(b)** — the measured
evidence: on `cacoma-43-poxu615` the actor's geo box top is `y = 0`, its
drawn head ellipse top is `y = 0.5`, jar's ink is the union of the drawn
`UEllipse` + `UPath` + label `UText`, and our `y - 1` therefore sits 1.5
above jar's. The same note's item (a) is CLOSED (the namespace mission) and
item (c) is a separate mission — do not work either.

## Context

plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the specification. Class diagrams shell out to real
graphviz, so jar geometry IS a target here.

## Task

Two things, both measurement only.

**1. Re-pin the baseline.** Run `scripts/shape-match-report.ts` and record
the current doc-size-exact count and matched-shape total. The brief quotes
773 / 25695 from `namespace-cluster-box`'s close-out; those are one merge
old and are NOT to be trusted as the baseline. If your measured numbers
differ from them, that is information — report both and say which you are
pinning. **Do not tune anything to reproduce a remembered number**; this
repo has been burned by that specifically (see `namespace-cluster-box`'s
journal, T1).

**2. Settle the family.** Note (b) says "6 cached class fixtures carry
`mix_actor`/`mix_usecase`/`actor`/`usecase`". A stereotype/keyword grep over
`test-results/dot-cache/class/*/in.puml` finds 5:
`cacoma-43-poxu615`, `cezaka-60-jado323`, `class-allowmixing-usecase-mix`,
`class-usecase-inline-img`, `class-usecase-inline-sprite`.

Establish which is right and why. Likely causes to check before concluding:
a sixth fixture using a different keyword form, a fixture whose symbol
arrives via `allowmixing` rather than an explicit keyword, or the note
counting a fixture outside the class cache. **Report the answer with the
enumeration that produced it** — "the note was wrong" and "the grep was
too narrow" are both fine outcomes; an unexplained discrepancy is not.

Then split the family by which ones are affected by the BOX-RULE fallback
specifically. A `usecase` leaf already dispatches to `addEllipseInk`, so a
usecase-only fixture may be unaffected. The mission targets leaves that
currently fall through to `addRectInk`.

## Read-set

- `.agent-notes/class-ink-shared-offset-groups.md` item (b)
- `src/diagrams/class/class-ink-box.ts:147-180` — the dispatch
- `src/diagrams/class/class-ink-shapes.ts:82-95` — `addRectInk`
- `scripts/shape-match-report.ts` — the harness
- `test-results/dot-cache/class/cacoma-43-poxu615/` — the named fixture

## Write-set

- `.agent-notes/usymbol-ink-family.md` (create)

Nothing under `src/`, nothing under `scripts/`.

## Interface contract (consumed by T3)

```
Baseline: { docSizeExact: N, matchedShapes: N, measuredAt: "<commit sha>" }
Family:   [{ slug, symbolKind, currentInkBranch: 'addRectInk' | 'addEllipseInk' | …, affected: boolean }]
```

`currentInkBranch` is what makes this useful to T3: it says which fixtures
should move and which must not.

## Acceptance criteria

1. Given `shape-match-report.ts`, when run, then the note records both
   numbers and the commit they were measured at.
2. Given the family question, when answered, then the note states 5 or 6
   with the enumeration and the reason for the discrepancy.
3. Given each family fixture, when classified, then it is labelled with the
   ink branch it takes TODAY and whether the mission should move it.
4. Given the note, when read by T3, then T3 needs no further enumeration.

## Quality bar

All four gates exit 0 (nothing changed, so this is a confirmation that the
tree was already green). No `src/` writes.

## Boundaries

- **Always:** report measured numbers, never remembered ones.
- **Ask first:** any change under `src/` or `scripts/`.
- **Never:** run a git command. Never adjust a harness to hit an expected
  number.
