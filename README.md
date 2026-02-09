# @lass-lang/docs

Documentation package for the Lass language with tested code examples.

## Structure

```
content/           # Documentation content
  index.md         # Homepage
  getting-started/ # Getting started guide
  syntax/          # Syntax reference
  llms.txt         # AI-friendly single-page reference
```

## Scripts

```bash
pnpm test          # Run all doc example tests
pnpm test:coverage # Run tests with coverage
pnpm lint:docs     # Check all lass+css pairs are wrapped in <test-case>
```

## Writing Documentation

Code examples use `<test-case>` elements to ensure they stay correct:

```markdown
<test-case type="valid">
```lass
const x = 10;
---
.box { width: {{ x }}px; }
```

```css
.box { width: 10px; }
```
</test-case>
```

The test runner extracts these pairs and verifies the Lass input compiles to the expected CSS output.

## Test Types

- `type="valid"` - Lass compiles to expected CSS
- `type="invalid"` - Lass throws error containing expected message
