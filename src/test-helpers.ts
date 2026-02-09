/**
 * Documentation test helpers
 *
 * Helper functions for testing Lass documentation examples.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { extractTestCasesFromMD, type TestCase } from './extractor.js';
import { transpile } from '@lass-lang/core';

export { extractTestCasesFromMD, type TestCase } from './extractor.js';

export interface FileResults {
  file: string;
  testCases: TestCase[];
}

/**
 * Executes transpiled Lass code and returns the CSS output.
 */
export async function executeTranspiledCode(code: string): Promise<string> {
  const originalLog = console.log;
  console.log = () => {};

  try {
    const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
    const module = await import(dataUrl);
    return module.default;
  } finally {
    console.log = originalLog;
  }
}

/**
 * Run a valid test case: transpile, execute, return output
 */
export async function runValidTestCase(testCase: TestCase): Promise<string> {
  const { code } = transpile(testCase.input);
  return executeTranspiledCode(code);
}

export interface FindOptions {
  /** Directory names to exclude from search */
  exclude?: string[];
}

/**
 * Find all markdown files in a directory recursively
 */
export function findMarkdownFiles(dir: string, options: FindOptions = {}): string[] {
  const files: string[] = [];
  const { exclude = [] } = options;

  for (const entry of readdirSync(dir)) {
    // Skip hidden files, node_modules, and internal directories
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'scripts' || entry === 'test' || entry === 'src' || entry === 'coverage') {
      continue;
    }

    // Skip excluded directories
    if (exclude.includes(entry)) {
      continue;
    }

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, options));
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Parse a documentation file and extract test cases
 */
export function parseDocFile(filePath: string, baseDir: string): FileResults {
  const content = readFileSync(filePath, 'utf-8');
  const relPath = relative(baseDir, filePath);
  const testCases = extractTestCasesFromMD(content, relPath);

  return { file: relPath, testCases };
}
