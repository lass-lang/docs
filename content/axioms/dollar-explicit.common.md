---
feature: dollar-explicit
fr: FR-DOLLAR-EXPLICIT
phase: deferred
status: deferred
description: >
  $(name) was the planned delimited form of $name, for cases where variable
  boundaries are ambiguous. DEFERRED: JS identifiers can't have hyphens
  (unlike CSS properties), so explicit delimiters aren't needed. Edge cases
  can use {{ $var }} instead. See Epic 4 notes (2026-02-07).
tags: [symbol-system, substitution, deferred]
see-also: [dollar-substitution]
depends: [two-zone-model, dollar-substitution]
---

# $(name) Explicit Form - DEFERRED

> **Status: Deferred (2026-02-07)**
>
> This feature was removed from scope. Unlike CSS properties (which have hyphens),
> JS identifiers use camelCase - no delimiter ambiguity. Quote stripping is also
> unnecessary since JS strings don't carry quote-type like SCSS. Edge cases like
> `.$(color)ful` can use `.{{ $color }}ful` instead.

`$(name)` was planned to do the same thing as `$name` — text substitution from a
`$`-prefixed variable in scope. The difference would be explicit
delimiters: the parentheses would make the variable boundary unambiguous.

The use case was when `$name` can't tell where the variable name ends and
the surrounding text begins. For example, `$(color)Primary` to get `bluePrimary`
when you have `$color = 'blue'`.

**Why deferred:** JS identifier boundaries are clear (`$color-primary` naturally
stops at `$color`), and concatenation cases can use `{{ $color }}Primary`.

<test-case type="valid">

## valid: disambiguating adjacent text

Without `$()`, `$colorPrimary` would look for a variable named
`$colorPrimary`. With `$(color)`, the boundary is explicit.

```lass
const $color = 'blue'
---
.text {
  color: $(color)Primary;
}
```

```css
.text {
  color: bluePrimary;
}
```

</test-case>


<test-case type="valid">

## valid: same behavior as $name in simple cases

When boundaries aren't ambiguous, `$(name)` and `$name` produce
identical output.

```lass
const $size = '16px'
---
p {
  font-size: $(size);
}
```

```css
p {
  font-size: 16px;
}
```

</test-case>


<test-case type="valid">

## valid: concatenating with digits

`$cols3` would look for a variable called `$cols3`. `$(cols)3` finds
`$cols` and appends `3`.

```lass
const $cols = 12
---
.grid {
  grid-column: span $(cols)3;
}
```

```css
.grid {
  grid-column: span 123;
}
```

</test-case>


<test-case type="valid">

## valid: inside a selector

Works in selectors too — same as `$name`.

```lass
const $ns = 'app'
---
.$(ns)__header {
  display: flex;
}
```

```css
.app__header {
  display: flex;
}
```

</test-case>


<test-case type="valid">

## valid: inside CSS string — no substitution

Same as `$name` — `$(name)` inside `"..."` is literal text.

```lass
const $x = 'test'
---
p {
  content: "$(x) is literal";
}
```

```css
p {
  content: "$(x) is literal";
}
```

</test-case>


<test-case type="invalid">

## invalid: undefined variable

Same as `$name` — referencing an undefined variable throws at execution
time.

```lass
---
p {
  color: $(missing);
}
```

```error
ReferenceError: $missing is not defined
```

</test-case>


<test-case type="invalid">

## invalid: unclosed $(

If `$(` is not closed by `)`, the scanner reports an error.

```lass
---
p {
  color: $(oops;
}
```

```error
ScanError: Unclosed $( at line 2
```

</test-case>

