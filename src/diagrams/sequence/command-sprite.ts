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
 * ## Registration is deliberately withheld — the payload has no `Sprite` kind
 *
 * Upstream's `executeArg` (`CommandSpriteBase64.java:84-91`) decodes the
 * Base64 to bytes, hands them to `SImageIO.read`, and registers a
 * `SpriteImage` — whose `asTextBlock` (`klimt/sprite/SpriteImage.java:70-99`)
 * draws the decoded raster through `UImage#muteColor`/`#monochrome`, i.e. a
 * per-pixel recolour of real image data.
 *
 * This port has no such sprite kind. `SpriteRegistry` entries are consumed by
 * `core/creole-atoms-image-resolver.ts#resolveSpriteAtom:274-296`, which
 * resolves a name to either a `SpriteSvg` (verbatim SVG re-emitted) or, via
 * `getSpriteMonochrome`'s UNCHECKED cast (`core/sprite-registry.ts:184-190`),
 * a `SpriteMonochrome` whose `getGray(x, y)` grid `spriteMonochromeAsLike`
 * (`klimt/sprite/sprite-raster.ts:74-81`) then reads. Registering a
 * `{ width, height }`-only entry under a name therefore does not degrade — it
 * throws `TypeError: sprite.getGray is not a function` the moment the name is
 * referenced. Building a real entry needs a PNG *decoder* (this port has only
 * the fixed-block *encoder* at `klimt/sprite/deflate-fixed.ts`) plus a third
 * branch in that resolver: both under `src/core/`, both outside this
 * task's boundary.
 *
 * So the line is fully consumed — which is the parse-level defect it was
 * pinned for — and the name is recorded on the registry's existing
 * "definition consumed, registration skipped" shelf, the same shelf
 * `sprite-commands.ts#registerSvg:274-283` uses for an SVG whose dimensions
 * cannot be derived. `resolveSpriteAtom` then takes its unknown-name branch
 * (`:282`, `StripeSimple.addSprite`'s own skip), so `<$name>` contributes
 * nothing rather than crashing.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteBase64.java:59-92
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommonCommands.java:79
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteImage.java:61-99
 */

import type { SpriteRegistry } from '../../core/sprite-commands.js';

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
const BASE64_SPRITE_RE = new RegExp(
  '^sprite\\s+' + NAME + '\\s+' + PNG_DATA_URI_PREFIX + BASE64_DATA + '$',
  'i',
);

/**
 * Tries `CommandSpriteBase64`'s grammar at line `i`, mutating `registry` in
 * place on a match. Returns `null` (no mutation) when line `i` is not an
 * inline Base64 PNG sprite definition.
 *
 * Both of upstream's outcomes consume the line: a decodable payload is
 * `CommandExecutionResult.ok()` (`:88`) and an undecodable one is
 * `CommandExecutionResult.error("Cannot decode Base64 PNG sprite.")` (`:90`).
 * They are NOT distinguished here, and deliberately so: this port registers
 * nothing on either path (see the file doc), so decoding the payload to pick
 * between two identical outcomes would be a check with no observable effect.
 */
export function matchSpriteBase64Command(
  lines: readonly string[],
  i: number,
  registry: SpriteRegistry,
): { consumed: number } | null {
  const match = BASE64_SPRITE_RE.exec((lines[i] ?? '').trim());
  if (match === null) return null;
  registry.skippedColorSprites.push(match[1]!);
  return { consumed: 1 };
}
