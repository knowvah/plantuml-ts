/**
 * `FlashCodeFactory` / `FlashCodeUtilsNone` (flashcode/, MIT edition, D13).
 *
 * `FlashCodeUtilsZxing.java:55` is `::remove file when __MIT__`, so the MIT
 * edition's `Class.forName` fails (FlashCodeFactory.java:44-49) and every
 * qrcode request reaches `FlashCodeUtilsNone`, whose export is `null`
 * (FlashCodeUtilsNone.java:45-47).
 */
import { describe, expect, it } from 'vitest';
import { getFlashCodeUtils } from '../../../../src/core/flashcode/FlashCodeFactory.js';
import { FlashCodeUtilsNone } from '../../../../src/core/flashcode/FlashCodeUtilsNone.js';

describe('FlashCodeFactory.getFlashCodeUtils (MIT edition)', () => {
  it('answers FlashCodeUtilsNone: the zxing encoder is not in the MIT build', () => {
    expect(getFlashCodeUtils()).toBeInstanceOf(FlashCodeUtilsNone);
  });
});
