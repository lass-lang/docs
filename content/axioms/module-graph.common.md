---
feature: module-graph
fr: FR-BUNDLER
phase: MVP
status: vite-only
description: >
  Preamble imports participate in Vite's real module graph, enabling
  shared mutable state between JavaScript and Lass files.
tags: [bundler, vite, module-graph, imports, mutation]
see-also: [bundler-integration, two-zone-model]
depends: [two-zone-model, bundler-integration]
---

# Module Graph Integration

This is what differentiates Lass from every other CSS preprocessor:
**Lass files are full JavaScript modules.** They can import,
mutate, and share state with the rest of the application.

When you import a shared JavaScript module from a Lass file's preamble and
modify a value, that mutation is visible to other modules that import the
same module. This works because the preamble code participates in Vite's
real module graph, not in an isolated execution context.

> Note: These test cases describe behavior that only works when processed
> through the Vite plugin. The transpiler output is the same regardless —
> it's how Vite executes that output that enables module graph participation.

<test-case type="valid">

## valid: shared state mutation from preamble

When a Lass file imports a shared module and mutates its state, that
mutation persists across module boundaries. Other modules importing the
same shared state will see the updated value.

```lass
import { objRef } from './shared-state.js'
objRef.current = 'from-lass'
---
.box { color: blue; }
```

```shared-state.js
export const objRef = { current: 'initial' }
```

```css
.box { color: blue; }
```

</test-case>


<test-case type="valid">

## valid: import chain preserves references

Multiple Lass files and JS files importing the same module all share
the same module instance. Mutations from any file are visible to all
others that import the same module.

```lass
import { counter } from './counter.js'
counter.value += 1
---
.incremented { margin: {{ counter.value }}px; }
```

```counter.js
export const counter = { value: 0 }
```

```css
.incremented { margin: 1px; }
```

</test-case>


<test-case type="valid">

## valid: preamble with default import

Default imports work the same as named imports — the imported module
participates in the real module graph.

```lass
import config from './config.js'
config.theme = 'dark'
---
.themed { background: {{ config.theme === 'dark' ? '#1a1a1a' : '#ffffff' }}; }
```

```config.js
export default { theme: 'light' }
```

```css
.themed { background: #1a1a1a; }
```

</test-case>


<test-case type="valid">

## valid: preamble with namespace import

Namespace imports (`import * as`) also participate in the module graph.

```lass
import * as tokens from './design-tokens.js'
---
.button {
  color: {{ tokens.primary }};
  background: {{ tokens.secondary }};
}
```

```design-tokens.js
export const primary = '#3b82f6'
export const secondary = '#10b981'
```

```css
.button {
  color: #3b82f6;
  background: #10b981;
}
```

</test-case>


<test-case type="valid">

## valid: preamble with JSON import

JSON imports with import assertions work normally.

```lass
import tokens from './tokens.json' with { type: 'json' }
---
.primary { color: {{ tokens.colors.primary }}; }
```

```tokens.json
{
  "colors": {
    "primary": "#3b82f6"
  }
}
```

```css
.primary { color: #3b82f6; }
```

</test-case>

