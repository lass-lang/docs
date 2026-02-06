# Lass Architecture Diagram

> **Last Updated:** 2026-02-06 (Story P.1 Complete)
> 
> Update this document when major architectural changes occur.

## System Overview

```
                                    LASS ECOSYSTEM
 ============================================================================
                                        
                              .lass file
                                  |
                                  v
 ============================================================================
 |                         @lass-lang/core                                  |
 |                      (Bundler-Agnostic Transpiler)                       |
 |                                                                          |
 |   .lass source ──► Scanner ──► Transpiler ──► JavaScript Module          |
 |                                                                          |
 ============================================================================
                                  |
                                  v
 ============================================================================
 |                      @lass-lang/vite-plugin-lass                         |
 |                       (Vite Integration Layer)                           |
 |                                                                          |
 |   JS Module ──► Vite Hooks ──► Module Graph + CSS Extraction             |
 |                                                                          |
 ============================================================================
                                  |
                                  v
                           Browser / Build
```

## Package Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              WORKSPACE ROOT                               │
│                          @lass-lang/dev-workspace                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  packages/                                                                │
│  ├────────────────────────────────────────────────────────────────────────┤
│  │                                                                        │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  │  @lass-lang/core                                                │   │
│  │  │  ══════════════                                                 │   │
│  │  │  The transpiler. Converts .lass to .js                          │   │
│  │  │                                                                 │   │
│  │  │  src/                                                           │   │
│  │  │  ├── index.ts      Main entry, transpile() function             │   │
│  │  │  ├── scanner.ts    Zone detection, expression finding           │   │
│  │  │  └── errors.ts     Error types and formatting                   │   │
│  │  │                                                                 │   │
│  │  │  Exports:                                                       │   │
│  │  │  • transpile(source, options) → { code, map? }                  │   │
│  │  │  • Scanner class                                                │   │
│  │  │  • Error types                                                  │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │
│  │                              │                                         │
│  │                              │ depends on (dev)                        │
│  │                              ▼                                         │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  │  @lass-lang/axioms                                              │   │
│  │  │  ════════════════                                               │   │
│  │  │  Test fixtures in markdown. Language specification.             │   │
│  │  │                                                                 │   │
│  │  │  files/                                                         │   │
│  │  │  ├── css-passthrough.common.md    Pure CSS behavior             │   │
│  │  │  ├── two-zone-model.common.md     Preamble + CSS zones          │   │
│  │  │  ├── expressions.common.md        {{ expr }} interpolation      │   │
│  │  │  ├── array-handling.common.md     Array auto-join               │   │
│  │  │  └── module-graph.common.md       Vite integration (vite-only)  │   │
│  │  │                                                                 │   │
│  │  │  src/                                                           │   │
│  │  │  ├── loader.ts     Parses axiom markdown files                  │   │
│  │  │  └── types.ts      Axiom type definitions                       │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │
│  │                                                                        │
│  └────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  plugins/                                                                 │
│  ├────────────────────────────────────────────────────────────────────────┤
│  │                                                                        │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  │  @lass-lang/vite-plugin-lass                                    │   │
│  │  │  ══════════════════════════                                     │   │
│  │  │  Vite plugin. Integrates transpiler with bundler.               │   │
│  │  │                                                                 │   │
│  │  │  src/                                                           │   │
│  │  │  ├── index.ts          Plugin factory, exports lass()           │   │
│  │  │  └── lib/                                                       │   │
│  │  │      ├── 1-resolve.ts  resolveId hook (virtual modules)         │   │
│  │  │      ├── 2-transform.ts transform hook (transpilation)          │   │
│  │  │      ├── 3-load.ts     load hook (CSS extraction)               │   │
│  │  │      ├── 4-hmr.ts      Hot Module Replacement                   │   │
│  │  │      ├── state.ts      Shared plugin state                      │   │
│  │  │      ├── utils.ts      Helper functions                         │   │
│  │  │      ├── constants.ts  Plugin constants                         │   │
│  │  │      └── types.ts      Type definitions                         │   │
│  │  │                                                                 │   │
│  │  │  test-app/             Manual testing application               │   │
│  │  │  test-integration/     Browser-based integration tests          │   │
│  │  │                                                                 │   │
│  │  │  Dependencies:                                                  │   │
│  │  │  • @lass-lang/core (runtime)                                    │   │
│  │  │  • vite (peer)                                                  │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │
│  │                                                                        │
│  └────────────────────────────────────────────────────────────────────────┤
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Transpilation Pipeline (@lass-lang/core)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INPUT: .lass file                                 │
│                                                                             │
│   import { colors } from './tokens.js'                                      │
│   const primary = colors.brand                                              │
│   ---                                                                       │
│   .button { background: {{ primary }}; }                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: detectZones()                                                      │
│  ══════════════════════                                                     │
│                                                                             │
│  Scanner.findSeparator() splits on "---":                                   │
│                                                                             │
│  ┌──────────────────────┐    ┌────────────────────────────────────────┐     │
│  │  PREAMBLE ZONE       │    │  CSS ZONE                              │     │
│  │  (JavaScript)        │    │  (CSS with expressions)                │     │
│  │                      │    │                                        │     │
│  │  import { colors }   │    │  .button { background: {{ primary }}; }│     │
│  │    from './tokens'   │    │                                        │     │
│  │  const primary =     │    │                                        │     │
│  │    colors.brand      │    │                                        │     │
│  └──────────────────────┘    └────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: processExpressions()                                               │
│  ═════════════════════════════                                              │
│                                                                             │
│  Scanner.findExpressions() finds {{ expr }} patterns:                       │
│                                                                             │
│  Input:  ".button { background: {{ primary }}; }"                           │
│                                   ▲                                         │
│                                   └─── Expression found                     │
│                                                                             │
│  Output: ".button { background: ${__lassExpr(primary)}; }"                  │
│                                  ▲                                          │
│                                  └─── Becomes template interpolation        │
│                                                                             │
│  The __lassExpr() helper handles:                                           │
│  • null/undefined → ""                                                      │
│  • arrays → flattened and joined                                            │
│  • other → String()                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: buildOutput()                                                      │
│  ══════════════════════                                                     │
│                                                                             │
│  Assembles final JavaScript module:                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  const __lassExpr = v => v == null ? '' : ...;  // Helper           │    │
│  │                                                                     │    │
│  │  import { colors } from './tokens.js'           // Preamble         │    │
│  │  const primary = colors.brand                                       │    │
│  │                                                                     │    │
│  │  export default `.button { background: ${__lassExpr(primary)}; }`;  │    │
│  │                   ▲                                                 │    │
│  │                   └─── Template literal with CSS                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OUTPUT: JavaScript Module                            │
│                                                                             │
│  • Standard ES Module with default export                                   │
│  • Imports are standard JS imports (bundler resolves them)                  │
│  • Default export is the CSS string                                         │
│  • Preamble code runs when module is imported                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Vite Plugin Flow (@lass-lang/vite-plugin-lass)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VITE DEV SERVER / BUILD                             │
│                                                                             │
│   import './styles.lass'                                                    │
│           │                                                                 │
│           ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  1. RESOLVE (1-resolve.ts)                                          │   │
│   │  ═══════════════════════════                                        │   │
│   │                                                                     │   │
│   │  • Handles .lass file resolution                                    │   │
│   │  • Creates virtual modules: /path/file.lass.css                     │   │
│   │                                                                     │   │
│   │  file.lass → resolved                                               │   │
│   │  file.lass.css → virtual module (for CSS extraction)                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  2. TRANSFORM (2-transform.ts)                                      │   │
│   │  ═══════════════════════════════                                    │   │
│   │                                                                     │   │
│   │  • Calls @lass-lang/core transpile()                                │   │
│   │  • Returns JS module that:                                          │   │
│   │    - Imports the virtual .lass.css file                             │   │
│   │    - Executes preamble code                                         │   │
│   │    - Exports CSS string                                             │   │
│   │                                                                     │   │
│   │  Output JS participates in Vite's MODULE GRAPH                      │   │
│   │  (This is the "killer feature" - mutations persist!)                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  3. LOAD (3-load.ts)                                                │   │
│   │  ═════════════════════                                              │   │
│   │                                                                     │   │
│   │  • Handles virtual .lass.css modules                                │   │
│   │  • Executes transpiled JS (in isolation) to get CSS string          │   │
│   │  • Returns CSS to Vite's CSS pipeline                               │   │
│   │                                                                     │   │
│   │  Virtual module → Pure CSS string                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  4. HMR (4-hmr.ts)                                                  │   │
│   │  ═══════════════════                                                │   │
│   │                                                                     │   │
│   │  • Tracks dependencies (imports in preamble)                        │   │
│   │  • Invalidates modules when .lass or deps change                    │   │
│   │  • Enables live reload during development                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│                                                                             │
│   ┌───────────────────────┐    ┌───────────────────────────────────────┐    │
│   │  JS in Module Graph   │    │  CSS in Vite's CSS Pipeline           │    │
│   │  (imports, mutations) │    │  (bundling, minification)             │    │
│   └───────────────────────┘    └───────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Killer Feature: Module Graph Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODULE GRAPH PARTICIPATION                               │
│                                                                             │
│  This is what makes Lass unique among CSS preprocessors.                    │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │   shared-state.js                                                    │  │
│  │   ════════════════                                                   │  │
│  │   export const state = { value: 'initial' }                          │  │
│  │                     │                                                │  │
│  │                     │ imported by both                               │  │
│  │          ┌──────────┴──────────┐                                     │  │
│  │          ▼                     ▼                                     │  │
│  │   ┌─────────────────┐   ┌─────────────────┐                         │  │
│  │   │  theme.lass     │   │  main.js        │                         │  │
│  │   │  ═══════════    │   │  ════════       │                         │  │
│  │   │                 │   │                 │                         │  │
│  │   │  import {state} │   │  import {state} │                         │  │
│  │   │  state.value =  │   │  import './lass'│                         │  │
│  │   │    'from-lass'  │   │                 │                         │  │
│  │   │  ---            │   │  // state.value │                         │  │
│  │   │  .box { ... }   │   │  // is now      │                         │  │
│  │   │                 │   │  // 'from-lass' │                         │  │
│  │   └─────────────────┘   └─────────────────┘                         │  │
│  │          │                     │                                     │  │
│  │          │ SAME module         │                                     │  │
│  │          │ instance!           │                                     │  │
│  │          └──────────┬──────────┘                                     │  │
│  │                     ▼                                                │  │
│  │              ┌─────────────┐                                         │  │
│  │              │ shared-state│                                         │  │
│  │              │ { value:    │                                         │  │
│  │              │ 'from-lass'}│                                         │  │
│  │              └─────────────┘                                         │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  WHY THIS MATTERS:                                                          │
│  • Lass files can import and MUTATE shared state                            │
│  • Other JS files see those mutations                                       │
│  • Enables design tokens, theme switching, dynamic styling                  │
│  • No other CSS preprocessor can do this                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Test Infrastructure

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           TEST ARCHITECTURE                                │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  UNIT TESTS (pnpm test)                                             │   │
│  │  ═══════════════════════                                            │   │
│  │                                                                     │   │
│  │  @lass-lang/axioms     27 tests   Axiom loader functionality        │   │
│  │  @lass-lang/core      154 tests   Scanner, transpiler, errors       │   │
│  │  vite-plugin-lass      54 tests   Plugin hooks, transforms          │   │
│  │                       ─────────                                     │   │
│  │  Total:               235 tests                                     │   │
│  │                                                                     │   │
│  │  Framework: Vitest 4.0.18                                           │   │
│  │  Coverage: 100% line coverage                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  INTEGRATION TESTS (pnpm test:integration)                          │   │
│  │  ═════════════════════════════════════════                          │   │
│  │                                                                     │   │
│  │  Location: plugins/vite-plugin-lass/test-integration/               │   │
│  │                                                                     │   │
│  │  • Runs in real Chromium browser (Vitest Browser Mode)              │   │
│  │  • Uses Playwright for browser automation                           │   │
│  │  • Verifies module graph participation (killer feature)             │   │
│  │  • Verifies CSS injection and styling                               │   │
│  │                                                                     │   │
│  │  Tests:                                                             │   │
│  │  • Module graph mutation persistence                                │   │
│  │  • Import order behavior                                            │   │
│  │  • CSS application to DOM                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AXIOM-DRIVEN DEVELOPMENT                                           │   │
│  │  ═════════════════════════                                          │   │
│  │                                                                     │   │
│  │  Axioms in @lass-lang/axioms define expected behavior:              │   │
│  │                                                                     │   │
│  │  ```markdown                                                        │   │
│  │  ## valid: expression interpolation                                 │   │
│  │                                                                     │   │
│  │  ```lass                                                            │   │
│  │  const x = 42                                                       │   │
│  │  ---                                                                │   │
│  │  .foo { width: {{ x }}px; }                                         │   │
│  │  ```                                                                │   │
│  │                                                                     │   │
│  │  ```css                                                             │   │
│  │  .foo { width: 42px; }                                              │   │
│  │  ```                                                                │   │
│  │  ```                                                                │   │
│  │                                                                     │   │
│  │  Axiom status:                                                      │   │
│  │  • implemented: Run in unit tests                                   │   │
│  │  • not-implemented: Skipped (future work)                           │   │
│  │  • vite-only: Run in integration tests                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PACKAGE DEPENDENCIES                               │
│                                                                             │
│                                                                             │
│                    ┌──────────────────────────┐                             │
│                    │    @lass-lang/axioms     │                             │
│                    │    (test fixtures)       │                             │
│                    └──────────────────────────┘                             │
│                                 ▲                                           │
│                                 │ devDependency                             │
│                                 │                                           │
│                    ┌──────────────────────────┐                             │
│                    │     @lass-lang/core      │                             │
│                    │     (transpiler)         │                             │
│                    └──────────────────────────┘                             │
│                                 ▲                                           │
│                                 │ dependency                                │
│                                 │                                           │
│                    ┌──────────────────────────┐                             │
│                    │ @lass-lang/vite-plugin   │                             │
│                    │ (bundler integration)    │                             │
│                    └──────────────────────────┘                             │
│                                 ▲                                           │
│                                 │ peerDependency: vite                      │
│                                 │                                           │
│                    ┌──────────────────────────┐                             │
│                    │      User Project        │                             │
│                    │   (vite.config.ts)       │                             │
│                    └──────────────────────────┘                             │
│                                                                             │
│                                                                             │
│  External Dependencies:                                                     │
│  ══════════════════════                                                     │
│                                                                             │
│  @lass-lang/core:                                                           │
│    └── (none - zero runtime dependencies)                                   │
│                                                                             │
│  @lass-lang/vite-plugin-lass:                                               │
│    ├── @lass-lang/core (runtime)                                            │
│    └── vite (peer, ^5.0.0 || ^6.0.0)                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## File Processing Example

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPLETE EXAMPLE: button.lass → CSS in Browser                             │
│                                                                             │
│  INPUT FILE: src/styles/button.lass                                         │
│  ═══════════════════════════════════                                        │
│                                                                             │
│  import { spacing, colors } from '../tokens.js'                             │
│  import { lighten } from '../utils.js'                                      │
│                                                                             │
│  const hoverBg = lighten(colors.primary, 0.1)                               │
│  ---                                                                        │
│  .button {                                                                  │
│    padding: {{ spacing.md }}px {{ spacing.lg }}px;                          │
│    background: {{ colors.primary }};                                        │
│    color: white;                                                            │
│    border: none;                                                            │
│    border-radius: 4px;                                                      │
│    cursor: pointer;                                                         │
│  }                                                                          │
│                                                                             │
│  .button:hover {                                                            │
│    background: {{ hoverBg }};                                               │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                       @lass-lang/core transpile()
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRANSPILED: JavaScript Module                                              │
│  ═════════════════════════════                                              │
│                                                                             │
│  const __lassExpr = v => v == null ? '' : Array.isArray(v)                  │
│    ? v.flat(Infinity).map(x => x == null ? '' : String(x)).join('')         │
│    : String(v);                                                             │
│                                                                             │
│  import { spacing, colors } from '../tokens.js'                             │
│  import { lighten } from '../utils.js'                                      │
│                                                                             │
│  const hoverBg = lighten(colors.primary, 0.1)                               │
│                                                                             │
│  export default `.button {                                                  │
│    padding: ${__lassExpr(spacing.md)}px ${__lassExpr(spacing.lg)}px;        │
│    background: ${__lassExpr(colors.primary)};                               │
│    color: white;                                                            │
│    border: none;                                                            │
│    border-radius: 4px;                                                      │
│    cursor: pointer;                                                         │
│  }                                                                          │
│                                                                             │
│  .button:hover {                                                            │
│    background: ${__lassExpr(hoverBg)};                                      │
│  }`;                                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    Vite executes module (imports resolve)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXECUTED: CSS String (runtime)                                             │
│  ══════════════════════════════                                             │
│                                                                             │
│  .button {                                                                  │
│    padding: 12px 24px;                                                      │
│    background: #3b82f6;                                                     │
│    color: white;                                                            │
│    border: none;                                                            │
│    border-radius: 4px;                                                      │
│    cursor: pointer;                                                         │
│  }                                                                          │
│                                                                             │
│  .button:hover {                                                            │
│    background: #5b9cf6;                                                     │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                         Vite CSS Pipeline
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BROWSER: Styles Applied                                                    │
│  ════════════════════════                                                   │
│                                                                             │
│  <style> or linked CSS file with final styles                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Version History

| Date       | Version | Changes                                    |
|------------|---------|-------------------------------------------|
| 2026-02-06 | 1.0     | Initial diagram (Story P.1 complete)      |
|            |         | - Core transpiler architecture            |
|            |         | - Vite plugin flow                        |
|            |         | - Integration test infrastructure         |
|            |         | - Module graph participation diagram      |

---

## Notes for Updating

When to update this document:
- New package added to workspace
- Major architectural change to transpiler or plugin
- New bundler integration added
- Test infrastructure changes
- New Vite hook added

Keep diagrams ASCII-based for compatibility with all markdown renderers.
