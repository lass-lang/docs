---
feature: bundler-integration
fr: FR-BUNDLER
phase: MVP
status: implemented
description: >
  The Vite plugin processes .lass files end-to-end: transpile to JS,
  execute to CSS, feed to Vite's existing CSS pipeline.
tags: [bundler, vite, integration, pipeline]
see-also: [two-zone-model, css-passthrough]
depends: [two-zone-model, css-passthrough]
---

# Bundler Integration

The Vite plugin is how `.lass` files get into your project. It hooks
into Vite's `transform()` pipeline and does three things:

1. **Transpile** — calls `@lass-lang/core` to convert the `.lass` file
   into a JS module
2. **Execute** — runs that JS module to produce a CSS string
3. **Hand off** — feeds the CSS string to Vite's existing CSS pipeline
   (PostCSS, Lightning CSS, style injection, CSS extraction — whatever
   you've configured)

This is the same pattern used by Sass loaders, Vue SFCs, and Svelte
compilers. From Vite's perspective, the plugin takes in a `.lass` file
and returns CSS — everything downstream works as usual.

> Note: The axiom format can't fully test bundler integration in
> isolation — these test cases describe the expected end-to-end
> behavior. Actual integration tests run in a real Vite project.

<test-case type="valid">

## valid: basic .lass import in Vite

A `.lass` file imported in a JS/TS module produces CSS that Vite
injects into the page.

```lass
const $brand = '#3b82f6'
---
.button {
  background: $brand;
  border: none;
  padding: 8px 16px;
}
```

```css
.button {
  background: #3b82f6;
  border: none;
  padding: 8px 16px;
}
```

</test-case>


<test-case type="valid">

## valid: pure CSS .lass file

A `.lass` file with no preamble produces identical CSS — the plugin
still runs the transpile-execute cycle, but the output is passthrough.

```lass
body {
  margin: 0;
  font-family: system-ui;
}
```

```css
body {
  margin: 0;
  font-family: system-ui;
}
```

</test-case>


<test-case type="valid">

## valid: .lass file with PostCSS compatibility

The CSS output from `.lass` is standard CSS — PostCSS plugins
(autoprefixer, cssnano, etc.) can process it in the next pipeline stage.
The `.lass` plugin doesn't need to know about PostCSS; it just produces
CSS and hands it to Vite.

```lass
---
.grid {
  display: grid;
  gap: 16px;
}
```

```css
.grid {
  display: grid;
  gap: 16px;
}
```

</test-case>


<test-case type="valid">

## valid: HMR — file change triggers rebuild

When a `.lass` file changes, the Vite plugin re-transpiles and
re-executes it. Vite's HMR picks up the new CSS and hot-reloads the
styles in the browser.

> This behavior is inherent to Vite's `transform()` hook — the plugin
> doesn't need custom HMR logic. When the source file changes, Vite
> invalidates the module and calls `transform()` again.

```lass
const $color = 'red'
---
p {
  color: $color;
}
```

```css
p {
  color: red;
}
```

</test-case>


<test-case type="valid" skip>

## valid: complex .lass file through full pipeline

A `.lass` file with preamble logic, `$name` substitution, `{{ }}`
expressions, and `@{ }` fragments produces clean CSS output.

> Skipped: Requires `@{ }` fragment syntax (Epic 5)

```lass
const breakpoints = { sm: '640px', lg: '1024px' }
const $maxWidth = '1200px'
---
.container {
  max-width: $maxWidth;
  margin: 0 auto;
}

{{ Object.entries(breakpoints).map(([name, width]) => @{
  @media (min-width: {{ width }}) {
    .container-{{ name }} {
      max-width: {{ width }};
    }
  }
}) }}
```

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .container-sm {
    max-width: 640px;
  }
}
@media (min-width: 1024px) {
  .container-lg {
    max-width: 1024px;
  }
}
```

</test-case>


<test-case type="invalid">

## invalid: transpilation error surfaces through Vite

When the transpiler encounters a scan error, the Vite plugin surfaces
it as a Vite build error with the original `.lass` source location.

```lass
---
p {
  color: {{ 'red';
}
```

```error
Unclosed {{ expression
```

</test-case>

