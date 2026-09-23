# A6 — oracle-side / policy bucket: findings (40 slugs)

(Delivered inline by the diagnosis agent 2026-09-21; saved verbatim in substance by the orchestrator.)

Headline: only 7 of 40 (the `!pragma layout elk` set) are genuinely oracle-side/policy. The other 33 carry a real, already-tagged port mechanism (pragma is incidental), and 5 are real bugs not previously documented: an `!include <stdlib>` misdispatch (severe) and a broken error-page SVG-root formatter.

## 1. `!pragma layout elk` (7) — HIGH
Confirmed architectural divergence per DIVERGENCES.md ("`!pragma layout elk` — not supported", ruling 2026-08-09). Evidence: no `svek-N.dot` in the cache for any of the 7 (jar never shelled out to dot); `render-one.ts` on cadutu: 1 structural + 414 numeric, canvas 331x236 vs ours 341x219; cirojo/gokoru: entity DRAW ORDER differs (`@class exp=entity act=cluster`) — a different traversal, not a nudge.
`PRAGMA_LAYOUT_RE` (`scripts/svg-parity-survey.ts:102`) flags `oracleBlind` for the DOT gate only (`:190-191`); `scripts/svg-conformance-census.ts` and `scripts/svg-parity-dashboard.ts` have no `oracleBlind`/pragma reference, so these 7 show as plain `diverged`.
Reach: cadutu-02-lazu601, cirojo-62-dubo306, gokoru-18-daba136, lagudi-03-rucu383, rutefe-49-xeju709, tegefa-14-koxo759, temofi-63-vega763.
Recommended accounting: 7 entries in `oracle/accepted-divergences.json` (`match.id` = `svg-class/<slug>`, scope "svg-conformance class ledger (ELK layout — unsupported engine, DIVERGENCES.md)", acceptedAt 2026-09-21, acceptedBy maintainer, reason citing the ruling + "no svek-N.dot dump"). `svg-parity-dashboard.ts:24` already reads the ledger into its "Divergence ledger" section. Do not special-case in survey/census scripts.

## 2. Other `!pragma` keys (26) — HIGH (5 sampled) / MEDIUM (21)
Cross-referenced against `net/sourceforge/plantuml/skin/PragmaKey.java` (~:88-95, `lazyFrom`):
- `svek_trace`: in enum; no visual effect (trace files only).
- `defaultLabeldistance` / `defaultLabelangle` / `labeldistance`: in enum; real mechanism `net/atmp/CucaDiagram.java:517-558`; ALREADY PORTED `src/core/cucadiagram/CucaDiagramBase2.ts:146-176`.
- `useIntermediatePackages false`: in enum; `classdiagram/ClassDiagram.java:84`; sugifi/sumule render correctly (only 2 `ent000N` id swaps each = A1 ordering).
- `teoz true`: sequence-only (`sequencediagram/teoz/**`), no-op for class.
- `useNewPackage`, `backToLegacyPackage`: NOT in the enum — dead keys.
Sampled: dudimi (8 `@id` order + 48 numeric = A1), tibatu (package-box fill/stroke = package_color), galili (legend `<back:red>` creole leaking as raw text + missing `filter` + textLength = creole/legend bug, unrelated to teoz).
Reach: baneru, befasi, cidepu, comaxe, coxose, delasa, dudimi, galili, gamevo, gujigi, jojime, kadifi, kopida, mububu, pumocu, ribove, sekame, soboro, sugifi, sumule, tibatu, vorimi, vuneta, zakuta, ziruni, zosaxa.
Accounting: no divergence entries; each already carries its real mechanism tag.

## 3. `newpage` — premise false for this set
Only sadamo-18-siva346 contains `newpage` (51×), inside content the jar's parser never reaches (see 5b). No separate action.

## 4. `skinparam flashcode` (befasi, mububu, soboro) — HIGH, no QR drawn
`skinparam flashcode on` only affects an explicit `<flashcode>` block; none present; `grep -c "<image"` = 0 in both SVGs. befasi's diffs are arrowhead polygon-vs-path, missing `#FEFFDD` note fill, generics/assocclass/font-name shifts. No divergence entry.

