/**
 * preprocessor-collector.ts -- the `<style>` / `skinparam` / `skin` line
 * collector `preprocessor.ts#resultOf` runs over the interpreter's finished
 * result list. Moved out of `preprocessor.ts` (line cap, cdd3-T27); see that
 * file's header for why it is not a TIM concept.
 */

import type { StringLocated } from './tim/StringLocated.js';
import { EmbeddedDiagram, getEmbeddedType } from './EmbeddedDiagram.js';

const RE_STYLE_OPEN = /^<style>$/i;
const RE_STYLE_CLOSE = /^<\/style>$/i;
// G2 N51: the key group additionally accepts an optional, directly-
// appended `<<stereotype>>` guillemet suffix with NO space before it
// (`skinparam classBorderThickness<<stereo>> 5`) -- `SkinParam#getThickness
// (LineParam, Stereotype)`'s own stereotype-qualified key lookup
// (`param.name() + "thickness" + stereotype.getLabel(...)`, java:914-915)
// has no space in that concatenation either. Without this, the ORIGINAL
// `(\w+)\s+` alternative failed to match at all (the char right after
// the key word is `<`, not whitespace), silently dropping the entire
// line -- diagnosed G2 N51 (`ragona-89-fadi984`).
// cdd-T28 (`/i`): upstream compiles EVERY command regex through
// `Pattern2.compileInternal`, whose one `Pattern.compile(regex,
// Pattern.CASE_INSENSITIVE)` (`regex/Pattern2.java:114`) covers
// `CommandSkinParam`'s own `(skinparam|skinparamlocked)` leaf
// (`command/CommandSkinParam.java:58`) and `CommandSkinParamMultilines`'s
// `^skinparam[%s]*...\{$` (java:49). So `skinParam CaptionFontSize 10` is
// an ordinary skinparam line upstream, while this port's case-SENSITIVE
// spelling dropped the whole line silently (`repuga-78-xora226`: every
// caption skinparam ignored, `preprocess()` returning an empty map).
const RE_SKINPARAM_LINE = /^skinparam\s+(\w+(?:<<[^<>]+>>)?)\s+(.+)$/i;
/** mission skin-file-loading Batch 1: `skin <name>` -- mirrors upstream's
 *  `CommandSkin` grammar (`^skin\\s+([\\w.]+)$`, see `skins-builtin.ts`'s
 *  own doc comment). The `\\s+` after the literal `skin` prefix means this
 *  can never match a `skinparam ...` line (the char right after "skin" in
 *  "skinparam" is "p", not whitespace) -- no negative lookahead needed.
 *  Case-insensitive, matching every other directive-keyword regex here. */
