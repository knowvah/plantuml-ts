# T5a: creole URL — UrlBuilder grammar, hyperlink style, xlink:title crash (families A, C, D)

Prepend [../task-preamble.md](../task-preamble.md). **Pre-declared `src/core/` work — runs only
after maintainer approval (stop 10, journal row 30).**

## Rows (b4 render-diff S/N)
- C: `link-URL-tooltip-1` S6/N5, `zeneno-39-bize297` S6/N5, `xasinu-75-sabe690` S2/N0,
  `link-URL-tooltip-2` S2/N0.
- A: `facibu-72-dako171` S1/N0, `keloxe-59-zalu422` S2/N0.
- D: `ledama-83-xoko366` S3/N6, `link-URL-tooltip-0` S3/N6 (jar CRASH pages; conformant only
  when we render our error page too — 2026-10-10 rule).

## Mechanisms (T4a, orchestrator-verified for C and D)
- **C.** `CommandCreoleUrl.java#executeAndAdvance` builds the url through
  `UrlBuilder.getUrl` (`url/UrlBuilder.java:95-120`: QUOTED `[["…" tooltip]]`,
  ONLY_TOOLTIP_AND_LABEL `[[{…} label]]` with url "", …) and `Url.java:54-57` defaults the
  tooltip to the url. The port's `src/core/klimt/creole/command/CommandCreoleUrl.ts:112-118
  resolveUrlAndTooltip` splits on the first space instead, although the full grammar is
  already ported at `src/core/url/UrlBuilder.ts:67-142`. Re-mirror: call the port's
  `UrlBuilder` exactly where the Java does (read the Java method body first).
- **D.** `klimt/drawing/svg/SvgGraphics.java:1147-1161 getXlinkTitle`:
  `m.appendReplacement(sb, "" + c)` — a decoded `<U+005C>` (`\`) or `<U+0024>` (`$`) is a
  replacement-string escape, so Java throws `IllegalArgumentException: character to be
  escaped is missing` (`\` alone) / `Illegal group reference` (`$`) — mirror the Java
  `Matcher.appendReplacement` semantics for the decoded character in
  `src/core/klimt/drawing/svg/svg-graphics.ts:103-108` (today a function replacer, never
  throws), so the render throws and our error page renders (D needs C first: today the
  tooltip never contains the `<U+005C>`).
- **A.** `style/Style.java:265-267` gives `FontConfiguration` the style's `hyperlinkColor`
  and `hyperlinkUnderlineStroke` (`HyperlinkUnderlineThickness/Style`); the port's
  `src/core/klimt/font/FontConfigurationBridge.ts:36-50` drops both, so `CommandCreoleUrl.ts`
  (`:129-140`) paints `#00F` underlined; and `DriverTextSvg.java:134-135` underlines only when
  `getUnderlineStroke().getThickness() > 0`, which `src/core/klimt/drawing/svg/driver-text-svg.ts:30-35`
  assumes always true. Read `FontConfiguration.java#hyperlink()` and `Style.java:255-270`.

## Task (TDD)
Failing tests first with jar values from the cached `in.svg` (or `scripts/oracle-render.sh`
probes); then re-mirror each mechanism at its origin. Every engine draws creole URLs, so
**whole-corpus hash diff** before/after (`plans/wbs-engine-port/measurements/T4a/hash-corpus.mts`
method) — every non-wbs mover needs a mechanism; a conformant loss anywhere is stop 4.

## Write-set
`src/core/klimt/creole/command/CommandCreoleUrl.ts`, `src/core/url/UrlBuilder.ts` (only if a
Java arm is missing), `src/core/klimt/drawing/svg/svg-graphics.ts`,
`src/core/klimt/font/FontConfigurationBridge.ts`, `src/core/klimt/drawing/svg/driver-text-svg.ts`,
their unit tests under `tests/unit/core/**`, `docs/catalog.md`, `.agent-notes/wep-T5a.md`,
`plans/wbs-engine-port/measurements/T5a/**`. Any other file is a stop.

## Acceptance
- Given the 8 rows, then each is survey-conformant (D: our error page renders).
- Given the whole-corpus hash diff, then every changed non-wbs row is listed with a mechanism
  and none loses conformance.

**Observability:** N/A. **Rollback:** Reversible.
