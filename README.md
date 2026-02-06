# lass-docs

Documentation for the Lass language and tooling.

## Contents

### Diagrams

- **[Architecture Diagram](./diagrams/architecture-diagram.md)** - Comprehensive visual overview of the Lass ecosystem, including:
  - Package architecture
  - Transpilation pipeline
  - Vite plugin flow
  - Module graph integration
  - Test infrastructure
  - Dependency graph

## For AI Agents

When making architectural changes to the Lass project, remember to update:

```
apps/lass-docs/diagrams/architecture-diagram.md
```

Update this diagram when:
- New package added to workspace
- Major architectural change to transpiler or plugin
- New bundler integration added
- Test infrastructure changes
- New Vite hook added
