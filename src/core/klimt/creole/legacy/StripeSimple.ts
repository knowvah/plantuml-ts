/**
 * StripeSimple — builds one physical creole display line's flat `CreoleAtom`
 * sequence: plain-text runs interleaved with `<img>`/`<$sprite>`/`<latex>`
 * atoms, each text run carrying its own resolved `FontConfiguration` (nested
 * `<b>`/`**`/etc. runs collapse into this flat sequence — matching the jar's
 * one-`<text>`-per-styled-run SVG output, this mission's cutover charter).
 *
 * Upstream: klimt/creole/legacy/StripeSimple.java — `analyzeAndAdd`
 * (cell-alignment strip, `CharHidder.hide`, then the HEADING/HORIZONTAL_LINE/
 * else dispatch), `modifyStripe`+`searchCommand`+`addPending` (the
 * character-by-character command scan), `fontConfigurationForHeading`,
 * `getAtoms()`'s "empty stripe -> one space atom" fallback. Ported: all of
 * the above except the HORIZONTAL_LINE branch (already correctly handled by
 * `EntityImageDescriptionSupport.ts`'s pre-existing separator-line drawing —
 * see `buildStripeAtoms`'s doc comment for why that branch is dispatched by
 * the CALLER, not here) and `manageCellAlignment`/`CharHidder.hide` (no
 * `<left>`/`<center>`/`<right>` cell-alignment markup or hidden-newline
 * sentinel reaches a descdiagram entity display in this port — cell
 * alignment is a creole-TABLE-cell-only feature, tables are a separate,
 * already-ported subsystem, `core/creole.ts`).
 *
 * Composition order (E2r/L2 correction of L1's own integration decision,
 * journaled — `plans/e2r-creole/decision-journal.md`): L1 ran SI5b+E2r T6's
 * `scanLineForAtoms` (`core/creole-atoms.ts`) as a PRE-PASS over the whole
 * line to carve out `<img>`/`<$sprite>` atoms BEFORE running the style-run
 * splitter on each remaining text SEGMENT independently. That composition
 * is provably wrong whenever a color/size/font command's captured inner
 * text itself CONTAINS an atom (`<color:red><$Batch></color>`, a real
 * corpus pattern — 10 fixtures, `usecase/nenedo-78-fiva569` jar-verified
 * 2026-07-15): the pre-pass splits the command's activation tag into one
 * segment and its deactivation tag into a LATER segment (the atom sits
 * between them), so `matchLegacy`'s "shortest run up to the deactivation
 * tag" search never sees the closing tag at all (it is not in the same
 * segment) and the command falls through as literal, unstyled text —
 * differently wrong from the jar, which tints the sprite. Upstream's REAL
 * architecture is a single unified per-character scan:
 * `CommandCreoleImg`/`CommandCreoleSprite` are registered in the exact same
 * `searchCommand` starter map as the style/size/color commands
 * (`CommandCreoleBuilder.java` :106,114) — there is no separate "atom pass".
 * `modifyStripe` below now mirrors that: at each position it tries a creole
 * command first, then an inline atom
 * (`core/creole-atoms.ts#matchAtomAt`, reusing T6's already-tested regex
 * recognizers rather than re-deriving them), then falls back to plain-text
 * accumulation — so an atom recognized INSIDE a command's recursive
 * `analyzeAndAddInline` call (the SAME function) is now interleaved
 * correctly with the active font state, matching the jar exactly for this
 * class of input. This is a behavior-preserving refactor for every input
 * with no atom/command boundary crossing (verified: the old segment-by-
 * segment walk and the new single-pass walk produce byte-identical
 * `CreoleAtom[]` output whenever no atom sits inside a command's capture —
 * each still becomes its own flushed text run at the same boundary).
 */
import type { FontConfiguration } from '../../shape/UText.js';
import { FontStyle } from '../../shape/UText.js';
import type { CreoleAtom, CreoleAtomUrl } from '../atom/Atom.js';
import type { Command, StripeBuilder } from '../command/Command.js';
import { CREOLE_COMMANDS, CREOLE_COMMANDS_OTHER } from './CommandCreoleBuilder.js';
import { CreoleMode } from '../CreoleMode.js';
import { scanLineForAtoms, matchAtomAt, type InlineAtomToken } from '../../../creole-atoms.js';
import { classifyStripeLine, type StripeClassification } from './CreoleStripeSimpleParser.js';
import { resolveTextEscapes } from '../../../text-escapes.js';
import { MONOSPACED } from '../Parser.js';
import { retrieveEmoji } from '../Emoji.js';
import { emojiFactor } from '../atom/AtomEmoji.js';
import { resolveColorToSvgHex } from '../../color/HColorSet.js';

