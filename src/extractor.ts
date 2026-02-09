/**
 * @lass-lang/docs
 *
 * Extracts test cases from markdown files containing <test-case> elements.
 */

/**
 * A test case extracted from markdown.
 */
export interface TestCase {
  /** Test name/description for test runner output */
  description: string;
  /** The ```lass code block content */
  input: string;
  /** The expected ```css or ```error block content */
  output: string;
  /** Whether this test expects valid output or an error */
  outcome: 'valid' | 'invalid';
  /** Skip this test (for tests requiring external mocks) */
  skip?: boolean;
  /** Additional files referenced by imports (e.g., tokens.json) */
  companionFiles?: Record<string, string>;
  /** Source file name for error reporting */
  sourceFile?: string;
}

/**
 * Extracts code blocks from a test case section.
 * Returns input, output, and any companion files.
 */
function extractCodeBlocks(
  section: string
): { input: string; output: string; companionFiles?: Record<string, string> } | null {
  // Match all code blocks: ```lang\ncontent\n```
  const codeBlockRegex = /```(\w+(?:\.\w+)?)\n([\s\S]*?)```/g;
  const blocks: Array<{ lang: string; content: string }> = [];

  let match;
  while ((match = codeBlockRegex.exec(section)) !== null) {
    const lang = match[1];
    const content = match[2];
    if (lang !== undefined && content !== undefined) {
      blocks.push({ lang, content });
    }
  }

  if (blocks.length === 0) return null;

  // First block must be lass (input)
  const firstBlock = blocks[0];
  if (!firstBlock || firstBlock.lang !== 'lass') {
    return null;
  }

  const input = firstBlock.content;

  // Last block must be css or error (output)
  const lastBlock = blocks[blocks.length - 1];
  if (!lastBlock || (lastBlock.lang !== 'css' && lastBlock.lang !== 'error')) {
    return null;
  }

  const output = lastBlock.content;

  // Middle blocks are companion files
  const companionFiles: Record<string, string> = {};
  for (let i = 1; i < blocks.length - 1; i++) {
    const block = blocks[i];
    if (block) {
      companionFiles[block.lang] = block.content;
    }
  }

  return {
    input: input.replace(/\n$/, ''),
    output: output.replace(/\n$/, ''),
    companionFiles: Object.keys(companionFiles).length > 0 ? companionFiles : undefined,
  };
}

/**
 * Extracts the test description from a <test-case> section.
 * Priority:
 * 1. description attribute (if provided)
 * 2. First ## heading inside the section (with valid:/invalid: prefix stripped)
 * 3. "unnamed test"
 */
function extractDescription(section: string, descriptionAttr?: string): string {
  if (descriptionAttr) {
    return descriptionAttr;
  }

  // Find first ## heading with valid:/invalid: prefix
  const headingMatch = section.match(/^##\s+(?:valid|invalid):\s*(.+?)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }

  // Fallback: any ## heading
  const anyHeadingMatch = section.match(/^##\s+(.+?)$/m);
  if (anyHeadingMatch?.[1]) {
    return anyHeadingMatch[1].trim();
  }

  return 'unnamed test';
}

/**
 * Extracts test cases from markdown content.
 *
 * Parses <test-case type="valid|invalid" description="..." skip> elements
 * and extracts the ```lass input and ```css/```error output blocks.
 *
 * @param content - The markdown content to parse
 * @param fileName - Optional filename for error reporting
 * @returns Array of test cases
 */
export function extractTestCasesFromMD(content: string, fileName?: string): TestCase[] {
  const testCases: TestCase[] = [];

  // Match <test-case> elements with attributes
  const testCaseRegex = /<test-case\s+([^>]*)>([\s\S]*?)<\/test-case>/g;

  let match;
  while ((match = testCaseRegex.exec(content)) !== null) {
    const attributesStr = match[1] ?? '';
    const sectionContent = match[2] ?? '';

    // Parse type attribute (required)
    const typeMatch = attributesStr.match(/type=["'](valid|invalid)["']/);
    if (!typeMatch?.[1]) {
      continue;
    }
    const outcome = typeMatch[1] as 'valid' | 'invalid';

    // Parse description attribute (optional)
    const descMatch = attributesStr.match(/description=["']([^"']+)["']/);
    const descriptionAttr = descMatch?.[1];

    // Parse skip attribute (boolean, presence means true)
    const skip = /\bskip\b/.test(attributesStr);

    // Extract description
    const description = extractDescription(sectionContent, descriptionAttr);

    // Extract code blocks
    const codeBlocks = extractCodeBlocks(sectionContent);
    if (!codeBlocks) {
      continue;
    }

    testCases.push({
      description,
      input: codeBlocks.input,
      output: codeBlocks.output,
      outcome,
      skip: skip || undefined,
      companionFiles: codeBlocks.companionFiles,
      sourceFile: fileName,
    });
  }

  return testCases;
}
