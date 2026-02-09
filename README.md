# Lass

**CSS with JavaScript superpowers.** Zero runtime - compiles to static CSS.

## Examples

### Start with CSS

Any valid CSS works as-is:

```lass
.button {
  background: #6366f1;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}

.button-secondary {
  background: #8b5cf6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}
```

### Then Add JavaScript

See the repetition? Add a preamble above `---` to DRY it up:

```lass
const colors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
};

---

{{ Object.keys(colors).map(name => @{
  .button-{{ name }} {
    background: {{ colors[name] }};
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
  }
}) }}
```

Same output, single source of truth. Add a new variant? Just add it to `colors`.

### Style Lookup

Reuse values within a rule with `@prop`:

```lass
.button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  
  &:focus {
    outline: 2px solid currentColor;
    outline-offset: @padding;
  }
}
```

`@padding` resolves to `0.75rem 1.5rem` at build time.

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
