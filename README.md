# Lass

**CSS with JavaScript superpowers.** Zero runtime - compiles to static CSS.

## Examples

### Just CSS

Any valid CSS works as-is:

```lass
.button {
  background: #6366f1;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
}
```

### Add JavaScript When You Need It

Add a preamble above `---` to unlock variables, functions, and loops:

```lass
const space = (n) => `${n * 0.25}rem`;
const colors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
};

---

.card {
  padding: {{ space(6) }};
  background: {{ colors.primary }};
}

{{ Object.keys(colors).map(name => @{
  .text-{{ name }} {
    color: {{ colors[name] }};
  }
}) }}
```

Outputs:

```css
.card {
  padding: 1.5rem;
  background: #6366f1;
}

.text-primary {
  color: #6366f1;
}
.text-secondary {
  color: #8b5cf6;
}
```

### Style Lookup

Reuse CSS values with `@prop`:

```lass
.box {
  border: 2px solid #6366f1;
  outline: @border;
}
```

Outputs: `outline: 2px solid #6366f1;`

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