const RE_SKIN_LINE = /^skin\s+([\w.]+)\s*$/i;
const RE_SKINPARAM_BLOCK_OPEN = /^skinparam\s*\{$/i;
/** Selector-scoped block, e.g. `skinparam component {` -- inner entries are
 *  keyed `<selector><name>` (upstream sugar: `component { Style X }` is
 *  `skinparam componentStyle X`).
 *
 *  The selector additionally accepts a directly-appended `<<stereotype>>`
 *  suffix (`skinparam rectangle<<stereo>> {`), for the same reason
 *  RE_SKINPARAM_LINE does: without it the line failed BOTH block-open forms
 *  and fell through to RE_SKINPARAM_LINE, which happily read the key as
 *  `rectangle<<stereo>>` and the VALUE as `{` -- precisely the failure the
 *  `openSkinparam` ordering comment warns about, just never extended to the
 *  scoped form. No block was opened, so the block's BODY leaked into the
 *  diagram as content lines (`BackgroundColor #FFFFFF`, `BorderColor
 *  #FF9900`, `}`). Every awslib/tupadr3 sprite include ends in an
 *  `AWSEntityColoring(x)`-style `!definelong` that expands to exactly this
 *  block, so a stdlib-using diagram accumulated ~3 orphan lines PER SPRITE
 *  -- 53 of them ahead of the real content in kofuca-08-pafi749. That buried
 *  the actual element declarations past `descriptive-keywords.ts`'s
 *  SCAN_LINE_LIMIT, `hasDescriptiveElement` returned false, and
 *  `dispatcher.ts#resolve` fell back to the block's own detected type --
 *  handing an AWS deployment diagram to the CLASS engine, which then
 *  measured each node's raw `<img data:image/png;base64,...>` markup as
 *  label text (19214px wide vs the jar's 142px). Found closing S1L-f. */
const RE_SKINPARAM_SELECTOR_BLOCK_OPEN = /^skinparam\s+(\w+)(<<[^<>]+>>)?\s*\{$/i;
/** A stereotype sub-block inside a selector block: `<<Foo1>> {`. */
/**
 * A nested scope opener inside a `skinparam` block: any name followed by `{`.
 * Upstream's single pattern is
 * `^([\w.]*(?:\<\<.*\>\>)?[\w.]*)[%s]+(?:(\{)|(.*))$|^\}?$`
 * (`SkinLoader.java:50`), whose group 1 is the name and group 2 the brace —
 * so a stereotype scope (`<<Foo1>> {`) and an element scope (`border {`) are
 * the SAME production, not two. Upstream requires whitespace between the name
 * and the brace; `[%s]*` here also allows none, which no fixture exercises
 * either way.
 */
const RE_SKINPARAM_NESTED_OPEN = /^([\w.]*(?:<<[^<>]*>>)?[\w.]*)\s*\{$/;

/**
 * `SkinParam#cleanForKeySlow` (`SkinParam.java:283-300`), the part this port
 * needs: lower-case the key, then move every `<<stereotype>>` out of wherever
 * it sits and re-append it at the END. That is what makes
 * `skinparam object { <<Foo1>> { FontSize 8 } }` key as
 * `objectfontsize<<foo1>>` rather than `object<<foo1>>fontsize`, which the
 * two-level model this replaced had to special-case.
 *
 * The other four substitutions upstream applies (`_`/`.` removal, the
 * `sequence(participant|actor)` and `<type>arrow` collapses, `align$` ->
 * `alignment`) are NOT ported here: this port's lookup side never produced
 * them either, so adding them one-sided would change every existing key.
 */
function cleanSkinKey(key: string): string {
  const lower = key.toLowerCase();
  const stereos = [...lower.matchAll(/<<([^<>]*)>>/g)].map((m) => `<<${m[1]!}>>`);
  return lower.replace(/<<[^<>]*>>/g, '') + stereos.join('');
}
const RE_SKINPARAM_BLOCK_ENTRY = /^\s*(\w+(?:<<[^<>]+>>)?)\s+(.+)$/;
const RE_SKINPARAM_BLOCK_CLOSE = /^\s*\}\s*$/;

/**
 * The `<style>` / `skinparam` / `skin` collector: `preprocessor.ts#resultOf`
 * offers it every line of the FINISHED interpreter result list, in order --
 * the fully-substituted stream upstream's `CommandSkinParam` /
 * `CommandStyleMultilinesCSS` / `CommandSkin` dispatch over -- and it consumes
 * the ones that are not diagram content. No value needs substituting here any
 * more: `TContext#addPlain` already did (`TContext.java:455-466`).
 */
export class StyleAndSkinparamCollector {
  readonly styles: string[] = [];
  /** G2 N39: parallel to {@link styles} -- see `PreprocessorResult
   *  .stylePositions`'s doc comment. */
  readonly stylePositions: (number | undefined)[] = [];
  readonly skinparam = new Map<string, string>();
  /** mission skin-file-loading Batch 1: see `PreprocessorResult.skin`'s
   *  own doc comment. Last `skin <name>` line in the document wins (no
   *  corpus fixture repeats the directive; mirrors `skinparam`'s own
   *  last-write-wins Map semantics for a repeated key). */
  skin: string | undefined;
  /**
   * cdd4-T7b: the DECLARATION ORDER of the two streams, which the maps above
   * lose -- each key's last assignment and each `<style>` block's opening, on
   * one counter. Upstream applies both to one `StyleBuilder` in document
   * order (`SkinParam#setParam` converts a skinparam and mutes the style
   * immediately, `SkinParam.java:227-234`; a `<style>` block mutes it where
   * it is dispatched), so a later skinparam beats an earlier `<style>`
   * declaration of the same property -- which matters once `!theme` puts a
   * theme's `<style>` ahead of the document's own skinparams. Read by
   * `style-skinparam-segments.ts`.
   */
  readonly skinparamOrder = new Map<string, number>();
  /** Parallel to {@link styles}: each block's place on the same counter. */
  readonly styleOrder: number[] = [];

  private sequence = 0;
  private inStyleBlock = false;
  private readonly styleBuffer: string[] = [];
  /**
   * Upstream's `SkinLoader#context` (`SkinLoader.java:56`): the stack of
   * enclosing `NAME {` scopes inside a `skinparam` block. Non-empty exactly
   * while a block is open, at any depth. An entry's key is the whole stack
   * concatenated plus the entry name (`getFullParam()`, `:70-76`).
   */
  private readonly skinparamStack: string[] = [];
  /**
   * mmp-T6g: open `{{…` embedded-diagram depth. Upstream never dispatches
   * the lines of an embedded block as outer-diagram commands: a multi-line
   * command accumulating its lines takes everything from a `{{…` line to
   * the matching `}}` verbatim, nested blocks counted
   * (`PSystemCommandFactory.java:288-306`,
   * `addOneSingleLineManageEmbedded2`), and `EmbeddedDiagram.createAndSkip`
   * (`EmbeddedDiagram.java:97-115`) hands them to the INNER diagram. So a
   * `<style>`/`skinparam` inside `{{ }}` styles the embedded render, not the
   * outer document (`class/semutu-45-zeno907`). Tracked only outside a
   * `<style>`/`skinparam` block, whose bodies never carry `{{`.
   */
  private embeddedNesting = 0;

  /**
   * True when the line was consumed (it is not a diagram-body line).
   * `position` is the line's place in the DOCUMENT (`preprocessor.ts
   * #resultOf`), recorded for a `<style>` opening as its `stylePositions`
   * entry.
   */
  accept(line: StringLocated, position: number | undefined): boolean {
    const raw = line.getString();
    const trimmed = raw.trim();

    if (this.inStyleBlock) return this.collectStyleLine(raw, trimmed);

    if (this.skinparamStack.length > 0) return this.collectSkinparamBlockEntry(trimmed);

    if (this.skipEmbeddedLine(raw, trimmed)) return false;

    if (RE_STYLE_OPEN.test(trimmed)) {
      this.inStyleBlock = true;
      this.stylePositions.push(position);
      this.styleOrder.push(this.sequence++);
      return true;
    }
    const skinMatch = RE_SKIN_LINE.exec(trimmed);
    if (skinMatch !== null) {
      this.skin = skinMatch[1]!.trim().toLowerCase();
      return true;
    }
    return this.openSkinparam(trimmed);
  }

  /**
   * True while `raw` is part of an embedded `{{ … }}` block (its opening and
   * closing lines included): the nesting count of
   * `PSystemCommandFactory.java:291-303`.
   */
  private skipEmbeddedLine(raw: string, trimmed: string): boolean {
    if (getEmbeddedType(raw) !== null) {
      this.embeddedNesting++;
      return true;
    }
    if (this.embeddedNesting === 0) return false;
    if (trimmed === EmbeddedDiagram.EMBEDDED_END) this.embeddedNesting--;
    return true;
  }

  private collectStyleLine(raw: string, trimmed: string): boolean {
    if (RE_STYLE_CLOSE.test(trimmed)) {
      this.styles.push(this.styleBuffer.join('\n'));
      this.styleBuffer.length = 0;
      this.inStyleBlock = false;
    } else {
      // `<style>`-block content IS macro/`$variable`-substituted upstream
      // (jar-verified: `!$ACCENT="1a66c2"` + `<style>...BackgroundColor
      // $ACCENT...` renders #1A66C2). CommandStyleMultilinesCSS dispatches over
      // the post-substitution stream, same as skinparam -- NOT verbatim.
      // @see ~/git/plantuml/.../tim/TContext.java#addPlain
      this.styleBuffer.push(raw);
    }
    return true;
  }

  /**
   * One line inside a `skinparam ... { }` block, using upstream's own model:
   * a CONTEXT STACK. `SkinLoader#execute` (`SkinLoader.java:78-110`) pushes
   * `group1` on a `NAME {` line, pops on a bare `}`, and keys every entry as
   * `getFullParam() + NAME` — the whole stack concatenated. Nesting is
   * therefore unbounded and uniform; there is no special case for a
   * stereotype scope.
   *
   * This replaces an ad-hoc TWO-level model (an element selector plus one
   * nested `<<stereo>>` scope). That model had no representation for a third
   * level, so `skinparam database { border { color grey } }` left the block
   * one `}` early and LEAKED `BackgroundColor yellow`, `Font {`, `Color …`
   * and the trailing braces into `source.lines`, where the class parser then
   * refused them (`class/daxeno-00-kasu166`).
   *
   * The stereotype behaviour it did encode is preserved, because upstream
   * encodes it one level down instead: `SkinParam#cleanForKeySlow`
   * (`SkinParam.java:283-300`) strips every `<<x>>` out of the assembled key
   * and re-appends it at the END. So `object` + `<<Foo1>>` + `FontSize` keys
   * as `objectfontsize<<foo1>>`, exactly as before — see {@link cleanSkinKey}.
   */
  private collectSkinparamBlockEntry(trimmed: string): boolean {
    if (RE_SKINPARAM_BLOCK_CLOSE.test(trimmed)) {
      this.skinparamStack.pop();
      return true;
    }
    const opener = RE_SKINPARAM_NESTED_OPEN.exec(trimmed);
    if (opener !== null) {
      this.skinparamStack.push(opener[1]!.trim());
      return true;
    }
    const entry = RE_SKINPARAM_BLOCK_ENTRY.exec(trimmed);
    if (entry !== null) {
      const key = this.skinparamStack.join('') + entry[1]!.trim();
      this.setSkinparam(cleanSkinKey(key), entry[2]!.trim());
    }
    return true;
  }

  /** Block-open forms are tested before the single-line form, which would
   *  otherwise capture `{` as the parameter name. */
  private openSkinparam(trimmed: string): boolean {
    if (RE_SKINPARAM_BLOCK_OPEN.test(trimmed)) {
      this.skinparamStack.push('');
      return true;
    }
    const selectorBlock = RE_SKINPARAM_SELECTOR_BLOCK_OPEN.exec(trimmed);
    if (selectorBlock !== null) {
      this.skinparamStack.push(selectorBlock[1]!.trim() + (selectorBlock[2] ?? ''));
      return true;
    }
    const single = RE_SKINPARAM_LINE.exec(trimmed);
    if (single !== null) {
      this.setSkinparam(single[1]!.trim().toLowerCase(), single[2]!.trim());
      return true;
    }
    return false;
  }

  private setSkinparam(key: string, value: string): void {
    this.skinparam.set(key, value);
    this.skinparamOrder.set(key, this.sequence++);
  }
}
