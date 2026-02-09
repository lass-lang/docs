---
feature: style-lookup-shorthand
fr: FR-PROP-SHORT
phase: Growth
status: implemented
description: >
  Extra test cases for @prop shorthand. Covers edge cases for @{ } context
  handling and scanner detection behavior.
tags: [symbol-system, accessor, compile-time, shorthand]
---

# @prop Style Lookup Shorthand - Extra Cases

These test cases cover edge cases and implementation details for `@prop`
shorthand that complement the main axiom file.

<!-- ============================================ -->
<!-- @{ } Context Handling                        -->
<!-- ============================================ -->

<test-case type="valid">

## valid: @prop detected inside @{ } within {{ }}

The `@{ }` style block creates a CSS context inside a `{{ }}` JS context.
`@prop` shorthand IS detected in `@{ }` because it's CSS context.

```lass
---
.box {
  border: 1px solid;
  margin: {{ @{ @border } }};
}
```

```css
.box {
  border: 1px solid;
  margin: 1px solid;
}
```

</test-case>


<test-case type="valid">

## valid: @prop in @{ } with surrounding JS

`@prop` inside `@{ }` is detected even with JS code around it.

```lass
---
.box {
  color: red;
  content: {{ "prefix-" + @{ @color } + "-suffix" }};
}
```

```css
.box {
  color: red;
  content: prefix-red-suffix;
}
```

</test-case>

