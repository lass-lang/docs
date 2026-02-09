/**
 * Unit tests for test-helpers.ts
 */

import { describe, test, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  executeTranspiledCode,
  findMarkdownFiles,
  parseDocFile,
  runValidTestCase,
} from '../src/test-helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '..');

describe('test-helpers', () => {
  describe('executeTranspiledCode', () => {
    test('executes JS module and returns default export', async () => {
      const code = `export default 'hello world';`;
      const result = await executeTranspiledCode(code);
      expect(result).toBe('hello world');
    });

    test('suppresses console.log during execution', async () => {
      const code = `console.log('should not appear'); export default 'done';`;
      const result = await executeTranspiledCode(code);
      expect(result).toBe('done');
    });
  });

  describe('findMarkdownFiles', () => {
    test('finds markdown files in docs directory', () => {
      const files = findMarkdownFiles(docsDir);
      expect(files.length).toBeGreaterThan(0);
      expect(files.every(f => f.endsWith('.md'))).toBe(true);
    });

    test('includes README.md', () => {
      const files = findMarkdownFiles(docsDir);
      expect(files.some(f => f.endsWith('README.md'))).toBe(true);
    });
  });

  describe('parseDocFile', () => {
    test('parses README.md and extracts test cases', () => {
      const readmePath = join(docsDir, 'README.md');
      const result = parseDocFile(readmePath, docsDir);
      
      expect(result.file).toBe('README.md');
      expect(result.testCases.length).toBeGreaterThan(0);
    });
  });

  describe('runValidTestCase', () => {
    test('transpiles and executes valid lass code', async () => {
      const testCase = {
        description: 'test',
        outcome: 'valid' as const,
        input: '.box { color: red; }',
        output: '.box { color: red; }',
        sourceFile: 'test.md',
      };

      const result = await runValidTestCase(testCase);
      expect(result).toBe('.box { color: red; }');
    });
  });
});
