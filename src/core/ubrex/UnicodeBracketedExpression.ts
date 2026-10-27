/**
 * `UnicodeBracketedExpression` -- a compiled ubrex. Java interface with
 * three `default` `match` overloads, one abstract `match(TextNavigator, int)`
 * and the statics `build`/`from`; here the interface plus a merged
 * same-named const holding the statics and the default-method bodies.
 *
 * Overloads of `match`: `match(string, pos)` with a `string`
 * (`UnicodeBracketedExpression.java` default 1), `match(nav)` (default 2,
 * position 0) and `match(nav, pos)` (abstract).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UnicodeBracketedExpression.java
 */
import type { Capture } from './Capture.js';
import type { Challenge } from './Challenge.js';
import { CompositeList } from './CompositeList.js';
import { TextNavigator } from './TextNavigator.js';
import type { UMatcher } from './UMatcher.js';
import { umatcherFindFirstValueByKey } from './UMatcher.js';

export interface UnicodeBracketedExpression {
  /**
   * `match(String, int)` and `match(TextNavigator)` / `match(TextNavigator, int)`.
   * A `string` input is wrapped by `TextNavigator.build`; position defaults to 0.
   *
   * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UnicodeBracketedExpression.java
   */
  match(string: string | TextNavigator, position?: number): UMatcher;
}

/** The static half of upstream's `UnicodeBracketedExpression` interface. */
export const UnicodeBracketedExpression: {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UnicodeBracketedExpression.java */
  build(ubrex: string): UnicodeBracketedExpression;
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/UnicodeBracketedExpression.java */
  from(challenge: Challenge): UnicodeBracketedExpression;
} = {
  build(ubrex: string): UnicodeBracketedExpression {
    return UnicodeBracketedExpression.from(CompositeList.parseAndBuild(ubrex));
  },

  from(challenge: Challenge): UnicodeBracketedExpression {
    return {
      match(string: string | TextNavigator, position: number = 0): UMatcher {
        const nav = typeof string === 'string' ? TextNavigator.build(string) : string;
        const shallWePass = challenge.runChallenge(nav, position);
        let acceptepMatch: string;

        if (shallWePass.getFullCaptureLength() < 0) acceptepMatch = '';
        else acceptepMatch = nav.subSequence(position, position + shallWePass.getFullCaptureLength()).toString();

        const matcher: UMatcher & { toString(): string } = {
          toString(): string {
            return acceptepMatch + ' ' + shallWePass.toString();
          },

          exactMatch(): boolean {
            if (matcher.startMatch() === false) return false;

            return position + shallWePass.getFullCaptureLength() === nav.length();
          },

          getAcceptedMatch(): string {
            return acceptepMatch;
          },

          startMatch(): boolean {
            return shallWePass.getFullCaptureLength() >= 0;
          },

          findValuesByKey(key: string): string[] {
            return shallWePass.findValuesByKey(key);
          },

          findFirstValuesByKeyPrefix(keyPrefix: string): string[] | undefined {
            return shallWePass.findFirstValuesByKeyPrefix(keyPrefix);
          },

          extractByPrefix(key: string): Capture {
            return shallWePass.extractByPrefix(key);
          },

          findFirstValueByKey(key: string): string | undefined {
            return umatcherFindFirstValueByKey(matcher, key);
          },
        };
        return matcher;
      },
    };
  },
};
