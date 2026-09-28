/**
 * `EntityImageClassHeader.java#getCircledChar`/`#spotStyleSignature`'s
 * LeafType-specific badge letter/fill arms that `class-badge.ts`'s own
 * `badgeLetter`/`badgeFill` do not themselves distinguish -- split into
 * their own module (not just a sibling function in `class-badge.ts`)
 * purely to keep that file under the repo's 500-line cap, mirroring
 * `class-badge-glyph-data.ts`'s own split precedent (T21).
 *
 * cdd5-T3e (badge-leaftype-spot-unported, `diagnosis/S1-text.md`): the
 * parser ported the dataclass/struct/exception/metaclass/stereotype/record
 * `ClassifierKind` members, but the badge still mapped every one of them to
 * the class letter ('C') and fill (`#ADD1B2`, `spotClass`) -- upstream gives
 * each its own circled character and `spot<Kind>` style.
 */
import type { ClassifierKind } from './ast.js';
import type { BadgeLetter } from './class-badge-glyph-data.js';

/**
 * `root { BackGroundColor: var(--common-background); }` (`skin/plantuml
 * .skin:2,16`, `--common-background: #f1f1f1`) -- the style cascade's
 * ULTIMATE fallback once a `spot<Kind>` signature has no entry ANYWHERE in
 * `spot { ... }` (`plantuml.skin:239-273`) to merge from. Reached by
 * `spotProtocol`/`spotStruct` alone among the surveyed kinds (T3e,
 * `xusuxi-66-zaci221`/`zelura-55-pasa982`): every OTHER `spot<Kind>` entry
 * below has its own `plantuml.skin` block, so only these two ever fall this
 * far up the `{root, element, spot, spot<Kind>}` signature.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:2,16,239-273
 */
export const SPOT_ROOT_BACKGROUND_FALLBACK = '#F1F1F1';

/**
 * `getCircledChar(LeafType)`'s arms for the six `ClassifierKind` members
 * `class-badge.ts#badgeLetter` does not itself distinguish. `undefined` for
 * every kind `badgeLetter` already handles (or deliberately leaves at its
 * 'C' default).
 * @see ~/git/plantuml/.../svek/image/EntityImageClassHeader.java:213-214,
 *   215-216,217-218,219-220,221-222,253-254,245-246,247-248,249-250,251-252
 */
export function leafTypeBadgeLetter(kind: ClassifierKind): BadgeLetter | undefined {
  switch (kind) {
    case 'struct':
      return 'S';
    case 'exception':
      return 'X';
    case 'metaclass':
      return 'M';
    case 'stereotype':
      return 'S';
    case 'dataclass':
      return 'D';
    case 'record':
      return 'R';
    default:
      return undefined;
  }
}

/**
 * `spotStyleSignature(LeafType)`'s arms for the six `ClassifierKind`
 * members `class-badge.ts#badgeFill` does not itself distinguish.
 * dataclass/metaclass/stereotype/exception/record each have their OWN
 * `plantuml.skin` `spot<Kind>` block; protocol/struct have none, so they
 * fall through the style cascade all the way to `root`'s own default
 * ({@link SPOT_ROOT_BACKGROUND_FALLBACK}). `undefined` for every kind
 * `badgeFill` already distinguishes or does not survey.
 * @see ~/git/plantuml/.../svek/image/EntityImageClassHeader.java:221-222,
 *   217-220,249-252,215-216,247-248,213-214,245-246,211-212,209-210
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:239-273
 */
export function leafTypeSpotFill(kind: ClassifierKind): string | undefined {
  switch (kind) {
    case 'dataclass':
      return '#7E57C2'; // spotDataClass
    case 'metaclass':
      return '#CCCCCC'; // spotMetaClass
    case 'stereotype':
      return '#FF77FF'; // spotStereotype
    case 'exception':
      return '#D94321'; // spotException
    case 'record':
      return '#FF8F00'; // spotRecord
    case 'protocol':
    case 'struct':
      return SPOT_ROOT_BACKGROUND_FALLBACK; // no spot<Kind> skin entry
    default:
      return undefined;
  }
}

/**
 * `class-badge.ts#spotSnameForKind`'s arms for the six `ClassifierKind`
 * members it does not itself distinguish -- the SAME `SName.spot<Kind>`
 * tokens `leafTypeBadgeLetter`/`leafTypeSpotFill` above already cite,
 * lowercased to match `spotSnameForKind`'s existing 5-entry convention.
 * Unlike {@link leafTypeSpotFill}, `protocol`/`struct` DO get their own
 * bucket here: the `{root, element, spot, spot<Kind>}` STYLE SELECTOR
 * exists for both regardless of whether `plantuml.skin` ships a default
 * color for it (a user's own `<style> spotProtocol { BackgroundColor } }`
 * is still a valid override target).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/SName.java:174-187
 */
export function leafTypeSpotSname(kind: ClassifierKind): string | undefined {
  switch (kind) {
    case 'dataclass':
      return 'spotdataclass';
    case 'metaclass':
      return 'spotmetaclass';
    case 'stereotype':
      return 'spotstereotype';
    case 'exception':
      return 'spotexception';
    case 'record':
      return 'spotrecord';
    case 'protocol':
      return 'spotprotocol';
    case 'struct':
      return 'spotstruct';
    default:
      return undefined;
  }
}
