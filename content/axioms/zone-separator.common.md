---
feature: zone-separator
fr: FR-ZONE
phase: MVP
status: implemented
description: >
  A .lass file with opening and closing --- delimiters has a JS/TS preamble
  between them, followed by a CSS zone. Files without --- are pure CSS.
tags: [foundational, two-zone, preamble]
see-also: [css-passthrough, script-lookup, mustache-expression]
companions: [tokens.json]
---

# Two-Zone Model

A `.lass` file can have an optional JS/TS preamble surrounded by `---` delimiters:

- **Opening `---`** (line 1): marks the start of the preamble
- **JS/TS preamble**: Standard JavaScript or TypeScript between the delimiters.
  Imports, variables, functions, async/await — anything goes.
- **Closing `---`**: marks the end of the preamble
- **CSS zone**: Standard CSS after the closing delimiter, plus Lass symbols
  (`$name`, `{{ }}`, `@{ }`, `@(prop)`, `//`).

The delimiter lines can include an optional comment or extra dashes:
- `---` (bare three dashes)
- `--- here starts the preamble` (comment after space)
- `------` (visual separator with extra dashes)
- `--- centered title ---` (decorative style)

Note: whitespace or extra dashes are required after the three dashes — 
`---nospace` is **not** a delimiter (avoids confusion with CSS `--custom` properties).

If there's no `---` on line 1, the entire file is a CSS zone — which is why 
plain CSS files work as-is (see [css-passthrough](./css-passthrough.common.md)).

The preamble uses surrounding delimiters (like YAML frontmatter). The opening 
`---` must be on line 1. The second `---` closes the preamble. Any subsequent 
`---` in the CSS zone is treated as CSS text (which CSS parsers will error on).

The preamble executes as standard JS/TS in the bundler's Node.js process.
Variables defined there become available to the CSS zone through `$name`
and `{{ }}`.

<test-case type="valid">

## valid: basic two-zone file

The preamble defines a variable, the CSS zone uses it.

```lass
---
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


<test-case type="valid">

## valid: no separator — pure CSS zone

Without `---`, the entire file is CSS zone. This is how CSS passthrough
works.

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


<test-case type="valid" skip>

## valid: preamble with imports

The preamble supports `import` — resolved by the bundler's module graph,
just like any other JS module.

> Skipped: Requires bundler context for import resolution

```lass
---
import tokens from './tokens.json'

const $primary = tokens.colors.primary
---
.button {
  background: $primary;
}
```

```tokens.json
{
  "colors": {
    "primary": "#3b82f6"
  }
}
```

```css
.button {
  background: #3b82f6;
}
```

</test-case>


<test-case type="valid">

## valid: preamble with functions

You can define functions in the preamble and call them from `{{ }}` in
the CSS zone.

```lass
---
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

</test-case>


<test-case type="valid" skip>

## valid: preamble with async/await

The preamble supports `async`/`await`. The transpiled JS module is
async, so top-level await works.

> Skipped: Requires external mock for `fetchTheme()`

The test harness must provide a mock for `fetchTheme()` that returns
a color value. The axiom uses `'#1a1a2e'` as the expected return.

```lass
---
const $theme = await fetchTheme()
---
body {
  background: $theme;
}
```

```css
body {
  background: #1a1a2e;
}
```

</test-case>


> The test generator must arrange for `fetchTheme()` to return `'#1a1a2e'`
> before executing this axiom. This is the only axiom that requires
> an external mock — all others are self-contained.

<test-case type="valid">

## valid: empty preamble

Opening and closing `---` with nothing between them is valid. The preamble 
is empty, the CSS zone starts immediately after the closing delimiter.

