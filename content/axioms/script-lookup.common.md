---
feature: script-lookup
fr: FR-DOLLAR
phase: MVP
status: implemented
description: >
  In the CSS zone, $name performs text substitution from $-prefixed JS
  variables in scope. No expression evaluation — $name is "dumb"
  substitution. Special handling: null→'unset', undefined/missing→preserved.
tags: [symbol-system, substitution, two-zone]
see-also: [mustache-expression]
depends: [two-zone-model]
---

# $name Text Substitution

`$name` in the CSS zone is replaced with the value of the matching
`$`-prefixed variable in scope. The substitution is purely textual —
the variable's value is inserted as-is into the CSS output, with no
expression evaluation.

> Scope includes the file's preamble, but also CSS blocks — nested
> blocks can see variables from their parent scopes.

If you write `$gap * 2` and `$gap` is `23`, the output is `23 * 2` —
the `* 2` stays as literal CSS text. If you need the math evaluated,
use `{{ $gap * 2 }}` instead (see [{{ }} expressions](./mustache-expression.common.md)).

Only variables whose name starts with `$` are visible to the CSS zone.
A variable declared as `const gap = 8` cannot be reached with `$gap` —
you'd need `const $gap = 8`. This is intentional: the `$` prefix opts
a variable into CSS-zone visibility, keeping the namespace clean.

## Special Value Handling

| Value | Output | Rationale |
|-------|--------|-----------|
| `null` | `unset` | CSS-meaningful fallback |
| `undefined` | `$name` (preserved) | No silent empty output |
| non-existent | `$name` (preserved) | No ReferenceError; graceful |
| object | `[object Object]` | JS default coercion |
| other | String(value) | Normal substitution |

The scanner skips `$name` detection inside CSS string literals (`"..."`,
`'...'`) and block comments (`/* */`) — those are literal CSS text.
The `url()` function is NOT protected — `$name` inside `url()` IS substituted.
Use `url("...")` with quotes if you need literal `$name`.

<test-case type="valid">

## valid: basic substitution

```lass
---
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


<test-case type="valid">

## valid: multiple variables

```lass
---
const $primary = '#3b82f6'
const $radius = '8px'
---
.button {
  background: $primary;
  border-radius: $radius;
}
```

```css
.button {
  background: #3b82f6;
  border-radius: 8px;
}
```

</test-case>


<test-case type="valid">

## valid: text-only — no evaluation

`$name` is "dumb" — it pastes the value and moves on. The surrounding
text stays as-is.

```lass
---
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


<test-case type="valid">

## valid: inside calc() this becomes valid CSS

Because `calc()` evaluates math at browser runtime, pasting a number
into `calc()` gives you a working expression.

```lass
---
const $gap = 23
---
.box {
  padding: calc($gap * 2);
}
```

```css
.box {
  padding: calc(23 * 2);
}
```

</test-case>


<test-case type="valid">

## valid: numeric value

When the variable holds a number, its string representation is inserted.

```lass
---
const $cols = 12
---
.grid {
  grid-template-columns: repeat($cols, 1fr);
}
```

```css
.grid {
  grid-template-columns: repeat(12, 1fr);
}
```

</test-case>


<test-case type="valid">

## valid: in selector position

`$name` works anywhere in the CSS zone — including selectors. The
substitution happens on the raw text before any CSS parsing.

```lass
---
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


<test-case type="valid">

## valid: only $-prefixed variables are visible

`headerImages` has no `$` prefix, so it's invisible to the CSS zone.
`$urlHeader` has the prefix, so `$urlHeader` substitutes.

```lass
---
const headerImages = ['ici']
const $urlHeader = headerImages[0]
---
.h {
  background: url(headers[0]);
  background: url($urlHeader);
}
```

```css
.h {
  background: url(headers[0]);
  background: url(ici);
}
```

</test-case>


<test-case type="valid">

## valid: inside a CSS string literal — no substitution

`$color` inside `"..."` is literal text, not a Lass symbol. The scanner
skips symbol detection inside CSS strings.

```lass
---
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


