# T4b — exo message labels (E1, E2, E3)

Agent: `typescript-pro` (sonnet), worktree `sdd2-T4b`. Commit:
`fix(sequence): mirror exo label deltas from CommunicationExoTile`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms (research A §2 — all in `sequence-layout-exo.ts`)
- **E1** `CommunicationExoTile.java:122-124`: `textDeltaX = point1 − x1`
  (x1 = border1; right: `point2 − x2`) is computed **before** the circle
  insets (`:137-147`, diamCircle/2 + 2 = 6). The port applies the insets
  in `exoSpan` (`:208-209`) and derives textDeltaX from the inset ends
  (`:223`). dojapu `[o<-o`: −6.
- **E2** `ComponentRoseArrow.java:174-177` adds `getArrowDeltaX()` (10) for
  RIGHT_TO_LEFT_REVERSE **or BOTH_DIRECTION**; direction from
  `ArrowConfiguration.java:181-192` on the config
  `CommunicationExoTile.java:103-104` reverses; base config
  `CommandExoArrowAny.java:88-89,111-130`. Port `:224` adds 10 only for
  direction −1 (misses `[<->`, `[x<->x`, `x->]`). gogise +10.
- **E3** `Display.java:308-310` collapses `\\` to `\` before measuring;
  the port measures `event.label.split('\n')` raw (`:138`) while drawing
  `displayLines` (`text-block-geo.ts:378`). lozuru −3.575.

## Targets
All 18: bacupi, jotase, dojapu, jebole, kapuva, kugati, momuxe, nanoza,
zofeda, fonope, gogise, kevavu, domaji, kivavu, bozuru, texoze, lozuru,
gejeji. Pinned exposure: mocuna, necofe, dugata, kopaxi, jitesa must not
change (research A risk section).

## Write-set
`src/diagrams/sequence/sequence-layout-exo.ts`, its tests.

## Read-set
`research/research-a-text.md` §2; `sequence-layout-exo.ts:120-240`; the
Java above.

## Acceptance
- Given `[o<-o A : x`, then the label is 6 further right than today (test
  citing `CommunicationExoTile.java:122-147`).
- Given `[<-> A : x`, then the head clearance is 10 (test).
- Given a label with `\\`, then its width is measured on the collapsed text
  (test).
- Given the 18 targets, then all are zero-diff or journaled; the 5 pinned
  exo rows do not change.
