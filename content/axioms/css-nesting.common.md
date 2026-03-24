---
feature: css-nesting
fr: FR-NESTING
phase: MVP
status: implemented
description: >
  CSS nesting syntax passes through the transpiler unchanged. The
  transpiler does not parse or transform nesting — the bundler's CSS
  pipeline or the browser handles it.
tags: [css-superset, passthrough, nesting]
see-also: [css-passthrough]
---

# CSS Nesting Passthrough

CSS nesting (per CSS Nesting Module Level 1) is standard CSS. The Lass
transpiler doesn't know or care about nesting — it passes through as
literal text in the assembled CSS string.

This means nesting resolution happens downstream: the bundler's CSS
pipeline (PostCSS, Lightning CSS) or the browser itself flattens the
nesting. Lass stays out of the way.

Lass symbols (`$name`, `{{ }}`, `@(prop)`, `//`) work inside nested
blocks exactly as they do elsewhere in the CSS zone — the scanner
doesn't treat nested CSS any differently.

<test-case type="valid">

## valid: basic nesting

```lass
---
.parent {
  color: red;
  .child {
    color: blue;
  }
}
```

```css
.parent {
  color: red;
  .child {
    color: blue;
  }
}
```

</test-case>


<test-case type="valid">

## valid: & selector

The CSS `&` nesting selector passes through. It's CSS, not Lass.

```lass
---
a {
  color: blue;
  &:hover {
    color: lightblue;
  }
}
```

```css
a {
  color: blue;
  &:hover {
    color: lightblue;
  }
}
```

</test-case>


<test-case type="valid">

## valid: deeply nested

Multiple levels of nesting pass through unchanged.

```lass
---
figure {
  margin: 0;
  > figcaption {
    background: rgba(0, 0, 0, 0.5);
    > p {
      font-size: 0.9rem;
    }
  }
}
```

```css
figure {
  margin: 0;
  > figcaption {
    background: rgba(0, 0, 0, 0.5);
    > p {
      font-size: 0.9rem;
    }
  }
}
```

</test-case>


<test-case type="valid">

## valid: nesting with @media

Nested `@media` inside a rule passes through — this is valid CSS nesting.

```lass
---
.foo {
  display: grid;
  @media (orientation: landscape) {
    grid-auto-flow: column;
  }
}
```

```css
.foo {
  display: grid;
  @media (orientation: landscape) {
    grid-auto-flow: column;
  }
}
```

</test-case>


<test-case type="valid">

## valid: Lass symbols inside nested blocks

`$name` and `{{ }}` work the same inside nested CSS as anywhere else.
The scanner sees CSS zone text — nesting depth doesn't matter.

```lass
const $accent = 'coral'
---
.card {
  .header {
    color: $accent;
  }
  .body {
    padding: {{ 8 * 2 }}px;
  }
}
```

```css
.card {
  .header {
    color: coral;
  }
  .body {
    padding: 16px;
  }
}
```

</test-case>


<test-case type="valid">

## valid: // comments inside nested blocks

`//` comments work inside nested blocks — stripped as usual.

```lass
---
.parent {
  // this disappears
  .child {
    // so does this
    color: red;
  }
}
```

```css
.parent {
  
  .child {
    
    color: red;
  }
}
```

</test-case>


<test-case type="valid">

## valid: malformed nesting passes through unchanged

Like all CSS syntax, malformed nesting is not the transpiler's problem.
It passes through as-is — the bundler's CSS pipeline or the browser
reports the error.

```lass
---
.parent {
  .child {
    color: red;
}
```

```css
.parent {
  .child {
    color: red;
}
```

</test-case>


> Note: `css-nesting` has no `invalid:` test cases because Lass does
> not parse or validate CSS nesting. Nesting errors are the downstream
> CSS pipeline's responsibility.
