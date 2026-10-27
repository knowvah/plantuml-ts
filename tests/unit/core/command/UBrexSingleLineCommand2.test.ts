import { describe, expect, it } from 'vitest';
import { CommandControl } from '../../../../src/core/command/CommandControl.js';
import type { CommandExecutionResult } from '../../../../src/core/command/CommandExecutionResult.js';
import { CommandExecutionResult as Result } from '../../../../src/core/command/CommandExecutionResult.js';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { UBrexSingleLineCommand2 } from '../../../../src/core/command/UBrexSingleLineCommand2.js';
import { PSystemError } from '../../../../src/core/error/PSystemError.js';
import { NoSuchColorException } from '../../../../src/core/klimt/color/NoSuchColorException.js';
import type { RegexResult } from '../../../../src/core/regex/RegexResult.js';
import type { LineLocation } from '../../../../src/core/tim/LineLocation.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { UBrexConcat } from '../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../../src/core/ubrex/builder/UBrexNamed.js';
import { UBrexOptional } from '../../../../src/core/ubrex/builder/UBrexOptional.js';
import type { UnicodeBracketedExpression } from '../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Toy command: "hello NAME" (UBrexSingleLineCommand2.java is abstract; every member is exercised via this subclass).
const LOCATION: LineLocation = {
  getPosition: () => 7,
  getDescription: () => 'string',
  getParent: () => undefined,
};

interface Sink {
  calls: { name: string | undefined; pass: ParserPass; location: LineLocation | undefined }[];
}

function pattern(withBracket = false): UnicodeBracketedExpression {
  return UBrexConcat.build(
    new UBrexLeaf('hello'),
    UBrexLeaf.spaceOneOrMore(),
    new UBrexNamed('NAME', new UBrexLeaf('〇+「〴w」')),
    ...(withBracket ? [UBrexLeaf.spaceZeroOrMore(), new UBrexOptional(new UBrexLeaf('{'))] : []),
    UBrexLeaf.end(),
  );
}

class Toy extends UBrexSingleLineCommand2<Sink> {
  public forbidden = false;
  public verification: CommandControl = CommandControl.OK;
  public throwColor = false;
  public bracket = false;

  public override syntaxWithFinalBracket(): boolean {
    return this.bracket;
  }

  protected override finalVerification(): CommandControl {
    return this.verification;
  }

  protected override isForbidden(line: string): boolean {
    return this.forbidden && line.includes('bad');
  }

  protected explainArg(location: LineLocation | undefined, arg: RegexResult): string {
    return String(location?.getPosition()) + ':' + String(arg.get('NAME', 0));
  }

  protected executeArg(
    system: Sink,
    location: LineLocation | undefined,
    arg: RegexResult,
    currentPass: ParserPass,
  ): CommandExecutionResult {
    if (this.throwColor) throw new NoSuchColorException();
    system.calls.push({ name: arg.get('NAME', 0), pass: currentPass, location });
    return Result.ok();
  }
}

function line(s: string, location?: LineLocation): StringLocated {
  return new StringLocated(s, location);
}

