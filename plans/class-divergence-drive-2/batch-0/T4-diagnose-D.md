# T4 — diagnose group D (dotted-name namespaces)

**Agent:** debugger · **Depends on:** T0 · parallel with T1–T3, T5.
Prompt = [`diagnosis-task.md`](diagnosis-task.md) + this file.

## Fixtures (4)

bejusa-95-gafo325, runane-30-vena766, vusute-48-xono099, pisobo-93-sipa138

## Measured signatures

0 structural. bejusa 4 numerics, runane/vusute 7, pisobo 2 — all Δ20.0
(vusute: one edge `path/@d` + its arrowhead polygon shifted 19.998 px in
one axis). Sources use dotted names that create packages implicitly or
name a package and a class the same:

- runane: `net.sourceforge.mazix.components.sound.AudioManager ..>
  javax.sound.sampled.AudioFormat.Encoding`
- pisobo: `package boo1.boo2 {}` ... `boo1.boo2 +--- foo1.foo2.foo3`
  (a link between two packages)
- bejusa: `package PCAN_DRV { ... class PCAN_DRV }` + nested packages
  sharing class names, links into them

## Leads, not findings

Twenty px is a round number: look for a constant, not arithmetic drift.
Candidates to rule in or out with a probe: the edge endpoint on a
cluster (package-to-package link → `lhead`/`ltail` handling), the
implicit-package creation path (`net/atmp/CucaDiagram.java`, the
namespace-separator logic), and which node the edge actually attaches to
in `svek-N.dot` versus our DOT.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible — see [`diagnosis-task.md`](diagnosis-task.md).
