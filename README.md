# mk-ecosystem

A monorepo of npm-publishable packages I'm building from scratch as part of a **20-day advanced JavaScript architecture training**. Inspired by patterns from Ant Design v5, Koa, and modern React library design.

The goal: deeply understand how production-grade libraries work by building one myself — adapters, middleware, design tokens, form engines, and all.

## Packages

| Package | What it will be | Status |
|---|---|---|
| `core-request` | Adapter-based HTTP client with middleware and plugin system | Scaffolded |
| `core-form` | Schema-driven form engine with validation pipeline and pluggable renderers | Scaffolded |
| `ui-kit` | Minimal business-oriented component library (Button, Input) | Scaffolded |
| `theme-system` | Token-driven theme system with ConfigProvider and runtime switching | Scaffolded |

## Training Progress

### Phase 1: Foundation (Days 1-4)
- [x] **Day 1** — Monorepo scaffolding & build pipeline (pnpm workspaces, tsup, dual ESM/CJS)
- [ ] **Day 2** — Public API design & type contracts for `core-request`
- [ ] **Day 3** — Adapter pattern & `createClient` implementation
- [ ] **Day 4** — Middleware chain & plugin system

### Phase 2: Theme System (Days 5-8)
- [ ] **Day 5** — Design token architecture (seed/map/alias tokens)
- [ ] **Day 6** — ConfigProvider & React context integration
- [ ] **Day 7** — Runtime theme switching & dark mode
- [ ] **Day 8** — Theme system polish, benchmark & API freeze

### Phase 3: UI Kit (Days 9-12)
- [ ] **Day 9** — Button component with token integration
- [ ] **Day 10** — Input component & compound component pattern
- [ ] **Day 11** — Component-level style isolation & CSS strategy
- [ ] **Day 12** — Tree-shaking, bundle analysis & UI kit API freeze

### Phase 4: Form Engine (Days 13-16)
- [ ] **Day 13** — FormStore & field-level subscription
- [ ] **Day 14** — Schema format & validation pipeline
- [ ] **Day 15** — Pluggable renderer registry & form-UI integration
- [ ] **Day 16** — Form-request integration, async submit & API freeze

### Phase 5: Integration & Polish (Days 17-20)
- [ ] **Day 17** — Cross-package integration test & demo app
- [ ] **Day 18** — Lint, test strategy & CI setup
- [ ] **Day 19** — Documentation site & API reference
- [ ] **Day 20** — Final benchmark, retrospective & architecture review

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Verify ESM imports work
node test-imports.mjs

# Verify CJS imports work
node test-imports.cjs
```

## Architecture

```
mk-ecosystem/
├── packages/
│   ├── core-request/    # HTTP client, middleware, plugins
│   ├── core-form/       # Form store, schema, validation, renderers
│   ├── ui-kit/          # Button, Input, style engine
│   └── theme-system/    # Tokens, algorithms, ConfigProvider
├── tsconfig.base.json   # Shared TypeScript config
└── pnpm-workspace.yaml  # Workspace definition
```

Each package outputs dual **ESM** (`.mjs`) + **CJS** (`.cjs`) with TypeScript declarations, configured via tsup.

## Key Concepts I'm Exploring

- **Adapter pattern** for swappable HTTP transports
- **Onion-model middleware** (like Koa) for request pipelines
- **Three-layer design tokens** (seed → map → alias) for theming
- **Field-level subscriptions** with `useSyncExternalStore` for form performance
- **Pluggable renderer registry** to decouple form schema from UI
- **Tree-shaking** with `sideEffects: false` and per-component entry points