/** Font for an `<img>` cannot-decode/error fallback text run —
 *  `AtomImg.create` (`AtomImg.java:106-107`) hardcodes
 *  `UFontFactory.monospace(14)` + `FontConfiguration.blackBlueTrue(font)` for
 *  EVERY such path (`(Cannot decode)`, `(File not found: …)`, `ERROR …`),
 *  unconditionally — not the creole context's font, not the diagram
 *  default. `blackBlueTrue`'s hyperlink-color/underline-stroke fields have
 *  no counterpart in this port's minimal `FontConfiguration` (`UText.ts`'s
 *  own doc comment — full class deferred); only `family`/`size`/`color`/
 *  `styles` carry over, which is everything `blackBlueTrue`'s foreground
 *  color (`HColors.BLACK`) and `UFontFace.normal()` (non-bold, non-italic)
 *  actually contribute to this port's rendering surface.
 *
 *  ADR-1 (`plans/sizer-footprint-parity/decisions.md`): a PREVIOUS mission
 *  threaded a caller-supplied fallback font here instead, believing the
 *  fallback should draw at the diagram-default font — wrong: the jar's
 *  100.362×14 measurement for `<img:x/y.svg>` is this hardcoded constant,
 *  identically with or without a `skinparam …FontSize` override. That
 *  threaded-font seam is deleted; no font is threaded from any caller. */
const IMG_FALLBACK_FONT: FontConfiguration = {
  family: MONOSPACED,
  size: 14,
  color: '#000000',
  styles: new Set(),
};

/** Upstream: `StripeSimple#searchCommand`. `line.length > pos + 2` (not
 *  `>=`) is upstream's own bound — ported verbatim, including its edge
 *  case (a 2-char starter with zero content chars remaining never looks
 *  itself up; every L1/L2 command needs >=1 content char anyway, per each
 *  form's own minimum-match rule, so this never rejects a real match).
 *  A2s R2a: `commands` is now the per-stripe map (`StripeSimple.java`'s
 *  own `this.commands` field, set FULL-vs-OTHER in its ctor java:112-115). */
function searchCommand(
  line: string,
  pos: number,
  commands: ReadonlyMap<string, readonly Command[]>,
): Command | null {
  if (line.length <= pos + 2) return null;
  const candidates = commands.get(line.slice(pos, pos + 2));
  if (candidates === undefined) return null;
  for (const cmd of candidates) {
    if (cmd.matchingSize(line, pos) !== 0) return cmd;
  }
  return null;
}

/** Upstream: `StripeSimple#fontConfigurationForHeading` (private static).
 *  I4c mechanism 2 / mechanism 5's per-line `==` heading font cascade. */
export function fontConfigurationForHeading(font: FontConfiguration, order: number): FontConfiguration {
  if (order === 0) return addStyleAndBigger(font, 4);
  if (order === 1) return addStyleAndBigger(font, 2);
  if (order === 2) return addStyleAndBigger(font, 1);
  return { ...font, styles: new Set(font.styles).add(FontStyle.ITALIC) };
}

function addStyleAndBigger(font: FontConfiguration, delta: number): FontConfiguration {
  return { ...font, size: font.size + delta, styles: new Set(font.styles).add(FontStyle.BOLD) };
}

/** The mutable per-line builder state — upstream: `StripeSimple`'s own
 *  `atoms`/`fontConfiguration` fields. A single instance is shared across
 *  one line's ENTIRE (possibly recursive, nested-style) build, matching
 *  upstream's own single-stripe-per-line lifetime. */
class StripeAtomBuilder implements StripeBuilder {
  private readonly built: CreoleAtom[] = [];
  private font: FontConfiguration;
  // A2s R2a: the FULL-vs-OTHER command map this stripe scans against —
  // upstream `StripeSimple.java`'s own `this.commands` field (ctor
  // java:112-115: FULL mode -> FULL map, every other mode -> OTHER map).
  private readonly commands: ReadonlyMap<string, readonly Command[]>;
  // G2 N40: the `[[url]]` command's active href/tooltip, set for the
  // duration of `analyzeAndAddInlineWithUrl`'s recursive call -- every
  // `'text'` atom `flushPending` produces while set gets tagged with it
  // (`CreoleAtomUrl`), restored to `undefined` on return so text OUTSIDE
  // the url command's captured label is never mistakenly tagged.
  private activeUrl: CreoleAtomUrl | undefined;