## 5. Root-attribute / background cases — mostly REAL port bugs
### 5a. bidusa-22-jutu505, cuzoga-39-tufu259, jevuvi-65-dipo437, ruliki-78-biji661 — `!include <tupadr3/...>` misdispatches to the WRONG diagram type — HIGH bug / MEDIUM mechanism
Minimal repro `@startuml\n!include <tupadr3/font-awesome/star>\n@enduml` (no options) renders an SVG carrying SEQUENCE arrow-marker `<defs>` (`arrow-sync`/`arrow-async`/`arrow-reply`, produced only by the sequence renderer); a `class Foo {}` after the include is dropped. The `src/index.ts:364-369` includeStore guard is ruled out (its regex matches, and its catch routes to `errorSvg()` → `renderPSystemError`, which never emits those markers). Something in `registry.resolve` / `src/core/dispatcher.ts` mis-attributes the type before the guard. The real harness (`svg-parity-survey.ts:268-271`) calls `renderSync(markup, { measurer, assetStore })` with no includeStore, so the census hits the same bug. The jar renders all four as small ordinary CLASS diagrams. Reach likely wider than A6 (any `!include <bundle/...>`). Fix in port; instrument `src/core/dispatcher.ts` next.
### 5b. sadamo-18-siva346 — parse error on both sides; our error page is malformed — HIGH
Both sides error (a ~9500-char run of backticks). Ours lacks the six root attrs (`background`, `contentStyleType`, `preserveAspectRatio`, `version`, `xmlns:xlink`, `zoomAndPan`); emits 12 default arrowhead-marker defs (jar 0); `font-weight` `bold` vs `700`; text/rect geometry off 1.4–8.8 px. Legitimate divergence only for the version-identity string. Path: `src/core/error/error-diagrams.ts:78-97` → `src/core/error/error-renderer.ts#renderPSystemError`. Likely reproduces on every error-path fixture.
### 5c. luzive-62-zote562 — jar errors on n-ary `<> diamond` syntax; we silently drop it — HIGH bug / LOW mechanism
Jar `in.svg` is a `PSystemError` page (`fill="#33FF02"` = `HColors.MY_GREEN`, `klimt/color/HColors.java:97`, `error/PSystemError.java:128-137`). We render only `Station`, no error. Fix in port (route to error path or implement n-ary support).
### 5d. zirori-93-jefo337 — `skinparam mode dark` unimplemented — HIGH
Jar recolors: background `#1B1B1B`, fill `#313139`, stroke `#E7E7E7`, badge `#2E5233`, text `#FFF`. Ours: light palette, 10 structural colour diffs, 0 numeric. No DIVERGENCES.md entry. Fix in port.

## 6. Oracle staleness — MEDIUM
`oracle/pin.json` (2026-08-07) pins `1.2026.7beta11`; all 40 `in.svg` mtimes 2026-08-15. DRIFT RISK: `oracle/dist/plantuml-oracle.jar` symlink points at `plantuml-1.2026.8beta1.jar` (built 2026-09-02) — newer than the pin; `scripts/dot-sync-report.ts:64` and `scripts/oracle-render.sh` resolve through it. Any `--rebuild` today silently drifts. Repoint or set `PLANTUML_JAR` before rebuilding.

## Summary
| sub-bucket | reach | recommendation | confidence |
|---|---|---|---|
| 1 elk | 7 | declare (7 ledger entries) | HIGH |
| 2 other pragma | 26 | no entry; pragma is noise | HIGH/MEDIUM |
| 3 newpage | 1 | fold into 5b | HIGH |
| 4 flashcode | 2-3 | no entry | HIGH |
| 5a stdlib include misdispatch | 4 | fix in port | HIGH bug / MEDIUM mech |
| 5b error-page formatter | 1 | fix in port; declare version string | HIGH |
| 5c diamond leniency | 1 | fix in port | HIGH / LOW mech |
| 5d mode dark | 1 | fix in port | HIGH |
| 6 staleness | 0 | repoint jar before rebuild | MEDIUM |
