# Lass

**JavaScript-enhanced stylesheets for modern web development.**

Lass extends CSS with a JavaScript preamble zone, enabling dynamic styles through expressions, lookups, and computed values - all transpiled to standard CSS at build time.

```lass
---
const brand = '#6366f1';
const spacing = (n) => `${n * 0.25}rem`;
---

.button {
  background: {{ brand }};
  padding: {{ spacing(4) }} {{ spacing(6) }};
  border-radius: {{ spacing(2) }};
}
```

Outputs:

```css
.button {
  background: #6366f1;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
}
```

## Documentation

- [Getting Started](./getting-started/index.md) - Installation and first steps
- [Syntax Reference](./syntax/index.md) - Complete language reference
- [llms.txt](./llms.txt) - AI-friendly single-page reference

## Key Features

- **JavaScript Preamble** - Define variables, functions, and imports in the `---` zone
- **Expression Interpolation** - Use `{{ expr }}` to inject JS values into CSS
- **Style Lookup** - Read CSS values with `@(property)` or `@property` shorthand
- **Variable Substitution** - Simple `$param` text replacement
- **Style Blocks** - Generate CSS from JS with `@{ cssText }`
- **Zero Runtime** - Everything compiles to static CSS

## Installation

```bash
npm install lass vite-plugin-lass
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import lass from 'vite-plugin-lass';

export default defineConfig({
  plugins: [lass()]
});
```

## Links

- [GitHub Repository](https://github.com/lass-lang/lass)
- [npm: lass](https://www.npmjs.com/package/lass)
- [npm: vite-plugin-lass](https://www.npmjs.com/package/vite-plugin-lass)

## License

MIT
