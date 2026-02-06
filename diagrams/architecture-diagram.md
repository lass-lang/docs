# Lass Architecture Diagram

> **Last Updated:** 2026-02-06 (Story P.1 Complete)
> 
> Update this document when major architectural changes occur.

## System Overview

```mermaid
flowchart TB
    subgraph Input
        LASS[".lass file"]
    end

    subgraph Core["@lass-lang/core<br/>(Bundler-Agnostic Transpiler)"]
        SCANNER["Scanner"]
        TRANSPILER["Transpiler"]
        LASS --> SCANNER --> TRANSPILER
    end

    subgraph Plugin["@lass-lang/vite-plugin-lass<br/>(Vite Integration Layer)"]
        HOOKS["Vite Hooks"]
        GRAPH["Module Graph"]
        CSS_EXT["CSS Extraction"]
        TRANSPILER --> HOOKS
        HOOKS --> GRAPH
        HOOKS --> CSS_EXT
    end

    subgraph Output
        BROWSER["Browser / Build"]
    end

    GRAPH --> BROWSER
    CSS_EXT --> BROWSER
```

## Package Architecture

```mermaid
flowchart TB
    subgraph Workspace["@lass-lang/dev-workspace"]
        subgraph Packages["packages/"]
            subgraph Core["@lass-lang/core"]
                CORE_INDEX["src/index.ts<br/>transpile() function"]
                CORE_SCANNER["src/scanner.ts<br/>Zone detection"]
                CORE_ERRORS["src/errors.ts<br/>Error types"]
            end

            subgraph Axioms["@lass-lang/axioms"]
                AXIOM_FILES["files/<br/>*.common.md"]
                AXIOM_LOADER["src/loader.ts"]
                AXIOM_TYPES["src/types.ts"]
            end
        end

        subgraph Plugins["plugins/"]
            subgraph VitePlugin["@lass-lang/vite-plugin-lass"]
                VP_INDEX["src/index.ts<br/>Plugin factory"]
                VP_RESOLVE["src/lib/1-resolve.ts"]
                VP_TRANSFORM["src/lib/2-transform.ts"]
                VP_LOAD["src/lib/3-load.ts"]
                VP_HMR["src/lib/4-hmr.ts"]
                VP_STATE["src/lib/state.ts"]
                VP_UTILS["src/lib/utils.ts"]
            end
        end
    end

    Core -.->|"devDependency"| Axioms
    VitePlugin -->|"dependency"| Core
```

## Transpilation Pipeline (@lass-lang/core)

```mermaid
flowchart TB
    subgraph Input["INPUT: .lass file"]
        INPUT_CODE["import { colors } from './tokens.js'<br/>const primary = colors.brand<br/>---<br/>.button { background: {{ primary }}; }"]
    end

    subgraph Step1["STEP 1: detectZones()"]
        FIND_SEP["Scanner.findSeparator()"]
        subgraph Zones["Split on '---'"]
            PREAMBLE["PREAMBLE ZONE<br/>(JavaScript)<br/><br/>import { colors }...<br/>const primary = ..."]
            CSS_ZONE["CSS ZONE<br/>(CSS with expressions)<br/><br/>.button { background: {{ primary }}; }"]
        end
        INPUT_CODE --> FIND_SEP --> Zones
    end

    subgraph Step2["STEP 2: processExpressions()"]
        FIND_EXPR["Scanner.findExpressions()"]
        REPLACE["{{ primary }}<br/>↓<br/>${__lassExpr(primary)}"]
        Zones --> FIND_EXPR --> REPLACE
    end

    subgraph Step3["STEP 3: buildOutput()"]
        ASSEMBLE["Assemble JavaScript Module"]
        OUTPUT_CODE["const __lassExpr = v => ...<br/><br/>import { colors } from './tokens.js'<br/>const primary = colors.brand<br/><br/>export default `.button { background: ${__lassExpr(primary)}; }`;"]
        REPLACE --> ASSEMBLE --> OUTPUT_CODE
    end

    subgraph Output["OUTPUT: JavaScript Module"]
        FEATURES["• Standard ES Module<br/>• Imports resolved by bundler<br/>• Default export = CSS string<br/>• Preamble runs on import"]
    end

    OUTPUT_CODE --> FEATURES
```

## Vite Plugin Flow (@lass-lang/vite-plugin-lass)

```mermaid
flowchart TB
    subgraph Vite["VITE DEV SERVER / BUILD"]
        IMPORT["import './styles.lass'"]

        subgraph Resolve["1. RESOLVE (1-resolve.ts)"]
            R_DESC["• Handles .lass file resolution<br/>• Creates virtual modules"]
            R_FLOW["file.lass → resolved<br/>file.lass.css → virtual module"]
        end

        subgraph Transform["2. TRANSFORM (2-transform.ts)"]
            T_DESC["• Calls @lass-lang/core transpile()<br/>• Returns JS module with CSS import<br/>• Executes preamble code"]
            T_KEY["⭐ Output participates in MODULE GRAPH<br/>(Killer feature - mutations persist!)"]
        end

        subgraph Load["3. LOAD (3-load.ts)"]
            L_DESC["• Handles virtual .lass.css modules<br/>• Executes JS in isolation for CSS<br/>• Returns CSS to Vite pipeline"]
            L_FLOW["Virtual module → Pure CSS string"]
        end

        subgraph HMR["4. HMR (4-hmr.ts)"]
            H_DESC["• Tracks dependencies<br/>• Invalidates on changes<br/>• Enables live reload"]
        end

        IMPORT --> Resolve --> Transform --> Load --> HMR

        subgraph Output["Output"]
            JS_OUT["JS in Module Graph<br/>(imports, mutations)"]
            CSS_OUT["CSS in Vite Pipeline<br/>(bundling, minification)"]
        end

        HMR --> JS_OUT
        HMR --> CSS_OUT
    end
```

