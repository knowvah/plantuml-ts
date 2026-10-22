/**
 * `Stereotype#toString` over a decoration whose `LABEL` is blank-only
 * (`Stereotype.java:140-145`; `StereotypeDecoration.java:157-160,169-172` with
 * `StringUtils.isNotEmpty`, `StringUtils.java:164-183`, which treats a string
 * of spaces/tabs/CR/LF/NUL as empty).
 */
import { describe, expect, it } from 'vitest';
import { parseSimpleColor } from '../../../../src/core/klimt/color/HColorSet.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';

function build(label: string): Stereotype {
  return Stereotype.build(label, 0, undefined, parseSimpleColor);
}

describe('Stereotype with a blank-only decoration label', () => {
  it('a sprite spec alone has an empty label', () => {
    expect(build('<< ($APIGateway, #CC2264) >>').toString()).toBe('');
  });

  it('a spot spec alone is the bare character and a space', () => {
    expect(build('<< (C,#00FFFF) >>').toString()).toBe('C ');
  });

  it('a label with text keeps it, spaces included', () => {
    expect(build('<< (C,#ADD1B2) Testable >>').toString()).toBe('C << Testable >>');
    expect(build('<< ($APIGateway, #CC2264) APIGateway >>').toString()).toBe('<< APIGateway >>');
  });
});
