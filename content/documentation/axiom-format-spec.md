# Lass Axiom Format Specification

> **Document Type:** Specification (not an axiom file)  
> **FR:** FR-AXIOM  
> **Last Updated:** 2026-02-06

## Overview

A Lass axiom file is a **Markdown document** with **YAML frontmatter** that contains multiple **test cases** for a single language feature. Axioms are foundational truths that define language behavior - they serve as the single source of truth for:

1. **Specification** — what the language does
2. **Test generation** (MVP) — a parser reads axiom files and generates test cases
3. **Human documentation** (Growth) — axiom files render as readable docs (GitHub, docs site)
4. **AI reference** (Growth) — a generator extracts the structured content into a dense single-page spec

## File Convention

```
packages/axioms/                       ← axiom package root
  AXIOM-FORMAT-SPEC.md                 ← this file
  src/
    index.ts                           ← loader exports
    loader.ts                          ← axiom parser
  css-passthrough.common.md            ← main docs + primary examples
  css-passthrough.extra-cases.md       ← edge cases, regressions (optional)
  two-zone-model.common.md
  dollar-substitution.common.md
  dollar-substitution.extra-cases.md
  dollar-explicit.common.md
  mustache-expression.common.md
  fragment-syntax.common.md
  single-line-comments.common.md
  css-nesting.common.md
  prop-accessor.common.md
  custom-prop-accessor.common.md
  cross-rule-accessor.common.md
  self-accessor.common.md
  design-token-import.common.md
  bundler-integration.common.md
```

- **One file per feature.** Each file maps to one FR.
- **Extensions:**
  - `.common.md` — Main documentation + primary examples (linked in docs index)
  - `.extra-cases.md` — Edge cases, regressions, error cases (optional)
- **Location:** `packages/axioms/` (the `@lass-lang/axioms` package)
- **Naming:** kebab-case feature name
- **Alphabetical sort order:** `.common.md` → `.extra-cases.md`

| Pattern | Purpose | Linked in docs? |
|---------|---------|-----------------|
| `<feature>.common.md` | Main documentation + primary examples | Yes |
| `<feature>.extra-cases.md` | Edge cases, regressions, error cases | Optional |

## File Structure

```
┌─ YAML frontmatter (optional) ───────────┐
│  feature, fr, phase, description, tags  │
├─ Markdown body ─────────────────────────┤
│  # Feature Title                        │
│                                         │
│  ## valid: test case name               │
│  (optional prose)                       │
│  ```lass ... ```                        │
│  (optional companion files)             │
│  ```css ... ```                         │
│                                         │
│  ## valid: another test case            │
│  ...                                    │
│                                         │
│  ## invalid: error case name            │
│  (optional prose)                       │
│  ```lass ... ```                        │
│  ```error ... ```                       │
└─────────────────────────────────────────┘
```

## YAML Frontmatter

Required fields:

```yaml
---
feature: dollar-substitution    # kebab-case identifier (unique across all axioms)
fr: FR-DOLLAR                   # FR reference from PRD
phase: MVP                      # MVP | Growth | Vision
description: >                  # 1-3 sentence description of the feature
  In the CSS zone, $name performs text substitution from JS preamble
  variables. No expression evaluation.
tags: [symbol-system, substitution, two-zone]   # freeform tags for filtering
---
```

Optional fields:

```yaml
depends: [two-zone-model]              # features this one requires
see-also: [mustache-expression]        # related features (cross-referenced in prose)
companions: [tokens.json]              # companion files needed by test cases
```

## Test Case Format

### Heading Convention

Each `## ` heading defines one test case. The heading format is:

```
## {outcome}: {name}
## {outcome}: {name} [test]
```

Where `{outcome}` is one of:
- **`valid`** — this input MUST compile and produce the expected CSS output
- **`invalid`** — this input MUST produce the expected error

The `{name}` is a descriptive, human-readable label for the test case.

### Documentation Visibility

Test cases are visible in documentation by default. To mark a test case
as test-only (hidden from the docs site and AI reference), append `[test]`
to the heading:

```
## valid: basic substitution              ← shown in docs (default)
## valid: $name adjacent to hyphen [test] ← test runner only
```

The `[test]` tag is used for:
- **Cross-feature interaction tests** that belong to the test suite but
  not to a single feature's documentation page
- **Exhaustive edge cases** that are important for correctness but would
  clutter the human-readable docs
- **Regression tests** added after bug fixes

The docs generator strips `[test]`-tagged cases. The test generator
includes all cases regardless of tag.

### Valid Test Cases