  constructor(initialFont: FontConfiguration, mode: CreoleMode = CreoleMode.FULL) {
    this.font = initialFont;
    this.commands = mode === CreoleMode.FULL ? CREOLE_COMMANDS : CREOLE_COMMANDS_OTHER;
  }

  getActualFontConfiguration(): FontConfiguration {
    return this.font;
  }

  setActualFontConfiguration(font: FontConfiguration): void {
    this.font = font;
  }

  analyzeAndAddInline(text: string): void {
    this.modifyStripe(text);
  }

  analyzeAndAddInlineWithUrl(text: string, url: string, tooltip: string): void {
    const saved = this.activeUrl;
    this.activeUrl = { url, tooltip };
    this.modifyStripe(text);
    this.activeUrl = saved;
  }

  pushLatexAtom(expr: string): void {
    this.built.push({ kind: 'latex', expr, color: this.font.color });
  }

  /** Upstream: `StripeSimple#addEmoji` (java:245-266) — unknown name ->
   *  the `¿name?` error run in RED (`AtomTextUtils.create(...,
   *  changeColor(HColors.RED))`); known name -> an `'emoji'` atom whose
   *  `factor` is `AtomEmoji`'s ctor `scale * getSize2D() / 24` and whose
   *  tint follows the `#0`/`#000`/`#black` -> ambient-font-color rule. */
  addEmoji(name: string, scale: number, forcedColor: string | null): void {
    const emoji = retrieveEmoji(name);
    if (emoji === undefined) {
      this.built.push({ kind: 'text', text: `¿${name}?`, font: { ...this.font, color: '#FF0000' } });
      return;
    }
    let col: string | null = null;
    if (forcedColor === null) col = null;
    else if (forcedColor === '#0' || forcedColor === '#000' || forcedColor === '#black') col = this.font.color;
    else col = resolveColorToSvgHex(forcedColor);
    this.built.push({
      kind: 'emoji',
      name,
      unicode: emoji.unicode,
      factor: emojiFactor(scale, this.font.size),
      color: col,
    });
  }

  /** Upstream: `StripeSimple#modifyStripe`, extended (E2r/L2, see module doc
   *  comment) to also recognize `<img>`/`<$sprite>` atoms at each position
   *  it does not recognize a creole command — the single unified scan
   *  upstream's own `searchCommand` map performs. */
  private modifyStripe(line: string): void {
    let pending = '';
    let pos = 0;
    while (pos < line.length) {
      const cmd = searchCommand(line, pos, this.commands);
      if (cmd !== null) {
        this.flushPending(pending);
        pending = '';
        pos += cmd.executeAndAdvance(line, pos, this);
        continue;
      }
      const atomMatch = matchAtomAt(line, pos);
      if (atomMatch !== null) {
        if (atomMatch.atom !== undefined) {
          this.flushPending(pending);
          pending = '';
          // G2 N41: `ambientFont` threads `this.font` (the CURRENT
          // font state at this scan position) onto the atom -- only
          // consumed by an OpenIconic glyph atom (`Atom.ts`'s own field
          // doc comment); every other atom kind ignores it, so this is a
          // zero-behavior-change addition for img/sprite.
          this.built.push({ kind: 'inline', atom: this.markUrlProvenance(atomMatch.atom), ambientFont: this.font });
        } else if (atomMatch.fallbackText !== undefined) {
          // Its own run at the hardcoded fallback font — see `IMG_FALLBACK_FONT`.
          this.flushPending(pending);
          pending = '';
          this.built.push({ kind: 'text', text: atomMatch.fallbackText, font: IMG_FALLBACK_FONT });
        }
        pos += atomMatch.length;
        continue;
      }
      pending += line[pos];
      pos += 1;
    }
    this.flushPending(pending);
  }

