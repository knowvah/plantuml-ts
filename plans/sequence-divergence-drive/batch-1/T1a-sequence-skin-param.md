# T1a — `sequence-skin-param.ts`: the sequence style seam

Agent: `typescript-pro`, worktree `sdd1-T1a`. Commit:
`feat(sequence): port the sequence style dispatch and signatures`.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec — read the method bodies, not
summaries, and cite `file:line` for every constant. The sequence engine
(`src/diagrams/sequence/`) imports nothing from `src/core/style/`, so the
jar's `plantuml.skin` values never reach it (e.g. `element { LineThickness
0.5 }` `plantuml.skin:91-93`, `participant { RoundCorner 5 }` `:193-195`);
this floors ~1100 of 1143 fixtures. Upstream: every event captures
`getSkinParam().getCurrentStyleBuilder()` at its command
(`sequencediagram/SequenceDiagram.java:130,172,248,270,289,372,428`), and each
graphic element merges a `StyleSignature` (`skin/ComponentType.java:75-111`).
Mindmap, wbs and salt already run on the ported builder. This task builds the
module everything else in sdd1 consumes; it changes no output.

## Task
1. **Dispatch** — port wbs's per-command style dispatch for sequence:
   `createSequenceStyleDispatch(source: UmlSource)` and
   `executeDeclarationsBefore(dispatch, position)` with the same semantics as
   `src/diagrams/wbs/WBSDiagramFactory.ts:160-200` (`StyleParsingException`
   → `ParseRefusal`, line 0), built on `createMindmapSkinParam` /
   `positionedDeclarationsOf` / `executeDeclaration`
   (`src/core/style/mindmap-style-builder.ts`). Expose the current
   `StyleBuilder` (`getCurrentStyleBuilder()`).
2. **Signatures** — one function per upstream source, each with `@see`:
   `ComponentType.getStyleSignature` (`ComponentType.java:75-111`, every
   branch incl. `DESTROY` → `LifeEventType.java:47-50`);
   `AbstractMessage.getStyleSignature` (`AbstractMessage.java:75-80`, the
   `arrow` signature and any stereotype/clickable additions it makes);
   `ParticipantType` per kind (`ParticipantType.java:54-82`) with
   `Participant.java:82-96`'s `addClickable` / `withTOBECHANGED(stereotype)` /
   `forStereotypeItself`; `NoteStyle` (`NoteStyle.java:46-74`) with
   `Note.java:71-82`'s stereotype merge and `eventuallyOverride(colors)`;
   `Grouping.java:58-62`; `Reference.java:66-67`; `Doll.java:103-108`
   (englober/box); `Newpage.java:48`; `Delay.java:51`; `Divider.java:51`.
   `src/core/sequence-shadowing.ts` already encodes the participant-kind and
   note tables for shadowing — reuse its knowledge, do not import across
   (T3b retires that file).
3. **Paint** — `interface SequencePaint` and `paintOf(style: Style)`: stroke
   color, thickness, dash (`Style.getStroke()` / `PName.LineStyle`), fill
   (`BackGroundColor`), `RoundCorner`, `DiagonalCorner`, padding, margin,
   font configuration, shadowing, horizontal alignment — exactly the reads
   the `ComponentRose*` classes make (`skin/rose/*.java`; list each in a
   comment). Colors as the SVG strings the klimt driver emits.
4. **Tests first** (`tests/unit/sequence/sequence-skin-param.test.ts`):
   every signature table row; default-skin paint for participant, lifeline,
   activation box, arrow, note, group, separator, delay, newpage, destroy,
   box (each expected value cites `plantuml.skin:N`); a `skinparam` and a
   `<style>` applied only to declarations before a position; a bad `<style>`
   → refusal.

## Write-set
`src/diagrams/sequence/sequence-skin-param.ts`,
`tests/unit/sequence/sequence-skin-param.test.ts` (500-line cap: a forced
split into `sequence-skin-param-*.ts` is push-forward — journal it).

## Read-set
`decisions.md#d1`–`#d4`; `src/diagrams/wbs/WBSDiagramFactory.ts:130-200`;
`src/diagrams/wbs/wbs-skin-param.ts` (whole, 268); `src/core/style/
mindmap-style-builder.ts:1-120,200-260`; `src/core/style/Style.ts:120-320`;
`src/core/sequence-shadowing.ts` (whole); `src/core/block-extractor.ts:40-90`
(`UmlSource`); `~/git/plantuml/src/main/resources/skin/plantuml.skin:1-202`;
Java: `skin/ComponentType.java`, `sequencediagram/{AbstractMessage,
Participant,ParticipantType,Note,NoteStyle,Grouping,Reference,Doll,Newpage,
Delay,Divider,LifeEventType}.java`, `skin/rose/Rose.java`,
`skin/rose/ComponentRoseParticipant.java`.

## Interface contracts (outputs, consumed by T1b, T1c, T2*, T3*)
```ts
export interface SequenceStyleDispatch { /* opaque */ }
export function createSequenceStyleDispatch(source: UmlSource): SequenceStyleDispatch;
export function executeDeclarationsBefore(d: SequenceStyleDispatch, position: number): ParseRefusal | null;
export function currentStyleBuilder(d: SequenceStyleDispatch): StyleBuilder;
export type SequenceComponentType = 'PARTICIPANT_HEAD' | 'PARTICIPANT_TAIL' | 'PARTICIPANT_LINE'
  | 'ACTIVATION_BOX' | 'DESTROY' | 'DIVIDER' | 'ENGLOBER' | 'NEWPAGE' | 'NOTE' | 'DELAY_TEXT' | 'DELAY_LINE';
