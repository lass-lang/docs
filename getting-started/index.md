# Getting Started

> This guide will be completed in Story 7.2

## Prerequisites

- Node.js 18+
- A Vite-based project (or willingness to create one)

## Quick Start

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

Create your first `.lass` file:

```lass
---
const primary = '#6366f1';
---

.hello {
  color: {{ primary }};
}
```

Import it in your JavaScript:

```js
import './styles.lass';
```

---

[Back to Home](../README.md)
