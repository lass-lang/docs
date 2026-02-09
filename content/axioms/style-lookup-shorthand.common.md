---
feature: style-lookup-shorthand
fr: FR-PROP-SHORT
phase: Growth
status: implemented
description: >
  @prop in CSS value position is shorthand for @(prop). Works only when
  identifier starts with a letter. Not detected inside {{ }} blocks,
  strings, comments, or url(). Use explicit @(prop) for custom properties.
tags: [symbol-system, accessor, compile-time, shorthand]
see-also: [style-lookup, custom-prop-accessor]
depends: [style-lookup]
---

# @prop Style Lookup Shorthand

`@prop` is a shorthand for `@(prop)` in CSS value position. It provides
a more concise way to reference previously-declared CSS property values.

The shorthand only works when the identifier starts with a **letter**.
For custom properties (`--accent`) or vendor prefixes (`-webkit-foo`),
use the explicit `@(prop)` form.

<test-case type="valid">

## valid: basic shorthand resolution

```lass
.box {
  border: 1px solid blue;
  border-left: @border;
}
```

```css
.box {
  border: 1px solid blue;
  border-left: 1px solid blue;
}
```

</test-case>


<test-case type="valid">

## valid: hyphenated property name

Hyphens are part of the CSS identifier, so `@border-color` looks up
the `border-color` property.

```lass
.box {
  border-color: red;
  outline-color: @border-color;
}
```

```css
.box {
  border-color: red;
  outline-color: red;
}
```

</test-case>


<test-case type="valid">

## valid: multiple shorthands in one declaration

```lass
.box {
  width: 100px;
  height: 50px;
  padding: @width @height;
}
```

```css
.box {
  width: 100px;
  height: 50px;
  padding: 100px 50px;
}
```

</test-case>


<test-case type="valid">

## valid: nested scope resolution

Child selectors can access parent properties via shorthand.

```lass
.parent {
  color: red;
  .child {
    background: @color;
  }
}
```

```css
.parent {
  color: red;
  .child {
    background: red;
  }
}
```

</test-case>


<test-case type="valid">

## valid: preserve unresolved shorthand as explicit form

When property is not found, `@prop` is preserved as `@(prop)` for
PostCSS compatibility or future resolution.

```lass
.box {
  color: @missing;
}
```

```css
.box {
  color: @(missing);
}
```

</test-case>


<test-case type="valid">

## valid: at-rules pass through unchanged

CSS at-rules like `@media` are not in value position, so they
pass through unchanged.

```lass
@media (min-width: 768px) {
  .box {
    color: red;
    background: @color;
  }
}
```

```css
@media (min-width: 768px) {
  .box {
    color: red;
    background: red;
  }
}
```

</test-case>


<test-case type="valid">

## valid: shorthand not detected in string literal

`@prop` inside quoted strings is preserved unchanged.

```lass
.box {
  content: "use @color here";
}
```

```css
.box {
  content: "use @color here";
}
```

</test-case>


<test-case type="valid">

## valid: shorthand not detected in block comment

`@prop` inside `/* */` comments is preserved unchanged.

```lass
.box {
  /* use @color for theming */
  color: red;
}
```

```css
.box {
  /* use @color for theming */
  color: red;
}
```

</test-case>


<test-case type="valid">

## valid: shorthand detected in url() without quotes

`@prop` inside `url()` IS detected (same as `$param`). Only
strings protect symbols, not `url()` itself.

```lass
.box {
  --path: images;
  background: url(@path/image.png);
}
```

```css
.box {
  --path: images;
  background: url(@(path)/image.png);
}
```

</test-case>


<test-case type="valid">

## valid: shorthand not detected in url() with quotes

`@prop` inside quoted strings (even inside `url()`) is protected.

```lass
.box {
  background: url("@path/image.png");
}
```

```css
.box {
  background: url("@path/image.png");
}
```

</test-case>


<test-case type="valid">

## valid: shorthand not detected inside script block

`@prop` inside `{{ }}` is not detected as shorthand. Use explicit
`@(prop)` for style lookups inside script blocks.

```lass
.box {
  color: {{ '@border' }};
}
```

```css
.box {
  color: @border;
}
```

</test-case>


<test-case type="valid">

## valid: explicit form works inside script block

Use `@(prop)` for style lookups inside `{{ }}` blocks.

```lass
.box {
  border: 2px solid;
  color: {{ @(border) }};
}
```

```css
.box {
  border: 2px solid;
  color: 2px solid;
}
```

</test-case>


<test-case type="valid">

## valid: custom property requires explicit form

`@--custom` is NOT detected (starts with hyphen). Use `@(--custom)`.

```lass
.box {
  --accent: blue;
  color: @--accent;
}
```

```css
.box {
  --accent: blue;
  color: @--accent;
}
```

</test-case>


<test-case type="valid">

## valid: vendor prefix requires explicit form

`@-webkit-foo` is NOT detected (starts with hyphen). Use `@(-webkit-foo)`.

```lass
.box {
  -webkit-appearance: none;
  appearance: @-webkit-appearance;
}
```

```css
.box {
  -webkit-appearance: none;
  appearance: @-webkit-appearance;
}
```

</test-case>


<test-case type="valid">

## valid: double @ resolves second one

First `@` is literal (not followed by letter), second `@` is shorthand.

```lass
.box {
  border: 1px solid;
  outline: @@border;
}
```

```css
.box {
  border: 1px solid;
  outline: @1px solid;
}
```

</test-case>


<test-case type="valid">

## valid: sibling scope isolation

Properties from sibling selectors are not accessible.

```lass
.sibling1 {
  color: red;
}
.sibling2 {
  background: @color;
}
```

```css
.sibling1 {
  color: red;
}
.sibling2 {
  background: @(color);
}
```

</test-case>


<test-case type="valid">

## valid: mixed with $param

`@prop` and `$param` can be used in the same file.

```lass
const $gap = '8px';
---
.box {
  border: 1px solid;
  border-left: @border;
  padding: $gap;
}
```

```css
.box {
  border: 1px solid;
  border-left: 1px solid;
  padding: 8px;
}
```

</test-case>

