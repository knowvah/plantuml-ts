# SVG sprite dims — the pinned oracle jar is STALE vs its own pinned source

**status:** diagnosed, verified at bytecode level. **BLOCKED — needs a
maintainer ruling** (stop conditions 7 and 9). Not self-approved.
**found:** 2026-08-07, closing F4-f's archimate residual
**blocks:** `turasu-73-zoni468`, `tuliba-37-liza126`, `lesori-32-zeve057`,
`ravodu-50-siso430` — all four at an identical **0.013889in (1.0px)** residual

## The finding

`UImageSvg#getData` converts a viewBox dimension to an int. The two sides
disagree about how:

| | rule | `19.928` → | `40.9` → |
|---|---|---|---|
| **Pinned oracle jar** (`oracle/dist/plantuml-oracle.jar`) | `(int)` cast — **truncates** | 19 | 40 |
| **Upstream source at the pinned SHA** | `(int) Math.ceil(...)` | 20 | 41 |
| **This port** | `Math.ceil` — faithful to source | 20 | 41 |

Upstream changed truncation → ceil in **`1449909d6d6`** (2026-07-04), citing
**issue #2735**: a floor "understates the declared box, and that undersized box
is later reused as a hard viewport … clipping up to 1 unit of real content."

The jar was built **2026-07-05 20:58**, and the repo HEAD it is pinned to
(`de1f986f092`, 2026-07-05) *contains* that commit — yet the jar does not.
The build is stale with respect to its own source.

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

1. **Make the port truncate.** Closes all four pins immediately — by
   deliberately porting a bug upstream has already fixed, one that issue #2735
   says clips real content. Would need a `DIVERGENCES.md` entry
   (**stop condition 9**).
2. **Rebuild the oracle jar from the pinned SHA, regenerate the four goldens.**
   Correct in principle — the jar should *be* its pinned SHA. But it changes
   the oracle and regenerates existing goldens (**stop condition 7**,
   maintainer territory, the A2s ADR-5 precedent). Note this is the same
   *class* of defect as G13/`kokebo-27`, which Batch 5 (F5-a) already exists to
   sweep: a bad capture, not a port defect. Here the capture is bad because the
   *jar* is.
3. **Leave the four open** as a documented oracle-skew gap. Mission lands at
   346, not 350.

**Recommended: (2).** The port is right and the oracle is wrong; changing
correct code to match a stale binary is the one option that makes the codebase
worse. It also likely affects every fractional-viewBox SVG sprite in the
corpus, not just these four — integer-viewBox sprites (`tatori-66-kaci883`,
`sprite-SVG-fill-management-3`) are unaffected, which is why this never
surfaced before.

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
