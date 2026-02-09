# Getting Started

## CLI

```bash
npm install @lass-lang/cli
```

```bash
npx lass input.lass -o output.css
npx lass src/styles --outdir dist/css
```

## Vite

```bash
npm install @lass-lang/vite-plugin-lass --save-dev
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import lass from '@lass-lang/vite-plugin-lass';

export default defineConfig({
  plugins: [lass()],
});
```

## Bun

```bash
bun add @lass-lang/bun-plugin-lass --dev
```

```js
// build.js
import lass from '@lass-lang/bun-plugin-lass';

Bun.build({
  entrypoints: ['./src/index.ts'],
  plugins: [lass()],
});
```

## Your First .lass File

Create a file with the `.lass` extension. Lass files are just CSS - write styles exactly as you would in a `.css` file:

<test-case type="valid">
```lass
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

```css
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
</test-case>

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

<test-case type="valid">
```lass
const primary = '#6366f1';
const secondary = '#8b5cf6';
const spacing = (n) => `${n * 0.25}rem`;

---

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

```css

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
  background: #6366f1;
  color: white;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.button:hover {
  background: #8b5cf6;
}
```
</test-case>

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

<test-case type="valid">
```lass
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

```css

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  padding: 1.5rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
```
</test-case>

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

<test-case type="valid">
```lass
const size = 16;

---

.text {
  font-size: {{ size }}px;
  line-height: {{ size * 2 }}px;
}
```

```css

.text {
  font-size: 16px;
  line-height: 32px;
}
```
</test-case>

Use `$name` for simple text substitution (no computation). Variables must be `$`-prefixed:

<test-case type="valid">
```lass
const $unit = 'rem';

---

.box {
  margin: 1$unit;
}
```

```css

.box {
  margin: 1rem;
}
```
</test-case>

### Preamble Must Come First

When using JavaScript, the preamble must come **before** the `---` separator:

<test-case type="valid">
```lass
const color = 'blue';

---

.box { color: {{ color }}; }
```

```css

.box { color: blue; }
```
</test-case>

Without a preamble, you don't need a separator at all - just write CSS directly.

## What's Next

You now have Lass running in your project. Explore more:

- [Syntax Reference](../syntax/index.md) - Full language reference
- [llms.txt](../llms.txt) - Quick syntax cheatsheet

---

[Back to Home](../index.md) | [Next: Syntax Reference](../syntax/index.md)