export function componentStyle(b: StyleBuilder, t: SequenceComponentType): Style;
export function messageStyle(b: StyleBuilder, stereotype?: Stereotype, url?: Url): Style;
export function participantStyle(b: StyleBuilder, kind: SequenceParticipantSName, stereotype?: Stereotype, url?: Url): { style: Style; stereo: Style };
export function noteStyle(b: StyleBuilder, kind: SequenceNoteStyle, stereotype?: Stereotype, colors?: Colors): Style;
export function groupingStyle(b: StyleBuilder, header: boolean): Style;   // and referenceStyle, englober/box
export interface SequencePaint {
  readonly stroke: string | undefined; readonly thickness: number; readonly dash: readonly number[] | undefined;
  readonly fill: string | undefined; readonly roundCorner: number; readonly diagonalCorner: number;
  readonly padding: ClockwiseTopRightBottomLeft; readonly margin: ClockwiseTopRightBottomLeft;
  readonly font: FontConfiguration; readonly shadowing: number; readonly align: HorizontalAlignment | undefined;
}
export function paintOf(style: Style, colorSet: HColorSet): SequencePaint;
```
Exact names may follow upstream more closely; any rename is journaled and
the dependents' specs are updated in the same commit.

## Acceptance
- Given an empty source, when `componentStyle(b, 'PARTICIPANT_HEAD')`, then
  `paintOf` gives thickness 0.5 and roundCorner 5 (`plantuml.skin:91-93,
  193-195`); `PARTICIPANT_LINE` gives thickness 0.5 and dash `[5,5]`
  (`plantuml.skin:141-143`).
- Given `skinparam participantBorderThickness 2` before position 3, then the
  builder after `executeDeclarationsBefore(d, 3)` gives thickness 2 and the
  builder before it gives 0.5.
- Given a `<style>` block after an event, then only a builder captured after
  it sees the change.
- Given a malformed `<style>`, then `executeDeclarationsBefore` returns a
  refusal at line 0.
- Given `grep -rn "core/style/" src/diagrams/sequence`, then only this
  module matches, and no other file changed.

Quality bar: targeted vitest (`tests/unit/sequence/sequence-skin-param*`) +
typecheck + eslint; 90/90/90 on the new file. Boundaries: no edit under
`src/core/style/**` (stop 8); no other sequence file changes (T1b/T1c own
them); no Serena edit tools. Observability: N/A — no new observable
operations. Rollback: Reversible.
