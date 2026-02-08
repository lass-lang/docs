# Syntax Reference

> This reference will be completed in Story 7.3

## Overview

Lass files consist of two zones:

1. **Preamble Zone** - JavaScript code between `---` delimiters
2. **Style Zone** - CSS with Lass syntax extensions

## Syntax Elements

### Preamble (`---`)

Define JavaScript that runs at build time:

```lass
---
const spacing = 8;
const color = '#333';
---
```

### Expression Interpolation (`{{ }}`)

Inject JavaScript values into CSS:

```lass
.box {
  margin: {{ spacing * 2 }}px;
  color: {{ color }};
}
```

### Style Lookup (`@(prop)` / `@prop`)

Read the last value of a CSS property:

```lass
.box {
  --brand: #6366f1;
  border-color: @(--brand);  /* Full syntax */
  color: @--brand;           /* Shorthand */
}
```

### Variable Substitution (`$param`)

Simple text replacement:

```lass
---
const $size = '16px';
---

.text {
  font-size: $size;
}
```

### Style Blocks (`@{ }`)

Generate CSS from JavaScript:

```lass
---
const styles = `
  color: red;
  font-weight: bold;
`;
---

.highlight {
  @{ styles }
}
```

### Comments (`//`)

Single-line comments (stripped from output):

```lass
.box {
  // This comment won't appear in CSS
  color: blue;
}
```

---

[Back to Home](../README.md)
