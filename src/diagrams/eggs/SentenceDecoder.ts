/**
 * `SentenceDecoder` — xor an encrypted easter-egg payload with the key a
 * sentence spells (`EggUtils.fromSecretSentence`) and judge whether the
 * result reads as text.
 *
 * `new String(bytes, UTF_8)` is `TextDecoder('utf-8')` (non-fatal): both turn
 * a malformed sequence into U+FFFD, which `isOk` rejects (65533 > 256), so a
 * decode `isOk` accepts was well-formed and reads the same on both sides.
 * `throws UnsupportedEncodingException` (java:47) cannot happen with the
 * `UTF_8` constant and has no counterpart.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/SentenceDecoder.java
 */
import { EggUtils } from './EggUtils.js';

/** `(int) c > 256`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/SentenceDecoder.java:55 */
const MAX_CHAR = 256;

/** `Character.isISOControl`: U+0000-U+001F and U+007F-U+009F. */
const C0_LAST = 0x1f;
const DEL = 0x7f;
const C1_LAST = 0x9f;

/** @see java/lang/Character.java#isISOControl(int) */
function isISOControl(c: number): boolean {
  return c <= C0_LAST || (c >= DEL && c <= C1_LAST);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/SentenceDecoder.java:42 */
export class SentenceDecoder {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/SentenceDecoder.java:45 */
  private readonly secret: string;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/SentenceDecoder.java:47-51 */
  constructor(sentence1: string, encrypted: Uint8Array) {
    const key = EggUtils.toByteArray(EggUtils.fromSecretSentence(sentence1));
    const sen2 = EggUtils.xor(encrypted, key);
    this.secret = new TextDecoder('utf-8').decode(sen2);
  }

  /**
   * Every UTF-16 unit at most 256, defined and not a control. The
   * `Character.isDefined(c) == false` test (java:58-60) never fires here:
   * it runs only on units up to U+0100, and U+0000-U+0100 are all assigned.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/SentenceDecoder.java:53-66
   */
  isOk(): boolean {
    for (let i = 0; i < this.secret.length; i++) {
      const c = this.secret.charCodeAt(i);
      if (c > MAX_CHAR) return false;
      if (isISOControl(c)) return false;
    }
    return true;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/SentenceDecoder.java:68-70 */
  getSecret(): string {
    return this.secret;
  }
}
