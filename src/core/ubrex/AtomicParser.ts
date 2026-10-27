/**
 * `AtomicParser` -- parses one ubrex atom (or operator + operand) off the
 * front of a `TextNavigator` into `Challenge`s.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java
 */
import { ChallengeAlternative } from './ChallengeAlternative.js';
import { ChallengeCharClass } from './ChallengeCharClass.js';
import { ChallengeCharSet } from './ChallengeCharSet.js';
import { ChallengeEndOfText } from './ChallengeEndOfText.js';
import { ChallengeLazzyOneOrMore } from './ChallengeLazzyOneOrMore.js';
import { ChallengeLookAhead } from './ChallengeLookAhead.js';
import { ChallengeLookBehind } from './ChallengeLookBehind.js';
import { ChallengeOneOrMore } from './ChallengeOneOrMore.js';
import { ChallengeOneOrMoreUpToOldVersion } from './ChallengeOneOrMoreUpToOldVersion.js';
import { ChallengeOptional } from './ChallengeOptional.js';
import { ChallengeRepetition } from './ChallengeRepetition.js';
import { ChallengeSingleChar } from './ChallengeSingleChar.js';
import { ChallengeUpTo } from './ChallengeUpTo.js';
import { ChallengeZeroOrMore } from './ChallengeZeroOrMore.js';
import type { Challenge } from './Challenge.js';
import { CharClass } from './CharClass.js';
import { CompositeList } from './CompositeList.js';
import { CompositeNamed } from './CompositeNamed.js';
import { LookAround } from './LookAround.js';
import { Repetition } from './Repetition.js';
import type { TextNavigator } from './TextNavigator.js';

/**
 * `Character.isJavaIdentifierPart(char)`: letter, currency symbol, connecting
 * punctuation, digit, numeric letter, combining mark, non-spacing mark, or
 * identifier-ignorable (0-8, 0xE-0x1B, 0x7F-0x9F, format chars) -- per the
 * `java.lang.Character` javadoc.
 */
const JAVA_IDENTIFIER_PART_RE =
  /^[\p{L}\p{Sc}\p{Pc}\p{Nd}\p{Nl}\p{Mc}\p{Mn}\p{Cf}\u0000-\u0008\u000E-\u001B\u007F-\u009F]$/u;

function isJavaIdentifierPart(ch: string): boolean {
  return JAVA_IDENTIFIER_PART_RE.test(ch);
}

