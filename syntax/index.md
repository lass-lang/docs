# Syntax Reference

Complete reference for Lass syntax elements.

## Quick Reference

| Syntax | Purpose | Example |
|--------|---------|---------|
| `---` | Zone separator | JS preamble before, CSS after |
| `{{ expr }}` | Expression interpolation | `width: {{ x * 10 }}px;` |
| `@(prop)` | Style lookup (full) | `color: @(--brand);` |
| `@prop` | Style lookup (shorthand) | `border-left: @border;` |
| `$name` | Variable substitution | `color: $primary;` |
| `@{ css }` | Style block | `{{ @{ color: red; } }}` |
| `//` | Single-line comment | `// stripped from output` |

---

## Zone Separator (`---`)

A `.lass` file is split into two zones by a `---` separator:

- **Above `---`**: JavaScript preamble (imports, variables, functions)
- **Below `---`**: CSS zone with Lass syntax extensions

If there's no `---`, the entire file is CSS zone - plain CSS works as-is.

### With preamble

```lass
const $color = 'blue'
---
p {
  color: $color;
}
```

```css
p {
  color: blue;
}
```

### Without preamble (pure CSS)

```lass
p {
  color: red;
}
```

```css
p {
  color: red;
}
```

### Functions in preamble

```lass
function rem(px) {
  return (px / 16) + 'rem'
}
---
h1 {
  font-size: {{ rem(32) }};
}
```

```css
h1 {
  font-size: 2rem;
}
```

---

## Expression Interpolation (`{{ }}`)

`{{ }}` evaluates a JS expression and inserts the result into CSS. Works in value, selector, and property name positions.

### Value position

```lass
const gap = 23
---
.box {
  padding: {{ gap * 2 }}px;
}
```

```css
.box {
  padding: 46px;
}
```

### Selector position

```lass
const tag = 'article'
---
{{ tag }} {
  display: block;
}
```

```css
article {
  display: block;
}
```

### Property name position

```lass
const prop = 'background-color'
---
.box {
  {{ prop }}: blue;
}
```

```css
.box {
  background-color: blue;
}
```

### Function calls

```lass
function px(n) { return n + 'px' }
---
.box {
  margin: {{ px(16) }};
}
```

```css
.box {
  margin: 16px;
}
```

### Array auto-join

Arrays are automatically joined with space (CSS-friendly for shorthand properties):

```lass
const items = ['a', 'b', 'c']
---
.list {
  --items: {{ items.map(x => x.toUpperCase()) }};
}
```

```css
.list {
  --items: A B C;
}
```

For different separators, use explicit `.join()`:

