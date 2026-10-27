import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/SimpleTest.java (every assertion; Java line cited per assertion).
describe('SimpleTest', () => {
  /**
   * Tests the basic functionality of add() and getLonguestMatchStartingIn() using
   * a single word.
   */
  it('testAddAndGetLongestMatch (SimpleTest.java:14)', () => {
    const cut = UnicodeBracketedExpression.build('hello');

    // Test exact match
    expect(cut.match(TextNavigator.build('hello')).getAcceptedMatch()).toBe('hello'); // SimpleTest.java:18

    // Test match with additional trailing characters
    expect(cut.match(TextNavigator.build('hello world')).getAcceptedMatch()).toBe('hello'); // SimpleTest.java:21

    // Test match starting at an offset
    expect(cut.match(TextNavigator.build('say hello'), 4).getAcceptedMatch()).toBe('hello'); // SimpleTest.java:24

    // Test no match when the prefix is not present
    expect(cut.match(TextNavigator.build('hi there')).getAcceptedMatch()).toBe(''); // SimpleTest.java:27
  });

  //	/**
  //	 * Tests that adding a string containing the null character ('\0') throws an
  //	 * IllegalArgumentException.
  //	 */
  it.skip('testAddThrowsExceptionForStringWithNullChar (SimpleTest.java:35, commented out upstream; targets BracketedExpression1, which does not exist)', () => {});
  //	@Test
  //	public void testAddThrowsExceptionForStringWithNullChar() {
  //		BracketedExpression1 cut = new BracketedExpression1();
  //		assertThrows(IllegalArgumentException.class, () -> {
  //			cut.addPattern("he\0llo");
  //		});
  //	}
  //
  //	/**
  //	 * Tests getLonguestMatchStartingIn() with multiple words added to the trie. In
  //	 * this test the trie contains "he", "hello", and "helium".
  //	 */
  it.skip('testLongestMatchWithMultipleWords (SimpleTest.java:47, commented out upstream; targets BracketedExpression1, which does not exist)', () => {});
  //	@Test
  //	public void testLongestMatchWithMultipleWords() {
  //		BracketedExpression1 cut = new BracketedExpression1();
  //		cut.addPattern("he");
  //		cut.addPattern("hello");
  //		cut.addPattern("helium");
  //
  //		// For input "hello", the longest match should be "hello"
  //		assertEquals("hello", cut.getMatcher(TextNavigator.build("hello", 0)).getAcceptedMatch());
  //
  //		// For input "helium", the longest match should be "helium"
  //		assertEquals("helium", cut.getMatcher(TextNavigator.build("helium", 0)).getAcceptedMatch());
  //
  //		assertEquals("he", cut.getMatcher(TextNavigator.build("helix", 0)).getAcceptedMatch());
  //	}
  //
  //	/**
  //	 * Tests getLonguestMatchStartingIn() when matching occurs at different offsets
  //	 * within the input string.
  //	 */
  it.skip('testLongestMatchWithOffset (SimpleTest.java:67, commented out upstream; targets BracketedExpression1, which does not exist)', () => {});
  //	@Test
  //	public void testLongestMatchWithOffset() {
  //		BracketedExpression1 cut = new BracketedExpression1();
  //		cut.addPattern("hello");
  //		cut.addPattern("world");
  //		String text = "hello world";
  //
  //		// Starting at index 0, the longest match should be "hello"
  //		assertEquals("hello", cut.getMatcher(TextNavigator.build(text, 0)).getAcceptedMatch());
  //
  //		// Starting at index 6, the longest match should be "world"
  //		assertEquals("world", cut.getMatcher(TextNavigator.build(text, 6)).getAcceptedMatch());
  //
  //		// Starting at an index with a space character, no word should match.
  //		assertEquals("", cut.getMatcher(TextNavigator.build(text, 5)).getAcceptedMatch());
  //	}

  /**
   * Tests the behavior of getLonguestMatchStartingIn() when the starting position
   * is at the end of the input.
   */
  it('testLongestMatchAtEnd (SimpleTest.java:88)', () => {
    const cut = UnicodeBracketedExpression.build('end');
    const text = 'the end';

    // Starting at index corresponding to "end"
    expect(cut.match(TextNavigator.build(text), 4).getAcceptedMatch()).toBe('end'); // SimpleTest.java:93

    // Starting at an index equal to the text length should return an empty string.
    expect(cut.match(TextNavigator.build(text), text.length).getAcceptedMatch()).toBe(''); // SimpleTest.java:96
  });
});