A valid test case has:
1. `## valid: {name}` heading
2. Optional prose (Markdown paragraph) explaining the behavior
3. A ` ```lass ` code block with the `.lass` input
4. Zero or more companion file blocks (` ```{filename} `)
5. A ` ```css ` code block with the expected CSS output

```markdown
## valid: basic substitution

```lass
const $color = 'red'
---
p {
  color: $color;
}
` ``

` ``css
p {
  color: red;
}
` ``
```

### Invalid Test Cases

An invalid test case has:
1. `## invalid: {name}` heading
2. Optional prose explaining why this is invalid
3. A ` ```lass ` code block with the invalid `.lass` input
4. A ` ```error ` code block with the expected error pattern

```markdown
## invalid: undefined variable

` ``lass
---
p {
  color: $undefined;
}
` ``

` ``error
ReferenceError: $undefined is not defined
` ``
```

### Companion Files

Some test cases need external files (e.g., JSON token files for import).
These are declared as code blocks with the filename as the language tag:

```markdown
## valid: expression accessing imported data

` ``lass
import tokens from './tokens.json'
---
:root {
  --primary: {{ tokens.colors.primary }};
}
` ``

` ``tokens.json
{
  "colors": {
    "primary": "#3b82f6"
  }
}
` ``

` ``css
:root {
  --primary: #3b82f6;
}
` ``
```

The axiom parser extracts companion files and creates them in a
temp directory before running the test.

### Prose Between Code Blocks

Markdown prose between the heading and the code blocks is:
- **For humans:** rendered as documentation explaining the behavior
- **For tests:** ignored by the test generator
- **For AI reference:** included as context

This is what makes axioms self-documenting. A contributor can read
the prose to understand WHY a behavior exists, not just WHAT it does.

### Prose Style

Axiom prose is developer documentation. It talks to the person using
Lass — precise about behavior, but conversational. Think Svelte docs or
MDN, not W3C normative specifications.

1. **Feature-level prose** (after `# Title`, before first `##`): Explain
   the feature in 2-5 short paragraphs. What it does, how it differs
   from similar features, any boundaries or gotchas. Use inline code
   examples in the prose itself when they help. Cross-reference related
   features with `See [feature](./feature.common.md)`.

   This prose is rendered as the feature's documentation page on the
   docs site. A developer should be able to understand the feature from
   the prose alone — the test cases prove it and show edge cases.

2. **Test-case prose** (after `##`, before code blocks): One or two
   sentences explaining what this case shows and why it matters. If the
   behavior is obvious from the code, keep it short.

   This prose is rendered alongside the example on the docs site.

3. **`> Note:` / `> Tip:` blocks**: For workarounds, future-version
   hints, or "if you need X, use Y instead" pointers.

4. **`See [feature](./link)`**: Cross-reference related axioms when
   a test case touches another feature.

5. **Tone rules**:
   - "You" is fine — you're talking to a developer.
   - Short sentences. One idea per sentence.
   - Strict about behavior — no ambiguity about what the output is.
   - No RFC keywords (MUST, SHALL). Just say what happens.
   - Concrete over abstract: "the output is `23 * 2`" beats
     "the expression is not evaluated".

## Parsing Rules

The axiom parser extracts test cases by:

1. Parse YAML frontmatter → feature metadata
2. Extract feature-level prose (between `# Title` and first `##`) → documentation text
3. Split body on `## ` headings → test cases
4. For each test case:
   a. Parse heading → `{outcome}`, `{name}`, and `{visibility}` (default: `doc`, or `test` if `[test]` tag present)
   b. Extract first ` ```lass ` block → input
   c. Extract all non-`lass`/non-`css`/non-`error` code blocks → companion files (language tag = filename)
   d. If `valid`: extract ` ```css ` block → expected output
   e. If `invalid`: extract ` ```error ` block → expected error pattern
   f. Remaining Markdown → prose (used by docs generator, ignored by test runner)

### Code Block Ordering

Within a test case, blocks must appear in this order:
1. ` ```lass ` (required — always first code block)
2. Companion file blocks (optional — any order)
3. ` ```css ` or ` ```error ` (required — always last code block)

### Error Matching

Error blocks are matched as substrings. The test runner checks that
the actual error message **contains** the expected error text. This
allows error messages to include additional context (file paths, etc.)
without breaking axioms.

## Test Generation

Axiom tests are generated **dynamically at runtime** — no generated test files are committed to the repository. The test runner loads axiom files directly:

```
packages/axioms/dollar-substitution.common.md
packages/axioms/dollar-substitution.extra-cases.md (if exists)
  → packages/core/test/axioms.test.ts (dynamic test generation)
```

