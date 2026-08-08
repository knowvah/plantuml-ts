# T7b — Route hand-built markup through the emission formatter

**Agent:** typescript-pro · **Depends on:** T5, T6a–T6e, T7 · **Commit:** `fix(T7b): format numbers in hand-built markup across the diagram engines`

> **Added 2026-08-08 during batch-2b.** T6e found it; the orchestrator
> confirmed the scope. This is the same defect class T5's template-literal
> audit was written to catch — T5's write-set was `src/core/`, so the
> audit never reached `src/diagrams/`, where the goldens actually come
> from.

## The defect — and it is a structural one, not a formatting one

ADR-1's premise is that `src/core/svg.ts`'s `attrs`/`attrsFromRecord` are
the emission choke point, so callers can stop pre-rounding. **Markup built
by string concatenation never passes through that choke point.** A number
interpolated straight into a `d=`, `points=`, `x=` or `width=` attribute
reaches the output at full binary precision.

While the class engine's `javaRound4` calls existed they masked this.
T6a–T6e removed them, so the bypassing sites now emit raw floats.
Confirmed regression in `class-namespace-shape.ts`:

```
d="M8.5,6 L28.925000000000004,6 …"
```

**The cause is that these are one-off re-implementations of shared code
that already exists.** Upstream has exactly one SVG emission seam —
`SvgGraphics`, with `svgRectangle`, `svgLine`, `svgPolygon`, `svgEllipse`,
`svgArcEllipse`, `svgPath`, `svgImage`. Every diagram type reaches SVG
only through it, via the `Driver*Svg` classes. **No per-diagram hand-rolled
markup exists anywhere upstream**, which is why upstream has no equivalent
bug: `SvgGraphics.format()` sees every coordinate.

This port already has the 1:1 equivalents in `src/core/svg-shapes.ts`:

| upstream `SvgGraphics` | this port |
|---|---|
| `svgRectangle` | `rect()` |
| `svgLine` | `line()` |
| `svgPolygon` | `polygon()` |
| `svgEllipse` | `ellipse()` |
| `svgPath` | `path()` |
| `svgImage` | `image()` |

So the fix is **not** to sprinkle a formatter at each hand-built site —
that would entrench the divergence. It is to route these callers through
the shared emitters that already mirror upstream's seam, per this repo's
rule that upstream's architecture is authoritative.

## Scope — the four engines with goldens in this mission

`src/diagrams/class/`, `src/diagrams/state/`, `src/diagrams/object/`,
`src/diagrams/description/`.

Known sites (**this list is a starting point, not the answer — audit for
the rest**):

- `class-namespace-shape.ts:214` — `folderPathD`'s `pt()` helper, `d`
- `class-namespace-shape.ts:285` — `renderFolderPolygon`, `points`
- `class-visibility-icon.ts:139` — `points`
- `class-visibility-icon.ts:148` — `<rect x y width height>`
- `class-visibility-icon.ts:157` — `<ellipse cx cy rx ry>`
- `renderer-note.ts:45,59` — note path `M`/`L` segments
- `note-opale.ts:92-102,122…` — opale note path segments

**Out of scope, deliberately:** `src/diagrams/activity/`, `dot/`, `board/`,
`chart/` have the same pattern, but they have **no goldens in this
mission's ratchets** and they did not regress — those sites were never
formatted, before or after, because `core/svg.ts` never formatted anything
until T5. Record them as a follow-up; do not fix them here. Widening this
task to every engine turns a bounded fix into an unbounded one.

## Read-set

- `src/core/svg.ts` — `attrs`, `attrsFromRecord`, and the internal `fmt()`
  helper T5 added. Check whether `fmt` is exported; if not, exporting it
  is the intended mechanism.
- `src/core/svg-format.ts` — `formatDecimal`, `DEFAULT_SVG_DECIMALS`
- `plans/svg-output-size-reduction/decisions.md` — ADR-1, ADR-2, ADR-3
- The T5 commit body (`cc7b29b1`) — its enumeration is the model for yours