  /** G10: tags a `<$sprite>` atom recognized while a `[[url ...]]` command's
   *  captured label is being scanned (`activeUrl !== undefined`), the same
   *  provenance `flushPending` below already attaches to a text run. It is
   *  what lets `creole-atoms-measure.ts#spriteAtomScale` reproduce upstream's
   *  SECOND, url-only sprite constructor (`AtomTextUtils
   *  #createAtomTextForUrl`, `java:119-127`), which passes the RAW parsed
   *  scale and so skips `CommandCreoleSprite`'s `* fc.getSize2D() / 13.0`
   *  (`java:82`) — jar-verified 3.6923px per axis on a 48x48 sprite at font
   *  14 (`bivira-53-boja685`). Sprite-only: upstream's url branch passes a
   *  raw scale for openiconic/img too, but those are already raw on the
   *  ordinary path, so only the sprite kind diverges. */
  private markUrlProvenance(atom: InlineAtomToken): InlineAtomToken {
    if (this.activeUrl === undefined || atom.kind !== 'sprite') return atom;
    return { ...atom, insideUrl: true };
  }

  /** Upstream: `StripeSimple#addPending` (`AtomTextUtils.createLegacy`). */
  private flushPending(pending: string): void {
    if (pending.length === 0) return;
    this.built.push({
      kind: 'text',
      text: pending,
      font: this.font,
      ...(this.activeUrl !== undefined ? { url: this.activeUrl } : {}),
    });
  }

  /** Upstream: `StripeSimple#getAtoms()`'s "empty stripe -> one space atom"
   *  fallback, applied once the whole line has been processed. */
  finish(): readonly CreoleAtom[] {
    if (this.built.length === 0) return [{ kind: 'text', text: ' ', font: this.font }];
    return this.built;
  }
}

/**
 * Builds one already-classified (NORMAL or HEADING content) line's flat
 * atom sequence via a SINGLE unified per-character scan (see module doc
 * comment): creole style/size/color/font commands AND `<img>`/`<$sprite>`
 * atoms are recognized in the same pass, so a command's captured inner text
 * may itself contain an atom and still resolve correctly. The caller
 * (`EntityImageDescriptionSupport.ts`, `leaf-sizing.ts`) is responsible for
 * the HORIZONTAL_LINE branch (unchanged, pre-existing) and for computing
 * `font` via `fontConfigurationForHeading` when the line classified as
 * HEADING — see `legacy/CreoleStripeSimpleParser.ts`'s `classifyStripeLine`.
 */
export function buildStripeAtoms(
  line: string,
  font: FontConfiguration,
  mode: CreoleMode = CreoleMode.FULL,
): readonly CreoleAtom[] {
  const builder = new StripeAtomBuilder(font, mode);
  builder.analyzeAndAddInline(line);
  return builder.finish();
}

/**
 * Builds a line's atom sequence WITHOUT running the style-command engine —
 * img/sprite carve-out only, each remaining text segment becomes ONE plain
 * text atom verbatim. Used for `CreoleStripeSimpleParser.ts`'s `LITERAL`
 * classification (a non-empty-captured `--Header--`/`==Header==`/
 * `..Header..`-shaped line — see that module's doc comment for the
 * jar-verified reason this must NOT be style-processed: it happens to also
 * satisfy the STRIKE creole syntax as plain text, which would incorrectly
 * strike part of it). This path has no command captures to cross an atom
 * boundary, so the plain whole-line `scanLineForAtoms` pre-scan remains
 * correct and is kept (unlike `buildStripeAtoms` above).
 */
export function buildLiteralAtoms(line: string, font: FontConfiguration): readonly CreoleAtom[] {
  const scan = scanLineForAtoms(line);
  const atoms: CreoleAtom[] = [];
  for (const seg of scan.segments) {
    if (seg.kind === 'text') atoms.push({ kind: 'text', text: seg.text, font });
    else atoms.push({ kind: 'inline', atom: seg.atom, ambientFont: font });
  }
  return atoms.length === 0 ? [{ kind: 'text', text: ' ', font }] : atoms;
}

/**
 * LineBuildAtoms — one already-classified display line's classification
 * plus its built atom sequence: `atoms` is empty for a `HORIZONTAL_LINE`
 * line (nothing to measure/draw as text — the caller handles the separator
 * directly), `lineFont` is the BASE font for `NORMAL`/`LITERAL`, or the
 * heading-cascaded font (`fontConfigurationForHeading`) for `HEADING` — the
 * font every atom on this line's OWN style flags/color start from before any
 * nested `<b>`/`**`/etc. run adds more.
 *
 * ADR-1 (`plans/creole-lexer-unification/decisions.md`): the shared shape
 * BOTH `EntityImageDescriptionSupport.ts#buildLine` (renderer, a thin
 * delegate to {@link buildLineAtoms} below) and `leaf-sizing.ts
 * #creoleVisibleText` (sizer) consume — eliminating the two-lexer drift
 * that let the sizer's `parseCreole` disagree with the renderer's
 * `buildStripeAtoms`/`buildLiteralAtoms` on unclosed/`:`-variant tags.
 */
