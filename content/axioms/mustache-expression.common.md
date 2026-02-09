---
feature: mustache-expression
fr: FR-MUSTACHE
phase: MVP
status: implemented
description: >
  In the CSS zone, {{ expr }} evaluates a JS expression at execution time
  and concatenates the result into the CSS string. Works in value position,
  selector position, property name position, and for generating entire blocks.
tags: [symbol-system, expression, two-zone, js-bridge]
see-also: [dollar-substitution, fragment-syntax]
depends: [two-zone-model]
---

# {{ }} JS Expression Bridge

`{{ }}` is where the real power lives. Anything between `{{` and `}}`
is a JS expression — it gets evaluated at execution time and the result
is dropped into the CSS output.

This is the "smart" counterpart to `$name`. Where `$name` does dumb
text substitution, `{{ }}` evaluates: arithmetic, function calls,
ternaries, `.map()`, template literals — any valid JS expression.

`{{ }}` works in three positions:
1. **Value position** — inside a declaration value: `padding: {{ x * 2 }}px`
2. **Selector position** — as part of a selector: `{{ tag }} { ... }`
3. **Property name position** — as the property name: `{{ prop }}: value;`

All JS variables in scope from the preamble are accessible inside `{{ }}`.

<test-case type="valid">

## valid: simple variable interpolation

The most basic case: a single variable reference inside `{{ }}`.

```lass
const color = "blue"
---
.box {
  color: {{ color }};
}
```

