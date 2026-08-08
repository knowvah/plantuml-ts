# SVG sprite dims — the PORT is ahead of the pinned oracle (pin drift)

**status:** diagnosed, verified at bytecode level. **BLOCKED — needs a
maintainer ruling** (stop conditions 7 and 9). Not self-approved.

> ## CORRECTION (2026-08-07, same day)
>
> An earlier revision of this document concluded "the pinned oracle jar is
> STALE against its own pinned SHA." **That was wrong, and the direction is
> reversed.** It compared the ceil commit against the local checkout's `HEAD`
> instead of against `pin.json`'s `upstreamSha`.
>
> | fact | value |
> |---|---|
> | `pin.json` `upstreamSha` | `59ddb531`, **2026-06-26** |
> | ceil commit `1449909d6d6` | **2026-07-04** — AFTER the pin |
> | `git merge-base --is-ancestor ceil pin` | **NO** |
> | `dot-output` pristine base (`dot-output~2`) | `ebbacfefebe`, **2026-07-26** |
> | commits `pin..base` | **59** |
>
> So **the jar is CORRECT for its pin** — the pinned upstream truncates. What
> drifted is the local reference checkout, rebased onto 2026-07-26 master. This
> port then ported `Math.ceil` from that drifted source, so **the port is ahead
> of its own oracle.**
>
> All the EVIDENCE below still stands (bytecode, byte-identical assets, the
> scale-dependent gap, the synthetic-viewBox test). Only the attribution
> changed: not a stale build, but **pin drift**.
>
> `build-oracle.sh` builds from `dot-output`, i.e. from the DRIFTED base — so
> "rebuild the jar" silently advances the oracle 59 upstream commits.
> `pin.json`'s own note ("Re-baseline DOT/SVG goldens whenever upstreamSha
> changes") makes that a full re-baseline, not a four-golden regeneration.
> `build-oracle.sh` even warns on this, though its check is off by one: it
> tests `dot-output~1`, which is the FIRST of two seam commits, not the
> pristine base.

**found:** 2026-08-07, closing F4-f's archimate residual
**blocks:** `turasu-73-zoni468`, `tuliba-37-liza126`, `lesori-32-zeve057`,
`ravodu-50-siso430` — all four at an identical **0.013889in (1.0px)** residual

## The finding

`UImageSvg#getData` converts a viewBox dimension to an int. The two sides
disagree about how:

| | rule | `19.928` → | `40.9` → |
|---|---|---|---|
| **Pinned oracle jar** (`oracle/dist/plantuml-oracle.jar`) | `(int)` cast — **truncates** | 19 | 40 |
| **Upstream at the PINNED sha** (2026-06-26) | `(int)` cast — **truncates** | 19 | 40 |
| **Upstream at the DRIFTED checkout** (2026-07-26) | `(int) Math.ceil(...)` | 20 | 41 |
| **This port** | `Math.ceil` — ported from the DRIFTED source | 20 | 41 |

Upstream changed truncation → ceil in **`1449909d6d6`** (2026-07-04), citing
**issue #2735**: a floor "understates the declared box, and that undersized box
is later reused as a hard viewport … clipping up to 1 unit of real content."

The jar was built **2026-07-05 20:58**, from the pin-era tree, before the
`dot-output` branch was rebased onto 2026-07-26 master. It matches its pin.

### Bytecode proof (not inference)

```
$ javap -c -p net/sourceforge/plantuml/klimt/shape/UImageSvg.class
  34: invokestatic  java/lang/Double.parseDouble:(Ljava/lang/String;)D
  37: d2i                      <-- raw double->int cast, truncates
  42: ireturn
```

`Math.ceil` and `Math.floor` appear **nowhere** in the jar's class.

### Behavioural proof

A synthetic sprite, `viewBox="0 0 30.9 40.9"`, in a `rectangle` leaf:

| | node dims | implied sprite box |
|---|---|---|
| jar | 50 × 74 | **30 × 40** (truncate) |
| ours | 51 × 75 | **31 × 41** (ceil) |

The stereotype-less control node measures 27 × 34 on **both** sides.

Scaling confirms it is the dimension, not a constant offset: at `{scale=10}`
the gap is exactly −10 on both axes (−1 per unit scale); at `{scale=2}`, −2.

### Ruled out

- **Different asset.** The jar's `sprites/archimate/interface.svg` and our
  vendored `assets/sprites/archimate/interface.svg` are **byte-identical**
  (`diff -q` clean).
- **A composition offset.** A constant −1 would not scale with `{scale=N}`.
- **Text-vs-sprite fallback.** Fixed separately (see below); a plain `<<foo>>`
  text stereotype measures **identically** on both sides (+14px).
- **Reference-repo contamination.** `~/git/plantuml` carries only our two
  oracle commits (`de1f986f092`, `8c8c0a9bea2`), which touch **only**
  `FileFormat.java` and `DotStringFactory.java`. `UImageSvg.java` is pristine.

## Why this is not mine to decide

Three options, none self-approvable:

1. **Hold the port at the pin — make `SpriteSvg` truncate.** Closes all four
   pins immediately and restores port/oracle consistency at the pinned
   revision. It is *faithful*, not a self-approved bug: the pinned upstream
   genuinely truncates. It flips back naturally when the pin advances. Small,
   reversible, and needs a one-line note rather than a divergence.
2. **Advance the pin** to the current base (`ebbacfefebe`), rebuild the jar,
   and re-baseline **all** goldens — description (356) plus class, state,
   object and the svg-* suites. This is what `pin.json`'s own note demands and
   is its own mission, not a four-file edit.
3. **Leave the four open** as a documented pin-drift gap. Mission lands at 346.

**Recommended: (1) now, (2) as a tracked follow-up.** The gate is the pinned
jar, so implementing post-pin behaviour guarantees a permanent 1px miss on
every fractional-viewBox sprite. Integer-viewBox sprites (`tatori-66-kaci883`,
`sprite-SVG-fill-management-3`) are unaffected, which is why this never
surfaced before.

## The systemic finding (bigger than these four)

The reference checkout is **59 commits ahead of `pin.json`**, and at least one
port task has already read post-pin behaviour from it and implemented it
against a pre-pin oracle. `Math.ceil` is the confirmed instance; it is not
necessarily the only one. Any port work done after the 2026-07-26 rebase that
consulted `~/git/plantuml` is in scope for an audit. Worth its own tracked
issue regardless of which option above is chosen.

## What DID land (independent, committed)

The four fixtures were **not** blocked on this alone. The dominant defect was
that a `<<$name>>` stereotype never resolved at all — see the sibling fix:
the description sizer and renderer never populated
`EntityImageDescriptionLabels.stereotypeSprite`, so the run fell through to
`stereotypeLabels` and was measured as guillemet **text**. That is fixed, and
it moved all four from 0.069–1.286 down to a shared 0.013889.

Before: `turasu-73` 1.224826 · `tuliba-37` 0.521007 · `lesori-32` /
`ravodu-50` 0.242882.
After: **all four exactly 0.013889** — one shared residual, this one.
