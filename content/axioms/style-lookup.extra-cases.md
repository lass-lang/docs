---
feature: style-lookup
fr: FR-PROP
phase: Growth
status: implemented
description: >
  Extra test cases for @(prop) property accessor. Covers edge cases for
  at-rule boundaries, @(prop) inside {{ }} expressions, escaping behavior,
  and pipeline integration.
tags: [symbol-system, accessor, compile-time, accumulator]
---

# @(prop) Property Accessor - Extra Cases

These test cases cover edge cases and implementation details for `@(prop)`
that complement the main axiom file.

<!-- ============================================ -->
<!-- At-Rule Boundaries                           -->
<!-- ============================================ -->

<test-case type="valid">

## valid: doesn't cross @layer boundaries - preserved

`@(prop)` stops at at-rule boundaries. Properties declared in one
`@layer` are not visible to another.

```lass
---
@layer base {
  .box {
    color: blue;
  }
}

@layer utilities {
  .box {
    background: @(color);
  }
}
```

```css
@layer base {
  .box {
    color: blue;
  }
}

@layer utilities {
  .box {
    background: @(color);
  }
}
```

</test-case>


<!-- ============================================ -->
<!-- @(prop) Inside {{ }} Expressions             -->
<!-- ============================================ -->

<test-case type="valid">

## valid: parent scope lookup inside {{ }}

`@(prop)` inside `{{ }}` can resolve from parent scope.

```lass
---
.parent {
  border: solid;
  .child {
    outline: {{ @(border) }};
  }
}
```

```css
.parent {
  border: solid;
  .child {
    outline: solid;
  }
}
```

</test-case>


<test-case type="valid">

## valid: multiple @(prop) in one {{ }} expression

Multiple `@(prop)` references can appear in a single `{{ }}` expression.

```lass
---
.box {
  width: 100;
  height: 50;
  content: {{ @(width) + " x " + @(height) }};
}
```

```css
.box {
  width: 100;
  height: 50;
  content: 100 x 50;
}
```

</test-case>


<test-case type="valid">

## valid: math with multiple @(prop) references

Arithmetic operations can use multiple `@(prop)` values.

```lass
---
.box {
  padding: 10px;
  margin: 5px;
  total: {{ parseInt(@(padding)) + parseInt(@(margin)) }}px;
}
```

```css
.box {
  padding: 10px;
  margin: 5px;
  total: 15px;
}
```

</test-case>


<test-case type="valid">

## valid: string operations with @(prop)

JavaScript string methods work on `@(prop)` values.

```lass
---
.box {
  color: blue;
  content: {{ @(color).toUpperCase() }};
}
```

```css
.box {
  color: blue;
  content: BLUE;
}
```

</test-case>


<test-case type="valid">

## valid: template literal with @(prop)

`@(prop)` works inside JavaScript template literals within `{{ }}`.

```lass
---
.box {
  color: blue;
  {{ `border-color: ${@(color)};` }}
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

## valid: multiple @(prop) concatenated

Multiple `@(prop)` values can be concatenated with string operators.

```lass
---
.box {
  width: 100px;
  height: 50px;
  content: {{ "Size: " + @(width) + " x " + @(height) }};
}
```

```css
.box {
  width: 100px;
  height: 50px;
  content: Size: 100px x 50px;
}
```

</test-case>


<test-case type="valid">

## valid: @(prop) in CSS context and JS context

Same property accessed in CSS context (raw substitution) and JS context
(as quoted string for expression evaluation).

```lass
---
.box {
  color: blue;
  border-color: @(color);
  background: {{ @(color) }};
}
```

```css
.box {
  color: blue;
  border-color: blue;
  background: blue;
}
```

</test-case>


<test-case type="valid">

## valid: nested scope @(prop) inside {{ }}

`@(prop)` inside `{{ }}` resolves from parent scope through nesting.

```lass
---
.parent {
  padding: 10px;
  .child {
    margin: {{ parseInt(@(padding)) * 2 }}px;
  }
}
```

```css
.parent {
  padding: 10px;
  .child {
    margin: 20px;
  }
}
```

</test-case>


<!-- ============================================ -->
<!-- Escaping Behavior                            -->
<!-- ============================================ -->

<test-case type="valid">

## valid: quoted value escaping

Values containing quotes are properly escaped when used in `{{ }}`.

```lass
---
.box {
  font-family: "Arial";
  content: {{ @(font-family) }};
}
```

```css
.box {
  font-family: "Arial";
  content: "Arial";
}
```

</test-case>


<test-case type="valid">

## valid: newline in value escaping

Values containing newlines are properly escaped when used in `{{ }}`.

```lass
---
.box {
  content: "line1
line2";
  other: {{ @(content) }};
}
```

```css
.box {
  content: "line1
line2";
  other: "line1
line2";
}
```

</test-case>


<test-case type="valid">

## valid: backslash and quote escaping

Values with backslashes and quotes are preserved correctly.

```lass
---
.box {
  content: "path\\to\"file\"";
  other: {{ @(content) }};
}
```

```css
.box {
  content: "path\\to\"file\"";
  other: "path\\to\"file\"";
}
```

</test-case>


<!-- ============================================ -->
<!-- Pipeline Integration                         -->
<!-- ============================================ -->

<test-case type="valid">

## valid: @(prop) resolves before {{ }}

`@(prop)` in CSS context resolves at compile time (Phase 1),
before `{{ }}` evaluates at runtime (Phase 2).

```lass
const color = "green";
---
.box {
  border: solid;
  outline: @(border);
  background: {{ color }};
}
```

```css
.box {
  border: solid;
  outline: solid;
  background: green;
}
```

</test-case>


<test-case type="valid">

## valid: @(prop) after {{ }} in same block

`@(prop)` appearing after a `{{ }}` expression in the same block
still resolves correctly.

```lass
---
.box {
  color: blue;
  margin: {{ 10 }}px;
  border-color: @(color);
}
```

```css
.box {
  color: blue;
  margin: 10px;
  border-color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: @(prop) at root level after {{ }}

`@(prop)` works at root level (no selector block) after `{{ }}`.

```lass
---
color: blue;
{{ 'injected' }}
border: @(color);
```

```css
color: blue;
injected
border: blue;
```

</test-case>


<!-- ============================================ -->
<!-- Error Cases                                  -->
<!-- ============================================ -->

<test-case type="invalid">

## invalid: @(prop) not found inside {{ }} causes runtime error

When `@(prop)` is not found and is inside `{{ }}`, it's preserved as
`@(prop)` which is invalid JavaScript, causing a runtime error.

```lass
---
.box {
  color: {{ @(nonexistent) }};
}
```

```error
Invalid or unexpected token
```

</test-case>

