# T7 — vertical 1px

**Agent:** typescript-pro (sonnet — fully diagnosed) · **Depends on:** T0 · wave 1, parallel with T9, T11 (worktrees).
Prompt = [`fix-task.md`](../fix-task.md) + this file.

## Fixtures

jubobo-22-fapu993, bejeli-39-sina124, gabejo-44-juki791, julixi-10-jide878, rulite-35-muno361, xosiza-60-sobu480, lecelo-92-loma110

## Mechanisms

**R-VP** (probe-verified by cdd2 T17: its temporary `bodyInkHeight` closed
the first six with no rise; lecelo 7→5). Read `plans/class-divergence-drive-2/.agent-notes/cdd2-T17.md`
(artifact 1) and `fixtures.md` rows. When all members are hidden, the body
is `TextBlockUtils.empty(0,0)` (`BodierLikeClassOrObject.java:249-250`) and
reserves nothing; the header blocks stop short of the bottom
(`HeaderLayout.java:98-109`), so the jar's lowest ink is the rect corner at
`y+h-1`; ours is fixed at `y+h` (`class-ink-shapes.ts#addRectInk`).
`headerInkReservation` (`class-classifier-ink-reservation.ts`) already
computes the header's lowest point. Port it as the Y analogue of the
existing reservation model (one model — no ad-hoc flag). Also retires the
disproved R-4 (`absorbLayoutEpsilon`) / R-5 (dot-engine drift) readings for
xosiza/julixi/rulite — state in the commit body whether `absorbLayoutEpsilon`
still changes any outcome (do NOT remove it; D3 owns that).

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-layout-helpers.ts`, `class-geo-builders.ts`, `class-scale-geo.ts`, `class-ink-shapes.ts`, `class-classifier-ink-reservation.ts`, `class-geo-types.ts`, `class-layout-generic-classifier.ts`; tests beside each; `.agent-notes/cdd3-T7.md`.

## Interface contracts

- Interface out (T8 reads it): `MeasuredClassifier.bodyInkHeight?: number`
  and `ClassifierGeo.bodyInkHeight?: number`; absent = today's behaviour.

## Acceptance criteria

- Given the seven fixtures, when rendered, then `svg/@height` and `@viewBox[3]` equal the jar's
- Given a classifier with a shown body, when its ink is walked, then the Y extent is unchanged (byte-identical for every non-hidden-body fixture)
- Given the 607 conformant fixtures, when render-all runs, then none leaves conformant

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
