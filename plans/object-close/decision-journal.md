# Decision journal — object-close

Appended during execution. One row per non-trivial judgment call: if a
reasonable developer might have chosen differently, log it.

Numbers recorded here are the source of truth after compaction — **re-read
this file from disk, never trust a remembered number.**

| Date | Task/Iter | Decision or measurement | Rationale | Evidence |
|---|---|---|---|---|
| 2026-08-11 | plan | Baseline is 23/80, not the census's 0/80 | The committed cache predates the 0.2.0 SVG-reduction port | Fresh jar render of `beruju-17-jigi548` is byte-identical to its pinned golden |
| 2026-08-11 | plan | G3's 46-fixture `gvts-blocked` attribution rejected | 0 fixtures under 0.5px; 19 carry non-numeric diffs | Per-fixture max-delta measurement across all 57 non-conformant |
| 2026-08-11 | pre-flight | Baseline is RED: 6 failures, one cause, owned by T0 | The uncommitted `applyElementFontSizeByStereo` runs before the matcher loop and swallows `statefontsize<<X>>` (`state` ∈ `ELEMENT_BUCKET_SNAMES`) | 3 unit + class DOT `tabaxa-70-pomu341` 0.083in + state DOT `laferu-31-tice836` 0.604in + state SVG ratchet viewBox 80≠123; typecheck and lint clean |
| 2026-08-11 | T0 | Branch `feat/object-close` cut from `fix/object-member-row-height` HEAD, not from `main` | The brief says "off main", but HEAD is main + `3f26bbba fix(object): sum per-row member heights` — object work that belongs to this closure. Branching off main would strand it | `git log main..HEAD` = exactly that one commit |
| 2026-08-11 | T0 | The pre-flight diagnosis was RIGHT about the state cause but INCOMPLETE: `tabaxa-70-pomu341` is a SECOND, independent cause | Moving `applyElementFontSizeByStereo` after the matcher table fixed 5 of 6. tabaxa is driven by the preprocessor's nested-`<<x>>` scope, not by the matcher order | 6 → 1 failure after the ordering fix alone; tabaxa still 0.0833in |
| 2026-08-11 | T0 | Ported the CLASS arm of the mechanism (`classFontSizeByStereo`) rather than let the class DOT gate move | tabaxa was EQUAL only because the OLD preprocessor bug flattened `<<Foo1>> { FontSize 8 }` onto `classfontsize`, applying 8 globally — accidental, not faithful. Upstream `FromSkinparamToStyle` (`:292-302`, `:396-410`) re-signs the key's ordinary `element.class.header` style with `.addStereotype(label)` at +1000 priority (`StyleLoader.java:178-186`) | Port now A=B=0.997917x0.861111in, byte-equal to the jar's own sh0006/sh0007; SVG emits font-size 8 once (A's header) and 16 once (B's) |
| 2026-08-11 | T0 | `tenalu-53-meri239`'s `A` stays 2px short (40 vs 42) — recorded, NOT fixed here | Residue is a header-height term (`EntityImageObject.java:240-247` stacks name + stereo, the stereo row sized by the separate `FontParam.OBJECT_STEREOTYPE` lookup, `SkinParam.java:432-449`), not this mechanism. tenalu is already in batch-2's queue | Width is EXACT for both A and B, and B is exact in both dimensions — so the 8/16 reaches the name row correctly |
| 2026-08-11 | T0 | Maintainer intervention: bare oracle literals in assertions are indistinguishable from fitted values | Named `DOT_PX_PER_INCH`/`PX_DIGITS`/`ORACLE_IN` (each entry citing its golden file + `shNNNN`). Repo-wide sweep proposed as a separate mission | `.agent-notes/oracle-number-constants-sweep.md` |
| 2026-08-11 | T0 | `git -C .` is NOT protection against cwd drift — `checkout -b feat/object-close` landed in the JAVA reference repo | A prior `cd ~/git/plantuml` persisted in the shell; `.` resolved there. Restored `~/git/plantuml` to `dot-output` and deleted the stray branch (it held no commits — a duplicate pointer). Rule tightened to: absolute `-C <path>`, never `.` | `git -C ~/git/plantuml reflog`: `checkout: moving from dot-output to feat/object-close`, no commits on it |
| 2026-08-11 | T0 | The class SVG census is ALSO reporting the stale-oracle artifact — 0 zero-diff of 721 | `test-results/dot-cache/class` was last written 2026-08-08 by `9b54513f`, which PREDATES the SVG-reduction merge `7c30f8ae`; same mechanism as the object finding. So the brief's "class SVG census: zero-diff set intact" gate is currently vacuous (0 → 0) | `git merge-base --is-ancestor 7c30f8ae 9b54513f` → false; census run: 0 diffs = 0 |
| 2026-08-11 | T0 | Frozen-count denominators differ from the brief for class (711 vs 708) and usecase (93 vs 90) | Both report 100% EQUAL with zero diverging checks, so nothing regressed — the brief's denominators are stale, not the health. Not treated as stop condition #2 | `dot-sync-report.ts`: class 711/711, usecase 93/93, component 262/262, state 267/267, object 78/80 |

## Baseline snapshot (planning, 2026-08-11)

- Object SVG census: **23/80** vs fresh oracle (census reads 0/80 vs stale).
- Object DOT structural: **78/80 EQUAL** (2 ledgered).
- Object size backlog: **8 entries**, all also SVG non-conformant.
- Object ratchet: 24 tests, green.
- Frozen siblings: component 262/262 · usecase 90/90 · class 708/708 ·
  state 267/267.

## Measured delta bands (planning, 57 non-conformant)

| Band | Fixtures |
|---|---|
| < 0.5px | 0 |
| exactly 1.0px | 4 |
| 2–10px | 8 |
| ≥ 10px (to 1196px) | 26 |
| ≥1 non-numeric diff | 19 |

## Quality-gate log

| Date | Batch/Iter | test | typecheck | lint | build | frozen counts |
|---|---|---|---|---|---|---|
| 2026-08-11 | T0 | 573 files / 12707 pass, 1 todo | clean | clean | clean | object DOT 78/80 · component 262/262 · usecase 93/93 · class 711/711 · state 267/267 — all 100% EQUAL except object's 2 ledgered |
