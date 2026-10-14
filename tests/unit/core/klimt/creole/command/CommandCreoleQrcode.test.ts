/**
 * `CommandCreoleQrcode` (klimt/creole/command/CommandCreoleQrcode.java):
 * starter `<q`, pattern `^(Splitter.qrcodePattern)` compiled by `Pattern2`
 * (CASE_INSENSITIVE, Pattern2.java:114), `stripe.addQrcode(group 2,
 * Parser.getScale(group 3, 3))`, registered after the exposant commands
 * (CommandCreoleBuilder.java:107).
 */
import { describe, expect, it } from 'vitest';
import type { StripeBuilder } from '../../../../../../src/core/klimt/creole/command/Command.js';
import { createQrcodeCommand } from '../../../../../../src/core/klimt/creole/command/CommandCreoleQrcode.js';
import {
  CREOLE_COMMANDS,
  CREOLE_COMMANDS_OTHER,
} from '../../../../../../src/core/klimt/creole/legacy/CommandCreoleBuilder.js';

/** Records `addQrcode` calls; every other stripe member is unreachable here. */
function recordingStripe(): { stripe: StripeBuilder; calls: [string, number][] } {
  const calls: [string, number][] = [];
  const stripe = {
    addQrcode(src: string, scale: number): void {
      calls.push([src, scale]);
    },
  } as unknown as StripeBuilder;
  return { stripe, calls };
}

describe('CommandCreoleQrcode pattern', () => {
  const cmd = createQrcodeCommand();

  it('starts on <q (java:50-52)', () => {
    expect(cmd.starters).toEqual(['<q']);
  });

  it('matches the colon and whitespace separators, with or without {scale=N}', () => {
    expect(cmd.matchingSize('<qrcode:abcdef>', 0)).toBe(15);
    expect(cmd.matchingSize('<qrcode abcdef>', 0)).toBe(15);
    expect(cmd.matchingSize('<qrcode: \tabc{scale=1.5}>', 0)).toBe(25);
    expect(cmd.matchingSize('x <qrcode:https://plantuml.com/lp>\t', 2)).toBe(32);
  });

  it('is case-insensitive past the starter (Pattern2 compiles CASE_INSENSITIVE)', () => {
    expect(cmd.matchingSize('<qRCode:abc>', 0)).toBe(12);
  });

  it('does not match an empty source, a brace in the source, or a bare <qrcode>', () => {
    expect(cmd.matchingSize('<qrcode:>', 0)).toBe(0);
    expect(cmd.matchingSize('<qrcode:a{b>', 0)).toBe(0);
    expect(cmd.matchingSize('<qrcode>', 0)).toBe(0);
    expect(cmd.matchingSize('<qrcode:abc', 0)).toBe(0);
  });

  it('does not take a non-breaking space as a separator (Java \\s is ASCII)', () => {
    expect(cmd.matchingSize('<qrcode abc>', 0)).toBe(0);
  });
});

describe('CommandCreoleQrcode.executeAndAdvance', () => {
  const cmd = createQrcodeCommand();

  it('adds the source at the default scale 3 and advances past the tag', () => {
    const { stripe, calls } = recordingStripe();
    expect(cmd.executeAndAdvance('<qrcode:https://plantuml.com/patreon>\t', 0, stripe)).toBe(37);
    expect(calls).toEqual([['https://plantuml.com/patreon', 3]]);
  });

  it('reads {scale=N} through Parser.getScale', () => {
    const { stripe, calls } = recordingStripe();
    expect(cmd.executeAndAdvance('ab<qrcode:abcdef{scale=1.5}>', 2, stripe)).toBe(26);
    expect(calls).toEqual([['abcdef', 1.5]]);
  });

  it('keeps the default for {SCALE=N}: the tag matches case-insensitively, getScale does not', () => {
    const { stripe, calls } = recordingStripe();
    cmd.executeAndAdvance('<qrcode:abc{SCALE=2}>', 0, stripe);
    expect(calls).toEqual([['abc', 3]]);
  });

  it('throws IllegalStateException when the line does not match (java:75-76)', () => {
    const { stripe } = recordingStripe();
    expect(() => cmd.executeAndAdvance('<qrcode>', 0, stripe)).toThrow('IllegalStateException');
  });
});

describe('CommandCreoleBuilder registration (java:107)', () => {
  it('registers the qrcode command under <q in both the FULL and OTHER maps', () => {
    expect(CREOLE_COMMANDS.get('<q')?.length).toBe(1);
    expect(CREOLE_COMMANDS_OTHER.get('<q')?.length).toBe(1);
    expect(CREOLE_COMMANDS.get('<q')?.[0]?.matchingSize('<qrcode:a>', 0)).toBe(10);
  });
});
