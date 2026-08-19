# T2 — Description `AtomOps`: altitude + muted font

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `feat/creole-exposant-port`.
Description/component/usecase (and every klimt `SheetBlock1` consumer —
`BodyEnhanced2`, `EmbeddedDiagram`, `leaf-sizing-folder-title`) run the REAL
`Sea`/`SheetBlock1` pipeline. Its `AtomOps` (`Sea.ts:27-31`) has two
implementations: `EntityImageDescriptionDelegates.ts#descAtomOps` (`:160-200`,
doc at `:129-147` says altitude is 0 "because this port has no FontPosition")
and `leaf-sizing-folder-title.ts:140-160`. T1 added `FontConfiguration.fontPosition`,
`getFont`, `getSpace` — read T1's journal row for the final names. Read
`decisions.md` D1/D2/D7, CLAUDE.md.

## Task
1. Both `AtomOps`: `getStartingAltitude` returns `getSpace(atom.font)` for
   `kind==='text'` (`AtomText.java:321-323`), 0 otherwise as today;
   `calculateDimension` measures text with `getFont(atom.font)`; `drawU`
   draws with `getFont` and baseline `height − descent` measured with the
   muted font (`AtomText.java:213-215`; the altitude comes from `Sea`, do NOT
   add `getSpace` again — D2).
2. Rewrite the `:129-147` doc comment to what is now true.
3. Ratchets/goldens for T0's usecase fixture; verify with a probe that its
   declared node sizes match `svek-N.dot`.
TDD: extend the description unit tests with the usecase fixture's `in.puml`
(paired: measured dim == drawn font-size/y).

## Write-set
As in the batch overview.

## Read-set
T1 journal row; `EntityImageDescriptionDelegates.ts:120-210`;
`leaf-sizing-folder-title.ts:130-170`; `src/core/klimt/creole/Sea.ts:60-131`;
Java `klimt/creole/Sea.java:60-80`, `klimt/creole/legacy/AtomText.java:197-233,
321-323`.

## Acceptance
- Given a text atom with EXPOSANT, when `getStartingAltitude`, then −6 (INDICE +3; NORMAL/inline/emoji 0).
- Given the usecase fixture, then declared sizes match `svek-N.dot`; its backlog pin is removed; description parity ratchet (`tests/oracle/description-parity.ratchet.test.ts`) unchanged or better.
- Given NORMAL-only description fixtures, then none moves in `render-manifest`.
- Given `harness-diff.py`, then 0 rows appeared or grew.

## Observability / Rollback
Manifest + description parity. Reversible.

## Report (≤400 tokens)
Both impls' changes; usecase fixture rows; manifest moves.
