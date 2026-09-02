# The `CommandCreoleUrl` bracket fix, applied and measured

Applied 2026-09-02 on `fix/creole-url-brackets`, cut from `39a1d56c`. This
closes follow-on 1 of [`creole-close.md`](creole-close.md) and supersedes
[`creole-url-bracket-defect.md`](creole-url-bracket-defect.md)'s "not applied"
status; that file's mechanism section remains the reference.

## The change

```
- const URL_TAG_SOURCE = '\[\[([^\]]*(?:\][^\]]+)*)\]\]';
+ const URL_TAG_SOURCE = '\[\[([^\[\]]*(?:\][^\[\]]+)*)\]\]';
```
`src/core/klimt/creole/command/CommandCreoleUrl.ts:58`

Both brackets are now excluded from the capture, matching every one of the five
alternatives `UrlBuilder.getRegexp()` composes — the link arm is
`([^%s%g\[\]]+?)` (`UrlBuilder.java:76-80`).

## Method

All five families were rendered fixture by fixture with `DeterministicMeasurer`
and the shared include store, and compared against their committed jar oracles
with the same `compareSvg`/`weightedScore` every ratchet test uses — once before
the change and once after, on the same checkout. **2 577 fixtures**, of which
2 552 scored and 25 errored identically at both refs.

Per-fixture scores were diffed, not just per-family totals: a total can hide
offsetting movement, and here it would have hidden the one rise.

## Result — four families did not move at all

| family | fixtures | scored | weighted total before | after | fixtures moved |
|---|---:|---:|---:|---:|---:|
| sequence | 1141 | 1124 | 1 315 303 | 1 315 151 | **2** |
| class | 723 | 721 | 101 354 | 101 354 | 0 |
| object | 80 | 80 | 6 246 | 6 246 | 0 |
| state | 273 | 269 | 37 185 | 37 185 | 0 |
| description | 360 | 358 | 75 841 | 75 841 | 0 |

**Zero movement in class, object, state and description** — not a net zero,
a per-fixture zero: no fixture in those four families changed by any amount.
The blast radius that made this a stop-condition-8 refusal turns out to be
empty in the measured corpus. That is a result, not a reason the refusal was
wrong: it could not be known without measuring.

Gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all
green. The only red file remains the inherited
`sequence.diff-baseline.ratchet.test.ts`, which went **78 → 77**. Neither moved
fixture is in its rise set.

## The two fixtures that moved

### `cedeti-10-bufu072` — 535 → 222, the target

Now structurally exact against the jar on both axes this fix touches:

```
ours <a> 4 | jar <a> 4        ours <text> 14 | jar <text> 14
hrefs: https://www.plantuml.com x2, https://www.google.com x2
```

Before, the two frame anchors carried `href="[https://www.plantuml.com"` — the
outer bracket swallowed into the url.

### `mefeke-43-xotu192` — 92 → 253, a rise, and it is an artefact

Source: `Bob -> Alice : hello <math>[[a,b],[c,d]]((n),(k))</math> there`.

**Mechanism.** `[[a,b],[c,d]]` is AsciiMath matrix notation, not a url. The old
character class let it match: `[^\]]*` took `a,b`, `(?:\][^\]]+)*` took `],[c,d`,
and `\]\]` closed it. So this port drew an `<a href="a,b],[c,d">` — a link the
jar does not emit, on a fixture where the jar emits none.

**Causal chain for the RISE.** Consuming the math expression as a url also
prevented `<math>…</math>` from being recognised as a complete tag, so the line
produced three text runs instead of one, and our root child count came out at
15 — **equal to the jar's 15 by coincidence**, because our spurious third run
occupied the slot of the jar's `<image>`. The comparator therefore descended and
charged 70 real per-attribute diffs, weighting 92. With the fix the math atom is
recognised, the seam's undrawable-atom rule keeps the whole line literal, the
count is 13 against 15, and the comparator short-circuits and charges its upper
bound — 5 diffs weighting 253.

```
              <a>   <text>   childCount   diffs   weighted
before         1      7       15 = 15      70       92
after          0      5       13 vs 15      5      253
jar            0      6       15            —        —
```

**Ruled out.** Not a placement or measurement change: the fixture's other
elements are untouched. Not a new error: it renders cleanly at both refs.

**Verdict: artefact.** This is the same shape as `gucare-93-petu502` earlier in
the mission — a coincidental element-count match lost when a wrong element was
removed. The fix is strictly correct on the axis it governs: a bogus hyperlink
the jar does not emit is gone, and corpus-wide `<a>` fell 87 → 86 for exactly
that reason. The residual wrongness is that this port draws no `<image>` for
`<math>`, which is follow-on 2 of `creole-close.md` and predates this change;
when sequence gains image geometry the count will match for the right reason.

## Tests added

Two, in `tests/unit/core/klimt/creole/command/CommandCreoleL2.test.ts`:
an outer bracket is not swallowed into the link (`[[[url]]]` → `[` / url / `]`,
one linked run), and a bracketed non-url expression is not mistaken for a link
(`[[a,b],[c,d]]` → no url atom).