## The Killer Feature: Module Graph Integration

```mermaid
flowchart TB
    subgraph Feature["MODULE GRAPH PARTICIPATION"]
        STATE["shared-state.js<br/>────────────────<br/>export const state = { value: 'initial' }"]

        subgraph Importers["Both import the same module"]
            LASS["theme.lass<br/>───────────<br/>import {state}<br/>state.value = 'from-lass'<br/>---<br/>.box { ... }"]
            MAIN["main.js<br/>────────<br/>import {state}<br/>import './theme.lass'<br/><br/>// state.value<br/>// is now 'from-lass'"]
        end

        STATE --> LASS
        STATE --> MAIN

        SHARED["🔗 SAME module instance!<br/>────────────────<br/>shared-state<br/>{ value: 'from-lass' }"]

        LASS --> SHARED
        MAIN --> SHARED
    end

    subgraph Why["WHY THIS MATTERS"]
        W1["• Lass files can import and MUTATE shared state"]
        W2["• Other JS files see those mutations"]
        W3["• Enables design tokens, theme switching, dynamic styling"]
        W4["• No other CSS preprocessor can do this"]
    end

    Feature --> Why
```

## Test Infrastructure

```mermaid
flowchart TB
    subgraph Tests["TEST ARCHITECTURE"]
        subgraph Unit["UNIT TESTS (pnpm test)"]
            U_AXIOMS["@lass-lang/axioms<br/>27 tests"]
            U_CORE["@lass-lang/core<br/>154 tests"]
            U_PLUGIN["vite-plugin-lass<br/>54 tests"]
            U_TOTAL["Total: 235 tests<br/>100% line coverage"]
        end

        subgraph Integration["INTEGRATION TESTS (pnpm test:integration)"]
            I_LOC["Location: plugins/vite-plugin-lass/test-integration/"]
            I_BROWSER["Runs in real Chromium browser<br/>(Vitest Browser Mode + Playwright)"]
            I_TESTS["Tests:<br/>• Module graph mutation<br/>• Import order behavior<br/>• CSS application to DOM<br/>• HMR infrastructure"]
        end

        subgraph Axioms["AXIOM-DRIVEN DEVELOPMENT"]
            A_DESC["Axioms define expected behavior"]
            A_STATUS["Status types:<br/>• implemented → unit tests<br/>• not-implemented → skipped<br/>• vite-only → integration tests"]
        end
    end

    Unit --> Integration --> Axioms
```

## Dependency Graph

```mermaid
flowchart BT
    subgraph External["External Dependencies"]
        NONE["@lass-lang/core: (none)"]
        VITE["vite ^5.0.0 || ^6.0.0"]
    end

    AXIOMS["@lass-lang/axioms<br/>(test fixtures)"]
    CORE["@lass-lang/core<br/>(transpiler)"]
    PLUGIN["@lass-lang/vite-plugin-lass<br/>(bundler integration)"]
    USER["User Project<br/>(vite.config.ts)"]

    AXIOMS -.->|"devDependency"| CORE
    CORE -->|"dependency"| PLUGIN
    VITE -.->|"peerDependency"| PLUGIN
    PLUGIN --> USER
```

## File Processing Example

```mermaid
flowchart TB
    subgraph Input["INPUT: src/styles/button.lass"]
        INPUT_FILE["import { spacing, colors } from '../tokens.js'<br/>import { lighten } from '../utils.js'<br/><br/>const hoverBg = lighten(colors.primary, 0.1)<br/>---<br/>.button {<br/>  padding: {{ spacing.md }}px {{ spacing.lg }}px;<br/>  background: {{ colors.primary }};<br/>  ...<br/>}<br/>.button:hover {<br/>  background: {{ hoverBg }};<br/>}"]
    end

    TRANSPILE["@lass-lang/core transpile()"]

    subgraph Transpiled["TRANSPILED: JavaScript Module"]
        JS_OUT["const __lassExpr = v => ...<br/><br/>import { spacing, colors } from '../tokens.js'<br/>import { lighten } from '../utils.js'<br/><br/>const hoverBg = lighten(colors.primary, 0.1)<br/><br/>export default `.button {<br/>  padding: ${__lassExpr(spacing.md)}px ...;<br/>  background: ${__lassExpr(colors.primary)};<br/>  ...<br/>}<br/>.button:hover {<br/>  background: ${__lassExpr(hoverBg)};<br/>}`;"]
    end

    EXECUTE["Vite executes module<br/>(imports resolve)"]

    subgraph Executed["EXECUTED: CSS String"]
        CSS_OUT[".button {<br/>  padding: 12px 24px;<br/>  background: #3b82f6;<br/>  ...<br/>}<br/>.button:hover {<br/>  background: #5b9cf6;<br/>}"]
    end

    PIPELINE["Vite CSS Pipeline"]

    subgraph Browser["BROWSER: Styles Applied"]
        FINAL["&lt;style&gt; or linked CSS file<br/>with final styles"]
    end

    INPUT_FILE --> TRANSPILE --> Transpiled --> EXECUTE --> Executed --> PIPELINE --> Browser
```

---

## Version History

| Date       | Version | Changes                                    |
|------------|---------|-------------------------------------------|
| 2026-02-06 | 1.1     | Convert ASCII diagrams to Mermaid         |
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

Diagrams use Mermaid syntax for GitHub/GitLab rendering compatibility.
