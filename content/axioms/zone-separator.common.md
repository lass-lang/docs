---
feature: zone-separator
fr: FR-ZONE
phase: MVP
status: implemented
description: >
  A .lass file with a --- separator has two zones: JS/TS above (the
  preamble) and CSS below. Files without --- are pure CSS zone.
tags: [foundational, two-zone, preamble]
see-also: [css-passthrough, script-lookup, mustache-expression]
companions: [tokens.json]
---

# Two-Zone Model

A `.lass` file is split into two zones by a `---` separator:

- **Above `---`**: the JS/TS preamble. Standard JavaScript or TypeScript.
  Imports, variables, functions, async/await — anything goes.
- **Below `---`**: the CSS zone. Standard CSS, plus Lass symbols
  (`$name`, `{{ }}`, `@{ }`, `@prop`, `//`).

The separator can include an optional comment after any whitespace:
`--- here starts the CSS`. Everything after the whitespace is ignored.
Note: whitespace is required after the dashes — `---nospace` is **not**
a separator (this avoids confusion with CSS custom properties like `--foo`).

If there's no `---`, the entire file is a CSS zone — which is why plain
CSS files work as-is (see [css-passthrough](./css-passthrough.common.md)).

Only one `---` separator per file. If the file contains `---`, everything
before the first `---` is preamble, everything after is CSS zone.

The preamble executes as standard JS/TS in the bundler's Node.js process.
Variables defined there become available to the CSS zone through `$name`
and `{{ }}`.

<test-case type="valid">

## valid: basic two-zone file

The preamble defines a variable, the CSS zone uses it.

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

A `---` with nothing above it is valid. The preamble is empty, the CSS
zone starts immediately after the separator.

```lass
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

The scanner only recognizes `---` as a separator when it appears on its
own line, at the start of the line. `---` inside a CSS string is just
text.

```lass
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

## valid: --- with leading whitespace is not a separator

The scanner only recognizes `---` as a separator when it appears at
column 0 with no leading whitespace. Indented `---` is just text.

```lass
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

## valid: --- inside a /* */ CSS comment is not a separator

The scanner skips `---` detection inside `/* */` comments. A `---` on
its own line inside a CSS comment is just comment text.

```lass
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

## valid: separator with comment

The `---` separator can have an optional comment after a space.
Everything after `--- ` is ignored by the transpiler. The behavior
is identical to a bare `---`.

```lass
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

## valid: separator with comment and no preamble

A `--- comment` with no content above it is valid. The entire file
below the separator is treated as CSS zone, and the comment is stripped.

```lass
--- just the reset here
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

## valid: separator with only spaces after dashes

A `---` followed by only whitespace is still a valid separator.

```lass
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


<test-case type="invalid">

## invalid: multiple --- separators

Only one `---` is allowed per file. A second `---` is an error.

```lass
const $a = 1
---
p { color: red; }
---
p { color: blue; }
```

```error
Multiple --- separators
```

</test-case>

