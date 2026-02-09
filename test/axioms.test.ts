/**
 * Axiom-based tests for the Lass transpiler.
 *
 * This file dynamically generates tests from axiom files in content/axioms/.
 * Axioms are markdown files (.common.md, .extra-cases.md) that define input/output
 * pairs for the transpiler.
 *
 * Test execution flow:
 * 1. Read all .md files from content/axioms/
 * 2. Extract test cases using extractTestCasesFromMD
 * 3. For valid cases: transpile input, execute JS, compare CSS output
 * 4. For invalid cases: verify transpile/execute throws matching error
 */

import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTestCasesFromMD, type TestCase } from '../src/extractor.js';
import { runValidTestCase } from '../src/test-helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to axiom files directory
const axiomsDir = join(__dirname, '..', 'content', 'axioms');

/**
 * Run an invalid test case: verify that transpile/execute throws.
 */
async function runInvalidTestCase(testCase: TestCase): Promise<void> {
  try {
    await runValidTestCase(testCase);
    expect.fail(`Expected error containing "${testCase.output}" but no error was thrown`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    expect(errorMessage).toContain(testCase.output);
  }
}

/**
 * Parse frontmatter to get metadata (for skipping not-implemented features)
 */
function parseMetadataStatus(content: string): string | undefined {
  const statusMatch = content.match(/^status:\s*(\S+)$/m);
  return statusMatch?.[1];
}

// Load axiom files and generate tests
const axiomFiles = readdirSync(axiomsDir)
  .filter((f) => f.endsWith('.common.md') || f.endsWith('.extra-cases.md'))
  .sort();

for (const fileName of axiomFiles) {
  const filePath = join(axiomsDir, fileName);
  const content = readFileSync(filePath, 'utf-8');
  const testCases = extractTestCasesFromMD(content, fileName);

  if (testCases.length === 0) continue;

  // Check if feature is not implemented
  const status = parseMetadataStatus(content);
  const shouldSkip =
    status === 'not-implemented' ||
    status === 'in-progress' ||
    status === 'deferred' ||
    status === 'vite-only';

  // Use filename without extension as feature name
  const featureName = fileName.replace(/\.(common|extra-cases)\.md$/, '');

  describe(featureName, () => {
    const validCases = testCases.filter((tc) => tc.outcome === 'valid');
    const invalidCases = testCases.filter((tc) => tc.outcome === 'invalid');

    if (validCases.length > 0) {
      describe('valid cases', () => {
        for (const testCase of validCases) {
          if (shouldSkip || testCase.skip) {
            test.skip(testCase.description, async () => {
              const actual = await runValidTestCase(testCase);
              expect(actual).toBe(testCase.output);
            });
          } else {
            test(testCase.description, async () => {
              const actual = await runValidTestCase(testCase);
              expect(actual).toBe(testCase.output);
            });
          }
        }
      });
    }

    if (invalidCases.length > 0) {
      describe('invalid cases', () => {
        for (const testCase of invalidCases) {
          if (shouldSkip || testCase.skip) {
            test.skip(testCase.description, async () => {
              await runInvalidTestCase(testCase);
            });
          } else {
            test(testCase.description, async () => {
              await runInvalidTestCase(testCase);
            });
          }
        }
      });
    }
  });
}
