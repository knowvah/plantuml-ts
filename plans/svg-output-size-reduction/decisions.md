# Architecture Decisions

All six approved by the maintainer, 2026-08-08, before decomposition.
**Treat every one as locked.** If implementation requires contradicting
one, that is a stop condition — log it in `decision-journal.md`, do not
silently override.

---

## ADR-1 — Numeric precision is applied at emission, not at geometry

**Status:** Accepted

**Context.** `src/core/svg.ts`'s `attrs`/`attrsFromRecord` stringify via
bare `String(value)` — there is **no numeric formatting at emission at
all**. To compensate, 23 call sites in the class and state engines
pre-round geometry with `javaRound4` (see `class-edge-geo.ts:212-219`,
mission G2 N35, which fixed a `19.418750000000003` vs jar `19.4188`
mismatch). Upstream does the opposite: geometry stays full-precision and
`SvgGraphics.format` rounds once at emission.

**Decision.** Add a central `format()` to `core/svg.ts`'s attribute
builders, then **delete** the `javaRound4`/`javaFixed4` pre-rounding at
the 23 call sites.

**Consequences.** Eliminates double-rounding structurally — with geometry
at 4dp and emission at 3dp, `1.2345 → 1.2345 → 1.235` but direct-to-3dp is
`1.234`, a sporadic last-digit divergence that looks random. Also fixes the
whole G2-N35 bug class (raw floats leaking wherever a caller forgot to
pre-round). Larger diff, and any coordinate currently emitted unrounded
will shift — the golden regeneration exposes that rather than hiding it.
Per CLAUDE.md, re-mirroring upstream's structure beats patching symptoms.

---

## ADR-2 — Precision is a threaded option, not a constant

**Status:** Accepted

**Context.** Upstream added `SvgOption.decimal` (default 3, settable via
`withDecimal(int)`), with `FileFormatOption` carrying a `-1` unset
sentinel — deliberately a parameter, not a renamed constant.

**Decision.** Mirror it: thread `decimal` through both emitters with
default 3. Do **not** expose it on the public `RenderOptions` yet.

**Consequences.** Faithful to upstream and makes the next precision change
one line. Adds a threaded parameter that has exactly one production value
today — accepted, because porting discipline says reproduce the knob.

---

## ADR-3 — One shared rules module, not two copies

**Status:** Accepted

**Context.** Both emitters need `shortenColor`, decimal formatting, and
the opacity/percent rules. `src/core/number-format.ts` already exists as a
deliberately klimt-independent leaf module.

**Decision.** Put the rules in a shared leaf (`src/core/svg-format.ts`)
that both emitters import.

**Consequences.** The six rules cannot drift between emitters — which is
the failure mode that would produce "class goldens pass, description
goldens fail" (or worse, the reverse). One more core module.

---

## ADR-4 — Regeneration is a committed script

**Status:** Accepted

**Context.** 450 goldens × JVM startup ≈ 12 minutes, and the next pin
advance needs the identical procedure. Today it exists only as an ad-hoc
scratch script.

**Decision.** Commit `scripts/rebaseline-svg-goldens.ts`, reporting
`SAME/CHANGED/FAILED` and writing only under `--write`.

**Consequences.** Repeatable, reviewable, and gives the next pin advance
the measurement this mission had to hand-roll. One more script to
maintain.

---

## ADR-5 — Emitter and goldens land in one gate unit

**Status:** Accepted

**Context.** Gates cannot be green between porting the rules and
regenerating the goldens — the two are only consistent together. Any
ordering has a red window.

**Decision.** Batches 2a–2d are a single gate unit: full gates run **once**,
at the end of batch-2d. No per-task or per-batch gate inside that region.

**Consequences.** Departs from this repo's usual one-green-commit-per-task
rule. The red window becomes bounded and explicit rather than accidental.
A red suite inside 2a–2c is expected and is **not** a stop condition —
which is why the ">20 goldens still failing after the full port" condition
exists instead, as the real signal.

---

## ADR-6 — Documented as a breaking output change, plus a DIVERGENCES note

**Status:** Accepted (maintainer chose the recommended framing)

**Context.** `DIVERGENCES.md` documents places where this port produces
**different output from upstream**. After this work we *match* upstream
more closely than before, so the change is not a divergence in that file's
sense — the break is against **our own previous output**, which is
consumer-facing.

**Decision.** Three artifacts: a `BREAKING CHANGE:` commit footer, a
`CHANGELOG.md` entry at **0.2.0** (pre-1.0 semver permits this in a minor),
and a short `DIVERGENCES.md` entry under a new *Output format* heading
recording that the port previously emitted 4-decimal/long-form SVG and now
tracks upstream's reduced form.

**Consequences.** A DIVERGENCES reader is not left believing we still
diverge, and byte-comparing consumers get an accurate "re-baseline your
snapshots" signal in the changelog where they will actually look. No API
surface changes — same functions, same signatures, different bytes.
