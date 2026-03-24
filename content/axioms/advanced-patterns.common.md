---
feature: advanced-patterns
fr: FR-FRAGMENT
phase: MVP
status: implemented
description: >
  Advanced composition patterns demonstrating Lass's full power. These patterns
  combine @{ } style blocks, {{ }} expressions, and curried JS functions to
  create reusable, composable CSS generation - comparable to Sass/Less mixins
  but using pure JavaScript.
tags: [advanced, patterns, mixin, composition, currying, style-block]
see-also: [style-block, mustache-expression, dollar-substitution]
depends: [style-block, mustache-expression, array-auto-join]
---

# Advanced Composition Patterns

Lass doesn't need special mixin syntax because JavaScript already has functions.
These patterns demonstrate how to create reusable, composable CSS generation
using standard JS features combined with Lass's `@{ }` and `{{ }}` syntax.

The key insight: **a function returning `@{ }` is a mixin.**

## Why This Matters

Compare to Sass:
```scss
@mixin media($types...) {
  @each $type in $types {
    @media #{$type} { @content; }
  }
}
```

In Lass, it's just JavaScript:
```lass
---
const media = (...types) => content => types.map($type => @{
    @media $type { {{content($type)}} }
})
```

Benefits:
- No new syntax to learn - it's JavaScript
- Full IDE support (autocomplete, types, refactoring)
- Mixins can be shared via npm
- Tree-shaking removes unused mixins
- TypeScript for type-safe mixins

<test-case type="valid">

## valid: curried mixin with callback

A media query mixin using curried functions. The outer function takes
configuration (media types), the inner function takes content callback.

```lass
---
const media = (...types) => content => types.map($type => @{
    @media $type {
        {{content($type)}}
    }
})
---
{{media('screen', 'print')($type => @{
    h1 {
        font-size: 40px;
    }
})}}
```

```css
@media screen {
    h1 {
        font-size: 40px;
    }
}
@media print {
    h1 {
        font-size: 40px;
    }
}
```

</test-case>


<test-case type="valid">

## valid: conditional content in mixin callback

The callback receives the current iteration value, enabling conditional logic.
Note: Use ternary with `''` or `null` for conditional content (falsy values are suppressed).

```lass
---
const media = (...types) => content => types.map($type => @{
    @media $type {
        {{content($type)}}
    }
})
---
{{media('screen', 'print')($type => @{
    h1 {
        font-size: 40px;
        {{$type == 'print' ? @{
            font-family: Calluna;
        } : '' }}
    }
})}}
```

```css
@media screen {
    h1 {
        font-size: 40px;
        
    }
}
@media print {
    h1 {
        font-size: 40px;
        font-family: Calluna;
    }
}
```

</test-case>


<test-case type="valid">

## valid: imported mixin pattern

Mixins can be plain JavaScript files, imported via standard ES modules.
This is the recommended pattern for sharing reusable Lass utilities.

```lass
---
// Simulating: import { media } from './mixins.js'
const media = (...types) => content => types.map($type => @{
    @media $type {
        {{content($type)}}
    }
})
---
{{media('screen')($type => @{
    body {
        max-width: 1200px;
    }
})}}
```

```css
@media screen {
    body {
        max-width: 1200px;
    }
}
```

</test-case>


<test-case type="valid">

## valid: responsive breakpoints mixin

A more practical example: responsive breakpoints using an object configuration.

```lass
---
const breakpoints = { sm: '640px', md: '768px', lg: '1024px' }
const responsive = (config) => content => 
    Object.entries(config).map(([name, width]) => @{
        @media (min-width: {{width}}) {
            {{content(name, width)}}
        }
    })
---
{{responsive(breakpoints)((name, width) => @{
    .container {
        padding: {{name === 'sm' ? '1rem' : '2rem'}};
    }
})}}
```

```css
@media (min-width: 640px) {
    .container {
        padding: 1rem;
    }
}
@media (min-width: 768px) {
    .container {
        padding: 2rem;
    }
}
@media (min-width: 1024px) {
    .container {
        padding: 2rem;
    }
}
```

</test-case>


<test-case type="valid">

## valid: nested style block composition

Style blocks can return style blocks - enabling deep composition.

```lass
---
const withHover = (base, hover) => @{
    {{base}}
    &:hover {
        {{hover}}
    }
}
---
.btn {
    {{withHover(
        @{ background: blue; color: white; },
        @{ background: darkblue; }
    )}}
}
```

```css
.btn {
    background: blue; color: white;
    &:hover {
        background: darkblue;
    }
}
```

</test-case>


<test-case type="valid">

## valid: utility generator pattern

Generate utility classes from configuration objects - similar to Tailwind's approach.

```lass
---
const sizes = { sm: '0.5rem', md: '1rem', lg: '2rem' }
const spacingUtils = (prop, prefix) => 
    Object.entries(sizes).map(([name, value]) => @{
        .{{prefix}}-{{name}} {
            {{prop}}: {{value}};
        }
    })
---
{{spacingUtils('padding', 'p')}}
{{spacingUtils('margin', 'm')}}
```

```css
.p-sm {
    padding: 0.5rem;
}
.p-md {
    padding: 1rem;
}
.p-lg {
    padding: 2rem;
}
.m-sm {
    margin: 0.5rem;
}
.m-md {
    margin: 1rem;
}
.m-lg {
    margin: 2rem;
}
```

</test-case>


## Pattern: Mixin Library Structure

Recommended structure for a Lass mixin library:

```javascript
// mixins.js - can be npm published!
export const media = (...types) => content => 
    types.map($type => `@media ${$type} { ${content($type)} }`)

export const responsive = (breakpoints) => content =>
    Object.entries(breakpoints).map(([name, width]) => 
        `@media (min-width: ${width}) { ${content(name, width)} }`)

export const withStates = (base, states) => `
    ${base}
    ${Object.entries(states).map(([state, styles]) => 
        `&:${state} { ${styles} }`).join('\n')}
`
```

Then in your `.lass` file:
```lass
---
import { media, responsive } from '@my-org/lass-mixins'
---
{{media('screen', 'print')($type => @{ ... })}}
```

This is the power of Lass: **your mixin library is just JavaScript.**
