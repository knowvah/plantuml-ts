import { describe, expect, it } from 'vitest';
import { lifelineTitle } from '../../../src/diagrams/sequence/sequence-layout-lifeline.js';

/** MD5 hex of `iVBORw0KGgo=`, computed independently with node:crypto. */
const MD5_OF_PAYLOAD = '03690ab2ccd21a7441feadb0a5f629f0';

describe('lifelineTitle base64 rewrite', () => {
  it('shows an inline PNG data URI as its md5 form (UmlSource.java:332-368)', () => {
    // `UmlSource` patches every source line before the parser sees it, so the
    // jar's `<title>` carries `data:image/png;md5,<hash>` and the `{scale=N}`
    // tail survives (golden `vofupo-09-gafe466`: `...md5.<hash>.scale.1..`).
    const title = lifelineTitle({ display: '<img data:image/png;base64,iVBORw0KGgo={scale=1}>' });

    expect(title).toBe(`.img data.image.png.md5.${MD5_OF_PAYLOAD}.scale.1..`);
  });

  it('leaves a title without a base64 data URI unchanged', () => {
    expect(lifelineTitle({ display: 'Bob' })).toBe('Bob');
  });
});
