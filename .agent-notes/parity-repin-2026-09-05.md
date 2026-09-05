# Parity pins refreshed — and the 8 rows that went red doing it

Written 2026-09-05. The `parity-*.json` files carried drift back to
**2026-08-12**; every mission since had moved geometry without refreshing
them. All three are now regenerated from one fresh survey.

Supersedes `.agent-notes/lor-parity-pins-are-stale.md`'s open item. That
note's *recommendation* (don't adopt wholesale as a side effect of unrelated
work) still stands — this was a deliberate, standalone adoption with the
numbers on the table first.

## What was adopted

| corpus | rows | changed | `true`→`false` | `false`→`true` |
|---|---|---|---|---|
| state | 271 | 172 | 0 | 4 |
| class | 722 | 295 | 3 | 23 |
| component/usecase | 358 | 286 | 5 | 0 |
| **total** | 1,351 | **753** | **8** | **27** |

27 fixtures had silently become `dotEqual` and were going uncredited. 8 had
silently stopped being `dotEqual` and were hidden behind a stale `true`.

## Observation: 8 fixtures are pinned `dotEqual=false` with no diagnosis

- **Context**: refreshing pins that predate the current comparator.
- **Finding**: these 8 measure `false` today while their 2026-08-12 pin said
  `true`. They are now pinned honestly, but **why** each flipped is unknown:

  **class** — `xamule-03-jeda376`, `nagega-30-poso418`, `vonago-16-zime449`
  **component** — `sunuju-01-pote718`, `kafexo-72-xupa679`,
  `ruciga-77-ruja233`, `gevozu-46-sasu860`, `berelu-46-namo819`

- **Impact**: each is EITHER comparator staleness (a stricter check landed
  after the pin — which is exactly what the previous three turned out to be)
  OR a genuine `src/` regression. Those need opposite responses, and nothing
  distinguishes them yet.
- **Confidence**: High that they measure `false`; spot-checked live against
  `--render-one` on `xamule-03-jeda376` and `sunuju-01-pote718`, both
  matching. **Zero confidence** as to cause.

## Start here if you pick this up

The previous three (`lurage-50-kobo763`, `xetase-70-zaza808`,
`tunelu-64-xica833`) looked identical to these and were **not** regressions:
`labelSizeOk` landed in `tests/oracle/svek-dot.ts` at `d3ff29be`, three days
after the pins were generated, and made a pre-existing label-box divergence
visible. See `plans/doteq-regression-bisect/`.

So the cheap first move is **not** a bisect. It is: list every comparator
check added to `compareStructural` since 2026-08-12, and for each of the 8
ask which check it now fails. A bisect over `src/` costs three worktrees and
finds nothing if the answer is a comparator change — that mission spent
exactly that and stopped at T0.

`splinesOk` is itself one such check, added 2026-09-03 — but it can only
affect the 8 fixtures carrying `splines=` in their jar DOT, and none of
these 8 is among them.

## A counting error worth not repeating

These 8 were under-reported as **3** when first filed. The cause was reading
a truncated debug print (`flips[:12]`) on the class corpus and, on the
component corpus, counting movers without ever enumerating the `dotEqual`
flips at all. The real figure was 11 at the time — 2 state, 4 class, 5
component — of which 3 were then fixed.

Truncating a diagnostic listing and then quoting its length as a finding is
how an under-count reaches a commit message. Print the count separately from
the sample, and never quote a `[:N]` slice as a total.
