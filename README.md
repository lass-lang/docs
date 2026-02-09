# Lass

**JavaScript-enhanced stylesheets for modern web development.**

Lass is CSS - with optional JavaScript superpowers. Everything compiles to static CSS at build time.

### Just CSS

```lass
.button {
  background: #6366f1;
  padding: 1rem 1.5rem;
}
```

### JavaScript Power

```lass
const sizes = [1, 2, 4, 8];

---

{{ sizes.map(n => `.m-${n} { margin: ${n * 0.25}rem; }`).join('\n') }}
```

Outputs: `.m-1 { margin: 0.25rem; }` `.m-2 { margin: 0.5rem; }` ...

### Style Lookup

```lass
.box {
  color: #6366f1;
  border-color: @color;
}
```

Read CSS values set earlier with `@prop` - outputs `border-color: #6366f1;`

## Documentation

- [Getting Started](./getting-started/index.md) - Installation and first steps
- [Syntax Reference](./syntax/index.md) - Complete language reference
- [llms.txt](./llms.txt) - AI-friendly single-page reference

## Key Features

- **JavaScript Preamble** - Define variables, functions, and imports before the `---` separator
- **Expression Interpolation** - Use `{{ expr }}` to inject JS values into CSS
- **Style Lookup** - Read CSS values with `@(property)` or `@prop` shorthand
- **Variable Substitution** - Simple `$param` text replacement
- **Style Blocks** - Generate CSS from JS with `@{ cssText }`
- **Zero Runtime** - Everything compiles to static CSS

## Installation

```bash
npm install @lass-lang/vite-plugin-lass --save-dev
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import lass from '@lass-lang/vite-plugin-lass';

export default defineConfig({
  plugins: [lass()]
});
```

## Links

- [GitHub Repository](https://github.com/lass-lang/lass)
- [npm: @lass-lang/vite-plugin-lass](https://www.npmjs.com/package/@lass-lang/vite-plugin-lass)
- [npm: @lass-lang/core](https://www.npmjs.com/package/@lass-lang/core)

## License

MIT
