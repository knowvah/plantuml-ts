/**
 * `ChallengeResult` -- the outcome of a challenge: matched length
 * (`Challenge.NO_MATCH` if none) plus captures.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeResult.java
 */
import { Capture } from './Capture.js';
import { Challenge } from './Challenge.js';

export class ChallengeResult {
  public static readonly NO_MATCH: ChallengeResult = new ChallengeResult(Challenge.NO_MATCH);
  public static readonly ZERO: ChallengeResult = new ChallengeResult(0);
  public static readonly ONE: ChallengeResult = new ChallengeResult(1);

  private readonly fullCaptureLength: number;
  private readonly capture: Capture;

  /** One-arg form uses `Capture.EMPTY`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeResult.java,52 */
  public constructor(fullCaptureLength: number, capture: Capture = Capture.EMPTY) {
    this.fullCaptureLength = fullCaptureLength;
    this.capture = capture;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeResult.java */
  public toString(): string {
    return 'fullCaptureLength=' + this.fullCaptureLength + ' ' + this.capture.toString();
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeResult.java */
  public getFullCaptureLength(): number {
    return this.fullCaptureLength;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeResult.java */
  public findValuesByKey(key: string): string[] {
    return this.capture.findValuesByKey(key);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeResult.java */
  public findFirstValuesByKeyPrefix(keyPrefix: string): string[] | undefined {
    return this.capture.findFirstValuesByKeyPrefix(keyPrefix);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeResult.java */
  public getCapture(): Capture {
    return this.capture;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeResult.java */
  public extractByPrefix(key: string): Capture {
    return this.capture.extractByPrefix(key);
  }
}
