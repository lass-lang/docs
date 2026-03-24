---
feature: selector-lookup
fr: FR-SELF
phase: Growth
status: not-implemented
description: >
  @(&) returns the current block's constructed selector string, including
  full nesting context.
tags: [symbol-system, accessor, runtime, selector]
see-also: [prop-accessor, cross-rule-accessor]
---

# @(&) Current Selector Accessor

`@(&)` gives you the current block's full selector as a string value —
including all nesting context. If you're inside `.parent .child`, `@(&)`
returns `".parent .child"`.

This is useful when you need to reference the current selector in a value
position — for example, generating a `content` string that includes the
selector name, or passing the selector to a JS function inside `{{ }}`.

`@(&)` is read-only — it tells you what the current selector is, it
doesn't let you change it.

<test-case type="valid">

## valid: top-level selector

At the top level, `@(&)` returns the selector as written.

```lass
.button {
  content: "@(&)";
}
```

```css
.button {
  content: ".button";
}
```

</test-case>


<test-case type="valid">

## valid: nested selector — full context

Inside nested blocks, `@(&)` includes the full nesting chain.

```lass
.card {
  .header {
    content: "@(&)";
  }
}
```

```css
.card {
  .header {
    content: ".card .header";
  }
}
```

</test-case>


<test-case type="valid">

## valid: deeply nested

The full chain is included, no matter how deep.

```lass
.page {
  .sidebar {
    .nav {
      content: "@(&)";
    }
  }
}
```

```css
.page {
  .sidebar {
    .nav {
      content: ".page .sidebar .nav";
    }
  }
}
```

</test-case>


<test-case type="valid">

## valid: with & combinator

CSS's `&` nesting selector is reflected in the constructed selector.

```lass
a {
  &:hover {
    content: "@(&)";
  }
}
```

```css
a {
  &:hover {
    content: "a:hover";
  }
}
```

</test-case>


<test-case type="valid">

## valid: inside {{ }} expression

`@(&)` returns a string, so you can use it in JS expressions —
transform it, log it, pass it to a function.

```lass
.my-component {
  --self: "{{ @(&) }}";
}
```

```css
.my-component {
  --self: ".my-component";
}
```

</test-case>


<test-case type="valid">

## valid: multiple selectors

When a rule has a selector list, `@(&)` returns the full list.

```lass
.foo, .bar {
  content: "@(&)";
}
```

```css
.foo, .bar {
  content: ".foo, .bar";
}
```

</test-case>


<test-case type="valid">

## valid: with &.active compound nesting

CSS `&` used in compound selectors is reflected in the constructed
selector string.

```lass
.button {
  &.active {
    content: "@(&)";
  }
}
```

```css
.button {
  &.active {
    content: ".button.active";
  }
}
```

</test-case>


<test-case type="invalid">

## invalid: @(&) outside a rule block

`@(&)` at root level (not inside any selector block) has no selector
to return. This is an error.

```lass
content: "@(&)";
```

```error
RuntimeError: @(&) used outside of a selector block at line 1
```

</test-case>