<test-case type="valid">

## valid: inside url() — substitution works

`$path` inside `url(...)` without quotes IS substituted. The `url()`
function is not a protected context.

```lass
---
const $path = 'images'
---
.bg {
  background: url(/$path/hero.png);
}
```

```css
.bg {
  background: url(/images/hero.png);
}
```

</test-case>


<test-case type="valid">

## valid: inside url() with quotes — no substitution

`$path` inside `url("...")` with quotes is protected by the string.
Use this form if you need literal `$path` in the output.

```lass
---
const $path = 'images'
---
.bg {
  background: url("/$path/hero.png");
}
```

```css
.bg {
  background: url("/$path/hero.png");
}
```

</test-case>


<test-case type="valid">

## valid: {{ }} escape hatch in protected contexts

When you need substitution inside a string, `url()` with quotes, or comment,
use the `{{ $param }}` expression bridge. `{{ }}` is processed universally,
so it works in all contexts.

```lass
---
const $path = 'images'
---
.bg {
  background: url("/$path/hero.png");
  background: url("/{{ $path }}/hero.png");
}
```

```css
.bg {
  background: url("/$path/hero.png");
  background: url("/images/hero.png");
}
```

</test-case>


<test-case type="valid">

## valid: adjacent text — identifier boundaries

The `$name` identifier stops at the first character that isn't valid in
a JS identifier (`[a-zA-Z0-9_$]`). A hyphen terminates it.

For cases where the boundary is ambiguous (e.g., `$colorPrimary` when
you want `blue` + `Primary`), use the expression bridge: `{{ $color }}Primary`.

```lass
---
const $prefix = 'app'
---
.$prefix-header {
  display: flex;
}
```

```css
.app-header {
  display: flex;
}
```

</test-case>


<test-case type="valid">

## valid: end of value

The `;` at end of a declaration is not part of the identifier — `$size`
substitutes correctly.

```lass
---
const $size = '16px'
---
p {
  font-size: $size;
}
```

```css
p {
  font-size: 16px;
}
```

</test-case>


<test-case type="valid">

## valid: object value is coerced to string

When a `$`-prefixed variable holds an object, JS's default `toString()`
is used. The output is `[object Object]` — almost certainly not what
you want, but it's the correct behavior for dumb text substitution.

```lass
---
const $obj = { a: 1 }
---
p {
  --data: $obj;
}
```

```css
p {
  --data: [object Object];
}
```

</test-case>


<test-case type="valid">

## valid: undefined value preserves $name

When a `$`-prefixed variable holds `undefined`, the original `$name`
is preserved in the output. This avoids silent empty output.

```lass
---
const $x = undefined
---
p {
  --data: $x;
}
```

```css
p {
  --data: $x;
}
```

</test-case>


<test-case type="valid">

## valid: null value outputs unset

When a `$`-prefixed variable holds `null`, the CSS keyword `unset`
is output. This is a CSS-meaningful fallback.

```lass
---
const $border = null
---
p {
  border: $border;
}
```

```css
p {
  border: unset;
}
```

</test-case>


<test-case type="valid">

## valid: bare $ is literal text

A `$` not followed by a valid JS identifier start character is not a
Lass symbol — it's literal CSS text.

```lass
p {
  content: "costs $";
}
.price::after {
  content: "$";
}
```

```css
p {
  content: "costs $";
}
.price::after {
  content: "$";
}
```

</test-case>


<test-case type="valid">

## valid: non-existent variable preserves $name

If `$name` references a variable that doesn't exist in any JS scope,
the original `$name` is preserved in the output. This allows graceful
degradation and compatibility with tools that might process `$name`
as a different syntax.

```lass
p {
  color: $undefined;
}
```

```css
p {
  color: $undefined;
}
```

</test-case>

