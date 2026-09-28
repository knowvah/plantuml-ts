/**
 * ISkinSimple — the skin-parameter capability interface `Display`/
 * `CreoleParser` (and, once ported, `StripeTable`/`StripeTree`/
 * `EmbeddedDiagram`) consume to reach fonts, sprites, guillemets, and a
 * `SheetBuilder`.
 *
 * Upstream: style/ISkinSimple.java (80 lines), extending
 * `klimt/sprite/SpriteContainer.java` (44 lines: `getSprite`, `guillemet`,
 * `getFromMd5`), which itself extends `text/SvgCharSizeHack.java` (46
 * lines: `transformStringForSizeHack`).
 *
 * ## Not a duplicate of `skinparam.ts`/`theme.ts`
 *
 * Checked both before writing this file (per this task's own instruction).
 * `resolveSkinparam`/`Theme` (`core/skinparam.ts`, `core/theme.ts`) are a
 * DATA-ORIENTED flattening: a raw `skinparam key -> value` map merged onto
 * a plain `Theme` object — no `getSprite`/`guillemet`/`sheet`/`getPadding`
 * OOP capability surface, no `SheetBuilder` concept at all (`Theme` is
 * consumed directly by renderers, not asked to build creole sheets). They
 * solve a different problem (resolving a *diagram's* skin) than
 * `ISkinSimple` (a *capability object* threaded through the creole engine).
 * Nothing in this port currently carries `ISkinSimple`'s responsibilities —
 * ported as a genuinely new interface, not a duplicate.
 *
 * ## Scope: full interface where a type exists, cited omissions where none does
 *
 * An `interface` costs nothing to declare in full (no implementation, no
 * behavior) — so every member with a representable TS type is included,
 * not just the `sheet(...)`/`getPadding()` pair the task names as the
 * floor. Three members are omitted, each because representing them
 * faithfully would require inventing NEW supporting infrastructure with
 * zero callers anywhere reachable from this task's write-set (T9a's own
 * `CreoleParser.ts` calls only `guillemet()`; the rest are called from
 * `StripeTable`/`EmbeddedDiagram`/preprocessor machinery, all still
 * unported — see `.agent-notes/T9a-creoleparser.md` for the full audit):
 *
 *  - `getIHtmlColorSet(): HColorSet` — this port's `HColorSet.java`
 *    equivalent (`klimt/color/HColorSet.ts`) is architecturally a set of
 *    FREE FUNCTIONS (`parseSimpleColor`, `resolveColorToSvgHex`, ...), not
 *    an OOP class with a `getColor`/`getColorOrWhite` method surface —
 *    the same data-over-object-with-methods divergence `atom/Atom.ts`'s
 *    own doc comment already documents for `CreoleAtom` vs. the OOP
 *    `Atom`. Representing this member would mean inventing a NEW wrapper
 *    class duplicating those free functions for a member with no caller
 *    in scope — the exact "second builder" ADR-1/ADR-2/ADR-7 reject.
 *  - `options(): ConfigurationStore<OptionKey>` — `preproc/ConfigurationStore`
 *    /`preproc/OptionKey` are unported preprocessor-configuration
 *    machinery; zero callers reachable from this task.
 *  - `getPathSystem(): PathSystem` — `nio/PathSystem.java` is a
 *    filesystem-path abstraction; likely BLOCKED ON THE FILE SEAM (see
 *    `utils/SignatureUtils.ts`'s doc comment for that established
 *    wording) even once someone looks at it, and has zero callers
 *    reachable from this task regardless.
 *
 * `getPragma(): Pragma` was ALSO omitted here by T9a, for the identical
 * "zero callers reachable from this task" reasoning — WRONG under the
 * ADR-8 corollary the moment a real caller exists, and T10a's own
 * `CreoleHorizontalLine.ts` doc comment already names this exact gap as
 * a live blocker (`.agent-notes/T10a-separator-primitives.md`). `skin/
 * Pragma.java` is now ported (T10b, `skin/Pragma.ts`) and `getPragma()`
 * is added below.
 *
 * `getPragma()` is REQUIRED here, matching `ISkinSimple.java:75`
 * (`public Pragma getPragma();` — a Java interface member, so required by
 * construction).
 *
 * T10b first added it as `getPragma?()`, OPTIONAL, because making it
 * required broke four pre-existing `ISkinSimple`-shaped test doubles —
 * one of which (`legacy/StripeTree.test.ts`) belonged to a sibling task
 * running concurrently and was therefore untouchable from inside that
 * task. That was a sound call under the constraint and a divergence from
 * upstream's contract regardless: optional-vs-required changes what
 * implementors must provide, and a caller that must guard `getPragma?.()`
 * is a different program from one that may simply call it.
 *
 * The orchestrator made it required once the tree settled and no sibling
 * was in flight, updating all four doubles. Recorded because "a faithful
 * port overrides a short-term patch" is this mission's standing guidance,
 * and weakening an interface to keep test fixtures compiling is precisely
 * the short-term patch it rules out.
 *
 * Note the tempting-but-wrong precedent: `shape/TextBlock.ts`'s
 * `getMagneticBorder?()` IS optional here. That one is a genuine scope
 * reduction with a documented default resolver; this one had no caller
 * needing a default — only fixtures needing an edit.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinSimple.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainer.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/text/SvgCharSizeHack.java
 */
