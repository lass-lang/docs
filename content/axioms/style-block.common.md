---
feature: style-block
fr: FR-FRAGMENT
phase: MVP
status: implemented
description: >
  @{ css } syntax creates CSS strings within JS expressions. The transpiler
  translates @{ to backtick and } to backtick, turning @{ css } into a JS
  template literal. {{ }} inside @{ } becomes ${ }, enabling nested expressions.
tags: [symbol-system, style-block, js-bridge, delimiter-translation, fragment]
see-also: [mustache-expression, dollar-substitution]
depends: [two-zone-model, mustache-expression]
---

# @{ } Style Block Syntax

`@{ }` creates CSS strings from within JS expressions. It's the inverse of
`{{ }}` - where `{{ }}` injects JS into CSS, `@{ }` injects CSS into JS.

This recursive model is what makes Lass expressive without needing custom
programming constructs:
- A JS `.map()` returning `@{ }` fragments replaces `@each`
- A ternary with `@{ }` replaces `@if`
- A function returning `@{ }` replaces `@mixin`

The implementation is pure delimiter translation. The transpiler converts:
- `@{` to backtick (`` ` ``)
- `}` (matching closing brace) to backtick (`` ` ``)
- `{{ }}` inside `@{ }` to `${ }` (JS template interpolation)

The JS runtime handles all the evaluation and nesting naturally.

## Context Behavior

`@{ }` is translated in JS contexts (preamble and inside `{{ }}`):

| Location | Behavior |
|----------|----------|
| Preamble | Translated to template literal |
| Inside `{{ }}` | Translated to template literal |
| CSS zone (outside `{{ }}`) | Passed through unchanged |
| Inside string literals | Passed through unchanged |
| Inside block comments | Passed through unchanged |

**Note on whitespace:** Single-line style blocks are trimmed (leading/trailing 
spaces removed). Multi-line style blocks are dedented to their minimum indentation,
with exactly one leading and one trailing blank line removed if present. This
produces clean, consistent output.

<test-case type="valid">

## valid: basic style block

The simplest case: a function returning a CSS fragment.

