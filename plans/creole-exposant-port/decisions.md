# Architecture decisions — creole-exposant-port

Approved 2026-08-18. Locked; a conflict is README stop 8, not a judgment call.

## D1 — Lazy mute: `getFont(fc)`, not an eager size
**Context.** `FontConfiguration.java:98-104` keeps `currentFont` unmuted and
mutes at read time (`fontPosition.mute(result)`, `FontPosition.java:51-60`:
size−3, clamped at 2). Our `FontConfiguration` (`src/core/klimt/shape/UText.ts:46`)
is plain data `{family,size,color,styles}`; ~28 files build literals.
**Decision.** Add `fontPosition?: FontPosition` (undefined = NORMAL) and core
helpers `getFont(fc)` → `{family, size}` (muted) and `getSpace(fc)` → −6/+3/0
(`FontPosition.java:41-49`, `FontConfiguration.java:370-372`). Every creole
measure/draw site switches from `atom.font.size` to `getFont(atom.font).size`.
**Consequences.** Nested `<sup><size:20>x</size></sup>` yields 17 as the jar
does. Rejected: the command writing a muted `size` eagerly (diverges on
nesting; loses the single point of truth).

## D2 — Vertical placement through the ported `Sea`
**Decision.** `creole-text-lines.ts` (and via it state) and the class member/
note paths lay each physical line's runs through `Sea` (`Sea.ts:85-91` ↔
`Sea.java:72-80`: `y = −height + startingAltitude`, then `translateMinYto`),
yielding per-run `dy` and the true line height (a raised `<sup>` may grow the
line). Text atoms report `getStartingAltitude = getSpace(fc)`
(`AtomText.java:321-323`). Note `AtomText.drawU`'s own `getSpace` line is
COMMENTED OUT upstream (`AtomText.java:212-215`): the draw baseline is
`height − descent` only; the altitude comes from `Sea` — do not apply it twice.
**Consequences.** One altitude engine for description and the engine-local
seams. Rejected: a hand formula `dy = space − descent_sup + descent_normal`.

## D3 — Run-model contract
`CreoleTextRun` (`creole-text-lines.ts`) and `StateTextRun`
(`state-sizing-creole.ts`) gain `size: number` (effective, post-mute) and
`dy: number` (baseline offset from the line's normal baseline; 0 for NORMAL);
`CreoleTextLine.height` comes from `Sea`. Descent from the port's
`StringMeasurer.getDescent` (`src/core/measurer.ts:19-22`, with its documented
`size/4.5` fallback) — no new constant. Renderers keep their element structure
(state: tspans with `font-size` + `dy`; class: one `<text>` per atom). Rejected:
a separate "superscript" run kind.

## D4 — Command port form
`CommandCreoleExposantChange.ts` mirrors `CommandCreoleColorChange.ts`'s regex
port of the ubrex `<sup>〶$V=〄>〘</sup>〙` pattern
(`CommandCreoleExposantChange.java:65-70`); bracketed form only (no `createEol`
upstream); `starters()` = `<s` (`:56-58`); registered at
`CommandCreoleBuilder.java:104-105`'s position; upstream name preserved.

## D5 — Fixtures, oracles, exit
juvagu-33 (state, cached) + three authored fixtures rendered with
`scripts/oracle-render.sh` (dumps `svek-N.dot`) into
`test-results/dot-cache/<type>/<slug>/` (committed) and
`oracle/goldens/<type>/<slug>/` (DOT-parity goldens for state/class; description parity runs from `tests/oracle/description-parity.ratchet.test.ts` — T0 checks how a description fixture is registered there): class member+note,
usecase note, state leaf with `<sub>` and nested `<size:20><sup>`. Exit:
juvagu `s1 width idx1` exact; authored declared sizes match `svek-N.dot`; SI29's
`harness-diff.py`/`manifest-diff.py` reused by path; baselines re-pinned
shrink-only; only `<sup>`/`<sub>` fixtures + authored ones move.

## D6 — Out of scope (stated, not deferred silently)
Sequence/activity/WBS (no creole pipeline at all — `<sup>` stays literal there;
a separate mission), the legacy `src/core/creole.ts` lexer, `TileText`
(unported, no consumer), `<math>` (KaTeX divergence), G14 sub-pixel band.

## D7 — Routing and commit discipline
T1 (klimt core) and T3 (core seams): `general-purpose` (Opus, effort high,
brevity constraint). T0, T2, T4, T5, T6: `typescript-pro` (Sonnet). Agents run
no git; orchestrator commits `git commit -- <paths>` per task; merge commit to
main. Repo law as ADRs: no engine→engine imports (`layering.test.ts` green,
`KNOWN_DEBT = []`); every constant cites `~/git/plantuml` `file:line`; never
fit; the sizer/renderer parity audit (`planning/sizer-renderer-parity.md`) is
run and noted by T4 and T5; `.claude/catalog.md` is not created.
