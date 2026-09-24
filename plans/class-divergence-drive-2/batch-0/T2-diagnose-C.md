# T2 — diagnose group C (circled-character glyph family)

**Agent:** debugger · **Depends on:** T0 · parallel with T1, T3–T5.
Prompt = [`diagnosis-task.md`](diagnosis-task.md) + this file.

## Fixtures (7)

befasi-62-vimu310, mububu-79-nalu431, ribove-58-tefu515,
soboro-52-pevi612, zakuta-81-pese010, ziruni-05-fona846, zosaxa-86-mora157

## Measured signatures

All seven: 0 structural, 818 numerics (zosaxa 886), modal Δ1.42 and Δ1.71,
the first diffs on `svg/g[1]/g[8]/path[1]/@d` with coordinate deltas 0.05–2
px. The sources are near-identical (diffs: `skinparam flashcode on` vs
`skinparam layout circo`, one extra `class dummy` with four notes). They
share:

```
skinparam ClassStereotypeFontSize 7
skinparam ClassStereotypeFontStyle Plain
skinparam ClassStereotypeFontName Helvetica
skinparam CircledCharacterFontStyle Bold
skinparam CircledCharacterFontSize 12
skinparam CircledCharacterRadius 8
!pragma defaultLabeldistance 2.1
!pragma defaultLabelangle 30
class DrawableAdapter << (M, brown) >>
```

## Leads, not findings

- Identify first WHAT `g[8]/path[1]` is (glyph outline? edge? note?) before
  assuming the circled character. 818 numerics could equally be edge
  splines moved by label placement (`defaultLabeldistance/angle` pragmas).
- Glyph outlines are table data here (`class-badge-glyph-data.ts`,
  `class-badge-sized-glyphs.ts`); upstream draws them via
  `klimt/shape/CircledCharacter.java` and
  `svek/image/EntityImageClassHeader.java`.
- `layout circo` in some copies: check whether the jar honoured it
  (svek-N.dot `layout=` attribute) before comparing geometry.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible — see [`diagnosis-task.md`](diagnosis-task.md).