import type { SheetBuilder } from '../klimt/creole/SheetBuilder.js';
import type { CreoleMode } from '../klimt/creole/CreoleMode.js';
import type { FontConfiguration } from '../klimt/shape/UText.js';
import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { ClockwiseTopRightBottomLeft } from '../klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { Sprite } from '../klimt/sprite/Sprite.js';
import type { GuillemetPair } from '../text/Guillemet.js';
import type { Pragma } from '../skin/Pragma.js';

/**
 * D3 (cdd6 T1b): the style-cascade-resolved hyperlink colour a `[[url]]`
 * atom's initial `FontConfiguration` is built with (`StripeSimple.java
 * :224-225` builds the url atom off the CURRENT `fontConfiguration`, whose
 * `hyperlinkColor` field is populated by `FontConfiguration.create(skinParam,
 * style, colors)` reading `style.value(PName.HyperLinkColor)`,
 * `FontConfiguration.java:213-219` / `Style.java:265`).
 *
 * NOT named `getHyperlinkColor` (upstream's `ISkinSimple.java` itself has no
 * such member at all — the style-based lookup lives inline in
 * `FontConfiguration.create`, not on `ISkinSimple`): this port's
 * `abel/ISkinParam.ts` ALREADY declares a REAL, consumed
 * `getHyperlinkColor(): HColor` (`abel/Entity.ts:170`, feeding the SEPARATE
 * "richer" `abel/FontConfiguration.ts` — decisions.md#D3's own "stays
 * separate" carve-out) with an incompatible return type (`HColor` vs a
 * resolved hex `string`). `MethodsOrFieldsAreaSkinParam`
 * (`cucadiagram/MethodsOrFieldsAreaConfig.ts`) extends BOTH `ISkinParam` and
 * `ISkinSimple` — reusing the same name there is a genuine TS2320 interface-
 * merge conflict (two non-identical signatures for one property name),
 * confirmed by a minimal repro (`interface C extends A, B` with differing
 * `getHyperlinkColor` return types → `tsc` TS2320), not a style preference.
 *
 * Optional, mirroring `getPragma`'s own T10b precedent above: making this
 * REQUIRED today would break every OTHER `ISkinSimple`-shaped test double in
 * the tree (`StripeTree.test.ts`, `CreoleHorizontalLine.test.ts`,
 * `CreoleParser.test.ts`, `Display.test.ts`, `StripeTable.test.ts`,
 * `BodyEnhanced2.test.ts` — none in this task's write-set). A later closing
 * task, once no sibling is in flight, should promote it to required and
 * update those doubles, per `getPragma`'s own doc comment above.
 */
export interface ISkinSimple {
  // -- klimt/sprite/SpriteContainer.java (via extends) --
  getSprite(name: string): Sprite | null;
  guillemet(): GuillemetPair;
  getFromMd5(md5: string): string | null;

  // -- text/SvgCharSizeHack.java (via extends, transitively) --
  transformStringForSizeHack(s: string): string;

  // -- style/ISkinSimple.java's own members --
  getValue(key: string): string | null;
  values(): ReadonlyMap<string, string>;
  getPadding(): ClockwiseTopRightBottomLeft;
  getMonospacedFamily(): string;
  getTabSize(): number;
  getDpi(): number;
  copyAllFrom(other: ReadonlyMap<string, string>): void;
  getPragma(): Pragma;
  /** See this interface's own file doc comment (D3, cdd6 T1b) for why this
   *  is neither named `getHyperlinkColor` nor required. */
  getStyleHyperlinkColor?(): string | null;

  sheet(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    creoleMode: CreoleMode,
  ): SheetBuilder;
  sheet(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    creoleMode: CreoleMode,
    stereo: FontConfiguration,
  ): SheetBuilder;
}
