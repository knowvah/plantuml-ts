/**
 * `CompositeList` -- a sequence of challenges, built by parsing a ubrex definition.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java
 */
import { AtomicParser } from './AtomicParser.js';
import { Capture } from './Capture.js';
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import { csLength, TextNavigator } from './TextNavigator.js';
import type { CharSequence } from './TextNavigator.js';

export class CompositeList implements Challenge {
  private readonly challenges: Challenge[] = [];

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  public addChallenge(p: Challenge): void {
    this.challenges.push(p);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  public static createEmpty(): CompositeList {
    return new CompositeList();
  }

  /** Java `null` input (`IllegalArgumentException`) is `undefined`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  public static parseAndBuild(input: CharSequence | undefined): CompositeList {
    if (input === undefined) throw new Error('IllegalArgumentException');
    return new CompositeList(input);
  }

  /** `List#toString` format. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString: every Challenge has one
    return '[' + this.challenges.map((c) => String(c)).join(', ') + ']';
  }

  /** The Java private constructors: no argument, or a definition to parse. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  private constructor(definition?: CharSequence) {
    if (definition !== undefined) {
      if (csLength(definition) === 0) throw new Error('UnsupportedOperationException');
      const input = TextNavigator.build(definition);
      this.parseAndConsumeNow(input);
    }
  }

  /** Java `null` input (`IllegalArgumentException`) is `undefined`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  public static parseAndBuildFromTextNavigator(input: TextNavigator | undefined): CompositeList {
    if (input === undefined) throw new Error('IllegalArgumentException');
    const result = new CompositeList();
    result.parseAndConsumeNow(input);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  private parseAndConsumeNow(input: TextNavigator): void {
    const builder = new AtomicParser();
    while (input.length() > 0) {
      const ch = input.charAt(0);
      if (ch === ' ') input.jump(1);
      else for (const c of builder.parse(input)) this.addChallenge(c);
    }
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    let capture: Capture = Capture.EMPTY;
    let current = position;
    for (const challenge of this.challenges) {
      const shallWePass = challenge.runChallenge(string, current);
      if (shallWePass.getFullCaptureLength() < 0) return ChallengeResult.NO_MATCH;
      current += shallWePass.getFullCaptureLength();
      capture = capture.merge(shallWePass.getCapture());
    }
    return new ChallengeResult(current - position, capture);
  }

  /** `Collections.unmodifiableList`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeList.java */
  public getInternalChallengesList(): readonly Challenge[] {
    return this.challenges;
  }
}
