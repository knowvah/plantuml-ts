# T35 — canvas `minDim` off by 1-9 px, zero ink diffs

**Agent:** debugger · **Depends on:** — · parallel with T36 (worktrees).

## Context

24 of 50 A5 fixtures are exactly 1.0 px off on `@viewBox[2]`/`@width` or
`@viewBox[3]`/`@height` with every drawn coordinate otherwise matching
within 0.01 (A5 M7). 13 have NO other diff (`camupi-97-gezi072`,
`gatula-10-bifu561`, `jixamu-89-ribo225`, `jubobo-22-fapu993`,
`kexaca-03-situ523`, `siteza-47-lixe343`, `tamixa-86-jiku308`,
`tebore-53-tese080`, `tenomi-61-ceta987`, `ticuxa-26-tixo262`,
`tilipa-86-suxi130`, `vafaka-92-xose973`, `xosiza-60-sobu480`) — pure
`minDim` cases. The other 8 (`dofima-22-kofe334`, `jireze-84-loti743`,
`tijira-61-fere730`, `sicile-99-pefa679`, `lapoma-04-vaga142`,
`nenepe-70-keri784`, `lacote-58-sozu269`, `xefeme-77-fagu709`) pair the
width diff with sub-pixel text `@x` deltas (0.195-0.349) — downstream of
a text-measurement difference, re-measure and name separately, do not
fold into `minDim`.

The canvas rule itself (`SvgGraphics#ensureVisible`'s truncating
`(int)(v + 1)`, `klimt/drawing/svg/SvgGraphics.java:129-135,143,
800-813`) is ALREADY correctly ported and jar-verified — see
`layout-ink-extent.ts`'s own module doc comment (`:1-105`, written
across mission g2-class-svg N4/N5/N11/N35/N46/N54/N60,
`plans/g2-class-svg/ledger.md`) for the full chain: `SvekResult
#calculateDimension`'s `LimitFinder` ink walk (`.delta(15,15)`, per-shape
rules — classifier box `UEmpty` full-box reservation, `UPath` plain
bbox, `UPolygon` `HACK_X_FOR_POLYGON=10`, namespace `URectangle`),
`TextBlockExporter#calculateFinalDimension`'s `+5/+5` outer margin, then
`ensureVisible`'s `+1` truncation — ALL ported in `computeClassRawInkDims`
(`:203-215`)/`computeClassDocumentDims` (`:234-270`)/
`applyClassDocumentMargin` (`:222-232`). For `camupi-97-gezi072` (`class
a; class b; a --> b : visible` — a MINIMAL fixture, no notes, no
qualifiers, no clusters) the jar's `minDim` lands in `[79,80)` and ours
in `[78,79)`: some per-shape ink rule this module already models is
short by <1px on THIS shape combination. The module's own "NOT modeled"
section (`:73-82`) names two candidates worth checking first: the
edge-label `UText` ink exception (`lollipopRowInk`, G2 N35) and the
arrowhead-extremity ink walk (`renderer-arrowhead.ts#edgeExtremityInk`,
G2 N54) — `camupi`'s only non-trivial ink source besides the two boxes
is the `: visible` edge label and its arrowhead.

## Task

1. Instrument FIRST (this is diagnosis mode — no fix before a stated
   mechanism, per `~/.claude/rules/diagnosis.md`): for `camupi-97-
   gezi072`, print the pre-margin ink dims `computeClassRawInkDims`
   actually computes, then the margined `computeClassDocumentDims`
   result, then the final truncated canvas size. Compare against `dot
   -Tplain test-results/dot-cache/class/camupi-97-gezi072/svek-1.dot`
   (`graph 1 0.80408 2.375` -> 57.894 x 171 px raw dot size — NOT the
   final SVG size, a separate input to cross-check against).
