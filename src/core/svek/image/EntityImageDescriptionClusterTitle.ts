/**
 * A group's title block: `ClusterHeader#getTitleBlock` builds it with
 * `label.create(fontConfiguration, alignment, g.getSkinParam())` (`ClusterHeader.java:128`) -- `Display#create`
 * -> `DisplayCreole` -> the creole `Sheet` (`SheetBlock1`/`SheetBlock2`, whose `drawU` wraps the ug in a
 * `UGraphicStencil`, `SheetBlock2.java:99`). That is the same path `BodyFactory.create3` takes for a leaf
 * description, so a `----` separator (`CreoleHorizontalLine`, a 10x10 atom drawn at half height), a `* x`
 * bullet and its 6-px indent all come out of the one parser instead of the `buildTextBlock` substitute.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:128
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/SheetBlock2.java:99
 */
import type { FontConfiguration } from '../../klimt/shape/UText.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import type { HorizontalAlignment } from '../../klimt/geom/HorizontalAlignment.js';
import { Display } from '../../klimt/creole/Display.js';
import { Pragma } from '../../skin/Pragma.js';
import type { GuillemetPair } from '../../text/Guillemet.js';
import type { AtomImageResolver } from '../../creole-atoms.js';
import { buildLocalSkinSimple, descAtomOps } from './EntityImageDescriptionDelegates.js';
import type { EmojiArtworkResolver } from './EntityImageDescriptionEmoji.js';

/** What the creole parser needs beyond the text itself. */
export interface ClusterTitleOptions {
  readonly resolveAtomImage?: AtomImageResolver | undefined;
  readonly emojiArtwork?: EmojiArtworkResolver | undefined;
  readonly guillemet?: GuillemetPair | undefined;
}

/**
 * `Display.create(lines).create(fontConfiguration, alignment, skinParam)` for a group label. `text` is the
 * already-split display (one `\n` per source line, this port's `entity.getDisplay()` convention -- see
 * `EntityImageDescriptionDelegates.ts#buildDesc`). An anonymous group (`display === ''`) has no line at all and
 * measures 0x0 (`StripeSimple.java:125-126`'s `" "` atom is only for a Display that HAS a line).
 */
export function buildClusterTitle(
  text: string,
  font: FontConfiguration,
  alignment: HorizontalAlignment,
  options: ClusterTitleOptions = {},
): TextBlock {
  const atomOps = descAtomOps(options.resolveAtomImage, options.emojiArtwork);
  const skinParam = buildLocalSkinSimple(options.guillemet, atomOps, Pragma.createEmpty());
  return Display.create(text.length === 0 ? [] : text.split('\n')).create(
    { fontConfiguration: font, spriteContainer: skinParam, atomOps },
    alignment,
  );
}
