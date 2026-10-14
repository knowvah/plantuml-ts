/**
 * `FlashCodeUtilsNone` (flashcode/FlashCodeUtilsNone.java:43-49): the MIT
 * edition's only `FlashCodeUtils` (D13) exports no image.
 */
import { describe, expect, it } from 'vitest';
import { FlashCodeUtilsNone } from '../../../../src/core/flashcode/FlashCodeUtilsNone.js';

/** `XColor.BLACK` / `XColor.WHITE` (XColor.java:7-8), as `AtomImg.java:93` passes them. */
const BLACK = { r: 0, g: 0, b: 0, a: 255 };
const WHITE = { r: 255, g: 255, b: 255, a: 255 };

describe('FlashCodeUtilsNone.exportFlashcode', () => {
  it('exports no image for any text', () => {
    const utils = new FlashCodeUtilsNone();
    expect(utils.exportFlashcode('https://plantuml.com/patreon', BLACK, WHITE)).toBeNull();
    expect(utils.exportFlashcode('', WHITE, BLACK)).toBeNull();
  });
});
