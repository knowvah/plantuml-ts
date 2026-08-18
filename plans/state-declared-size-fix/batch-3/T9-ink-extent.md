# T9 — F8: RoundedSouth south-cap ink (G5) + self-loop arrowhead ink (G6)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
Two SI28-closed mechanisms in `src/diagrams/state/layout-ink-extent.ts`:
- G5 (`findings/composite-b.md` pacami/tofezi/xojudi, `composite-a.md`
  decede-10): `addNodeInk`'s composite dispatch (`:305-321`) folds only the
  outer `URectangle` (inset −1, `RoundedContainer.java:89-92`,
  `LimitFinder.java:184-188`) and misses the SEPARATE `RoundedSouth` south-cap
  `UPath` (`RoundedSouth.java:65-83`) whose `LimitFinder#drawUPath` walk
  (`LimitFinder.java:159-162`, no inset) reaches 1 px lower:
  `115 = C.height(99) + 1 + INK_DELTA 15`.
- G6 (pebepi/taxile/tigibi): `includeArrowheadInk: false` at `:522` excludes
  the self-loop's arrowhead ink; jar includes it — union of
  `transitionArrowheadInk` gives 85.338 vs jar 85.34. The doc comment at
  `:82-85` describes an over-reach (~30 px) SI28 could NOT reproduce.
Read both records, `SYNTHESIS.md` §1 G5/G6, `decisions.md` D5/D8, CLAUDE.md
("Never fit a value" — the +1 must be the south-cap path, cited, not a constant).

## Task
1. G5: fold the south-cap path ink for rounded composites exactly as
   `LimitFinder` walks it (port the path shape or its bounding contribution
   with the Java cited); confirm X is unaffected (divider already reaches the
   uninset edge).
2. G6: include the self-loop arrowhead ink (jar's `SvekEdge`/`ExtremityArrow`
   → `LimitFinder` — cite lines). If the old over-reach reappears on some
   other shape in the corpus, STOP and journal (that would be the real bug the
   comment named); otherwise rewrite the `:82-85` comment to what is now
   proven.
3. Ratchets for the seven fixtures; harness on them; `render-manifest --diff`
   for collateral (list rounded/self-loop composites that move, jar-ward).
TDD: `tests/unit/state/layout-ink-extent.test.ts` with pacami and pebepi
`in.puml` asserting the composite declared height/width against `svek-N.dot`.

## Write-set
`src/diagrams/state/layout-ink-extent.ts`, `tests/unit/state/layout-ink-extent.test.ts`,
ratchet entries.

## Read-set
Records above; `layout-ink-extent.ts:60-120, 290-330, 500-530`; Java
`svek/image/RoundedSouth.java`, `RoundedContainer.java:60-110`,
`klimt/LimitFinder.java:150-195`, `svek/SvekEdge.java`, `svek/extremity/ExtremityArrow.java`.

## Acceptance
- Given a rounded composite, then the south-cap ink is folded (`RoundedSouth.java:65-83`); pacami/tofezi/xojudi/decede rows exact.
- Given a self-loop transition, then arrowhead ink is included; pebepi/taxile/tigibi rows exact.
- Given `harness-diff.py`, then 0 rows appeared or grew; `render-manifest --diff` moves listed and jar-ward.

## Observability / Rollback
Harness rows. Reversible.

## Report (≤500 tokens)
Rows per fixture; the `:82-85` comment outcome; manifest moves.