export class AtomicParser {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private static getClosingBracket(input: TextNavigator, open: string, close: string): number {
    let level = 0;
    for (let i = 1; i < input.length(); i++) {
      const ch = input.charAt(i);
      if (ch === open) level++;
      else if (ch === close) {
        if (level === 0) return i;
        else if (--level < 0) throw new Error('IllegalArgumentException');
      }
    }
    return -1;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private parseSingle(input: TextNavigator): Challenge {
    const result = this.parse(input);
    if (result.length !== 1) throw new Error('UnsupportedOperationException');
    return result[0] as Challenge;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  public parse(input: TextNavigator): Challenge[] {
    switch (input.charAt(0)) {
      case '┇':
        throw new Error('IllegalArgumentException');
      case '〒':
        return [this.manageLookAround(input)];
      case '【':
        return [this.manageAlternative(input)];
      case '〇':
        return this.manageQuantifier(input);
      case '〄':
        return this.manageUpTo(input);
      case '〘':
        return [this.manageGroup(input)];
      case '「':
        return [this.manageCharacterSet(input)];
      case '〴':
        return [this.manageClass(input)];
      case '〶':
        return this.manageNamed(input);
      case '〃':
        return [this.manageDoubleQuote(input)];
      default:
        return [this.manageRegularCharacter(input)];
    }
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageLookAround(input: TextNavigator): Challenge {
    input.jump(1);
    const look = LookAround.from(input);
    if (look === undefined) throw new Error('Syntax error');
    input.jump(look.getDefinitionSize());

    let result: Challenge;
    if (look === LookAround.END_OF_TEXT) {
      result = new ChallengeEndOfText();
    } else {
      const p1 = this.parseSingle(input);

      if (look.isLookBehind()) result = new ChallengeLookBehind(p1, look);
      else if (look.isLookAhead()) result = new ChallengeLookAhead(p1, look);
      else throw new Error('UnsupportedOperationException');
    }

    return result;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageClass(input: TextNavigator): Challenge {
    input.jump(1);
    const result = CharClass.fromDefinition(input);
    input.jump(result.getDefinitionLength());
    return new ChallengeCharClass(result);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageQuantifier(input: TextNavigator): Challenge[] {
    const operator = input.charAt(1);
    input.jump(2);
    if (operator === '{') return [this.manageQuantifierBracket(input)];
    else if (operator === 'l') return this.manageQuantifierLazzy(input);

    const origin = this.parseSingle(input);
    switch (operator) {
      case '+':
        return [new ChallengeOneOrMore(origin)];
      case '*':
        return [new ChallengeZeroOrMore(origin)];
      case '?':
        return [new ChallengeOptional(origin)];
      default:
        throw new Error('wip01');
    }
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageQuantifierLazzy(input: TextNavigator): Challenge[] {
    input.jump(1);
    const origin = this.parseSingle(input);
    const remaining = CompositeList.parseAndBuildFromTextNavigator(input);

    // The lazzy quantifier only peeks at remaining as a stop condition.
    // The remaining challenges are returned as siblings, so they get
    // matched normally by the parent CompositeList/CompositeNamed.
    const result: Challenge[] = [];
    result.push(new ChallengeLazzyOneOrMore(origin, remaining));
    for (const c of remaining.getInternalChallengesList()) result.push(c);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageQuantifierBracket(input: TextNavigator): Challenge {
    const repetition = Repetition.parse(input);
    const origin = this.parseSingle(input);
    return new ChallengeRepetition(repetition, origin);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageUpTo(input: TextNavigator): Challenge[] {
    const operator = input.charAt(1);
    if (operator === '>') {
      input.jump(2);
      const p2 = this.parseSingle(input);
      // This is a terrible hack, because if this is used with named group, we do not
      // want p2 to be captured
      return [new ChallengeUpTo(p2), p2];
    }
    if (operator !== '+') throw new Error('manageQuantifierUpTo1');

    input.jump(2);
    this.skipSpaces(input);

    const p1 = this.parseSingle(input);

    this.skipSpaces(input);

    if (input.charAt(0) !== '-') throw new Error('manageQuantifierUpTo2');

    if (input.charAt(1) !== '>') throw new Error('manageQuantifierUpTo2');

    input.jump(2);
    this.skipSpaces(input);

    const p2 = this.parseSingle(input);
    // This is a terrible hack, because if this is used with named group, we do not
    // want p2 to be captured
    return [new ChallengeOneOrMoreUpToOldVersion(p1, p2), p2];
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private skipSpaces(input: TextNavigator): void {
    while (input.charAt(0) === ' ') input.jump(1);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageGroup(input: TextNavigator): Challenge {
    const end = AtomicParser.getClosingBracket(input, '〘', '〙');
    if (end === -1) throw new Error('wip99');

    const result = CompositeList.parseAndBuild(input.subSequence(1, end));
    input.jump(end + 1);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageAlternative(input: TextNavigator): Challenge {
    const result = new ChallengeAlternative();

    let start = 1;
    let level = 0;
    for (let i = 1; i < input.length(); i++) {
      const ch = input.charAt(i);
      if (ch === '【') level++;
      else if (level === 0 && ch === '┇') {
        const part = CompositeList.parseAndBuild(input.subSequence(start, i));
        result.addAlternative(part);
        start = i + 1;
      } else if (ch === '】') {
        if (level === 0) {
          const part = CompositeList.parseAndBuild(input.subSequence(start, i));
          result.addAlternative(part);
          input.jump(i + 1);
          return result;
        } else if (--level < 0) throw new Error('IllegalArgumentException');
      }
    }
    throw new Error('wip32');
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageNamed(input: TextNavigator): Challenge[] {
    let name = '';
    if (input.charAt(1) !== '$') throw new Error('varname must have a $');

    input.jump(2);
    for (;;) {
      const ch = input.charAt(0);
      input.jump(1);
      if (ch === '=') {
        if (name.length === 0) throw new Error('no name!');
        const parsed = this.parse(input);
        // The first element is the named group's content.
        // Any additional elements (e.g. siblings from a lazzy quantifier)
        // must live outside the named group, at the parent level.
        const named = new CompositeNamed(name, [parsed[0] as Challenge]);
        if (parsed.length === 1) return [named];
        const result: Challenge[] = [];
        result.push(named);
        for (let i = 1; i < parsed.length; i++) result.push(parsed[i] as Challenge);
        return result;
      }
      if (isJavaIdentifierPart(ch)) name += ch;
      else throw new Error('Unsupported name!');
    }
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageCharacterSet(input: TextNavigator): Challenge {
    const end = input.indexOf('」');
    if (end === -1) throw new Error('wip80');
    const result = ChallengeCharSet.build(input.subSequence(1, end));
    input.jump(end + 1);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageRegularCharacter(input: TextNavigator): Challenge {
    let ch = input.charAt(0);
    if (ch === ' ') throw new Error('no space allowed');
    if (ch === '∙') ch = ' ';
    input.jump(1);
    return new ChallengeSingleChar(ch);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/AtomicParser.java */
  private manageDoubleQuote(input: TextNavigator): Challenge {
    input.jump(1);
    return new ChallengeSingleChar('"');
  }
}
