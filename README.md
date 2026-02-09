# Lass

**CSS with JavaScript superpowers.** Zero runtime - compiles to static CSS.

## Examples

### Start with CSS

Any valid CSS works as-is:

<!-- test:begin valid -->
```lass
.button {
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}

.button-primary {
  background: #6366f1;
  border: 2px solid #6366f1;
  box-shadow: 0 2px 4px #6366f133;
}

.button-secondary {
  background: #8b5cf6;
  border: 2px solid #8b5cf6;
  box-shadow: 0 2px 4px #8b5cf633;
}

.button-danger {
  background: #ef4444;
  border: 2px solid #ef4444;
  box-shadow: 0 2px 4px #ef444433;
}
```

```css
.button {
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}

.button-primary {
  background: #6366f1;
  border: 2px solid #6366f1;
  box-shadow: 0 2px 4px #6366f133;
}

.button-secondary {
  background: #8b5cf6;
  border: 2px solid #8b5cf6;
  box-shadow: 0 2px 4px #8b5cf633;
}

.button-danger {
  background: #ef4444;
  border: 2px solid #ef4444;
  box-shadow: 0 2px 4px #ef444433;
}
```
<!-- test:end -->

### With Lass

Generate button variants from a color map:

<!-- test:begin valid -->
```lass
const colors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  danger: '#ef4444',
};

---

.button {
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}

{{ Object.entries(colors).map(([name, color]) => @{
  .button-{{ name }} {
    background: {{ color }};
    border: 2px solid {{ color }};
    box-shadow: 0 2px 4px {{ color }}33;
  }
}) }}
```

```css

.button {
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}

.button-primary {
  background: #6366f1;
  border: 2px solid #6366f1;
  box-shadow: 0 2px 4px #6366f133;
}
.button-secondary {
  background: #8b5cf6;
  border: 2px solid #8b5cf6;
  box-shadow: 0 2px 4px #8b5cf633;
}
.button-danger {
  background: #ef4444;
  border: 2px solid #ef4444;
  box-shadow: 0 2px 4px #ef444433;
}
```
<!-- test:end -->

Add a variant? One line in `colors`.

## Documentation

- [Getting Started](./getting-started/index.md) - Installation and first steps
- [Syntax Reference](./syntax/index.md) - Complete language reference
- [llms.txt](./llms.txt) - AI-friendly single-page reference

## Key Features

- **JavaScript Preamble** - Define variables, functions, and imports before the `---` separator
- **Expression Interpolation** - Use `{{ expr }}` to inject JS values into CSS
- **Style Lookup** - Read CSS values with `@(property)` or `@prop` shorthand
- **Variable Substitution** - Simple `$param` text replacement in CSS
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