**Documentation is the source of truth:** Tests are derived from the markdown files. The `loader.ts` utility parses both `.common.md` and `.extra-cases.md` files to extract code blocks for test generation.

Tests are generated dynamically using Vitest's `describe.each` or `test.each`:

```typescript
// packages/core/test/axioms.test.ts
import { loadAllAxioms } from '@lass-lang/axioms';
import { transpile } from '../src/index.js';

const axioms = loadAllAxioms();

describe.each(axioms)('$feature', ({ testCases }) => {
  describe.each(testCases.filter(tc => tc.outcome === 'valid'))('valid: $name', ({ input, expected }) => {
    test('produces expected CSS', async () => {
      const { code } = transpile(input);
      const module = await import(`data:text/javascript,${encodeURIComponent(code)}`);
      expect(module.default).toBe(expected);
    });
  });

  describe.each(testCases.filter(tc => tc.outcome === 'invalid'))('invalid: $name', ({ input, expected }) => {
    test('throws expected error', () => {
      expect(() => {
        const { code } = transpile(input);
        eval(code);
      }).toThrow(expected);
    });
  });
});
```

No generated test files are committed — axioms are the source of truth.

## Documentation Generation (Growth)

The axiom file IS the documentation source. The feature-level prose
is the spec; the test-case prose and examples are the reference.

1. **GitHub rendering:** Axioms render natively on GitHub — contributors
   read them directly. All cases are visible (including `[test]`).
2. **Docs site:** A static site generator reads axiom files, extracts
   the feature-level prose and non-`[test]` cases, and renders one page
   per feature with syntax highlighting. `[test]`-tagged cases are
   excluded from the docs site.
3. **AI reference:** A generator reads all axioms, extracts frontmatter +
   feature-level prose + non-`[test]` code blocks, and concatenates into
   a dense single-page reference optimized for token efficiency.

## Directory Layout (Full)

```
packages/
  axioms/                           # @lass-lang/axioms package
    AXIOM-FORMAT-SPEC.md            # this spec
    src/
      index.ts                      # exports loader functions
      loader.ts                     # axiom parser implementation
    css-passthrough.common.md       # main docs + primary examples
    css-passthrough.extra-cases.md  # edge cases (optional)
    two-zone-model.common.md
    dollar-substitution.common.md
    dollar-substitution.extra-cases.md
    ...
    _companion-files/               # shared companion files
      tokens.json                   # reusable token file
      large-stylesheet.css          # stress test input
    package.json
    tsconfig.json

  core/                             # @lass-lang/core package
    src/
      index.ts                      # transpile() function
    test/
      axioms.test.ts                # dynamic tests from axioms
      manual/                       # hand-written tests (perf, integration)
        benchmark.test.ts
```

## Design Decisions

### Why Markdown?

- **Self-documenting by design.** Prose between code blocks explains WHY,
  not just WHAT. Contributors read axioms without additional docs.
- **Renders on GitHub.** No special tooling needed to read axioms.
- **Docs pipeline is nearly free.** The axiom IS the documentation source.
- **YAML frontmatter is universal.** Parsed by gray-matter, static site
  generators, and custom scripts alike.

### Why one file per feature (not per test case)?

- **Readable grouping.** All edge cases for `$name` substitution are in
  one file. A contributor adding a new edge case opens one file.
- **Manageable file count.** 14 features × 1 file = 14 files (not 200+).
- **Natural docs structure.** One page per feature on the docs site.

### Why CSS-only output (not intermediate JS)?

- **Less brittle.** The JS output is an implementation detail. If the
  transpiler refactors its string-assembly strategy, axioms don't break.
- **CSS is the contract.** Users care about CSS output, not JS internals.
- **JS snapshots captured separately.** Snapshot tests for transpiler output
  are in the manual test suite, not in axioms.

### Why substring error matching?

- **Error messages evolve.** Adding file paths, column numbers, or
  suggestions to errors shouldn't break axioms.
- **Pattern captures intent.** `ReferenceError: $undefined is not defined`
  captures the essential error without over-specifying format.

## Axiom Completeness Checklist

For each feature, an axiom file should cover:

- [ ] Happy path (simplest valid usage)
- [ ] Multiple variations (different positions, types, combinations)
- [ ] Edge cases (empty input, boundary conditions, special characters)
- [ ] Context isolation (symbols inside strings, url(), comments NOT detected)
- [ ] Interaction with other features (when relevant, with cross-reference)
- [ ] Invalid usage (at least one error case)
- [ ] Prose explaining non-obvious behavior
