# T5 — F6: dotted-id display (G10) + G24 guards (D2)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
Three SI28 records, all in `src/diagrams/state/state-parse-resolve.ts`:
- G10 (`findings/other.md` fovafu-44#a, tubojo-49): `state B.A.X` without `as`
  defaults the throwaway declaration's display to the full dotted id and
  `applyDeclaredContent` (`:379`) overwrites the split leaf's short display
  "X" (jar: `CommandCreateState.java:181-183`, `quark.getName()` post-split).
- G24 (`findings/unmatched.md`, RULED): port `StateDiagram#checkConcurrentStateOk`
  (`StateDiagram.java:70-90`) into `ensureState` (`:358-363`) — cagego-53,
  xacona-99, zecivu-62; and `CommandLinkStateCommon.java:277-278`'s
  `parent.getData()==null` gate after `resolveOrCreateDottedPath` (`:153`) —
  fugedo-34 (we currently build AND draw the same phantom `Quark#child`
  builds). On failure throw `DiagramRefusal` (`src/core/error/error-diagrams.ts`)
  at the offending line so `errorSvg` renders — `decisions.md#D2` (locked):
  our error names STATE at the real line; the jar's `mergeV2` banner may differ.
Read the three records, `decisions.md`, `.agent-notes/si28-state-declared-size-observations.md`,
and the Java bodies (all of `CommandLinkStateCommon.java:250-300`,
`StateDiagram.java:60-95`, `CommandCreateState.java:150-200`, `net/atmp/CucaDiagram.java:245-290`).

## Task
1. G10 fix; verify with a probe that our SVG shows `X` not `B.A.X`.
2. Both guards; verify with a probe that cagego/xacona/zecivu/fugedo produce
   an error SVG at the right line and no phantom nodes; the four stay
   `unmatched` in the harness (0 dot both sides — do NOT try to make them pair).
3. Ratchets: tighten fovafu-44/tubojo-49 (fovafu #b rows belong to Batch 5 —
   leave, journal). Check `tests/unit/state/state-dotted-id.test.ts` and
   `tests/integration/state.test.ts` for tests that assert the OLD lenient
   behaviour and update them with the Java citation.
TDD first: `state-dotted-id.test.ts` (G10), new `state-guards.test.ts`.

## Write-set
`src/diagrams/state/state-parse-resolve.ts`, `state-parse-helpers.ts`,
`tests/unit/state/state-dotted-id.test.ts`, `tests/unit/state/state-guards.test.ts`,
`tests/integration/state.test.ts` (only if an existing assertion pins the old
behaviour), ratchet entries.

## Acceptance
- Given `state B.A.X`, then the leaf display is `X`; fovafu-44 (#a rows) and tubojo-49 harness rows exact.
- Given cagego-53 / xacona-99 / zecivu-62, when parsed, then a `DiagramRefusal` at the `state XA13`/offending line → error SVG (cite `StateDiagram.java:70-90`); given fugedo-34, then `DiagramRefusal` per `CommandLinkStateCommon.java:277-278` and no duplicate `ChildMode1` in any output.
- Given the harness, then the four remain `unmatched`; `harness-diff.py` clean.
- Given `render-manifest --diff`, then only the six listed fixtures move.

## Observability / Rollback
Harness; error-diagram tests. Reversible. Note in the commit body that the
error banner text differs from the jar's merged error (D2).

## Report (≤500 tokens)
Per fixture result; the exact refusal line each guard reports; any test that
had pinned the lenient behaviour.
