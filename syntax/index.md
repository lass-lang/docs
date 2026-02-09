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

<test-case type="valid">
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
</test-case>

### Without preamble (pure CSS)

<test-case type="valid">
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
</test-case>

### Functions in preamble

<test-case type="valid">
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
</test-case>

---

## Expression Interpolation (`{{ }}`)

`{{ }}` evaluates a JS expression and inserts the result into CSS. Works in value, selector, and property name positions.

### Value position

<test-case type="valid">
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
</test-case>

### Selector position

<test-case type="valid">
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
</test-case>

### Property name position

<test-case type="valid">
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
</test-case>

### Function calls

<test-case type="valid">
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
</test-case>

### Array auto-join

Arrays are automatically joined with space (CSS-friendly for shorthand properties):

<test-case type="valid">
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
</test-case>

For different separators, use explicit `.join()`:

<test-case type="valid">
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
</test-case>

### Null/undefined handling

`null`, `undefined`, and `false` produce empty string - just like JSX conditional rendering:

<test-case type="valid">
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
</test-case>

---

## Style Lookup (`@(prop)` / `@prop`)

In the CSS zone, read the last-declared value of a CSS property. Use it in value positions - resolution walks up the selector tree.

### Full syntax `@(prop)`

<test-case type="valid">
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
</test-case>

### Shorthand `@prop`

Works for properties starting with a letter:

<test-case type="valid">
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
</test-case>

### Parent walk-up

<test-case type="valid">
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
</test-case>

### Custom properties

`@(--custom)` works but `var(--custom)` is usually better (browser-resolved, supports fallbacks). Use `@()` for custom properties when you need build-time resolution:

<test-case type="valid">
```lass
.box {
  --base-size: 16px;
  padding: @(--base-size);
  margin: var(--base-size);
}
```

```css
.box {
  --base-size: 16px;
  padding: 16px;
  margin: var(--base-size);
}
```
</test-case>

Note: `@--custom` shorthand doesn't work due to the `--` prefix. Use `@(--custom)`.

### Inside expressions

<test-case type="valid">
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
</test-case>

Note: `parseFloat('16px')` returns `16` - JavaScript parses the leading number.

### Unresolved lookups

Properties not found are preserved (for PostCSS or other tools):

<test-case type="valid">
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
</test-case>

---

## Variable Substitution (`$name`)

Simple text substitution from `$`-prefixed variables. No expression evaluation.

### Basic substitution

<test-case type="valid">
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
</test-case>

### In selectors

<test-case type="valid">
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
</test-case>

### Text-only (no evaluation)

<test-case type="valid">
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
</test-case>

Use `{{ $gap * 2 }}` for evaluated math.

### Inside `calc()` (text substitution)

`$param` substitutes text, so the value goes into CSS `calc()`:

<test-case type="valid">
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
</test-case>

The browser evaluates `calc(23 * 1px)` = `23px`. For build-time math, use `{{ }}`.

### Special values

| Value | Output | Why |
|-------|--------|-----|
| `null` | `unset` | CSS fallback |
| `undefined` | `$name` (preserved) | No silent empty |
| non-existent | `$name` (preserved) | Graceful degradation |

### Protected in strings

`$name` inside quotes is literal text:

<test-case type="valid">
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
</test-case>

---

## Style Blocks (`@{ }`)

Create CSS strings from within JS expressions. The inverse of `{{ }}`.

### Basic style block

<test-case type="valid">
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
</test-case>

### With expressions inside

`{{ }}` inside `@{ }` enables dynamic values within generated blocks:

<test-case type="valid">
```lass
const colors = { primary: '#6366f1', secondary: '#8b5cf6' };
---
{{ Object.keys(colors).map(v => @{
  .btn-{{ v }} {
    background: {{ colors[v] }};
  }
}) }}
```

```css
.btn-primary {
  background: #6366f1;
}
.btn-secondary {
  background: #8b5cf6;
}
```
</test-case>

### Generating utilities

Use `{{ }}` with template literals for dynamic CSS generation:

<test-case type="valid">
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
</test-case>

### Mixin pattern

<test-case type="valid">
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
</test-case>

### Conditional pattern (replaces @if/@else)

<test-case type="valid">
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
</test-case>

### Loop pattern (replaces @each/@for)

<test-case type="valid">
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
</test-case>

---

## Comments (`//`)

Use `//` for inline comments in the CSS zone - they're stripped from output, just like SCSS or Less. Standard CSS `/* */` comments are preserved.

### Single-line stripped

<test-case type="valid">
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
</test-case>

### Inline stripped

<test-case type="valid">
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
</test-case>

### CSS comments preserved

<test-case type="valid">
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
</test-case>

### Protected in strings and URLs

<test-case type="valid">
```lass
a {
  content: "https://example.com";
}
.bg {
  background: url(https://example.com/image.png);
}
```

```css
a {
  content: "https://example.com";
}
.bg {
  background: url(https://example.com/image.png);
}
```
</test-case>

Both pass through unchanged - `//` inside strings and URLs is not a comment.

---

[Back to Home](../README.md) | [Getting Started](../getting-started/index.md)
