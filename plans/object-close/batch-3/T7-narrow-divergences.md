# T7 — narrow the `DIVERGENCES.md` geometry entry

## Prior observations

The entry "Edge geometry follows modern graphviz, not the jar's graphviz-2.38
transpile" (`DIVERGENCES.md`, under **Output format**) states the difference
is "sub-pixel and almost always invisible", measured at ~0.0097pt on one
class fixture, `bipudo-23-xavu432`.

G3 cited it to file 46 object fixtures as `gvts-blocked`. Measured 2026-08-11:
**zero** object fixtures fall under 0.5px; deltas reach 1196px, and 19 of the
46 carry non-numeric diffs (colour, `@id`, `childCount`, text) that no layout
engine produces.

The entry is not *wrong* about spline quantization. It is wrong as a blanket
warrant.

## Context

`decisions.md` D2: narrow the entry's scope; do not delete it. The measured
class case remains true and should survive the edit.

## Task

1. Restrict the entry to sub-pixel spline quantization, keeping the
   `bipudo-23-xavu432` measurement as its evidence.
2. State explicitly that it does **not** cover: deltas ≥1px, node or document
   dimensions, colours, DOM shape, or element identity — and that object is
   not a Smetana path (it emits svek DOT and has a DOT-parity gate), so the
   jar's geometry is a target there.
3. Add the object-specific divergence entries that batch-2 established, each
   with its mechanism and measured evidence.

## Write-set

`DIVERGENCES.md`

## Read-set

- `DIVERGENCES.md` → "Output format" section, the geometry entry and the
  0.2.0 reduced-form entry above it.
- `plans/object-close/ledger.md` — the mechanisms and measurements to record.
- `CLAUDE.md` → "One layout engine: dot-engine, never Smetana" — the Smetana
  path list the narrowing must stay consistent with.

## Architecture decisions in force

D2 (narrow, don't delete), D1 (each new entry names a mechanism).

## Acceptance criteria

- Given the edited entry, when read, then its scope is sub-pixel spline
  quantization and the `bipudo-23-xavu432` measurement is intact.
- Given the edited entry, when read, then it names what it does not cover and
  why object is not a Smetana path.
- Given each new object entry, when read, then it carries a mechanism and the
  measurement that justifies it — no entry rests on "graphviz differs".
- Given the file, when the gates run, then all four pass.

## Observability requirements

N/A — documentation only.

## Rollback

**Reversible** — single documentation commit.

## Quality bar

The reader test: someone who lands on the narrowed entry in six months must
not be able to use it to dismiss a 90px diff. Say so plainly.

## Boundaries

- **Always:** preserve the existing measured class evidence.
- **Ask first:** removing any existing entry.
- **Never:** delete the geometry entry; write an entry without a measurement.

## Commit format

```
docs: narrow the modern-graphviz geometry divergence to sub-pixel splines

It was generalized from one class fixture and then carried 46 object
fixtures that measurement shows are not sub-pixel — none under 0.5px,
19 not geometry at all.
```
