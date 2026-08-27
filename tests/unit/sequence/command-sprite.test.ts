/**
 * T11 (mission sequence-command-coverage): `command-sprite.ts` —
 * `matchSpriteBase64Command`, the port of `CommandSpriteBase64`
 * (`command/CommandSpriteBase64.java:59-92`, registered by
 * `CommonCommands.java:79`).
 *
 * Exercised BOTH directly (the matcher's own contract: consumed count,
 * registry mutation, non-match) and end-to-end through `parseSequence`, since
 * `parser.ts#dispatchAnnotationOrSprite` is its only production call site and
 * the fixture this closes (`liguma-77-mume567`) is a whole-document one.
 */
import { describe, it, expect } from 'vitest';
import { matchSpriteBase64Command } from '../../../src/diagrams/sequence/command-sprite.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { createSpriteRegistry } from '../../../src/core/sprite-commands.js';
import type { MessageEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

/** A real 1x1 transparent PNG, so the payload exercises `+`, `/` and `=`
 *  inside `CommandSpriteBase64`'s `([A-Za-z0-9+/=]+)` DATA class (java:68). */
const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const DATA_URI_PREFIX = 'data:image/png;base64,';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

function refusalLine(lines: string[]): number {
  const result = parseSequence(lines);
  if (!('refused' in result)) throw new Error('expected a refusal');
  return result.line;
}

describe('matchSpriteBase64Command', () => {
  it('consumes exactly one line and shelves the name (registering nothing)', () => {
    const registry = createSpriteRegistry();
    const line = `sprite $mySprite ${DATA_URI_PREFIX}${ONE_PIXEL_PNG}`;

    expect(matchSpriteBase64Command([line], 0, registry)).toEqual({ consumed: 1 });
    expect(registry.skippedColorSprites).toEqual(['mySprite']);
    // No `Sprite` kind in this port can carry a raster payload, so the name
    // must stay UNregistered — a `{width,height}`-only entry would reach
    // `getSpriteMonochrome`'s unchecked cast and throw at render time.
    expect(registry.byName.size).toBe(0);
  });

  it('captures NAME without the optional `$` and accepts dots and dashes', () => {
    const registry = createSpriteRegistry();
    const line = `sprite my-icon.v2 ${DATA_URI_PREFIX}${ONE_PIXEL_PNG}`;

    expect(matchSpriteBase64Command([line], 0, registry)).toEqual({ consumed: 1 });
    expect(registry.skippedColorSprites).toEqual(['my-icon.v2']);
  });

  it('matches case-insensitively, as `Pattern2.cmpile` compiles every RegexConcat', () => {
    const registry = createSpriteRegistry();
    const line = `SPRITE $Icon DATA:IMAGE/PNG;BASE64,${ONE_PIXEL_PNG}`;

    expect(matchSpriteBase64Command([line], 0, registry)).toEqual({ consumed: 1 });
    expect(registry.skippedColorSprites).toEqual(['Icon']);
  });

  it('reads line `i`, not line 0', () => {
    const registry = createSpriteRegistry();
    const lines = ['a -> b', `sprite $s ${DATA_URI_PREFIX}${ONE_PIXEL_PNG}`];

    expect(matchSpriteBase64Command(lines, 0, registry)).toBeNull();
    expect(matchSpriteBase64Command(lines, 1, registry)).toEqual({ consumed: 1 });
    expect(registry.skippedColorSprites).toEqual(['s']);
  });

  it('declines a non-PNG data URI and any other sprite grammar, mutating nothing', () => {
    const registry = createSpriteRegistry();
    const declined = [
      `sprite $s data:image/gif;base64,${ONE_PIXEL_PNG}`,
      'sprite $s [16x16/16] {',
      'sprite $s FFFF0000',
      'sprite $s <svg width="4" height="4"></svg>',
      'a -> b : hello',
    ];

    for (const line of declined) expect(matchSpriteBase64Command([line], 0, registry)).toBeNull();
    expect(registry.skippedColorSprites).toEqual([]);
    expect(registry.byName.size).toBe(0);
  });
});

describe('pinned corpus fixtures route SEQUENCE', () => {
  it('liguma-77-mume567 shape: an inline base64 sprite then a `<$name>` message', () => {
    const ast = parse([
      `sprite $mySprite ${DATA_URI_PREFIX}${ONE_PIXEL_PNG}`,
      'alice->bob: this is a <$mySprite> test',
    ]);

    expect(ast.participants.map((p) => p.id)).toEqual(['alice', 'bob']);
    const messages = ast.events.filter((e): e is MessageEvent => e.kind === 'message');
    expect(messages.map((m) => m.label)).toEqual(['this is a <$mySprite> test']);
    expect(ast.sprites?.skippedColorSprites).toEqual(['mySprite']);
  });

  it('still refuses the same line before the definition is recognised as a sprite', () => {
    // The discriminating negative: a `data:image/gif` payload is not
    // `CommandSpriteBase64`'s grammar, so nothing consumes the line.
    expect(refusalLine([`sprite $s data:image/gif;base64,${ONE_PIXEL_PNG}`, 'alice->bob'])).toBe(0);
  });

  it('does not disturb the multiline sprite grammar `matchSpriteCommand` owns', () => {
    const ast = parse(['sprite $tiny [2x2/16] {', 'F0', '0F', '}', 'alice->bob: <$tiny>']);

    expect(ast.sprites?.byName.has('tiny')).toBe(true);
    expect(ast.sprites?.skippedColorSprites).toEqual([]);
  });
});