```lass
const sizes = [1, 2, 4, 8]
---
:root {
  {{ sizes.map(s => '--space-' + s + ': ' + (s * 4) + 'px;').join('\n  ') }}
}
```

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-8: 32px;
}
```

### Null/undefined handling

`null`, `undefined`, and `false` produce empty string (React-style):

```lass
const value = null
---
.box {
  color: red{{ value }};
}
```

```css
.box {
  color: red;
}
```

---

## Style Lookup (`@(prop)` / `@prop`)

Read the last-declared value of a CSS property. Resolution walks up the selector tree.

### Full syntax `@(prop)`

```lass
.box {
  border: 1px solid black;
  outline: @(border);
}
```

```css
.box {
  border: 1px solid black;
  outline: 1px solid black;
}
```

### Shorthand `@prop`

Works for properties starting with a letter:

```lass
.box {
  border: 2px solid blue;
  outline: @border;
}
```

```css
.box {
  border: 2px solid blue;
  outline: 2px solid blue;
}
```

### Parent walk-up

```lass
.card {
  padding: 1.5rem;
  .content {
    margin: @padding;
  }
}
```

```css
.card {
  padding: 1.5rem;
  .content {
    margin: 1.5rem;
  }
}
```

### Custom properties (use full syntax)

`@--custom` doesn't work - use `@(--custom)`:

```lass
.box {
  --accent-color: blue;
  color: @(--accent-color);
}
```

```css
.box {
  --accent-color: blue;
  color: blue;
}
```

### Inside expressions

```lass
.box {
  padding: 16px;
  margin: {{ parseInt(@(padding)) * 2 }}px;
}
```

```css
.box {
  padding: 16px;
  margin: 32px;
}
```

### Unresolved lookups

Properties not found are preserved (for PostCSS or other tools):

```lass
.box {
  color: @(font-size);
}
```

```css
.box {
  color: @(font-size);
}
```

---

## Variable Substitution (`$name`)

Simple text substitution from `$`-prefixed variables. No expression evaluation.

### Basic substitution

```lass
const $color = 'red'
---
p {
  color: $color;
}
```

```css
p {
  color: red;
}
```

### In selectors

```lass
const $component = 'card'
---
.$component {
  display: block;
}
```

```css
.card {
  display: block;
}
```

### Text-only (no evaluation)

```lass
const $gap = 23
---
.box {
  padding: $gap * 2;
}
```

```css
.box {
  padding: 23 * 2;
}
```

Use `{{ $gap * 2 }}` for evaluated math.

### Inside `calc()` (text substitution)

`$param` substitutes text, so the value goes into CSS `calc()`:

```lass
const $gap = 23
---
.box {
  padding: calc($gap * 1px);
}
```

```css
.box {
  padding: calc(23 * 1px);
}
```

The browser evaluates `calc(23 * 1px)` = `23px`. For build-time math, use `{{ }}`.

### Special values

| Value | Output | Why |
|-------|--------|-----|
| `null` | `unset` | CSS fallback |
| `undefined` | `$name` (preserved) | No silent empty |
| non-existent | `$name` (preserved) | Graceful degradation |

### Protected in strings

`$name` inside quotes is literal text:

```lass
const $color = 'red'
---
.quote {
  content: "the value is $color";
}
```

```css
.quote {
  content: "the value is $color";
}
```

---

## Style Blocks (`@{ }`)

Create CSS strings from within JS expressions. The inverse of `{{ }}`.

### Basic style block

```lass
const makeBorder = () => @{ border: 1px solid; }
---
.box {
  {{ makeBorder() }}
}
```

```css
.box {
  border: 1px solid;
}
```

### With expressions inside

`{{ }}` inside `@{ }` works:

```lass
const size = 10
---
.box {
  {{ @{ padding: {{ size }}px; } }}
}
```

```css
.box {
  padding: 10px;
}
```

### Generating utilities

Use `{{ }}` with template literals for dynamic CSS generation:

```lass
const sizes = [1, 2, 4, 8]
---
{{ sizes.map(n => `.m-${n} { margin: ${n * 0.25}rem; }`).join('\n') }}
```

```css
.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.m-4 { margin: 1rem; }
.m-8 { margin: 2rem; }
```

### Mixin pattern

```lass
function card(bg) {
  return @{
    background: {{ bg }};
    border-radius: 8px;
    padding: 16px;
  }
}
---
.card {
  {{ card('#ffffff') }}
}
```

```css
.card {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
}
```

### Conditional pattern (replaces @if/@else)

```lass
const darkMode = true
---
body {
  {{ darkMode ? @{
    background: #1a1a1a;
    color: #e0e0e0;
  } : @{
    background: #ffffff;
    color: #333333;
  } }}
}
```

```css
body {
  background: #1a1a1a;
  color: #e0e0e0;
}
```

### Loop pattern (replaces @each/@for)

```lass
const breakpoints = { sm: '640px', md: '768px' }
---
{{ Object.entries(breakpoints).map(([name, width]) => @{
  @media (min-width: {{ width }}) {
    .container-{{ name }} {
      max-width: {{ width }};
    }
  }
}) }}
```

```css
@media (min-width: 640px) {
  .container-sm {
    max-width: 640px;
  }
}
@media (min-width: 768px) {
  .container-md {
    max-width: 768px;
  }
}
```

---

## Comments (`//`)

Single-line comments are stripped from output. CSS `/* */` comments are preserved.

### Single-line stripped

```lass
p {
  // this comment is stripped
  color: red;
}
```

```css
p {
  
  color: red;
}
```

### Inline stripped

```lass
p {
  color: red; // this is stripped
}
```

```css
p {
  color: red; 
}
```

### CSS comments preserved

```lass
/* preserved */
p {
  color: red; /* also preserved */
}
```

```css
/* preserved */
p {
  color: red; /* also preserved */
}
```

### Protected in strings and URLs

```lass
a {
  content: "https://example.com";
}
.bg {
  background: url(https://example.com/image.png);
}
```

Both pass through unchanged - `//` inside strings and URLs is not a comment.

---

[Back to Home](../README.md) | [Getting Started](../getting-started/index.md)
