# Adjudication — `sequence-hidden-arrow`

Measured 2026-08-31 on `feat/sequence-hidden-arrow`, against `main`
(`083ee632`). Executed directly — the mechanism was already diagnosed in
`planning/next-missions.md` when the gap was filed, so this is one behaviour
in three files, not a briefed mission.

## 1. The change

`-[hidden]->` drew a full arrow. `ComponentRoseArrow#drawInternalU:85-87` and
`ComponentRoseSelfArrow#drawInternalU:71-73` both `return` on
`arrowConfiguration.isHidden()` **before** the line, both arrowheads and the
label — the label is drawn after the guard, so it goes with them.

`ArrowConfiguration` gained an optional `hidden`, matching the shape
`inclination` already had; `applyStyle` (`command-arrow.ts`) sets it where it
previously parsed the token and dropped it; and `renderMessage` returns `''`.

**Layout is deliberately untouched.** Only `drawInternalU` is guarded upstream
— `getPreferredHeight`/`getPreferredWidth` (`ComponentRoseArrow.java:342-349`)
are not — so a hidden arrow still reserves its full tile. Reserving space
without ink is the whole point of the form, and a fix that dropped the event
in `sequence-layout-events.ts` would have been wrong.

## 2. Verdicts

`--base 083ee632`, 1141 fixtures, skipped 0:

| regression | artefact | substructure | improved | inconclusive | unchanged |
|---|---|---|---|---|---|
| **0** | 0 | 0 | 3 | 17 | 1121 |

All 17 `inconclusive` rows are NULL at both refs — fixtures that do not render
at all, unchanged by this work. **There are no rises.**

| fixture | score | child distance |
|---|---|---|
| `vogegu-91-mave762` | 553 → **193** | 6 → null |
| `TeozTimelineIssues_0004_Test` | 590 → **240** | 2 → null |
| `koneju-77-vode355` | 1165 → **1144** | 1 → 4 |

**`vogegu-91-mave762` and `TeozTimelineIssues_0004_Test` now match their
goldens' body-group histograms EXACTLY** — 28 and 38 children respectively,
every tag count equal. `vogegu` was one of the five red ratchet rows and this
was its whole stated cause; it is now green, at 193 against a 529 pin.

**Sequence ratchet: 5 red → 4** — `fobube`, `rugeco`, `digula`, `xedomi`.

## 3. `koneju-77-vode355` — score down, child distance up

Not a regression by the tool's own reading (its score FELL), but the distance
moved 1 → 4 and that deserves a mechanism rather than a shrug.

**Mechanism.** It was `-1` against its golden before this change and is `-4`
now: the port was already SHORT, and removing the three elements of its one
live hidden arrow (`B -[hidden]-> C: "              "`, line 27) makes the
existing shortfall visible instead of partly cancelling it. Composition now
reads `line 8` against the golden's `line 14` — six missing lines — with
`path 8` against `6`.

**Ruled out.** That the hidden arrow should have been drawn: upstream's guard
is unconditional, and the two fixtures where `[hidden]` is the dominant term
both closed exactly. The six-line shortfall is present at both refs and is
unrelated; it is not investigated here.

This is the same shape as the divider work's own exposure of `tukobo`: one
error was masking another, and fixing the first makes the second measurable.

## 4. A correction to this mission's own filing

The filing said "7 fixtures use `[hidden]`". Grep over-counted:
`zogane-85-raja214`'s five occurrences are all inside `'` comments
(`'& C -[hidden]> C`), so it has no live hidden arrow — and it correctly did
not move. Of the remaining six, three do not render at all
(`deroxu-29-gude369`, `guxode-39-dobi371`, `revezi-19-kuki251`, each with a
live `-[hidden]-`), leaving **three measurable fixtures, two of which closed
completely**. The filing predicted only `vogegu` would close; it undersold
`TeozTimelineIssues_0004_Test`.

## 5. Re-pinning — tightened 2026-09-01 at `2437b430`

Nothing rose, so no re-pin was *required*. The three fixtures that moved were
tightened anyway, so their gains are held: `vogegu-91-mave762` 529 → **193**,
`TeozTimelineIssues_0004_Test` 590 → **240**, `koneju-77-vode355`
1165 → **1144**. Guarded strictly-below-pin as in the two previous missions,
and verified against `HEAD` as **3 down, 0 up, 0 outside the set**; the four
remaining red rows keep their original pins and stamps.

One caveat on `koneju-77-vode355`, since its case is not the same as the other
two. Its SCORE fell (which is what the gate reads) but its child distance rose
1 → 4, for the reason in §3 — it was already short and this change exposed
that. A tighter pin there is still strictly better than the old one, but it
sits on a fixture with a known unfixed shortfall, so a future correct fix
elsewhere could raise its score through the same short-circuit artefact these
missions keep meeting and trip the gate sooner. That is the gate working; it
is recorded here so the next reader has the mechanism ready rather than
starting the diagnosis over.

The arrow COLOUR fallback (`config.withColor(...)`,
`CommandArrow.java:497-498`) is still parsed and dropped — a colour gap that
moves no child counts, deliberately left alone and still recorded in
`applyStyle`'s doc comment.