describe('UBrexSingleLineCommand2', () => {
  describe('isValid (UBrexSingleLineCommand2.java:80-102)', () => {
    it('OK for an exact match', () => {
      expect(new Toy(pattern()).isValid(line('hello bob'))).toBe(CommandControl.OK);
    });

    it('NOT_OK for a non-match', () => {
      expect(new Toy(pattern()).isValid(line('bye bob'))).toBe(CommandControl.NOT_OK);
      expect(new Toy(pattern()).isValid(line('hello bob x'))).toBe(CommandControl.NOT_OK);
    });

    it('trims by default (doTrim true, :56-58, :73-79)', () => {
      expect(new Toy(pattern()).isValid(line('   hello bob  '))).toBe(CommandControl.OK);
    });

    it('doTrim false matches the raw line (:60-63)', () => {
      const cmd = new Toy(false, pattern());
      expect(cmd.isValid(line('   hello bob'))).toBe(CommandControl.NOT_OK);
      expect(cmd.isValid(line('hello bob'))).toBe(CommandControl.OK);
    });

    it('doTrim true explicit equals the one-argument constructor (:56)', () => {
      expect(new Toy(true, pattern()).isValid(line('  hello bob '))).toBe(CommandControl.OK);
    });

    it('returns whatever finalVerification answers on a match (:98-99)', () => {
      const cmd = new Toy(pattern());
      cmd.verification = CommandControl.OK_PARTIAL;
      expect(cmd.isValid(line('hello bob'))).toBe(CommandControl.OK_PARTIAL);
      cmd.verification = CommandControl.NOT_OK;
      expect(cmd.isValid(line('hello bob'))).toBe(CommandControl.NOT_OK);
    });

    it('finalVerification defaults to OK (:116-118)', () => {
      class Plain extends UBrexSingleLineCommand2<Sink> {
        public verify(): CommandControl {
          return this.finalVerification();
        }
        protected explainArg(): string | undefined {
          return undefined;
        }
        protected executeArg(): CommandExecutionResult {
          return Result.ok();
        }
      }
      expect(new Plain(pattern()).verify()).toBe(CommandControl.OK);
    });

    it('isCommandForbidden defaults to false (Command.java isCommandForbidden)', () => {
      expect(new Toy(pattern()).isCommandForbidden(line('hello bob'))).toBe(false);
    });

    it('a forbidden command is NOT_OK (:89-90)', () => {
      class Forbidding extends Toy {
        public override isCommandForbidden(l: StringLocated): boolean {
          return l.getString().includes('nope');
        }
      }
      expect(new Forbidding(pattern()).isValid(line('hello nope'))).toBe(CommandControl.NOT_OK);
      expect(new Forbidding(pattern()).isValid(line('hello yes'))).toBe(CommandControl.OK);
    });

    it('syntaxWithFinalBracket defaults to false (:73-75)', () => {
      class Plain extends UBrexSingleLineCommand2<Sink> {
        protected explainArg(): string | undefined {
          return undefined;
        }
        protected executeArg(): CommandExecutionResult {
          return Result.ok();
        }
      }
      expect(new Plain(pattern()).syntaxWithFinalBracket()).toBe(false);
    });

    it('bracket syntax: a line already ending in { is matched as is (:93-94)', () => {
      const cmd = new Toy(pattern(true));
      cmd.bracket = true;
      expect(cmd.isValid(line('hello bob {'))).toBe(CommandControl.OK);
    });

    it('bracket syntax: a line without { is OK_PARTIAL when line + " {" is valid (:93-98)', () => {
      const cmd = new Toy(pattern(true));
      cmd.bracket = true;
      expect(cmd.isValid(line('hello bob'))).toBe(CommandControl.OK_PARTIAL);
    });

    it('bracket syntax: NOT_OK when line + " {" is not valid either (:97-98)', () => {
      const cmd = new Toy(pattern(true));
      cmd.bracket = true;
      expect(cmd.isValid(line('bye bob'))).toBe(CommandControl.NOT_OK);
    });

    it('bracket syntax: the rejoined line uses the untrimmed text (:95 lines.getAt(0).getString())', () => {
      const cmd = new Toy(pattern(true));
      cmd.bracket = true;
      // "hello bob   " + " {" trims to "hello bob   {": spaceZeroOrMore accepts the gap.
      expect(cmd.isValid(line('hello bob   '))).toBe(CommandControl.OK_PARTIAL);
    });
  });

  describe('explain (UBrexSingleLineCommand2.java:127-145)', () => {
    it('delegates to explainArg with the location and a UMatcher-backed RegexResult', () => {
      expect(new Toy(pattern()).explain(line('  hello bob ', LOCATION))).toBe('7:bob');
    });

    it('undefined for a forbidden line (:135-136)', () => {
      const cmd = new Toy(pattern());
      cmd.forbidden = true;
      expect(cmd.explain(line('hello bad'))).toBeUndefined();
    });

    it('undefined for a non-match (:140-141)', () => {
      expect(new Toy(pattern()).explain(line('bye bob'))).toBeUndefined();
    });

    it('undefined location is forwarded (StringLocated.getLocation)', () => {
      expect(new Toy(pattern()).explain(line('hello bob'))).toBe('undefined:bob');
    });
  });

  describe('execute (UBrexSingleLineCommand2.java:150-177)', () => {
    it('runs executeArg with the system, location, RegexResult and pass', () => {
      const sink: Sink = { calls: [] };
      const r = new Toy(pattern()).execute(sink, line(' hello bob', LOCATION), ParserPass.TWO);
      expect(r.isOk()).toBe(true);
      expect(sink.calls).toEqual([{ name: 'bob', pass: 'TWO', location: LOCATION }]);
    });

    it('a forbidden line is "Syntax error: <trimmed line>" (:163-164)', () => {
      const cmd = new Toy(pattern());
      cmd.forbidden = true;
      const sink: Sink = { calls: [] };
      const r = cmd.execute(sink, line('  hello bad '), ParserPass.ONE);
      expect(r.isOk()).toBe(false);
      expect(r.getError()).toBe('Syntax error: hello bad');
      expect(sink.calls).toEqual([]);
    });

    it('a non-match is "Cannot parse line <line>" (:168-169)', () => {
      const r = new Toy(pattern()).execute({ calls: [] }, line('bye bob'), ParserPass.ONE);
      expect(r.getError()).toBe('Cannot parse line bye bob');
    });

    it('doTrim false leaves the line untrimmed in the message (:60-63)', () => {
      const r = new Toy(false, pattern()).execute({ calls: [] }, line(' bye'), ParserPass.ONE);
      expect(r.getError()).toBe('Cannot parse line  bye');
    });

    it('a PSystemError target is "PSystemError cannot be cast" (:171-172)', () => {
      const system = Object.create(PSystemError.prototype) as Sink;
      const r = new Toy(pattern()).execute(system, line('hello bob'), ParserPass.ONE);
      expect(r.getError()).toBe('PSystemError cannot be cast');
    });

    it('NoSuchColorException becomes badColor() (:176-178)', () => {
      const cmd = new Toy(pattern());
      cmd.throwColor = true;
      const r = cmd.execute({ calls: [] }, line('hello bob'), ParserPass.ONE);
      expect(r.getError()).toBe('No such color');
      expect(r.getScore()).toBe(10);
    });

    it('any other exception propagates (Java catches only NoSuchColorException)', () => {
      class Boom extends Toy {
        protected override executeArg(): CommandExecutionResult {
          throw new Error('boom');
        }
      }
      expect(() => new Boom(pattern()).execute({ calls: [] }, line('hello bob'), ParserPass.ONE)).toThrow('boom');
    });
  });

  describe('isForbidden / isEligibleFor (UBrexSingleLineCommand2.java:181-191)', () => {
    it('isForbidden defaults to false', () => {
      class Plain extends UBrexSingleLineCommand2<Sink> {
        public forbidden(s: string): boolean {
          return this.isForbidden(s);
        }
        protected explainArg(): string | undefined {
          return undefined;
        }
        protected executeArg(): CommandExecutionResult {
          return Result.ok();
        }
      }
      expect(new Plain(pattern()).forbidden('x')).toBe(false);
    });

    it('is eligible only for pass ONE', () => {
      const cmd = new Toy(pattern());
      expect(cmd.isEligibleFor(ParserPass.ONE)).toBe(true);
      expect(cmd.isEligibleFor(ParserPass.TWO)).toBe(false);
      expect(cmd.isEligibleFor(ParserPass.THREE)).toBe(false);
    });
  });
});