```css
.box {
  color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: arithmetic expression

`{{ gap * 2 }}` evaluates the multiplication and outputs `46`.

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


<test-case type="valid">

## valid: ternary expression

Any JS expression works, including ternaries. Useful for conditional
values without needing a full `if` block.

```lass
const darkMode = true
---
body {
  background: {{ darkMode ? '#1a1a1a' : '#ffffff' }};
}
```

```css
body {
  background: #1a1a1a;
}
```

</test-case>


<test-case type="valid">

## valid: function call

Functions defined in the preamble (or imported) work inside `{{ }}`.

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

</test-case>


<test-case type="valid">

## valid: string literal expression

A string literal inside `{{ }}` outputs its value directly.

```lass
---
.error {
  color: {{ "red" }};
}
```

```css
.error {
  color: red;
}
```

</test-case>


<test-case type="valid">

## valid: multiple expressions in one declaration

Multiple `{{ }}` expressions can appear in a single property value.
Each is evaluated independently.

```lass
const top = 10
const right = 20
const bottom = 30
const left = 40
---
.box {
  margin: {{ top }}px {{ right }}px {{ bottom }}px {{ left }}px;
}
```

```css
.box {
  margin: 10px 20px 30px 40px;
}
```

</test-case>


<test-case type="valid">

## valid: selector position

The result of the expression replaces `{{ }}` in the selector text.

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


<test-case type="valid">

## valid: property name position

`{{ }}` can generate the property name itself.

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


<test-case type="valid">

## valid: nested object access

Expressions can access nested object properties.

```lass
const theme = { colors: { primary: '#3b82f6' } }
---
.button {
  background: {{ theme.colors.primary }};
}
```

```css
.button {
  background: #3b82f6;
}
```

</test-case>


<test-case type="valid">

## valid: array iteration with map and join

You can use `.map().join()` to produce multiple declarations from an
array. The join separator controls formatting.

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

</test-case>


<test-case type="valid">

## valid: template literals inside {{ }}

`{{ }}` can contain JS template literals with their own `${}`
interpolations. The scanner handles the nesting correctly.

```lass
const items = ['a', 'b']
---
.list {
  {{ items.map((item, i) => `--item-${i}: "${item}";`).join('\n  ') }}
}
```

```css
.list {
  --item-0: "a";
  --item-1: "b";
}
```

</test-case>


<test-case type="valid">

## valid: object literal in expression

Expressions containing object literals with braces work correctly.
The scanner tracks brace depth to find the closing `}}`.

```lass
const getStyle = (opts) => opts.value
---
.box {
  width: {{ getStyle({ value: '100px' }) }};
}
```

```css
.box {
  width: 100px;
}
```

</test-case>


<test-case type="valid">

## valid: multiline expression

`{{ }}` can span multiple lines. The scanner matches `{{` to the
next `}}` regardless of line breaks.

```lass
const sizes = { sm: '640px', lg: '1024px' }
---
:root {
  {{
    Object.entries(sizes)
      .map(([k, v]) => '--bp-' + k + ': ' + v + ';')
      .join('\n  ')
  }}
}
```

```css
:root {
  --bp-sm: 640px;
  --bp-lg: 1024px;
}
```

</test-case>


<test-case type="valid">

## valid: expression returning number

Numeric results are coerced to strings.

```lass
const width = 100
---
.box {
  width: {{ width }};
}
```

```css
.box {
  width: 100;
}
```

</test-case>


<test-case type="valid">

## valid: expression with whitespace

Whitespace inside `{{ }}` is trimmed from the expression.

```lass
const x = 42
---
.box {
  width: {{   x   }}px;
}
```

```css
.box {
  width: 42px;
}
```

</test-case>


<test-case type="valid">

## valid: CSS-only file unchanged

A file without `{{ }}` expressions passes through unchanged.

```lass
---
.box {
  color: red;
}
```

```css
.box {
  color: red;
}
```

</test-case>


<test-case type="invalid">

## invalid: empty expression

An empty `{{ }}` with no expression inside is a scan error. There's
nothing to evaluate.

```lass
---
p {
  color: {{ }};
}
```

```error
Empty {{ }} expression
```

</test-case>


<test-case type="invalid">

## invalid: unclosed expression

If `{{` isn't closed by a matching `}}`, the scanner reports an error.

```lass
---
p {
  color: {{ 'red';
}
```

```error
Unclosed {{ expression
```

</test-case>


<test-case type="invalid">

## invalid: statement not expression

Only expressions are allowed inside `{{ }}`. Statements like `if` or
`for` without a return value cause a runtime error.

```lass
---
p {
  color: {{ if (true) { 'red' } }};
}
```

```error
Unexpected token 'if'
```

</test-case>


<!-- ============================================ -->
<!-- Story 2.4: Array Auto-Join & Null Handling  -->
<!-- ============================================ -->

<test-case type="valid">

## valid: array auto-join with map

Arrays returned from `{{ }}` are automatically joined with space separator.
This enables clean `.map()` patterns without manual `.join(' ')`.
If any element contains newlines, newline is used as separator instead.

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


<test-case type="valid">

## valid: array of numbers auto-joined

Numeric array elements are coerced to strings then joined with space separator.

```lass
const nums = [1, 2, 3]
---
.box {
  --values: {{ nums }};
}
```

```css
.box {
  --values: 1 2 3;
}
```

</test-case>


<test-case type="valid">

## valid: nested array auto-join

Nested arrays are recursively flattened before joining with space separator.
`[[1, 2], [3, 4]]` becomes `'1 2 3 4'`.

```lass
const matrix = [[1, 2], [3, 4]]
---
.grid {
  --data: {{ matrix }};
}
```

```css
.grid {
  --data: 1 2 3 4;
}
```

</test-case>


<test-case type="valid">

## valid: empty array returns empty string

An empty array produces an empty string output.

```lass
const items = []
---
.box {
  --items: {{ items }};
}
```

```css
.box {
  --items: ;
}
```

</test-case>


<test-case type="valid">

## valid: array with null elements

Arrays containing null elements filter out null during join.

```lass
const items = [1, null, 2]
---
.box {
  --items: {{ items }};
}
```

```css
.box {
  --items: 1 2;
}
```

</test-case>


<test-case type="valid">

## valid: array with undefined elements

Arrays containing undefined elements filter out undefined during join.

```lass
const items = ['a', undefined, 'b']
---
.box {
  --items: {{ items }};
}
```

```css
.box {
  --items: a b;
}
```

</test-case>


<test-case type="valid">

## valid: array with mixed types

Arrays with mixed types (strings, numbers) are all coerced to strings and joined with space.

```lass
const mixed = ['a', 1, 'b', 2]
---
.box {
  --mixed: {{ mixed }};
}
```

```css
.box {
  --mixed: a 1 b 2;
}
```

</test-case>


<test-case type="valid">

## valid: null returns empty string

`null` returned from an expression produces empty string (React-style silent handling).

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

</test-case>


<test-case type="valid">

## valid: undefined returns empty string

`undefined` returned from an expression produces empty string.

```lass
const value = undefined
---
.box {
  color: blue{{ value }};
}
```

```css
.box {
  color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: explicit join still works

Explicit `.join('')` continues to work for backward compatibility.

```lass
const sizes = [1, 2, 4]
---
:root {
  {{ sizes.map(s => '--space-' + s + ': ' + (s * 4) + 'px;').join('') }}
}
```

```css
:root {
  --space-1: 4px;--space-2: 8px;--space-4: 16px;
}
```

</test-case>


<test-case type="valid">

## valid: map returning CSS declarations

The canonical use case: generating multiple CSS declarations from an array.
Arrays are joined with space separator.

```lass
const colors = [{name: "primary", value: "blue"}, {name: "secondary", value: "red"}]
---
:root {
  {{ colors.map(c => `--${c.name}: ${c.value};`) }}
}
```

```css
:root {
  --primary: blue; --secondary: red;
}
```

</test-case>


<test-case type="valid">

## valid: conditional returning undefined

A ternary that returns undefined on one branch produces empty string.

```lass
const showColor = false
---
.box {
  color: red{{ showColor ? '-500' : undefined }};
}
```

```css
.box {
  color: red;
}
```

</test-case>


<test-case type="valid">

## valid: function returning null

Functions that return null produce empty string output.

```lass
function maybeValue() { return null }
---
.box {
  color: blue{{ maybeValue() }};
}
```

```css
.box {
  color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: falsy zero is not empty

Zero (0) is falsy but not null/undefined, so it outputs as "0".

```lass
const count = 0
---
.box {
  --count: {{ count }};
}
```

```css
.box {
  --count: 0;
}
```

</test-case>


<test-case type="valid">

## valid: falsy false is suppressed

Boolean `false` is now suppressed (outputs empty string) just like `null` and `undefined`.
This enables cleaner conditional patterns like `{{condition && @{ ... }}}`.

```lass
const flag = false
---
.box {
  --flag: {{ flag }};
}
```

```css
.box {
  --flag: ;
}
```

</test-case>


<test-case type="valid">

## valid: empty string unchanged

Empty string remains empty string (not converted to something else).

```lass
const empty = ''
---
.box {
  --empty: {{ empty }};
}
```

```css
.box {
  --empty: ;
}
```

</test-case>


<!-- ============================================ -->
<!-- Story 2.5: Universal {{ }} Processing       -->
<!-- ============================================ -->

<test-case type="valid">

## valid: expression inside double-quoted string

`{{ }}` is processed everywhere in the CSS zone, including inside double-quoted strings.
This enables dynamic content values like pseudo-element text.

```lass
const name = "world"
---
.greeting::before {
  content: "Hello, {{ name }}!";
}
```

```css
.greeting::before {
  content: "Hello, world!";
}
```

</test-case>


<test-case type="valid">

## valid: expression inside single-quoted string

`{{ }}` works inside single-quoted strings too.

```lass
const label = "Click me"
---
.button::after {
  content: '{{ label }}';
}
```

```css
.button::after {
  content: 'Click me';
}
```

</test-case>


<test-case type="valid">

## valid: expression inside url()

`{{ }}` is processed inside `url()` values, enabling dynamic asset paths.

```lass
const imgPath = "images/hero"
---
.hero {
  background: url("{{ imgPath }}.jpg");
}
```

```css
.hero {
  background: url("images/hero.jpg");
}
```

</test-case>


<test-case type="valid">

## valid: expression inside block comment

`{{ }}` is processed inside CSS block comments, useful for dynamic metadata.

```lass
const version = "1.2.3"
---
/* Generated version: {{ version }} */
.app {
  color: blue;
}
```

```css
/* Generated version: 1.2.3 */
.app {
  color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: multiple expressions in string

Multiple `{{ }}` expressions can appear in a single string.

```lass
const firstName = "John"
const lastName = "Doe"
---
.name::before {
  content: "{{ firstName }} {{ lastName }}";
}
```

```css
.name::before {
  content: "John Doe";
}
```

</test-case>


<test-case type="valid">

## valid: expression with quotes inside string

Expressions containing string literals work inside CSS strings.
The expression's quotes are evaluated, not parsed as CSS string delimiters.

```lass
const quote = "said"
---
.quote::before {
  content: "He {{ quote }}: 'Hello'";
}
```

```css
.quote::before {
  content: "He said: 'Hello'";
}
```

</test-case>


<test-case type="valid">

## valid: url with expression and query string

Expressions work in complex url() values with query strings.

```lass
const assetId = "abc123"
---
.icon {
  background-image: url("/assets/{{ assetId }}?v=2");
}
```

```css
.icon {
  background-image: url("/assets/abc123?v=2");
}
```

</test-case>


<test-case type="valid">

## valid: multiline block comment with expression

Expressions work in multiline block comments.

```lass
const author = "Lass Team"
const date = "2026-02-06"
---
/*
 * Author: {{ author }}
 * Date: {{ date }}
 */
.box {
  color: red;
}
```

```css
/*
 * Author: Lass Team
 * Date: 2026-02-06
 */
.box {
  color: red;
}
```

</test-case>
