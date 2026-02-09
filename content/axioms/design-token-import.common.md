---
feature: design-token-import
fr: FR-TOKEN
phase: Growth
status: vite-only
description: >
  W3C Design Tokens JSON files are imported via standard JS import in the
  preamble. Token values are accessible in the CSS zone via $name and {{ }}.
tags: [design-tokens, import, w3c, interop]
see-also: [zone-separator, script-lookup, mustache-expression]
depends: [two-zone-model]
companions: [tokens.json, brand-tokens.json, system-tokens.json]
---

# Design Token Import

Design tokens are imported in the preamble with a standard JS `import`
— no special syntax, no plugin chain, no custom loader. The JSON file
is resolved by the bundler's module graph like any other import.

Once imported, token values are just JS variables. You use them the same
way you use any other preamble variable: `$name` for text substitution,
`{{ }}` for expressions, `.map()` for iteration.

The tokens should follow the W3C Design Tokens Community Group format,
but Lass doesn't enforce this — it's a JSON import. If your JSON has
the values you need, it works.

<test-case type="valid">

## valid: basic token import

Import a token file and use values in the CSS zone.

```lass
import tokens from './tokens.json'

const $primary = tokens.color.primary.value
---
.button {
  background: $primary;
}
```

```tokens.json
{
  "color": {
    "primary": {
      "value": "#3b82f6",
      "type": "color"
    }
  }
}
```

```css
.button {
  background: #3b82f6;
}
```

</test-case>


<test-case type="valid">

## valid: iterating over tokens

Tokens are just data — you can iterate, filter, transform.

```lass
import tokens from './tokens.json'
---
:root {
  {{ Object.entries(tokens.spacing).map(([name, token]) =>
    `--spacing-${name}: ${token.value};`
  ).join('\n  ') }}
}
```

```tokens.json
{
  "spacing": {
    "xs": { "value": "4px", "type": "dimension" },
    "sm": { "value": "8px", "type": "dimension" },
    "md": { "value": "16px", "type": "dimension" },
    "lg": { "value": "32px", "type": "dimension" }
  }
}
```

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 32px;
}
```

</test-case>


<test-case type="valid">

## valid: nested token structure

W3C Design Tokens can be deeply nested. It's just JSON — access
whatever structure your tokens have.

```lass
import tokens from './tokens.json'

const $bg = tokens.color.surface.default.value
const $text = tokens.color.text.primary.value
---
body {
  background: $bg;
  color: $text;
}
```

```tokens.json
{
  "color": {
    "surface": {
      "default": { "value": "#ffffff", "type": "color" }
    },
    "text": {
      "primary": { "value": "#1a1a1a", "type": "color" }
    }
  }
}
```

```css
body {
  background: #ffffff;
  color: #1a1a1a;
}
```

</test-case>


<test-case type="valid">

## valid: token values in expressions

Token values are strings — you can parse and compute with them in
`{{ }}`.

```lass
import tokens from './tokens.json'
---
.container {
  max-width: {{ parseInt(tokens.layout.maxWidth.value) - 32 }}px;
}
```

```tokens.json
{
  "layout": {
    "maxWidth": { "value": "1200px", "type": "dimension" }
  }
}
```

```css
.container {
  max-width: 1168px;
}
```

</test-case>


<test-case type="valid">

## valid: multiple token files

You can import from multiple token files — different design systems,
different layers, whatever your project needs.

```lass
import brand from './brand-tokens.json'
import system from './system-tokens.json'
---
.button {
  background: {{ brand.color.primary.value }};
  border-radius: {{ system.radius.md.value }};
}
```

```brand-tokens.json
{
  "color": {
    "primary": { "value": "#e11d48", "type": "color" }
  }
}
```

```system-tokens.json
{
  "radius": {
    "md": { "value": "8px", "type": "dimension" }
  }
}
```

```css
.button {
  background: #e11d48;
  border-radius: 8px;
}
```

</test-case>


<test-case type="invalid">

## invalid: accessing non-existent token path

Tokens are plain JS objects. Accessing a property that doesn't exist
produces `undefined`, and using `undefined` in a value position outputs
the string `"undefined"` — which is rarely what you want. Accessing
a nested property on `undefined` throws a `TypeError`.

```lass
import tokens from './tokens.json'
---
.button {
  color: {{ tokens.color.nonexistent.value }};
}
```

```tokens.json
{
  "color": {
    "primary": { "value": "#3b82f6", "type": "color" }
  }
}
```

```error
TypeError: Cannot read properties of undefined (reading 'value')
```

</test-case>

