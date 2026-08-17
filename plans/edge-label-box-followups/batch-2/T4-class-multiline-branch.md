# T4 — Class multi-line label branch: creole strip + per-line magic arrows

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.** Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are
vitest.

`class-layout-edge-labels.ts`'s main-label sizing has an early-return
**multi-line branch** (~`:255-270`: `lines.map(applyGuillemet)` → max width ×
line count) that runs before the magic-arrow and visibility branches. Two
residues live in it:

- **`vuresa-33-kumu160`** — `<b>Person-Meeting</b>\nMeetings/Person\n
  Fk=Meeting.PersonID`. The tag is measured literally: 140.32 + 2 = **142**
  (ours); the oracle's 128 = longest real line `Fk=Meeting.PersonID` 126.1 + 2.
  `stripCreoleMarkup` (`src/core/edge-label-box.ts:71`) exists and is not
  called here. (SI23's close-out reasoned the sign backwards — planning
  corrected it; see `decisions.md#the-two-formerly-undiagnosed-slugs`.)
- **`gobuco-16-ruke239` / `lapoma-04-vaga142`** — `ab >\ncd <\n< ef\n> gh`,
  oracle 29x54, ours 24x54. Upstream `SvekEdge.java:290-297`: when
  `Display.hasSeveralGuideLines` (`klimt/creole/Display.java:715-740`: ≥ 2
  lines and some line **starts with** `"< "` or `"> "`), each line goes through
  `StringWithArrow.addSeveralMagicArrows` (`descdiagram/command/
  StringWithArrow.java:115-127`): per line, `create9`, then if that line has a
  token `mergeLR(TextBlockArrow2(13x13), line)`, then `mergeTB` across lines.
  T12c ported only the whole-label `addMagicArrow` (:304) path.

## Task

1. In the multi-line branch, apply `stripCreoleMarkup` per line before
   measuring (after/before guillemet — read `Display.java:413-419` for the
   order and cite it). Verify with the Java that upstream measures the bold
   run at the same width in deterministic mode (`StringBounderFromWidthTable`)
   — if bold widens there, **stop** (stop 10); do not tune.
2. Port `hasSeveralGuideLines` (D6) and the per-line arrow path: per line,
   `StringWithArrow`'s token detection (read its constructor — it may accept
   both leading and trailing tokens; port what it does, `ab >` and `cd <` are
   the test), strip, `mergeLR` a `font.size × font.size` block, `mergeTB`.
   Reuse `parseMagicArrowLabel`/`class-magic-arrow.ts` where they already
   express the same rule; do not fork a second token parser.
3. SVG must agree with the box: `class-edge-geo.ts:99-135` draws the glyph for
   the whole-label path; extend it so each guide line draws its own glyph
   where the per-line box puts it (`TextBlockArrow2.java:64-65` draw offsets;
   `.80` is draw-only, never in the box).
4. Remove `vuresa`, `gobuco`, `lapoma` from the class backlog as each passes.
5. Correct the stale comment at `class-layout-edge-labels.ts:54` only if it is
   in a hunk you already touch (push-forward); otherwise leave for T5.

## Write-set

- `src/diagrams/class/class-layout-edge-labels.ts`
- `src/diagrams/class/class-magic-arrow.ts`
- `src/diagrams/class/class-edge-geo.ts`
- existing `tests/unit/class/*.test.ts` files that cover these (`class-note-link-label.test.ts`, the magic-arrow tests T12c added — find them)
- `oracle/goldens/class/label-size-backlog.json`

If `class-edge-label-lines.ts` (the T5/SI23 splitter) must change, stop and
log — it is the `shared-seam-extraction` mission's file.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:280-306`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:405-425,715-745`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/StringWithArrow.java` (whole, ~130 lines)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockArrow2.java:50-95`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/StringBounderFromWidthTable.java` (bold handling)
- `src/diagrams/class/class-layout-edge-labels.ts:240-300`, `class-magic-arrow.ts` (whole), `class-edge-geo.ts:90-140`
- `src/core/edge-label-box.ts:35-76,206-260`
- `.agent-notes/m4-single-line-width.md` (already listed above) and `.agent-notes/description-edge-label-oversizing.md` — the string-vs-TextBlock mechanism
- `plans/edge-label-box-backlog/batch-6/T12c-magic-arrow.md`, `.agent-notes/m4-single-line-width.md`
- `decisions.md#d6`, `#inline-creole-in-the-class-multi-line-branch-vuresa`, `#per-line-magic-arrows-gobuco-lapoma`
- `test-results/dot-cache/class/{vuresa-33-kumu160,gobuco-16-ruke239,lapoma-04-vaga142}/in.puml`

## Architecture decisions

D6; inherited no-fit / no-rise. T12c's `font.size` (not `ARROW_GLYPH_SIZE`)
rule holds per line.

## Acceptance criteria

- **Given** `vuresa`'s label at 13, **when** measured, **then** width 128
  (`floor(126.1)+2`), height unchanged (41); slug leaves the backlog.
- **Given** `ab >\ncd <\n< ef\n> gh`, **when** `hasSeveralGuideLines` is
  true, **then** the box is 29x54 (`gobuco`, `lapoma`); **given** a single-
  line `> foo`, **then** T12c's result is unchanged; **given** a two-line label
  with no line starting `< `/`> `, **then** the per-line path does not run.
- **Given** the class SVG for `gobuco`, **then** each guide line's glyph is
  drawn (DOT/SVG agree) — pin with a renderer test.
- **Given** the class SVG ratchet (292+ pins), **then** pins hold or move
  toward jar with the measurement journalled; no fixture rises.

## Quality bar

Four gates; `npx jiti scripts/dot-sync-report.ts class`, `shape-match-report`,
`label-box-triage`. Journal counts.

## Observability

Class DOT EQUAL (≥ 700 after T1), class backlog (10 → 7), census delta,
class SVG ratchet.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** run the per-line path for labels `hasSeveralGuideLines` rejects.
- **Never** put `.80` in a measurement.
- **Stop** on stop 10 (bold width) rather than fitting.

## Commit

`fix(T4): class multi-line labels strip creole tags and size per-line magic arrows`