export interface LineBuildAtoms {
  readonly classification: StripeClassification;
  readonly atoms: readonly CreoleAtom[];
  readonly lineFont: FontConfiguration;
}

/**
 * Builds one RAW display line's classification + flat atom sequence — the
 * single shared "line -> visible atoms" lexer (ADR-1). Classifies the raw
 * line first (`classifyStripeLine`, so an HR is recognized before any
 * escape-decoding); a `HORIZONTAL_LINE` line carries no atoms. Otherwise
 * decodes `<U+XXXX>`/`&#NNN;` escapes (`resolveTextEscapes`, mirroring
 * upstream's per-atom `AtomText.manageSpecialChars` — S1L-b-unicode ADR-1)
 * BEFORE atoms are built, then dispatches: `LITERAL` -> `buildLiteralAtoms`
 * (no style-command engine — see that function's doc comment for why);
 * `HEADING`/`NORMAL` -> `buildStripeAtoms`, under the heading-cascaded font
 * (`fontConfigurationForHeading`) when `HEADING`, else the base font
 * unchanged. Upstream has no single method matching this exactly — it is
 * this port's own extraction of `EntityImageDescriptionSupport.ts#buildLine`
 * (pre-ADR-1)'s classification-dispatch branches into one shared helper.
 *
 * Two parameters only (sizer-footprint-parity T2): T1 had kept a 3rd,
 * ALWAYS-IGNORED `_unusedLegacyDefaultFont` slot here as a compile-
 * compatibility placeholder for `leaf-sizing-text.ts#lineTextMetrics`'s
 * own 3-argument call, since that file was out of T1's write-set. T2 owns
 * `leaf-sizing-text.ts` and dropped the dead 3rd argument at that call
 * site, so the placeholder parameter is removed here too — the `<img>`
 * cannot-decode fallback font is hardcoded (`IMG_FALLBACK_FONT`, ADR-1)
 * and no caller font ever reached it regardless. Verified by the
 * two-different-element-fonts test in
 * `tests/unit/core/klimt/creole/legacy/StripeSimple.test.ts`.
 */
export function buildLineAtoms(
  line: string,
  font: FontConfiguration,
  mode: CreoleMode = CreoleMode.FULL,
): LineBuildAtoms {
  const classification = classifyStripeLine(line);
  if (classification.type === 'HORIZONTAL_LINE') return { classification, atoms: [], lineFont: font };
  const content = classification.content;
  if (classification.type === 'LITERAL') {
    return { classification, atoms: decodeAtomEscapes(buildLiteralAtoms(content, font)), lineFont: font };
  }
  const lineFont = classification.type === 'HEADING' ? fontConfigurationForHeading(font, classification.order) : font;
  return {
    classification,
    atoms: decodeAtomEscapes(buildStripeAtoms(content, lineFont, mode)),
    lineFont,
  };
}

/**
 * `<U+XXXX>`/`&#NNN;` decoding, applied PER ATOM once the creole tokenizer has
 * split the line into runs.
 *
 * Upstream decodes in the `AtomText` CONSTRUCTOR
 * (`AtomText.java:79-81`, `manageSpecialChars`) — so it necessarily runs after
 * the style-command engine has produced the runs, and only ever sees one run's
 * own text. `AtomTextUtils.createLegacy` (`:72`) passes `true`; its sibling at
 * `:76` passes `false`, which is the whole of upstream's control over it.
 *
 * This port used to decode the WHOLE LINE before building atoms. That put a
 * decoded `<U+000A>` — a real newline — into the string the tag tokenizer then
 * scanned, and a tag after it could be left as literal text: on
 * `component/gafico-37-cuma657` the run
 * `<u:blue>ccc <U+000A> <color:green>ddd <U+000A> eee` kept `<color:green>`
 * verbatim, and that literal is 1.2in of excess node width. Minimal repro is
 * in this module's test.
 *
 * Only `text` atoms are decoded, matching upstream: an image/emoji/latex atom
 * carries a name or expression, never display text.
 */
function decodeAtomEscapes(atoms: readonly CreoleAtom[]): CreoleAtom[] {
  return atoms.map((a) => (a.kind === 'text' ? { ...a, text: resolveTextEscapes(a.text) } : a));
}
