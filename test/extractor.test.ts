/**
 * Tests for extractTestCasesFromMD
 */

import { describe, test, expect } from 'vitest';
import { extractTestCasesFromMD } from '../src/extractor.js';

describe('extractTestCasesFromMD', () => {
  describe('basic extraction', () => {
    const content = `
<test-case type="valid">

## valid: basic case

Some explanation.

\`\`\`lass
.foo { color: red; }
\`\`\`

\`\`\`css
.foo { color: red; }
\`\`\`

</test-case>
`;

    test('extracts one test case from valid block', () => {
      const testCases = extractTestCasesFromMD(content, 'test.md');
      expect(testCases).toHaveLength(1);
    });

    test('extracts description from heading', () => {
      const testCases = extractTestCasesFromMD(content, 'test.md');
      expect(testCases[0]?.description).toBe('basic case');
    });

    test('sets outcome to valid for type="valid"', () => {
      const testCases = extractTestCasesFromMD(content, 'test.md');
      expect(testCases[0]?.outcome).toBe('valid');
    });

    test('extracts lass block as input', () => {
      const testCases = extractTestCasesFromMD(content, 'test.md');
      expect(testCases[0]?.input).toBe('.foo { color: red; }');
    });

    test('extracts css block as output', () => {
      const testCases = extractTestCasesFromMD(content, 'test.md');
      expect(testCases[0]?.output).toBe('.foo { color: red; }');
    });

    test('includes sourceFile when provided', () => {
      const testCases = extractTestCasesFromMD(content, 'test.md');
      expect(testCases[0]?.sourceFile).toBe('test.md');
    });
  });

  describe('invalid test cases', () => {
    const content = `
<test-case type="invalid">

## invalid: syntax error

\`\`\`lass
.foo { color: }
\`\`\`

\`\`\`error
Unexpected token
\`\`\`

</test-case>
`;

    test('sets outcome to invalid for type="invalid"', () => {
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[0]?.outcome).toBe('invalid');
    });

    test('extracts error block as output', () => {
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[0]?.output).toBe('Unexpected token');
    });

    test('extracts description from invalid heading', () => {
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[0]?.description).toBe('syntax error');
    });
  });

  describe('description extraction', () => {
    test('uses description attribute when provided', () => {
      const content = `
<test-case type="valid" description="programmatic name">

## valid: human readable heading

\`\`\`lass
.a { color: red; }
\`\`\`

\`\`\`css
.a { color: red; }
\`\`\`

</test-case>
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[0]?.description).toBe('programmatic name');
    });

    test('extracts description from heading without valid/invalid prefix', () => {
      const content = `
<test-case type="valid">

## just a plain heading

\`\`\`lass
.foo {}
\`\`\`

\`\`\`css
.foo {}
\`\`\`

</test-case>
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[0]?.description).toBe('just a plain heading');
    });

    test('falls back to "unnamed test" when no heading', () => {
      const content = `
<test-case type="valid">

\`\`\`lass
.foo {}
\`\`\`

\`\`\`css
.foo {}
\`\`\`

</test-case>
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[0]?.description).toBe('unnamed test');
    });
  });

  describe('skip attribute', () => {
    const content = `
<test-case type="valid">

## valid: not skipped

\`\`\`lass
.a { color: red; }
\`\`\`

\`\`\`css
.a { color: red; }
\`\`\`

</test-case>

<test-case type="valid" skip>

## valid: skipped case

\`\`\`lass
.b { color: blue; }
\`\`\`

\`\`\`css
.b { color: blue; }
\`\`\`

</test-case>
`;

    test('skip is undefined when attribute not present', () => {
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[0]?.skip).toBeUndefined();
    });

    test('skip is true when attribute present', () => {
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[1]?.skip).toBe(true);
    });
  });

  describe('companion files', () => {
    test('extracts middle blocks as companion files', () => {
      const content = `
<test-case type="valid">

## valid: with tokens

\`\`\`lass
@import './tokens.json';
.foo { color: $primary; }
\`\`\`

\`\`\`tokens.json
{ "primary": "#ff0000" }
\`\`\`

\`\`\`css
.foo { color: #ff0000; }
\`\`\`

</test-case>
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases[0]?.companionFiles).toEqual({
        'tokens.json': '{ "primary": "#ff0000" }\n',
      });
    });
  });

  describe('content filtering', () => {
    test('ignores content outside test-case elements', () => {
      const content = `
## Overview

Just documentation, no test case.

<test-case type="valid">

## valid: actual test

\`\`\`lass
.foo {}
\`\`\`

\`\`\`css
.foo {}
\`\`\`

</test-case>

## Notes

More documentation.
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases).toHaveLength(1);
    });

    test('returns empty array for content with no test cases', () => {
      const content = `
# Just a README

No test cases here.
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases).toEqual([]);
    });
  });

  describe('skipping malformed test cases', () => {
    test('skips test cases without code blocks', () => {
      const content = `
<test-case type="valid">

## valid: no code

This case has no code blocks, just prose.

</test-case>

<test-case type="valid">

## valid: has code

\`\`\`lass
.foo {}
\`\`\`

\`\`\`css
.foo {}
\`\`\`

</test-case>
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases).toHaveLength(1);
    });

    test('skips test cases where first block is not lass', () => {
      const content = `
<test-case type="valid">

## valid: css first

\`\`\`css
.foo {}
\`\`\`

\`\`\`lass
.foo {}
\`\`\`

</test-case>
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases).toHaveLength(0);
    });

    test('skips test cases where last block is not css or error', () => {
      const content = `
<test-case type="valid">

## valid: js last

\`\`\`lass
.foo {}
\`\`\`

\`\`\`javascript
console.log('wrong');
\`\`\`

</test-case>
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases).toHaveLength(0);
    });

    test('skips test-case elements without type attribute', () => {
      const content = `
<test-case>

## some heading

\`\`\`lass
.foo {}
\`\`\`

\`\`\`css
.foo {}
\`\`\`

</test-case>
`;
      const testCases = extractTestCasesFromMD(content);
      expect(testCases).toHaveLength(0);
    });
  });

  describe('multiple test cases', () => {
    const content = `
<test-case type="valid">

## valid: first

\`\`\`lass
.a {}
\`\`\`

\`\`\`css
.a {}
\`\`\`

</test-case>

<test-case type="valid">

## valid: second

\`\`\`lass
.b {}
\`\`\`

\`\`\`css
.b {}
\`\`\`

</test-case>

<test-case type="invalid">

## invalid: third

\`\`\`lass
.c {
\`\`\`

\`\`\`error
Unclosed block
\`\`\`

</test-case>
`;

    test('extracts all test cases', () => {
      const testCases = extractTestCasesFromMD(content);
      expect(testCases).toHaveLength(3);
    });

    test('extracts descriptions in order', () => {
      const testCases = extractTestCasesFromMD(content);
      expect(testCases.map((tc) => tc.description)).toEqual(['first', 'second', 'third']);
    });

    test('extracts outcomes in order', () => {
      const testCases = extractTestCasesFromMD(content);
      expect(testCases.map((tc) => tc.outcome)).toEqual(['valid', 'valid', 'invalid']);
    });
  });
});
