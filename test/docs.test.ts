/**
 * Documentation example tests
 *
 * Dynamically generates vitest tests from markdown documentation files.
 * Uses test:begin/test:end markers to identify testable examples.
 */

import { describe, test, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findMarkdownFiles,
  parseDocFile,
  runValidTestCase,
} from '../src/test-helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '..');

// Find all markdown files
const markdownFiles = findMarkdownFiles(docsDir);

// Parse each file and generate tests
for (const filePath of markdownFiles) {
  const { file, testCases } = parseDocFile(filePath, docsDir);

  if (testCases.length === 0) continue;

  describe(file, () => {
    for (const testCase of testCases) {
      if (testCase.outcome === 'valid') {
        test(testCase.name, async () => {
          const actual = await runValidTestCase(testCase);
          expect(actual).toBe(testCase.expected);
        });
      } else if (testCase.outcome === 'invalid') {
        test(testCase.name, async () => {
          try {
            await runValidTestCase(testCase);
            expect.fail(`Expected error containing "${testCase.expected}"`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            expect(errorMessage).toContain(testCase.expected);
          }
        });
      }
    }
  });
}
