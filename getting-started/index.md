# Getting Started

Get Lass running in your Vite project in under 10 minutes.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** - Check with `node --version`
- **A Vite-based project** - Lass works with Vite 5.x and 6.x

If you don't have a Vite project yet:

```bash
npm create vite@latest my-app -- --template vanilla
cd my-app
npm install
```

## Installation

Install the Lass Vite plugin as a dev dependency:

```bash
# npm
npm install @lass-lang/vite-plugin-lass --save-dev

# pnpm
pnpm add @lass-lang/vite-plugin-lass --save-dev

# yarn
yarn add @lass-lang/vite-plugin-lass --dev

# bun
bun add @lass-lang/vite-plugin-lass --dev
```

> **Note:** You only need `@lass-lang/vite-plugin-lass`. The core transpiler (`@lass-lang/core`) is included as a dependency.

## Vite Configuration

Add the Lass plugin to your Vite config:

```js
// vite.config.js
import { defineConfig } from 'vite';
import lass from '@lass-lang/vite-plugin-lass';

export default defineConfig({
  plugins: [lass()],
});
```

For TypeScript projects:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import lass from '@lass-lang/vite-plugin-lass';

export default defineConfig({
  plugins: [lass()],
});
```

## Your First .lass File

Create a file with the `.lass` extension. Lass files are just CSS - write styles exactly as you would in a `.css` file:

```lass
/* src/styles/theme.lass */

:root {
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
}

.button {
  background: var(--color-primary);
  color: white;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.button:hover {
  background: var(--color-secondary);
}
```

That's it! Any valid CSS works in a `.lass` file.

## Importing in Your App

Import `.lass` files just like CSS:

```js
// src/main.js
import './styles/theme.lass';

// Your app code...
document.querySelector('#app').innerHTML = `
  <div class="container">
    <button class="button">Click me</button>
  </div>
`;
```

Start the dev server:

```bash
npm run dev
```

Your Lass styles are now active. Edit the `.lass` file and see changes reflected instantly via Vite's HMR.

## Adding JavaScript Power

Want to do more? Add a JavaScript preamble before a `---` separator to unlock the full power of Lass:

```lass
// src/styles/theme.lass

// JavaScript preamble - runs at build time
const primary = '#6366f1';
const secondary = '#8b5cf6';
const spacing = (n) => `${n * 0.25}rem`;

---

/* CSS zone - use JS values with {{ }} */
:root {
  --color-primary: {{ primary }};
  --color-secondary: {{ secondary }};
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: {{ spacing(4) }} {{ spacing(6) }};
}

.button {
  background: {{ primary }};
  color: white;
  padding: {{ spacing(3) }} {{ spacing(5) }};
  border: none;
  border-radius: {{ spacing(2) }};
  cursor: pointer;
}

.button:hover {
  background: {{ secondary }};
}
```

The preamble lets you:
- **Define variables** - Colors, sizes, breakpoints
- **Create functions** - Spacing scales, color utilities
- **Import modules** - Share tokens across files

Everything compiles to static CSS at build time - zero runtime overhead.

## TypeScript Support

For TypeScript projects, add type declarations so the compiler recognizes `.lass` imports.

Create `src/lass.d.ts`:

```typescript
// src/lass.d.ts

// Side-effect imports (import './styles.lass')
declare module '*.lass';

// CSS Modules (import styles from './component.module.lass')
declare module '*.module.lass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
```

Ensure this file is included in your `tsconfig.json`:

```json
{
  "include": ["src/**/*.ts", "src/**/*.d.ts"]
}
```

### CSS Modules

Use `.module.lass` for scoped class names:

```lass
// src/components/Card.module.lass

const shadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';

---

.card {
  background: white;
  border-radius: 8px;
  box-shadow: {{ shadow }};
  padding: 1.5rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
```

Import with a default import to get scoped class names:

```typescript
// src/components/Card.ts
import styles from './Card.module.lass';

const card = document.createElement('div');
card.className = styles.card;  // Scoped class name

const title = document.createElement('h2');
title.className = styles.title;
```

## Common Pitfalls

### Wrong Package Name

Use the scoped package name:

```bash
# Correct
npm install @lass-lang/vite-plugin-lass --save-dev

# Wrong - these packages don't exist
npm install vite-plugin-lass
npm install lass
```

### Forgot to Add Plugin

If `.lass` files aren't being processed, check that the plugin is added to your Vite config:

```js
// vite.config.js
import lass from '@lass-lang/vite-plugin-lass';

export default defineConfig({
  plugins: [lass()],  // Don't forget this!
});
```

### Missing TypeScript Declarations

If TypeScript complains about `.lass` imports:

```
Cannot find module './styles.lass' or its corresponding type declarations.
```

Create `src/lass.d.ts` with the declarations shown in the [TypeScript Support](#typescript-support) section.

### Expression vs Substitution

Use `{{ }}` for expressions (computed at build time):

```lass
const size = 16;

---

.text {
  font-size: {{ size }}px;      /* Result: 16px */
  font-size: {{ size * 2 }}px;  /* Result: 32px */
}
```

Use `$name` for simple text substitution (no computation). Variables must be `$`-prefixed:

```lass
const $unit = 'rem';

---

.box {
  margin: 1$unit;  /* Result: 1rem */
}
```

### Preamble Must Come First

When using JavaScript, the preamble must come **before** the `---` separator:

```lass
// Correct - JS first, then ---, then CSS
const color = 'blue';

---

.box { color: {{ color }}; }
```

Without a preamble, you don't need a separator at all - just write CSS directly.

## What's Next

You now have Lass running in your project. Explore more:

- [Syntax Reference](../syntax/index.md) - Full language reference
- [llms.txt](../llms.txt) - Quick syntax cheatsheet

---

[Back to Home](../README.md) | [Next: Syntax Reference](../syntax/index.md)
