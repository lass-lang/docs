---
feature: style-lookup
fr: FR-PROP
phase: Growth
status: implemented
description: >
  In CSS value position, @(prop) resolves at compile-time to the last-declared
  value of the named property in the current selector tree. Resolution uses
  string slice + lazy regex lookup during transpilation. The explicit @()
  syntax is unambiguous and supports custom properties like @(--accent).
tags: [symbol-system, accessor, compile-time, accumulator]
see-also: [cross-rule-accessor, selector-lookup]
---

# @(prop) Property Accessor

`@(prop)` lets you reference the value of a CSS property that's already
been declared. Write `@(border)` and you get back whatever `border` was
last set to in the current selector tree.

The explicit parentheses make the syntax unambiguous:
- `@(border-width)` is clearly a lookup of `border-width`
- `@(--accent-color)` works for custom properties
- Safe to use inside `{{ }}` expressions without ambiguity

This is a **compile-time** feature - `@(prop)` resolves during transpilation,
not at browser runtime. The transpiler uses string slice + lazy regex
lookup to find and replace `@(border)` with the literal value.

How resolution works:

1. Cut the CSS zone into slices at `{` and `}` boundaries
2. When `@(prop)` is encountered, search current slice for `prop:` pattern
3. Not found? Walk backward through parent slices (parent scopes)
4. Extract the value and replace `@(prop)` with the literal value
5. If not found at root of selector tree, preserve `@(prop)` unchanged

Why preserve instead of empty string? Lass plays nicely with other
CSS tools. An unresolved `@(prop)` might be:
- A PostCSS plugin's custom syntax
- A future CSS feature we don't know about yet
- A visible signal that something wasn't resolved (fail visibly)

A few boundaries that `@(prop)` doesn't cross:
- **Sibling selector trees** - `.sidebar { border: dotted }` is invisible
  to `.main { @(border) }`. Each top-level rule is its own tree.
- **At-rule boundaries** - `@(prop)` doesn't reach across `@media`,
  `@layer`, or other at-rules (in v0).

<test-case type="valid">

## valid: same-block reference

`@(border)` resolves to the `border` value declared earlier in the same
block.

```lass
.box {
  border: 1px solid black;
  outline: @(border);
}
```

```css
.box {
  border: 1px solid black;
  outline: 1px solid black;
}
```

</test-case>


<test-case type="valid">

## valid: parent walk-up

If the property isn't in the current block, resolution walks up to
the parent. Here `.child` doesn't declare `border`, so `@(border)`
finds it on `.parent`.

```lass
.parent {
  border: solid;
  .child {
    outline: @(border);
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

## valid: nearest ancestor wins

When multiple ancestors declare the same property, the closest one wins.
Same idea as variable scoping in block-scoped languages - the inner
declaration shadows the outer.

```lass
.parent {
  border: solid;
  .child {
    border: dashed;
    .grandchild {
      outline: @(border);
    }
  }
}
```

```css
.parent {
  border: solid;
  .child {
    border: dashed;
    .grandchild {
      outline: dashed;
    }
  }
}
```

</test-case>


<test-case type="valid">

## valid: last value before the reference

Within a single block, `@(prop)` picks up the last value declared *before*
the reference. Declarations after it don't count.

```lass
.child {
  border: dashed;
  border-left: @(border);
}
```

```css
.child {
  border: dashed;
  border-left: dashed;
}
```

</test-case>


<test-case type="valid">

## valid: multiple declarations - last one wins

When the same property is declared more than once before the reference,
`@(prop)` returns the last value. This mirrors CSS cascade behavior
within a single block.

```lass
.box {
  color: red;
  color: blue;
  outline-color: @(color);
}
```

```css
.box {
  color: red;
  color: blue;
  outline-color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: inside a {{ }} expression

`@(prop)` works inside `{{ }}` too. The compile-time lookup returns a quoted
string that's embedded in the JS expression, enabling JS operations on
CSS values.

```lass
.box {
  padding: 16px;
  margin: {{ parseInt(@(padding)) * 2 }}px;
}
```

```css
.box {
  padding: 16px;
  margin: 32px;
}
```

</test-case>


<test-case type="valid">

## valid: custom property lookup

`@(--custom)` works for CSS custom properties. The `--` prefix is included
in the lookup pattern.

```lass
.box {
  --accent-color: blue;
  color: @(--accent-color);
}
```

```css
.box {
  --accent-color: blue;
  color: blue;
}
```

</test-case>


<test-case type="valid">

## valid: sibling trees are isolated - preserved

Properties from sibling selector trees are invisible. Each top-level
rule starts a fresh tree - `.sidebar`'s properties can't leak into
`.main`. Unresolved `@(prop)` passes through unchanged, enabling
PostCSS plugins and future CSS features to process it.

```lass
.sidebar {
  border: dotted;
}

.main {
  outline: @(border);
}
```

```css
.sidebar {
  border: dotted;
}

.main {
  outline: @(border);
}
```

</test-case>


<test-case type="valid">

## valid: doesn't cross @media boundaries - preserved

In v0, `@(prop)` stops at at-rule boundaries. The `@media` block is a
separate scope - it can't see properties declared outside.
Unresolved `@(prop)` passes through unchanged.

> This restriction may be relaxed in future versions for specific at-rule
> types where cross-boundary resolution is unambiguous.

```lass
.box {
  padding: 16px;
}

@media (min-width: 768px) {
  .box {
    margin: @(padding);
  }
}
```

```css
.box {
  padding: 16px;
}

@media (min-width: 768px) {
  .box {
    margin: @(padding);
  }
}
```

</test-case>


<test-case type="valid">

## valid: undeclared property - preserved

Referencing a property that hasn't been declared anywhere in the
selector tree passes through unchanged. This enables PostCSS plugins
or future CSS features to process it downstream.

```lass
.box {
  color: @(font-size);
}
```

```css
.box {
  color: @(font-size);
}
```

</test-case>


<test-case type="valid">

## valid: forward reference - preserved

`@(prop)` only looks backward. If the property is declared *after* the
reference, it doesn't exist yet from the accumulator's point of view.
The unresolved `@(prop)` passes through unchanged.

```lass
.box {
  outline: @(border);
  border: solid;
}
```

```css
.box {
  outline: @(border);
  border: solid;
}
```

</test-case>


<test-case type="valid">

## valid: self-reference protection

`@(prop)` cannot reference its own declaration - only the string
*before* the current position is searched. This prevents infinite
recursion naturally. The unresolved `@(prop)` passes through unchanged.

```lass
.box {
  background: @(background);
}
```

```css
.box {
  background: @(background);
}
```

</test-case>


<test-case type="valid">

## valid: build-time @() vs browser-runtime var()

`@(--radius)` resolves at **build time** — the value is baked into CSS.
`var(--radius)` stays as-is for **browser runtime** resolution.
Both are useful for different purposes.

```lass
.card {
  --radius: 8px;
  --color: blue;
  border-radius: @(--radius);
  color: var(--color);
}
```

```css
.card {
  --radius: 8px;
  --color: blue;
  border-radius: 8px;
  color: var(--color);
}
```

</test-case>


<test-case type="valid">

## valid: custom property parent walk-up

Same as standard properties — if the custom property isn't in the current
block, resolution walks up to the parent.

```lass
.card {
  --spacing: 16px;
  .header {
    padding: @(--spacing);
  }
}
```

```css
.card {
  --spacing: 16px;
  .header {
    padding: 16px;
  }
}
```

</test-case>