2. Identify which per-shape ink term is short: re-derive the jar's
   `minDim` by hand from the SAME `LimitFinder` rules already coded
   (classifier box, edge, arrowhead) and find the ~1px gap's source —
   likely the edge-label ink or the arrowhead ink walk under-measuring
   by a fraction of a pixel that only crosses the truncation boundary on
   fixtures this size.
3. Write the diagnosis artifact to `decision-journal.md`: mechanism,
   `file:line` origin, causal chain, what was ruled out (state
   explicitly if the canvas-rule/margin/truncation code itself was ruled
   out, since M7 already establishes that with MEDIUM confidence — your
   job is to raise it to HIGH or refute it).
4. Fix the identified per-shape ink term in `layout-ink-extent.ts`
   (or the specific ink-walk file the diagnosis names, if outside this
   file — stop 1 if so).
5. Re-measure all 13 pure cases; separately re-measure and name the 8
   sub-pixel-text cases (do not assume they share T35's fix — they may
   need T37's marker/label work, or a separate mechanism).
6. `.agent-notes/cdd-T35.md`: the confirmed mechanism; whether the 8
   sub-pixel cases are now explained or remain open.

## Read-set

`src/diagrams/class/layout-ink-extent.ts` (whole — it is short and
already carries the full jar-verified chain); `src/diagrams/class/
renderer-arrowhead.ts` (edgeExtremityInk); `plans/g2-class-svg/
ledger.md` N5, N11, N35, N46, N54, N60 (search for these anchors, do
not read the whole ledger). Java: `klimt/drawing/svg/
SvgGraphics.java:129-135,143,800-813`; `svek/SvekResult.java:126-135`;
`core/TextBlockExporter.java:200-209,751-753`; `klimt/drawing/
LimitFinder.java` (whole, if the diagnosis narrows to a specific shape
rule). Diagnosis: `diagnosis/A5-geometry.md` M7.

## Write-set

`src/diagrams/class/layout-ink-extent.ts`, its `*.test.ts` file,
`.agent-notes/cdd-T35.md`, `decision-journal.md` (diagnosis artifact +
fix summary).

## Acceptance criteria

- Given the diagnosis artifact, then it names a specific per-shape ink
  term with `file:line`, not "the canvas rule is imprecise"
- Given `camupi-97-gezi072`, `gatula-10-bifu561`, `jixamu-89-ribo225`,
  `jubobo-22-fapu993`, `kexaca-03-situ523`, `siteza-47-lixe343`,
  `tamixa-86-jiku308`, `tebore-53-tese080`, `tenomi-61-ceta987`,
  `ticuxa-26-tixo262`, `tilipa-86-suxi130`, `vafaka-92-xose973`,
  `xosiza-60-sobu480`, when re-rendered, then each is conformant
- Given `dofima-22-kofe334`, `jireze-84-loti743`, `tijira-61-fere730`,
  `sicile-99-pefa679`, `lapoma-04-vaga142`, `nenepe-70-keri784`,
  `lacote-58-sozu269`, `xefeme-77-fagu709`, then each is re-measured and
  its residual named in `decision-journal.md` (conformant if T35's fix
  happens to close it too, otherwise a distinct sub-pixel-text
  mechanism)

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the
code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all
green. `npx tsx tools/render-diff.mts` on all 21 named fixtures
before/after, structural + numeric counts. Files ≤500 lines, functions
≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: instrument before hypothesizing (diagnosis mode); re-read
`layout-ink-extent.ts`'s own module comment in full — it already
contains three prior missions' worth of jar-verified detail, most
answers are already written down there. Ask first: any stop condition
in `../README.md`. Never: touch the `ensureVisible`/margin/truncation
code (already jar-verified, HIGH confidence, not the residual); fit a
constant without re-deriving it from the `LimitFinder` rule it belongs
to.

## Commit

`fix(cdd-T35): close the sub-pixel minDim gap in <named ink term>`

Body: why — name the specific per-shape ink rule, the fixture that
proved it, and the diagnosis artifact's ruled-out list.
