/**
 * `CommandSpriteBase64` — `sprite $name data:image/png;base64,<payload>`, the
 * inline-image sprite definition.
 *
 * Upstream registers it in `CommonCommands#addCommonCommands2`
 * (`command/CommonCommands.java:79`), immediately after the two
 * `CommandFactorySprite` forms (`:76-77`) that `core/sprite-commands.ts`
 * already ports, and `SequenceDiagramFactory#initCommandsList:100` reaches it
 * through `addCommonCommands1` (`CommonCommands.java:54-56`). It is therefore
 * a SHARED command, not a sequence one; it lives under `src/diagrams/
 * sequence/` only because this task's write-set excludes `src/core/`. The
 * signature deliberately mirrors `matchSpriteCommand`'s
 * `(lines, i, registry) => { consumed } | null`, so moving the body into
 * `core/sprite-commands.ts` later is a file move plus one call-site deletion —
 * see the mission report's `sprite-base64-command-to-core` follow-on.
 *
 * Dispatch position: `parser.ts#dispatchAnnotationOrSprite` runs it directly
 * after `matchSpriteCommand`, i.e. after the multiline/single-line/SVG/`jar:`
 * grammars rather than between the single-line and SVG ones as upstream's
 * list orders them (`:77` then `:79` then `:82`). Not observable: the four
 * grammars `matchSpriteCommand` tries are disjoint from this one — the
 * encoded forms' `DATA` token is `([-_A-Za-z0-9]+)`
 * (`CommandFactorySprite.java:88`), which cannot span the `:`, `/`, `;` and
 * `,` of a `data:image/png;base64,` prefix; the SVG forms require `<svg`; and
 * the `jar:` form requires that literal prefix.
 *
 * ## Registration
 *
 * Upstream's `executeArg` (`CommandSpriteBase64.java:84-91`) decodes the
 * Base64 to bytes, hands them to `SImageIO.read`, and registers a
 * `SpriteImage` (`system.addSprite(NAME, new SpriteImage(...))`, `:88`),
 * whose `asTextBlock` (`klimt/sprite/SpriteImage.java:70-99`) draws the
 * decoded raster. This port has that sprite kind (`SpriteImage`, ufp-T3a,
 * resolved by `core/creole-atoms-image-resolver.ts#resolveImageSpriteAtom`)
 * and a PNG reader (`core/internal-sprite-store.ts#readPng`, which covers the
 * 8-bit RGBA and indexed encodings), so a decodable payload registers.
 *
 * An undecodable one is `CommandExecutionResult.error("Cannot decode Base64
 * PNG sprite.")` (`:90`); the line is still consumed, and the name goes on
 * the registry's "definition consumed, registration skipped" shelf -- the same
 * shelf `sprite-commands.ts#registerSvg` uses -- so `<$name>` then takes
 * `resolveSpriteAtom`'s unknown-name branch rather than crashing.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteBase64.java:59-92
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommonCommands.java:79
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteImage.java:61-99
 */

import { SpriteImage } from '../../core/klimt/sprite/SpriteImage.js';
import { readPng } from '../../core/internal-sprite-store.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { addSprite } from '../../core/sprite-registry.js';

/** `data:image/png;base64,` — the literal `RegexLeaf` between `NAME` and
 *  `DATA` (`CommandSpriteBase64.java:67`). */
const PNG_DATA_URI_PREFIX = 'data:image/png;base64,';

/** `\$?([-.%pLN_]+)` (`CommandSpriteBase64.java:64-65`) — identical to the
 *  `NAME` fragment `core/sprite-commands.ts:68` already builds, including its
 *  documented `%pLN_` -> `\w` narrowing. */
const NAME = '\\$?([-.\\w]+)';

/** `([A-Za-z0-9+/=]+)` (`CommandSpriteBase64.java:68`). */
const BASE64_DATA = '([A-Za-z0-9+/=]+)';

/** Built by string concatenation and `new RegExp(..., 'i')` — `'i'` because
 *  upstream compiles every `RegexConcat` with `Pattern.CASE_INSENSITIVE`
 *  (`regex/Pattern2.java:114`), matching `core/sprite-commands.ts`'s own
 *  sprite patterns. */
const BASE64_SPRITE_RE = new RegExp('^sprite\\s+' + NAME + '\\s+' + PNG_DATA_URI_PREFIX + BASE64_DATA + '$', 'i');

/** `Base64Coder.decode` (`CommandSpriteBase64.java:85`) over the grammar's own
 *  `[A-Za-z0-9+/=]+` payload; `undefined` for a payload `atob` rejects. */
function decodeBase64(data: string): Uint8Array | undefined {
  try {
    return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
}

/**
 * Tries `CommandSpriteBase64`'s grammar at line `i`, mutating `registry` in
 * place on a match. Returns `null` (no mutation) when line `i` is not an
 * inline Base64 PNG sprite definition.
 *
 * Both of upstream's outcomes consume the line (`:88`, `:90`); only a payload
 * that decodes to an image registers (`:87-88`).
 */
export function matchSpriteBase64Command(
  lines: readonly string[],
  i: number,
  registry: SpriteRegistry,
): { consumed: number } | null {
  const match = BASE64_SPRITE_RE.exec((lines[i] ?? '').trim());
  if (match === null) return null;
  const bytes = decodeBase64(match[2]!);
  const image = bytes === undefined ? undefined : readPng(bytes);
  if (image === undefined) registry.skippedColorSprites.push(match[1]!);
  else addSprite(registry, match[1]!, new SpriteImage(image));
  return { consumed: 1 };
}
