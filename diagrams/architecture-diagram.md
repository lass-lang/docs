# Lass Architecture Diagram

> **Last Updated:** 2026-02-06 (Story P.1 Complete)

## System Overview

```mermaid
flowchart LR
    A[.lass file] --> B[Scanner] --> C[Transpiler] --> D[JS Module]
    D --> E[Vite Plugin]
    E --> F[Module Graph]
    E --> G[CSS Pipeline]
    F --> H[Browser]
    G --> H
```

## Package Architecture

```mermaid
flowchart TB
    subgraph workspace[dev-workspace]
        subgraph packages
            core["@lass-lang/core"]
            axioms["@lass-lang/axioms"]
        end
        subgraph plugins
            vite["@lass-lang/vite-plugin"]
        end
        subgraph apps
            docs[lass-docs]
        end
    end

    axioms -.->|devDep| core
    core -->|dep| vite
```

## Transpilation Pipeline

```mermaid
flowchart TB
    subgraph input[Input]
        lass[".lass file"]
    end

    subgraph step1[Step 1: Zone Detection]
        scan[Find --- separator]
        preamble[Preamble Zone]
        css[CSS Zone]
        scan --> preamble
        scan --> css
    end

    subgraph step2[Step 2: Expression Processing]
        find["Find {{ expr }}"]
        replace["Replace with ${...}"]
        find --> replace
    end

    subgraph step3[Step 3: Build Output]
        assemble[Assemble JS Module]
        output["export default `...`"]
        assemble --> output
    end

    lass --> scan
    preamble --> find
    css --> find
    replace --> assemble
```

## Vite Plugin Hooks

```mermaid
sequenceDiagram
    participant App
    participant Resolve as 1-resolve
    participant Transform as 2-transform
    participant Load as 3-load
    participant HMR as 4-hmr
    participant Vite

    App->>Resolve: import './style.lass'
    Resolve->>Transform: resolved path
    Transform->>Load: JS + virtual .lass.css
    Load->>Vite: CSS string
    Vite->>App: styles applied
    
    Note over HMR: Watches for changes
    HMR-->>Vite: invalidate modules
```

## Module Graph Integration (Killer Feature)

```mermaid
flowchart LR
    subgraph shared[shared-state.js]
        state["{ value: 'initial' }"]
    end

    subgraph lass[theme.lass]
        mutate["state.value = 'from-lass'"]
    end

    subgraph main[main.js]
        read["console.log(state.value)"]
    end

    state --> mutate
    state --> read
    mutate -.->|mutation persists| read

    result["Output: 'from-lass'"]
    read --> result
```

This works because the transform hook puts preamble code in Vite's **real module graph**, not an isolated context.

## Test Infrastructure

```mermaid
flowchart TB
    subgraph unit[Unit Tests - pnpm test]
        axioms_t[axioms: 27]
        core_t[core: 154]
        plugin_t[plugin: 54]
    end

    subgraph integration[Integration Tests - pnpm test:integration]
        browser[Chromium + Playwright]
        module_graph[Module graph tests]
        css_tests[CSS injection tests]
        hmr_tests[HMR tests]
    end

    subgraph fixtures[Axiom-Driven]
        md[".common.md files"]
        loader[loader.ts]
        md --> loader
    end

    loader --> unit
    browser --> module_graph
    browser --> css_tests
    browser --> hmr_tests
```

## Dependency Graph

```mermaid
flowchart BT
    axioms["@lass-lang/axioms<br/>(fixtures)"]
    core["@lass-lang/core<br/>(transpiler)"]
    plugin["@lass-lang/vite-plugin"]
    vite["vite ^5 || ^6"]
    user[User Project]

    axioms -.->|devDep| core
    core --> plugin
    vite -.->|peerDep| plugin
    plugin --> user
```

## File Processing Flow

```mermaid
flowchart LR
    A[button.lass] -->|transpile| B[button.js]
    B -->|execute| C[CSS string]
    C -->|vite| D[stylesheet]
    D --> E[browser]

    subgraph values[Runtime Values]
        tokens[tokens.js]
        utils[utils.js]
    end

    tokens --> B
    utils --> B
```

---

## Version History

| Date | Changes |
|------|---------|
| 2026-02-06 | Convert to clean Mermaid diagrams |
| 2026-02-06 | Initial version (Story P.1) |
