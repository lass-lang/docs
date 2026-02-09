# Syntax Reference

Complete reference for Lass syntax elements.

## Quick Reference

| Syntax | Purpose | Example |
|--------|---------|---------|
| `---` | Zone separator | JS preamble before, CSS after |
| `{{ expr }}` | Expression interpolation | `width: {{ x * 10 }}px;` |
| `@(prop)` | Style lookup (full) | `outline: @(border);` |
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
const space = (n) => `${n * 0.25}rem`;
---
.card {
  padding: {{ space(4) }} {{ space(6) }};
  gap: {{ space(2) }};
}
```

```css
.card {
  padding: 1rem 1.5rem;
  gap: 0.5rem;
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
const fluid = (min, max) => `clamp(${min}rem, 5vw, ${max}rem)`;
---
.title {
  font-size: {{ fluid(1.5, 3) }};
}
```

```css
.title {
  font-size: clamp(1.5rem, 5vw, 3rem);
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
const stops = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'];
---
.gradient {
  background: linear-gradient(90deg, {{ stops.join(', ') }});
}
```

```css
.gradient {
  background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
}
```

### Null/undefined handling

`null`, `undefined`, and `false` produce empty string - just like JSX conditional rendering:

```lass
const isLarge = false;
const isDisabled = true;
---
.button {
  {{ isLarge && @{ padding: 1.5rem 2rem; } }}
  {{ isDisabled && @{ opacity: 0.5; pointer-events: none; } }}
}
```

```css
.button {
  
  opacity: 0.5; pointer-events: none;
}
```

---

## Style Lookup (`@(prop)` / `@prop`)

In the CSS zone, read the last-declared value of a CSS property. Use it in value positions - resolution walks up the selector tree.

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

### Custom properties

`@(--custom)` works but `var(--custom)` is usually better (browser-resolved, supports fallbacks). Use `@()` for custom properties when you need build-time resolution:

```lass
.box {
  --base-size: 16px;
  padding: @(--base-size);           /* build-time: becomes 16px */
  margin: var(--base-size);          /* runtime: stays as var() */
}
```

```css
.box {
  --base-size: 16px;
  padding: 16px;
  margin: var(--base-size);
}
```

Note: `@--custom` shorthand doesn't work due to the `--` prefix. Use `@(--custom)`.

### Inside expressions

```lass
const double = (v) => parseFloat(v) * 2 + 'px';
---
.box {
  padding: 16px;
  margin: {{ double(@(padding)) }};
}
```

```css
.box {
  padding: 16px;
  margin: 32px;
}
```

Note: `parseFloat('16px')` returns `16` - JavaScript parses the leading number.

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
