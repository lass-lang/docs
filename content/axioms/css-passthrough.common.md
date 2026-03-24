---
feature: css-passthrough
fr: FR-CSS
phase: MVP
status: implemented
description: >
  Any valid CSS file renamed to .lass (without a --- separator) produces
  byte-identical CSS output. Lass is a strict CSS superset.
tags: [css-superset, passthrough, foundational]
see-also: [css-nesting, two-zone-model]
---

# CSS Passthrough

Rename any `.css` file to `.lass` and it works. If the file has no `---`
separator, the entire content is treated as a pure CSS zone — the
transpiler wraps it in JS string-assembly code, and the executed output
is byte-identical to the input.

This is the foundational promise: **all valid CSS is valid Lass.** You
can adopt Lass incrementally, one file at a time, without changing a
single line.

The transpiler only transforms Lass-specific symbols (`$name`, `{{ }}`,
`@{ }`, `@(prop)`, `//`). Everything else passes through untouched. And
even those symbols are ignored inside CSS string literals (`"..."`,
`'...'`), `url()` values, and `/* */` comments — so existing CSS that
happens to contain `$` or `{{` in those contexts won't break.

<test-case type="valid">

## valid: basic selectors and properties

```lass
p {
  color: #ff8000;
}
```

```css
p {
  color: #ff8000;
}
```

</test-case>


<test-case type="valid">

## valid: multiple rules

```lass
h1 {
  font-size: 2rem;
  font-weight: bold;
}

p {
  line-height: 1.5;
}
```

```css
h1 {
  font-size: 2rem;
  font-weight: bold;
}

p {
  line-height: 1.5;
}
```

</test-case>


<test-case type="valid">

## valid: at-rules pass through unchanged

CSS at-rules (`@media`, `@layer`, `@container`, `@scope`, `@supports`,
`@keyframes`, etc.) are CSS — not Lass constructs. They pass through
as-is.

Since the transpiler is a text scanner and not a CSS parser, new CSS
at-rules that the W3C adds in the future will pass through automatically
without any transpiler update.

```lass
@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

@layer base {
  * {
    box-sizing: border-box;
  }
}
```

```css
@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

@layer base {
  * {
    box-sizing: border-box;
  }
}
```

</test-case>


<test-case type="valid">

## valid: CSS comments preserved

`/* */` comments are standard CSS and pass through into the output.
Lass's `//` single-line comments are a different story — those get
stripped. See [single-line-comments](./single-line-comments.common.md).

```lass
/* This comment is preserved */
p {
  color: red; /* inline comment preserved */
}
```

```css
/* This comment is preserved */
p {
  color: red; /* inline comment preserved */
}
```

</test-case>


<test-case type="valid">

## valid: CSS nesting passes through

CSS nesting syntax (per CSS Nesting Module Level 1) is standard CSS.
The transpiler doesn't parse or transform it — it goes straight through.
The bundler's CSS pipeline or the browser handles nesting resolution.

```lass
.parent {
  color: red;
  .child {
    color: blue;
  }
}
```

```css
.parent {
  color: red;
  .child {
    color: blue;
  }
}
```

</test-case>


<test-case type="valid">

## valid: empty file

An empty `.lass` file produces empty CSS output. Nothing in, nothing out.

```lass
```

```css
```

</test-case>


<test-case type="valid">

## valid: complex selectors

All valid CSS selectors pass through unchanged — `:has()`, `:not()`,
`::after`, attribute selectors, combinators, the works.

```lass
.card:has(> .header):not(.collapsed) > .body::after {
  content: "";
  display: block;
}
```

```css
.card:has(> .header):not(.collapsed) > .body::after {
  content: "";
  display: block;
}
```

</test-case>


<test-case type="valid">

## valid: url() values pass through unchanged

Standard `url()` values without Lass expressions pass through unchanged.

```lass
.bg {
  background: url(https://example.com/images/hero.png);
}
```

```css
.bg {
  background: url(https://example.com/images/hero.png);
}
```

</test-case>


<test-case type="valid">

## valid: string literals pass through unchanged

CSS string literals without Lass expressions pass through unchanged.
Note: `$` alone is NOT a Lass symbol (requires `$name` pattern).

```lass
.quote {
  content: "Price is $50 USD";
}
```

```css
.quote {
  content: "Price is $50 USD";
}
```

</test-case>


<test-case type="valid">

## valid: whitespace-only file

A file containing only whitespace produces that same whitespace as output.
Nothing to parse, nothing to transform.

```lass
   
```

```css
   
```

</test-case>


<test-case type="valid">

## valid: @charset at-rule

`@charset` has special positioning rules in CSS (must be the very first
thing in the file). Lass doesn't parse or reorder — it passes through
as-is.

```lass
@charset "UTF-8";

p {
  color: red;
}
```

```css
@charset "UTF-8";

p {
  color: red;
}
```

</test-case>


<test-case type="valid">

## valid: malformed CSS passes through unchanged

Lass is a text scanner, not a CSS parser. Malformed CSS passes through
the transpiler unchanged. The bundler's CSS pipeline (PostCSS, Lightning
CSS, or the browser) is responsible for reporting CSS syntax errors.

This test verifies the transpiler does not crash on broken CSS — it
passes through as-is, errors and all.

```lass
p {
  color: red
  background: blue;
```

```css
p {
  color: red
  background: blue;
```

</test-case>


> Note: `css-passthrough` has no `invalid:` test cases because Lass is
> not a CSS validator. When there's no `---` separator and no Lass
> symbols, the transpiler has nothing to reject. CSS validity is the
> downstream pipeline's responsibility.