```lass
---
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


<test-case type="valid">

## valid: style block in preamble

Style blocks in the preamble become JS template literals.

```lass
---
const $size = 10
const makeRule = () => @{ padding: {{ $size }}px; }
---
.box {
    {{ makeRule() }}
}
```

```css
.box {
    padding: 10px;
}
```

</test-case>


<test-case type="valid">

## valid: @(prop) inside style block

`@(prop)` lookups are resolved BEFORE style block translation.
This is a pipeline ordering requirement.

```lass
.box {
    color: blue;
    {{ @{ border-color: @(color); } }}
}
```

```css
.box {
    color: blue;
    border-color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: nested {{ }} inside style block

`{{ }}` inside `@{ }` becomes `${ }` in the output template literal.

```lass
---
const size = 10
---
.box {
    {{ @{ padding: {{ size }}px; } }}
}
```

```css
.box {
    padding: 10px;
}
```

</test-case>


<test-case type="valid">

## valid: array mapping with style blocks

Array.map with style blocks demonstrates the auto-join behavior.
Each style block produces a string, and the array is auto-joined with space separator.

```lass
---
const sizes = [10, 20, 30]
---
.box {
    {{ sizes.map(s => @{ padding: {{ s }}px; }) }}
}
```

```css
.box {
    padding: 10px; padding: 20px; padding: 30px;
}
```

</test-case>


<test-case type="valid">

## valid: deep nesting stress test

Multiple nesting levels: {{ }} inside @{ } inside {{ }}.
JS template literal nesting handles this naturally. Note that arrays
are joined without separator, so items concatenate directly.

```lass
---
const themes = ['light', 'dark']
const sizes = [10, 20]
---
{{ themes.map(t => @{
    .theme-{{ t }} {
        {{ sizes.map(s => @{
            &.size-{{ s }} {
                padding: {{ s }}px;
            }
        }) }}
    }
}) }}
```

```css
.theme-light {
    &.size-10 {
    padding: 10px;
}
&.size-20 {
    padding: 20px;
}
}
.theme-dark {
    &.size-10 {
    padding: 10px;
}
&.size-20 {
    padding: 20px;
}
}
```

</test-case>


<test-case type="valid">

## valid: protected context - string literal

`@{` inside a string literal is NOT treated as a style block opener.

```lass
.box::before {
    content: "This is not @{ a style block }";
}
```

```css
.box::before {
    content: "This is not @{ a style block }";
}
```

</test-case>


<test-case type="valid">

## valid: protected context - block comment

`@{` inside a block comment is NOT treated as a style block opener.

```lass
/* This is not @{ a style block } */
.box {
    color: red;
}
```

```css
/* This is not @{ a style block } */
.box {
    color: red;
}
```

</test-case>


<test-case type="valid">

## valid: brace matching with ternary

JS braces inside `{{ }}` within a style block are handled correctly.
Only the outermost `}` closes the style block.

```lass
---
const makeRule = (x) => @{ 
    color: {{ x > 0 ? 'blue' : 'red' }}; 
}
---
.box {
    {{ makeRule(1) }}
}
```

```css
.box {
    color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: empty style block

An empty `@{ }` produces an empty template literal.

```lass
---
const showBorder = false
---
.box {
    padding: 16px;
    {{ showBorder ? @{ border: 1px solid black; } : @{} }}
}
```

```css
.box {
    padding: 16px;
    
}
```

</test-case>


<test-case type="valid">

## valid: style block with only whitespace

Whitespace-only style blocks are trimmed to empty string.

```lass
.box {
    padding: 16px;{{ @{   } }}
}
```

```css
.box {
    padding: 16px;
}
```

</test-case>


<test-case type="valid">

## valid: adjacent style blocks

Multiple style blocks can appear adjacent to each other.

```lass
.box {
    {{ @{ a: 1; } }}{{ @{ b: 2; } }}
}
```

```css
.box {
    a: 1;b: 2;
}
```

</test-case>


<test-case type="valid">

## valid: style block with object access

Object property access inside `{{ }}` within style blocks works correctly.
Arrays are joined with space separator.

```lass
---
const colors = { primary: 'blue', secondary: 'red' }
---
.box {
    {{ ['primary', 'secondary'].map(k => @{ --{{ k }}: {{ colors[k] }}; }) }}
}
```

```css
.box {
    --primary: blue; --secondary: red;
}
```

</test-case>


<test-case type="valid">

## valid: $param inside style block

`$param` substitution works inside style blocks.

```lass
---
const $radius = '8px'
---
.box {
    {{ @{ border-radius: $radius; } }}
}
```

```css
.box {
    border-radius: 8px;
}
```

</test-case>


<test-case type="valid">

## valid: mixin-like function pattern

A function returning a style block acts like a mixin.

```lass
---
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


<test-case type="valid">

## valid: @media blocks from style block

Style blocks can generate any CSS construct including at-rules.

```lass
---
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


<test-case type="valid">

## valid: conditional style block - if/else pattern

Ternary with style blocks replaces traditional @if/@else.

```lass
---
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


<test-case type="valid">

## valid: undefined $param preserved in style block

When `$param` references an undefined variable inside a style block,
it should be preserved as literal text (same behavior as CSS zone).

```lass
.box {
    {{ @{ color: $undefinedVar; } }}
}
```

```css
.box {
    color: $undefinedVar;
}
```

</test-case>


<test-case type="valid">

## valid: null $param becomes unset in style block

When `$param` references a null variable inside a style block,
it should become 'unset' (same behavior as CSS zone).

```lass
---
const $nullVar = null
---
.box {
    {{ @{ color: $nullVar; } }}
}
```

```css
.box {
    color: unset;
}
```

</test-case>


<test-case type="valid">

## valid: style block function in preamble

A function defined in the preamble can return a style block,
which can then be called via `{{ }}` in the CSS zone. This
demonstrates the power of style blocks as reusable CSS generators.

```lass
---
const getBg = () => @{ linear-gradient(red, blue) }
---
.box {
    background: url({{ getBg() }});
}
```

```css
.box {
    background: url(linear-gradient(red, blue));
}
```

</test-case>


<test-case type="valid">

## valid: @(prop) inside @{ } resolves from outer CSS context

When `@(prop)` appears inside a style block, it should resolve from
the outer CSS context, NOT be quoted as JS.

```lass
.parent {
    background: white;
    color: black;
    {{ @{
        .child {
            background: @(color);
            color: @(background);
        }
    } }}
}
```

```css
.parent {
    background: white;
    color: black;
    .child {
        background: black;
        color: white;
    }
}
```

</test-case>


<test-case type="valid">

## valid: @(prop) lookup inside @{ }

The `@(prop)` lookup also works inside style blocks.

```lass
.parent {
    border: 2px solid red;
    {{ @{
        .child {
            outline: @(border);
        }
    } }}
}
```

```css
.parent {
    border: 2px solid red;
    .child {
        outline: 2px solid red;
    }
}
```

</test-case>


<test-case type="valid">

## valid: nested CSS blocks inside @{ }

Style blocks can contain nested CSS blocks with their own braces.

```lass
.wrapper {
    {{ @{
        .outer {
            color: red;
            .inner {
                color: blue;
            }
        }
    } }}
}
```

```css
.wrapper {
    .outer {
        color: red;
        .inner {
            color: blue;
        }
    }
}
```

</test-case>


<test-case type="valid">

## valid: map with @(prop) inside @{ }

Array.map with style blocks that use @(prop) from outer context.

```lass
.theme {
    --primary: blue;
    --secondary: red;
    {{ ['btn', 'link'].map(c => @{
        .{{ c }} {
            color: @(--primary);
            border-color: @(--secondary);
        }
    }) }}
}
```

```css
.theme {
    --primary: blue;
    --secondary: red;
    .btn {
    color: blue;
    border-color: red;
}
.link {
    color: blue;
    border-color: red;
}
}
```

</test-case>


<test-case type="valid">

## valid: three levels of recursion

`@{ }` inside `{{ }}` inside `@{ }` inside `{{ }}` - the recursion
goes as deep as you need. This pattern generates CSS for all combinations
of variants and states.

```lass
---
const variants = ['primary', 'secondary']
const states = ['hover', 'active']
---
{{ variants.map(v => @{
  .btn-{{ v }} {
    {{ states.map(s => @{
      &:{{ s }} {
        outline: 1px solid {{ v }}-{{ s }};
      }
    }) }}
  }
}) }}
```

```css
.btn-primary {
  &:hover {
  outline: 1px solid primary-hover;
}
&:active {
  outline: 1px solid primary-active;
}
}
.btn-secondary {
  &:hover {
  outline: 1px solid secondary-hover;
}
&:active {
  outline: 1px solid secondary-active;
}
}
```

</test-case>


<test-case type="valid">

## valid: .map() with index - replacing @each

`.map()` over an array with index access, returning a `@{ }` fragment
for each item. This replaces the `@each` / `@for` loop pattern from Sass.

```lass
---
const menuSections = ['home', 'categories', 'on-sell', 'basket']
---
header > nav {
  {{ menuSections.map((s, i, { length }) => @{
    #{{ s }} .label::before {
      content: "{{ i + 1 }} of {{ length }}";
    }
  }) }}
}
```

```css
header > nav {
  #home .label::before {
  content: "1 of 4";
}
#categories .label::before {
  content: "2 of 4";
}
#on-sell .label::before {
  content: "3 of 4";
}
#basket .label::before {
  content: "4 of 4";
}
}
```

</test-case>


<test-case type="valid">

## valid: @{ } in CSS zone passes through unchanged

When `@{ }` appears directly in the CSS zone (not inside `{{ }}`),
it is passed through unchanged. This allows compatibility with future
CSS syntax or other tools that might use this pattern.

```lass
.box {
  @{ border: 1px solid; }
}
```

```css
.box {
  @{ border: 1px solid; }
}
```

</test-case>


<test-case type="valid">

## valid: unclosed @{ in CSS zone is preserved

If `@{` appears in the CSS zone without a matching `}`, it is preserved
as literal text. This is graceful degradation, not an error.

```lass
.box {
  content: "@{ unclosed";
}
```

```css
.box {
  content: "@{ unclosed";
}
```

</test-case>

