import { expect } from 'vitest';

expect.extend({
  toContainElement(svg: string, tag: string) {
    const pass = svg.includes(`<${tag}`);
    return {
      pass,
      message: () => `expected SVG to contain <${tag}> element`,
    };
  },
  toContainText(svg: string, text: string) {
    const pass = svg.includes(text);
    return {
      pass,
      message: () => `expected SVG to contain text "${text}"`,
    };
  },
  toBeValidSvg(svg: string) {
    const pass = svg.startsWith('<svg') && svg.endsWith('</svg>');
    return {
      pass,
      message: () => 'expected string to be a valid SVG',
    };
  },
});

declare module 'vitest' {
  // Vitest 5 gives `Assertion` a second type parameter, so an augmentation
  // with one no longer merges ("All declarations of 'Assertion' must have
  // identical type parameters"). `Matchers` is the interface vitest's own
  // docs name for custom matchers, and its parameters are repeated here
  // exactly as vitest declares them, defaults included.
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T = unknown,
  > {
    toContainElement(tag: string): R;
    toContainText(text: string): R;
    toBeValidSvg(): R;
  }
}