## Write-set

- `src/core/svg.ts` — **only** if `fmt` must be exported
- `src/diagrams/class/**`, `src/diagrams/state/**`, `src/diagrams/object/**`,
  `src/diagrams/description/**` — only the files carrying a bypassing site
- the corresponding test files

## Task

**1. Audit.** Find every site in the four in-scope engines where a number
reaches output markup without passing through `attrs`/`attrsFromRecord`.
Grep for `${` inside a string that becomes markup — `d=`, `points=`,
`M`/`L`/`C` path commands, and any direct `<tag attr="${…}">`
construction.

**2. Replace each one-off with the shared emitter it duplicates.** A
hand-built `<polygon points="…">` becomes a `polygon()` call; a hand-built
`<rect …>` becomes `rect()`; `<ellipse …>` becomes `ellipse()`. This is
the primary deliverable — the formatting fix falls out of it, because the
shared emitters already format through `attrs()`.

If a shared emitter is missing an option a caller needs, **add the option
to the shared emitter** rather than keeping the one-off. If upstream's
corresponding `SvgGraphics` method has that capability, mirror its
parameter name.

**3. Path `d` strings need a shared builder, because upstream has one.**
`path(d, style)` takes an already-built `d`, and `attrs()` treats it as an
opaque string — correctly, since it is one. Upstream's equivalent is
`UPath`/`DotPath` fed to `svgPath`, which formats **every coordinate
through `format()` as it writes the `d`**. So coordinate formatting
belongs in a shared path builder, not in each caller's template literal.

Add that builder (mirroring `UPath`'s role) and route
`class-namespace-shape.ts`, `renderer-note.ts` and `note-opale.ts`'s path
construction through it. Three callers hand-assembling `M`/`L` segments
with their own `${}` interpolation is exactly the duplication to remove.

**4. Enumerate every site you found and what you did with it** in the
commit body — including any you judged already safe, and why. The next
maintainer needs to know the audit happened and how far it reached.

Do **not** re-add `javaRound4` anywhere. The fix is formatting at emission,
not rounding at the call site — that is the defect ADR-1 removed.

### Porting discipline applies to the shape of the fix

Mirror upstream's structure; do not invent a nicer abstraction of your own.
The shared emitters and the path builder should map onto `SvgGraphics`'s
methods and `UPath`, with upstream's names where a name is being chosen.
If you find yourself designing something with no upstream counterpart,
stop and report it rather than inventing.

## Acceptance criteria

1. Given a namespace folder, its `d` attribute contains no value with more
   than 3 decimal places — specifically not `28.925000000000004`.
2. Given the same, its `points` attribute is likewise formatted.
3. Given a visibility icon, an opale note and a class note, the same holds
   for every numeric attribute they emit.
4. Given any value, the shared path builder and the `attrs()` path format
   it identically — prove it with a test that formats one value both ways.
5. No `javaRound4`/`javaFixed4` call is reintroduced.
6. **No `<rect`, `<ellipse`, `<polygon`, `<line` or `<path` string literal
   remains in the four in-scope engines** — each is a call to the shared
   emitter that mirrors upstream's `SvgGraphics` method. Report any you had
   to leave, with the reason.

## Quality bar

```sh
npm run typecheck        # must pass
npm run lint             # must pass
```
Never pipe a gate. Cold-tree `npm test` is expected red until the goldens
are regenerated (ADR-5) — but a `d`/`points` attribute carrying a
15-decimal float is a real defect, not stale-golden churn, and must be
gone.

Complexity limits are hook-enforced: file ≤500 lines, function ≤30 NLOC,
cyclomatic ≤10, ≤5 params.

## Boundaries

- **Always:** one formatter, shared with the `attrs()` path.
- **Never:** re-add call-site pre-rounding; touch `activity/`, `dot/`,
  `board/` or `chart/`; regenerate goldens; run any `git` command.
