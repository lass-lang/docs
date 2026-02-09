#!/usr/bin/env tsx
/**
 * Lint markdown files to ensure all ```lass + ```css pairs
 * are wrapped in <test-case> elements.
 *
 * Usage:
 *   pnpm lint:docs           # Only show errors
 *   pnpm lint:docs --verbose # Show all files checked
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '..');

interface LintError {
  file: string;
  line: number;
  message: string;
}

interface Region {
  start: number;
  end: number;
}

/**
 * Find all markdown files in a directory recursively
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    // Skip hidden files, node_modules, and internal directories
    if (
      entry.startsWith('.') ||
      entry === 'node_modules' ||
      entry === 'scripts' ||
      entry === 'test' ||
      entry === 'src' ||
      entry === 'coverage'
    ) {
      continue;
    }

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Find all <test-case>...</test-case> regions with line numbers
 */
function findTestCaseRegions(content: string): Region[] {
  const regions: Region[] = [];
  const lines = content.split('\n');

  let inTestCase = false;
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (/<test-case\b/.test(line)) {
      inTestCase = true;
      startLine = i + 1; // 1-indexed
    } else if (/<\/test-case>/.test(line) && inTestCase) {
      regions.push({ start: startLine, end: i + 1 });
      inTestCase = false;
    }
  }

  return regions;
}

/**
 * Find all code blocks of a specific language with line numbers
 */
function findCodeBlocks(content: string, lang: string): number[] {
  const lines = content.split('\n');
  const blockLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (new RegExp(`^\`\`\`${lang}\\b`).test(line)) {
      blockLines.push(i + 1); // 1-indexed
    }
  }

  return blockLines;
}

/**
 * Check if a line is inside any of the given regions
 */
function isInsideRegion(line: number, regions: Region[]): boolean {
  return regions.some((r) => line >= r.start && line <= r.end);
}

/**
 * Lint a single markdown file
 */
function lintFile(filePath: string, fileName: string): { errors: LintError[]; testCaseCount: number } {
  const content = readFileSync(filePath, 'utf-8');
  const errors: LintError[] = [];

  const testCaseRegions = findTestCaseRegions(content);
  const lassBlocks = findCodeBlocks(content, 'lass');
  const cssBlocks = findCodeBlocks(content, 'css');

  // For each ```lass block, find the next ```css block
  for (const lassLine of lassBlocks) {
    // Find the next css block after this lass block
    const nextCssLine = cssBlocks.find((cssLine) => cssLine > lassLine);

    if (nextCssLine !== undefined) {
      // Check if there's another lass block between this lass and the css
      const hasLassBetween = lassBlocks.some((l) => l > lassLine && l < nextCssLine);

      if (!hasLassBetween) {
        // This is a lass+css pair - check if both are in the same test-case
        const lassInside = isInsideRegion(lassLine, testCaseRegions);
        const cssInside = isInsideRegion(nextCssLine, testCaseRegions);

        if (!lassInside || !cssInside) {
          errors.push({
            file: fileName,
            line: lassLine,
            message: 'Untested: ```lass + ```css pair not wrapped in <test-case>',
          });
        }
      }
    }
  }

  return { errors, testCaseCount: testCaseRegions.length };
}

/**
 * Main function
 */
function main(): void {
  const verbose = process.argv.includes('--verbose');
  const allErrors: LintError[] = [];
  let totalTestCases = 0;

  // Find all markdown files
  const files = findMarkdownFiles(docsDir);

  for (const filePath of files) {
    const fileName = relative(docsDir, filePath);
    const { errors, testCaseCount } = lintFile(filePath, fileName);

    totalTestCases += testCaseCount;
    allErrors.push(...errors);

    if (verbose) {
      if (errors.length === 0) {
        console.log(`✓ ${fileName} (${testCaseCount} test cases)`);
      } else {
        for (const error of errors) {
          console.log(`✗ ${error.file}:${error.line} - ${error.message}`);
        }
      }
    }
  }

  // Print errors (always, even without verbose)
  if (!verbose) {
    for (const error of allErrors) {
      console.log(`✗ ${error.file}:${error.line} - ${error.message}`);
    }
  }

  // Summary
  if (allErrors.length === 0) {
    if (verbose) {
      console.log(`\n✓ All ${totalTestCases} code examples are tested`);
    }
    process.exit(0);
  } else {
    console.log(`\n${allErrors.length} untested code example(s) found.`);
    console.log('Wrap them in <test-case type="valid">...</test-case>');
    process.exit(1);
  }
}

main();
