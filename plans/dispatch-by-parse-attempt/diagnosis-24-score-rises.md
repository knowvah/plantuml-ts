# Diagnosis — the 24 sequence weightedScore rises

Status: **root cause identified.** No fix applied; this is the artifact
`rules/diagnosis.md` requires before one.

## Mechanism

The pre-mission renderer **silently dropped statements it could not parse**,
so its documents were smaller than the jar's. `weightedScore`'s
structural-mismatch charge is

```
weight: sumUnits(actualChildren) + sumUnits(expectedChildren)
```

— `tests/oracle/svg-conformance/compare.ts:404`. It sums **both** sides, so a
truncated `actual` yields a *smaller* charge. The baselines were pinned
against those truncated documents.

Parse-attempt dispatch removed the silent drop. The same sources now parse
fully and render every statement, so `sumUnits(actual)` grew — and the charge
grew with it. **The rise measures our document getting bigger, not less
faithful.**

## Why the gate believed a rise was impossible

`units()` documents itself as "an upper bound on the number of diffs a descent
into it could push" (`compare.ts:160-166`). That is true **for a fixed pair of
documents**: descending can never cost more than stopping. A ratchet does not
compare a fixed pair — it compares *two different renders of the same source*,
one of them from a build that emitted less. The bound does not transfer across
that comparison, and this is exactly the gap the 24 fall into.

So the gate's assertion message — "weightedScore has NO benign reading for a
rise" — is **false for the case where the port begins rendering content it
previously dropped**. It should be amended rather than trusted here.

## Causal chain, in two surface forms

**(a) 16 fixtures still short-circuit** at `svg/g[1][childCount]`. Their new
score is the current pair's own bound plus the 4 root-attribute diffs,
exactly:

| fixture | bound(now) | +4 | score |
|---|---|---|---|
| bofovo-45-figi573 | 482 | 486 | 486 |
| bovugo-63-lazo401 | 442 | 446 | 446 |
| dototo-68-bexa421 | 203 | 207 | 207 |
| gibuxa-28-kale997 | 552 | 556 | 556 |

`gifope-23-jufe872` and `ravire-24-jaju542` add a **second** short-circuit at
`svg/defs[1][childCount]` (we emit no `<defs>` gradients), and gifope one
`@background` diff — which is why those two exceed bound+4.

**(b) 8 fixtures now reach the golden's child count and DESCEND**, reporting
real per-attribute diffs. Each new score sits *under its own* current bound:
dudure 321 ≤ 418, kikuba 389 ≤ 407, nucumi 1702 ≤ 1974, pixopo 307 ≤ 318,
pukebe 264 ≤ 275, rogube 364 ≤ 465, sepeti 467 ≤ 485, tuxido 263 ≤ 310.

## Fidelity, measured independently of the score

`|childCount − golden|`, pre-mission vs now: **16 CLOSER, 8 FARTHER, 0
unchanged**; 8 now land exactly on the golden. `dudure-98-cote516` and
`tuxido-23-xide677` went from rendering **nothing** (0 children) to exact.

## Ruled out

- **The ref-body change** (`3e8a8af6`). Layout/render only, and the riser sets
  were diffed across it: only `cusiro-03-mebe823` and `sojufi-84-bexi933`
  entered, both pinned. These 24 were rising before it.
- **The refusal pins** (`2652df3c`). None of the 24 refuses.
- **Comparator drift.** The bound was recomputed with the *current*
  comparator against both renders, so the numbers above are not measuring a
  changed `compare.ts`.

## Real defects this surfaced (each cited, none yet fixed)

1. **Empty message label emits `<text></text>`.** `renderMessageLabel`
   (`src/diagrams/sequence/renderer.ts:177-192`) has no empty guard. Upstream
   builds a `TextBlockEmpty` for an empty display
   (`AbstractTextualComponent.java:84-85`), which draws nothing. Affects
   bofovo(2), jugami(2), vanaci(4), ravire(2), gibuxa/rifazu/xuzusu(1 each).
   Removing them makes bofovo, jugami, gibuxa, rifazu and xuzusu **exact**.
2. **Multi-line labels emit one `<text>` with embedded newlines.** The jar
   emits one per line — porulu's `hello1\nthis\nmessage` is three `<text>`
   elements. Same class as the `ref` body defect fixed in `3e8a8af6`.
3. **Autonumber is inlined into the label.** The jar gives it its own
   `<text>` (porulu's `[001]`).
4. **`participant Alice <<alice>>` bakes the stereotype into the code.**
   `CommandParticipantA` splits `CODE ([%pLN_.@]+)` from
   `StereotypePattern.optional("STEREO")` (`:63-64`); `%pLN_.@` excludes `<`.
   Because our code becomes the whole string, a later `Alice -> …` matches
   nothing and creates a **second** participant — secida/xuxugi render 7
   participant labels where the jar renders 3. `hide stereotype` is also
   unported.
5. **`--` is admitted into a participant name.** `Alice <- Bob--: 500`
   (secida:71) creates a phantom participant `Bob--`; upstream's PART2CODE is
   `([%pLN_.@]+)` with the `--` taken by the ACTIVATION group
   (`CommandArrow.java:119,126`).
6. **No `<defs>` gradients** (gifope, ravire).
7. **Lifelines are not wrapped in `<g><title>`** as the jar wraps them —
   count-neutral here, so it does not move these scores.

## Two that look like regressions and are not

`bovugo-63-lazo401` and `porulu-24-ciga586` had base child counts **exactly**
equal to the golden and now render fewer. Both were compensating errors:

- **bovugo** drew **three** participants for a two-participant source. Its 31
  matched the golden's 31 for the wrong reason.
- **porulu** drew a footbox the jar hides. The source says `hide footbox` and
  the golden carries no footer text, so `isShowFootbox`
  (`SequenceDiagram.java:475-487`) is ported correctly; removing the wrong
  footbox exposed defects 2 and 3, which its four spurious children had been
  masking.

## What a fix would have to do

Defects 1–3 are self-contained and would take bofovo, jugami, gibuxa, rifazu,
xuzusu to an exact child count and improve porulu. Defects 4–5 are one
participant-identity cluster behind secida/xuxugi. Neither is a reason to
re-pin: re-pinning is correct only for fixtures whose rise is entirely form
(a) or (b) with fidelity CLOSER or unchanged.