```lass
---
---
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


<test-case type="valid">

## valid: preamble with multiple statements

The preamble is full JS — you can have as many statements as you want.

```lass
---
const $base = 16
const $scale = 1.25
const $sizes = Array.from({ length: 6 }, (_, i) =>
  ($base * Math.pow($scale, i)).toFixed(2) + 'px'
)
---
:root {
  {{ $sizes.map((s, i) => `--font-${i + 1}: ${s};`).join('\n  ') }}
}
```

```css
:root {
  --font-1: 16.00px;
  --font-2: 20.00px;
  --font-3: 25.00px;
  --font-4: 31.25px;
  --font-5: 39.06px;
  --font-6: 48.83px;
}
```

</test-case>


<test-case type="valid">

## valid: --- inside a CSS string literal is not a separator

The scanner only recognizes `---` as a delimiter when it appears on its
own line, at the start of the line. `---` inside a CSS string is just
text.

```lass
---
const $label = 'test'
---
.divider::after {
  content: "---";
  color: $label;
}
```

```css
.divider::after {
  content: "---";
  color: test;
}
```

</test-case>


<test-case type="valid">

## valid: --- with leading whitespace is not a delimiter

The scanner only recognizes `---` as a delimiter when it appears at
column 0 with no leading whitespace. Indented `---` is just text.

```lass
---
const $x = 'test'
---
.divider {
  content: "  ---";
  color: $x;
}
```

```css
.divider {
  content: "  ---";
  color: test;
}
```

</test-case>


<test-case type="valid">

## valid: --- inside a /* */ CSS comment is not a delimiter

The scanner skips `---` detection inside `/* */` comments in the CSS zone. 
A `---` on its own line inside a CSS comment is just comment text.

```lass
---
const $x = 'test'
---
/*
---
*/
p {
  color: $x;
}
```

```css
/*
---
*/
p {
  color: test;
}
```

</test-case>


<test-case type="valid">

## valid: delimiter with comment

The `---` delimiter can have an optional comment after a space.
Everything after `--- ` is ignored by the transpiler. Comments can
appear on the opening and/or closing delimiter.

```lass
--- design tokens
const $primary = '#2563eb'
--- here starts the CSS
.button {
  background: $primary;
}
```

```css
.button {
  background: #2563eb;
}
```

</test-case>


<test-case type="valid">

## valid: empty preamble with comments

Opening and closing delimiters with comments but no JS between them is valid.
The preamble is empty, and comments are stripped.

```lass
--- just the reset here
---
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


<test-case type="valid">

## valid: delimiter with only spaces after dashes

A `---` followed by only whitespace is still a valid delimiter.

```lass
---
const $x = 'test'
---   
.box {
  color: $x;
}
```

```css
.box {
  color: test;
}
```

</test-case>


<test-case type="valid">

## valid: extra --- in CSS zone

The second `---` closes the preamble. Any additional `---` in the CSS zone
is treated as CSS text, which CSS parsers will reject as a syntax error.
The Lass transpiler does not error on this - it lets CSS handle it naturally.

```lass
---
const $a = 1
---
p { color: red; }
---
p { color: blue; }
```

```css
p { color: red; }
---
p { color: blue; }
```

</test-case>


<test-case type="valid">

## valid: opening delimiter with no closing

If the opening `---` has no closing delimiter, the entire file after line 1
is treated as JS preamble. The CSS zone is empty. This creates a pure JS file.

```lass
---
const css = 'body { color: red; }'
```

```css

```

</test-case>


<test-case type="valid">

## valid: visual separator style with extra dashes

The delimiter can use extra dashes for visual emphasis. The regex `^---( .*|-*)$`
matches three or more dashes, optionally followed by a space and comment.

```lass
----------
const $color = 'blue'
----------
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


<test-case type="valid">

## valid: centered title style delimiter

The delimiter comment can include dashes for decorative styling.

```lass
--- design tokens ---
const $primary = '#2563eb'
---
.button {
  background: $primary;
}
```

```css
.button {
  background: #2563eb;
}
```

</test-case>


<test-case type="valid">

## valid: no opening delimiter - pure CSS file

If `---` does not appear on line 1, the file is treated as pure CSS.
Any `---` in the CSS will be rejected by CSS parsers naturally.

```lass
p {
  color: red;
}
---
p {
  color: blue;
}
```

```css
p {
  color: red;
}
---
p {
  color: blue;
}
```

</test-case>

