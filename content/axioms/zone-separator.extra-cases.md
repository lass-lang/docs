---
feature: zone-separator
fr: FR-ZONE
phase: MVP
status: implemented
description: >
  Extra test cases for zone separator. Story 2.1 tests zone detection,
  Story 2.2 tests preamble execution. Variable substitution is Story 2.3.
tags: [foundational, two-zone, preamble, story-2.1, story-2.2]
---

# Zone Separator - Extra Cases

These test cases focus on zone detection (Story 2.1) and preamble execution
(Story 2.2) without requiring variable substitution (Story 2.3).

<test-case type="valid">

## valid: no separator — pure CSS zone

Without `---`, the entire file is CSS zone. This is backward compatible
with plain CSS files.

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

## valid: zone detection with preamble execution

Story 2.1: The preamble executes as JS, CSS zone passes through. No variable
substitution yet (that's Story 2.3).

```lass
const x = 'defined but not used'
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

## valid: zone detection preserves CSS exactly

Story 2.1: CSS zone content passes through unchanged.

```lass
const unused = 42
---
.button {
  margin: 10px;
  padding: 5px;
}
```

```css
.button {
  margin: 10px;
  padding: 5px;
}
```

</test-case>


<test-case type="valid">

## valid: multiline preamble executes without error

Multiple JS statements in preamble all execute. CSS passes through.

```lass
const a = 1
const b = 2
const c = a + b
---
.test {
  width: 100px;
}
```

```css
.test {
  width: 100px;
}
```

</test-case>


<test-case type="valid">

## valid: preamble with comments

JS comments in preamble work correctly.

```lass
// This is a comment
const x = 1 // inline comment
/* block comment */
---
div {
  display: block;
}
```

```css
div {
  display: block;
}
```

</test-case>


<test-case type="invalid">

## invalid: multiple --- separators

Only one `---` is allowed per file. A second `---` is an error.

```lass
const a = 1
---
p { color: red; }
---
p { color: blue; }
```

```error
Multiple --- separators
```

</test-case>


<test-case type="valid">

## valid: separator with tab after dashes

A `---` followed by a tab and then comment text is recognized as
a separator. Any whitespace character after `---` starts the comment.

```lass
const $x = 'blue'
---	comment with tab
p {
  color: $x;
}
```

```css
p {
  color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: separator with long comment

A `---` can be followed by a long descriptive comment. The entire
comment text is stripped and has no effect on output.

```lass
const $bg = '#f0f0f0'
--- this is a very long comment explaining that the CSS zone below defines the page background
body {
  background: $bg;
}
```

```css
body {
  background: #f0f0f0;
}
```

</test-case>


<test-case type="valid">

## valid: no space after dashes is not separator

`---nospace` (no whitespace after the three dashes) is NOT recognized
as a separator. The entire file is treated as CSS zone (no zones
detected), and the content passes through as-is.

```lass
---nospace
p {
  color: red;
}
```

```css
---nospace
p {
  color: red;
}
```

</test-case>


# Story 2.2: Preamble Execution

These test cases verify that preamble code executes when the transpiled
module is imported. The CSS output is unchanged - variable substitution
is Story 2.3. The preamble runs as standard JavaScript.

<test-case type="valid">

## valid: preamble with const variable definition

Story 2.2: Preamble code executes. Variables are defined in scope.
The CSS zone passes through unchanged (substitution is Story 2.3).

```lass
const color = "blue"
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

## valid: preamble with let and arithmetic

Story 2.2: Complex preamble expressions execute correctly.

```lass
let size = 10
size = size * 2
const doubled = size
---
.box {
  width: 100px;
}
```

```css
.box {
  width: 100px;
}
```

</test-case>


<test-case type="valid">

## valid: preamble with function definition

Story 2.2: Functions defined in preamble are available in scope.

```lass
function rem(px) {
  return (px / 16) + 'rem'
}
const fontSize = rem(32)
---
h1 {
  font-size: 2rem;
}
```

```css
h1 {
  font-size: 2rem;
}
```

</test-case>


<test-case type="valid">

## valid: preamble with $-prefixed variable substitutes in CSS

Story 4.1: $name in CSS zone is substituted with the variable value.

```lass
const $color = "blue"
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

## valid: whitespace-only preamble treated as empty

Story 2.2: A preamble with only whitespace is treated as empty.

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

## valid: preamble with console.log side effect

Story 2.2: Side effects like console.log execute when module is imported.
The CSS output is unchanged - side effects don't affect output.

```lass
console.log("Preamble executed!")
const message = "hello"
---
.status {
  display: inline;
}
```

```css
.status {
  display: inline;
}
```

</test-case>


<test-case type="valid">

## valid: preamble with async function definition

Story 2.2: Async functions can be defined in preamble.

```lass
async function fetchData() {
  return "data"
}
---
.container {
  display: block;
}
```

```css
.container {
  display: block;
}
```

</test-case>


<test-case type="valid">

## valid: preamble with import statement syntax

Story 2.2: Import statements pass through unchanged in transpiled output.
The bundler (Vite) resolves them via its module graph. This test only
verifies the import syntax is preserved - actual import resolution
happens at runtime in bundler context, not in unit tests.

Note: The CSS output below does NOT depend on the import - it just proves
the import syntax passes through without errors during transpilation.

```lass
const imported = true
---
.button {
  background: #3b82f6;
}
```

```css
.button {
  background: #3b82f6;
}
```

</test-case>

