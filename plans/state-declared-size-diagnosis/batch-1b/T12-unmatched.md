# T12 — unmatched (scope-count mismatch)

## Context
As T1–T10. Harness rows `{"fixture":…,"unmatched":true}` mean OUR svek scope
count ≠ the jar's (`svek-N.dot` files), so nothing paired.

## Slice
`cagego-53-vemo516`, `fugedo-34-fice721`, `xacona-99-peze211`, `zecivu-62-pagu681`

## Task
For each: count jar `svek-N.dot` files vs our observed `DotInputGraph`s;
determine why (extra/missing composite graph, a scope the jar renders as a
plain node, an error diagram, an unported construct). Java:
`svek/GeneralImageBuilder.java`/`CucaDiagramFileMakerSvek` scope creation,
`statediagram/StateDiagram.java`. Record per SCHEMA with `rows` = "n/a
(unmatched: ours K scopes vs jar J)". Also state whether the harness COULD pair
a subset (feed T13).

## Write-set
`findings/unmatched.md` ONLY.

## Acceptance
- Given the 4 fixtures, then each record names the scope-count cause with `originFileLine` + `javaRef`.

## Observability / Rollback
N/A. Reversible.
