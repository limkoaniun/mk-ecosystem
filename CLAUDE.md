# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 🔥 20-Day Advanced JS Architecture Training Plan

## Trainee Profile

| Parameter | Value |
|---|---|
| React | 19 |
| Node | 20 |
| Browser Support | Legacy (ES5 transpilation target) |
| Module Format | Dual ESM + CJS |
| SSR | Yes — Next.js (App Router) |
| Package Structure | Monorepo (pnpm workspaces) |
| Daily Time | 1 hour |
| Priority Order | DX > Extensibility > Performance > Compatibility |
| Final Output | npm-publishable packages, demo app, docs site, internal toolkit |
| Ant Design Inspirations | ConfigProvider, Token/Theme Algorithm, Modular Exports |

## Packages to Build

1. **`core-request`** — Adapter-based HTTP client with middleware and plugin system
2. **`core-form`** — Schema-driven form engine with validation pipeline and pluggable renderers
3. **`ui-kit`** — Minimal business-oriented component subset (Button, Input)
4. **`theme-system`** — Token-driven theme system with ConfigProvider and runtime switching

---

# Phase 1: Foundation (Days 1–4)

---

## Day 1 — Monorepo Scaffolding & Build Pipeline

### Learning Goal
Understand how production monorepos separate packages while sharing tooling. Learn how `package.json` `exports` field controls what consumers see vs what's internal.

### High-Yield Reading Focus
Study the ant-design repository root: `package.json`, `.fatherrc.ts` build config, `tsconfig.json`, and the `components/` directory layout. Focus on how each component has an `index.tsx` barrel file and how the root `components/index.ts` re-exports everything. Note the separation between source code and build output.

### Architecture Question Checklist
1. What is the difference between `main`, `module`, and `exports` in `package.json`?
2. How does pnpm workspaces resolve cross-package imports at development time vs at publish time?
3. Why does ant-design use barrel files (`index.ts`) per component directory?
4. What happens if a CJS consumer tries to `require()` an ESM-only package?
5. How does the `exports` field prevent consumers from importing internal files?
6. What is the role of `tsconfig.json` `paths` in a monorepo vs runtime resolution?

### Coding Task
1. Initialize a pnpm workspace monorepo with this structure:
```
mini-ecosystem/
├── package.json              (workspace root)
├── pnpm-workspace.yaml
├── tsconfig.base.json        (shared TS config)
├── packages/
│   ├── core-request/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts      (export a placeholder createClient function)
│   ├── core-form/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   ├── ui-kit/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   └── theme-system/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
```
2. Configure `tsup` as the build tool for all packages.
3. Each package must output both ESM (`dist/index.mjs`) and CJS (`dist/index.cjs`) with type declarations (`dist/index.d.ts`).
4. Configure `package.json` `exports` field for each package with explicit `import`, `require`, and `types` conditions.
5. Add a root `build` script that builds all packages.
6. Write a simple Node script (`test-imports.mjs`) that imports from each built package using ESM syntax, and another (`test-imports.cjs`) using CJS `require()` — both must succeed.

### Performance Checkpoints
- Measure total build time for all 4 packages. Record it. This is your baseline.
- Each package's initial dist output should be < 1KB (they're placeholders).

### Compatibility Checkpoints
- Verify the CJS test script works with `node --experimental-vm-modules` disabled.
- Verify the ESM test script works without any flags.
- Confirm TypeScript declarations resolve correctly by running `tsc --noEmit` on a test file that imports from all packages.

### Extensibility Checkpoints
- Can you add a 5th package to the monorepo in under 2 minutes? If not, simplify your setup.
- Are build configs DRY? Each package's `tsup.config.ts` should extend a shared base, not duplicate everything.

### Concrete Deliverable
A monorepo where `pnpm build` succeeds, both test-import scripts pass, and all 4 packages have working dual ESM/CJS output with TypeScript declarations.

---

## Day 2 — Public API Design & Type Contracts for core-request

### Learning Goal
Learn to design a public API surface before writing implementation. Understand the difference between what consumers see (public types) and what powers the internals (private types). Study how ant-design exposes component props as explicit TypeScript interfaces.

### High-Yield Reading Focus
Study ant-design's type exports: look at `components/button/index.tsx` and trace how `ButtonProps` is defined, what's exported, and what remains internal. Study the `components/config-provider/index.tsx` to see how context types are separated from implementation. Notice that internal utility types live in separate files and are NOT exported from the barrel.

### Architecture Question Checklist
1. Why should you define your public API types BEFORE writing implementation code?
2. What is the difference between `interface` and `type` for public API contracts? When would you choose one over the other?
3. How does ant-design separate public props (`ButtonProps`) from internal state?
4. What happens to your consumers if you add a required property to a public interface in a minor version bump?
5. Why is `Record<string, any>` a bad public API type?
6. How do you design a middleware type that is both type-safe and allows unknown extensions?

### Coding Task
In `packages/core-request/src/`, create the following type-only files (NO implementation yet):

1. **`types/public.ts`** — The public API surface:
```typescript
// Design these interfaces:
// - RequestConfig: what users pass to make a request
// - Response<T>: what users get back
// - Middleware: function signature for middleware
// - Adapter: interface for HTTP adapters (fetch, XMLHttpRequest, etc.)
// - Plugin: interface for plugins that can hook into lifecycle
// - ClientOptions: what users pass to createClient()
// - RequestClient: the interface of the returned client object
```

2. **`types/internal.ts`** — Internal types NOT exported to consumers:
```typescript
// Design these:
// - InternalContext: request context passed through middleware chain
// - AdapterResponse: raw adapter response before normalization
// - MiddlewareStack: internal middleware chain representation
```

3. **`index.ts`** — Re-export ONLY public types. Internal types must not be importable by consumers.

4. Write a `types.test.ts` using `tsd` (or manual type assertions) that verifies:
   - `createClient` accepts `ClientOptions` and returns `RequestClient`
   - `RequestClient.request()` returns `Promise<Response<T>>`
   - Middleware signature matches `(config, next) => Promise<Response>`
   - Adapter interface requires `send(config): Promise<AdapterResponse>`

### Performance Checkpoints
- Verify that importing only types results in zero runtime code (check the built output has no implementation).
- Confirm the dist output for this package is still minimal.

### Compatibility Checkpoints
- Types must work with `strictNullChecks: true`.
- Types must be compatible with both React 19 and Node 20 (no DOM-specific types in core-request).
- Verify the `exports` field properly maps to the `.d.ts` file.

### Extensibility Checkpoints
- Can a consumer define a custom adapter by implementing the `Adapter` interface alone, without importing anything internal?
- Can a consumer write middleware without needing to understand the internal context shape?
- Is the Plugin interface open enough for unknown future hooks?

### Concrete Deliverable
A `core-request` package with a complete type-only public API surface, clear public/internal separation, and type tests that verify the contract. No implementation code yet.

---

## Day 3 — Adapter Pattern & createClient Implementation

### Learning Goal
Implement the adapter pattern for the HTTP client. Understand how dependency inversion lets you swap transport layers (fetch, XMLHttpRequest, node:http) without changing consumer code. Study how ant-design uses a similar pattern with its locale/direction adapters in ConfigProvider.

### High-Yield Reading Focus
Study ant-design's `components/config-provider/context.ts` — observe how they create contexts with default values, allowing override at any level. This same principle applies to your adapter: there's a default, but consumers can override it. Also study `components/config-provider/hooks/useConfig.ts` to see how defaults merge with overrides.

### Architecture Question Checklist
1. Why is an adapter pattern better than directly calling `fetch` inside your client?
2. What should happen if a consumer doesn't provide an adapter? How do you pick a sensible default?
3. How does the adapter interface abstract away the difference between browser `fetch` and Node `http`?
4. What is dependency inversion and how does it apply here?
5. Should the adapter return raw data or normalized data? Who is responsible for normalization?
6. How do you handle adapter errors vs application errors (e.g., 404 is not an adapter error)?

### Coding Task
1. **Implement `createFetchAdapter()`** in `src/adapters/fetch.ts`:
   - Takes a `RequestConfig` and returns `Promise<AdapterResponse>`
   - Handles GET, POST, PUT, DELETE, PATCH
   - Properly serializes query params
   - Handles JSON body serialization
   - Handles timeout via `AbortController`
   - Normalizes the response into your `AdapterResponse` shape

2. **Implement `createClient(options)`** in `src/client.ts`:
   - Accepts `ClientOptions` with an optional `adapter` field
   - Defaults to `fetchAdapter` if none provided
   - Returns a `RequestClient` with methods: `request(config)`, `get(url, config?)`, `post(url, data?, config?)`, `put(url, data?, config?)`, `delete(url, config?)`
   - Each convenience method delegates to `request()` with the correct method
   - `request()` calls the adapter and normalizes the response into `Response<T>`

3. **Write tests** in `src/__tests__/client.test.ts`:
   - Test with a mock adapter (NOT real HTTP)
   - Verify `createClient()` returns an object matching `RequestClient` interface
   - Verify each convenience method sets the correct HTTP method
   - Verify the adapter is called with the normalized config
   - Verify response normalization
   - Test timeout behavior
   - Test error handling (adapter throws)

### Performance Checkpoints
- `createClient()` should allocate zero intermediate objects beyond the client itself.
- The convenience methods (`get`, `post`, etc.) must NOT create closures on every call — bind once during construction.
- Measure: call `createClient()` 10,000 times and record memory usage.

### Compatibility Checkpoints
- The fetch adapter must detect whether it's in a browser or Node environment and use the appropriate `fetch` implementation.
- Verify the client works in a Node 20 script without any polyfills.
- Verify the CJS build can be required and used.

### Extensibility Checkpoints
- Can a consumer pass a custom adapter that wraps XMLHttpRequest without modifying any client code?
- Is the adapter interface simple enough that it could be implemented in under 20 lines?
- Can the client be instantiated with different adapters for different environments (e.g., a test adapter, a mock adapter)?

### Concrete Deliverable
A working `createClient()` with fetch adapter, convenience methods, full test coverage on the mock adapter path, and verified dual ESM/CJS output.

---

## Day 4 — Middleware Chain & Plugin System

### Learning Goal
Implement a composable middleware chain using the "onion" pattern (like Koa). Then build a plugin system on top of it. Understand how ant-design composes behaviors through HOCs and hook layers — your middleware serves the same purpose for requests.

### High-Yield Reading Focus
Study ant-design's `components/config-provider/index.tsx` — notice how it wraps children with multiple context providers in a specific order (theme, locale, size, direction). This is conceptually identical to a middleware chain: each layer wraps the next, can modify input going in and output coming out. Also study how ant-design's `_util/wave` wraps click handlers with additional behavior.

### Architecture Question Checklist
1. What is the "onion model" of middleware and why is it better than a simple before/after hook?
2. How does the `next()` call in middleware control the flow? What happens if a middleware doesn't call `next()`?
3. What is the difference between a middleware and a plugin in your system?
4. How do you ensure middleware execution order is predictable?
5. What should happen if a middleware throws? Should subsequent middleware still run?
6. How do you prevent a rogue plugin from breaking the entire request pipeline?
7. Should plugins be able to add middleware, or should they be a separate concern?

### Coding Task
1. **Implement the middleware engine** in `src/middleware.ts`:
   - `composeMiddleware(middlewares: Middleware[])` returns a single function that chains them
   - Each middleware has signature: `(context: InternalContext, next: () => Promise<Response>) => Promise<Response>`
   - Middleware executes in order: first registered = outermost layer
   - If a middleware doesn't call `next()`, the chain short-circuits (useful for caching)
   - Errors propagate outward through the chain

2. **Integrate middleware into `createClient()`**:
   - `ClientOptions` accepts a `middlewares: Middleware[]` array
   - The adapter call becomes the innermost "middleware" (the core)
   - `client.request()` runs the full chain: middleware[0] → middleware[1] → ... → adapter
   - `client.use(middleware)` allows adding middleware after creation

3. **Implement the plugin system** in `src/plugins.ts`:
   - A Plugin is an object with `{ name: string, install(client: ClientInstance): void }`
   - `install` can call `client.use()` to add middleware, or attach custom methods/properties
   - Implement two built-in plugins:
     a. **RetryPlugin**: retries failed requests up to N times with configurable delay
     b. **LoggerPlugin**: logs request/response timing and status

4. **Write tests**:
   - Test middleware execution order (use an array to record call sequence)
   - Test short-circuit behavior (caching middleware that doesn't call `next()`)
   - Test error propagation through middleware
   - Test RetryPlugin with a mock adapter that fails N-1 times then succeeds
   - Test LoggerPlugin captures timing info

### Performance Checkpoints
- `composeMiddleware()` should be called once during client creation, not on every request.
- Middleware chain should not allocate arrays or objects per-request — compose into a single function chain.
- Benchmark: 10,000 requests through a 5-middleware chain — measure overhead vs direct adapter call.

### Compatibility Checkpoints
- Middleware must work identically in Node and browser.
- The plugin `install` must be synchronous (no async setup during construction).
- Verify RetryPlugin works with both real timers and fake timers in tests.

### Extensibility Checkpoints
- Can a consumer write a custom "cache" plugin that intercepts requests and returns cached responses without calling `next()`?
- Can a consumer write a plugin that modifies response headers before they reach the caller?
- Is the plugin interface minimal enough that a new plugin can be written in under 30 lines?

### Concrete Deliverable
Working middleware chain integrated into `createClient()`, RetryPlugin and LoggerPlugin implemented and tested, benchmark comparing direct adapter call vs 5-middleware chain.

---

# Phase 2: Theme System (Days 5–8)

---

## Day 5 — Design Token Architecture

### Learning Goal
Design a token-based theming system. Understand the three-layer token architecture: global tokens (brand colors, spacing scale), alias tokens (semantic mappings like `colorPrimary`, `colorBgContainer`), and component tokens (button-specific overrides). Study how ant-design v5's token system separates "what the designer decides" from "what the algorithm computes."

### High-Yield Reading Focus
Study ant-design's `components/theme/interface/` directory. Focus on `seedToken.ts` (the base/seed values designers set), `maps/` directory (how seed tokens get transformed into derived tokens via algorithms), and `themes/default/index.ts` (how the default theme assembles everything). Pay attention to how few seed tokens produce hundreds of derived tokens through algorithmic transformation.

### Architecture Question Checklist
1. Why use a three-layer token system (seed → map → alias) instead of a flat token object?
2. What is a "seed token" and why should it be the minimal set a theme author needs to define?
3. How does an algorithm transform seed tokens into a full palette? Why is this better than manually defining every shade?
4. What is the difference between a "global" token and a "component" token?
5. How do you make the token object type-safe so consumers get autocomplete?
6. Why should tokens be plain objects (serializable) rather than class instances?

### Coding Task
In `packages/theme-system/src/`:

1. **Define the token type hierarchy** in `tokens/types.ts`:
   - `SeedToken`: the minimal set (6–10 values: `colorPrimary`, `colorSuccess`, `colorWarning`, `colorError`, `colorInfo`, `fontSize`, `borderRadius`, `sizeUnit`, `lineHeight`)
   - `MapToken`: derived from seed (extends SeedToken with computed values: `colorPrimaryBg`, `colorPrimaryHover`, `colorPrimaryActive`, `colorBgContainer`, `colorBgElevated`, `colorText`, `colorTextSecondary`, `colorBorder`, etc.)
   - `AliasToken`: semantic aliases (extends MapToken with: `colorLink`, `colorLinkHover`, `colorAction`, `controlHeight`, `controlHeightSM`, `controlHeightLG`, etc.)
   - `ComponentToken`: partial override object per component name

2. **Implement the default seed** in `tokens/seed.ts`:
   - Export `defaultSeed: SeedToken` with sensible defaults

3. **Implement the token derivation algorithm** in `algorithm/default.ts`:
   - `function deriveMapTokens(seed: SeedToken): MapToken`
   - Must generate hover/active color variants by lightening/darkening the primary color
   - Must generate background colors based on the primary color with low opacity
   - Use HSL manipulation (write a small `src/utils/color.ts` utility)
   - Must generate text color scales

4. **Implement alias mapping** in `algorithm/alias.ts`:
   - `function deriveAliasTokens(map: MapToken): AliasToken`
   - Maps semantic names to computed map tokens
   - Derives control heights from `sizeUnit`

5. **Implement the full pipeline** in `tokens/create.ts`:
   - `function createTheme(seed?: Partial<SeedToken>): AliasToken`
   - Merges user seed with defaults → runs derivation → returns complete token set

6. **Write tests**:
   - Verify `createTheme()` with no args returns a complete token set
   - Verify `createTheme({ colorPrimary: '#ff0000' })` changes derived colors
   - Verify all token fields are present (no undefined)
   - Verify color derivation produces valid hex colors
   - Verify changing one seed value cascades correctly

### Performance Checkpoints
- `createTheme()` should complete in under 1ms for a single call.
- Benchmark: call `createTheme()` 10,000 times, measure total time.
- Token object should be plain (no getters, no proxies) — verify with `JSON.stringify` round-trip.

### Compatibility Checkpoints
- Token creation must work in Node (SSR) and browser identically — no DOM APIs.
- Color utility must handle both hex (`#1890ff`) and rgb (`rgb(24,144,255)`) input.
- All token values must be CSS-compatible strings or numbers.

### Extensibility Checkpoints
- Can a consumer replace the derivation algorithm entirely (e.g., a "dark mode" algorithm)?
- Can a consumer add custom seed token fields without breaking the pipeline?
- Can a consumer override specific map tokens without re-deriving everything?

### Concrete Deliverable
A complete token pipeline: `SeedToken → MapToken → AliasToken`, with `createTheme()` producing a fully typed, serializable token object. All tests passing.

---

## Day 6 — ConfigProvider & React Context Integration

### Learning Goal
Build a React context-based ConfigProvider that distributes tokens to all descendant components. Understand context cascading (nested providers override ancestors), memoization to prevent unnecessary re-renders, and how ant-design's ConfigProvider handles multiple concerns (theme, locale, size) in a single provider.

### High-Yield Reading Focus
Study ant-design's `components/config-provider/index.tsx` in full. Notice: (1) how it creates separate contexts for different concerns, (2) how `useMemo` prevents re-renders when config hasn't changed, (3) how nested ConfigProviders merge with parent config rather than replacing it, (4) how `useContext` consumers only re-render when their specific slice changes. Also study `components/config-provider/context.ts` for the context shape.

### Architecture Question Checklist
1. Why does ant-design use multiple separate contexts instead of one giant context object?
2. What happens to re-renders if you put the entire theme object in a single context?
3. How does context cascading work — what does a nested ConfigProvider inherit vs override?
4. Why is `useMemo` critical in the ConfigProvider's value prop?
5. How would you split theme context from locale context to minimize re-render scope?
6. How does SSR affect context — what happens when there's no provider?
7. What is the "default value" strategy for contexts in a library (vs in an app)?

### Coding Task
In `packages/theme-system/src/`:

1. **Create the theme context** in `context/ThemeContext.ts`:
   - `ThemeContext` holds the full `AliasToken` object
   - Default value is `createTheme()` (the default theme)
   - Export a `useTheme()` hook that reads from context

2. **Create `ConfigProvider` component** in `provider/ConfigProvider.tsx`:
   - Props: `{ theme?: { token?: Partial<SeedToken>, algorithm?: (seed: SeedToken) => MapToken }, children: ReactNode }`
   - Merges provided seed with parent's seed (context cascading)
   - Runs the token pipeline only when seed or algorithm changes (memoize!)
   - Provides computed tokens to descendants via `ThemeContext`
   - Nested `<ConfigProvider>` inherits from parent and overrides

3. **Create `useToken()` hook** in `hooks/useToken.ts`:
   - Returns the current `AliasToken` from context
   - Optionally accepts a component name and merges component-level overrides

4. **Create `useComponentToken(componentName)` hook** in `hooks/useComponentToken.ts`:
   - Returns merged tokens: global + component-specific overrides
   - ConfigProvider accepts `components?: Record<string, Partial<ComponentToken>>`

5. **Write tests** (use `@testing-library/react`):
   - ConfigProvider renders children with default theme
   - `useToken()` returns default tokens when no provider exists
   - Nested ConfigProvider overrides parent's colorPrimary
   - Nested ConfigProvider inherits parent's fontSize when not overridden
   - Component token overrides merge correctly
   - Theme recalculates when seed changes
   - Theme does NOT recalculate when seed hasn't changed (mock `createTheme` and verify call count)

### Performance Checkpoints
- Verify ConfigProvider's `value` prop is referentially stable when inputs don't change (test with `React.memo` wrapper that counts renders).
- Verify `createTheme()` is NOT called on every render — only when seed/algorithm changes.
- Render a tree of 100 `useToken()` consumers — profile render count when theme changes vs when unrelated state changes.

### Compatibility Checkpoints
- ConfigProvider must work in Next.js App Router (mark client-only with `'use client'` if needed).
- `useToken()` must return sensible defaults during SSR (no undefined).
- Context must be importable from both ESM and CJS builds.

### Extensibility Checkpoints
- Can a consumer provide a completely custom algorithm that replaces the default derivation?
- Can a consumer add theme overrides for a specific subtree without affecting siblings?
- Can the ConfigProvider be extended later to handle locale/direction without breaking changes?

### Concrete Deliverable
Working `ConfigProvider` with context cascading, `useToken()` and `useComponentToken()` hooks, full test coverage including render count verification.

---

## Day 7 — Runtime Theme Switching & Dark Mode

### Learning Goal
Implement runtime theme switching (light/dark/custom) without full tree re-renders. Understand CSS custom property injection as a strategy to decouple token changes from React re-renders. Study how ant-design v5 handles theme switching and the trade-offs between CSS variables and JS-driven theming.

### High-Yield Reading Focus
Study ant-design's `components/theme/util/genComponentStyleHook.ts` and how `useToken` integrates with their CSS-in-JS system. Focus on how they use CSS variables (the `cssVar` option) to allow theme switching without re-rendering components. Also look at `components/theme/themes/dark/index.ts` to see how a dark theme is just a different algorithm applied to the same seed tokens.

### Architecture Question Checklist
1. Why does changing a React context value cause ALL consumers to re-render?
2. How can CSS custom properties decouple visual updates from React re-renders?
3. What is the trade-off between CSS variable injection (fast switch, limited to CSS values) vs JS token object (full re-render, but tokens usable in JS logic)?
4. How does a dark mode algorithm differ from a light mode algorithm — what seed values change?
5. Should theme preference be stored in context, localStorage, or both?
6. How do you handle flash-of-wrong-theme (FOWT) during SSR?

### Coding Task
1. **Implement CSS variable injection** in `runtime/cssVars.ts`:
   - `function injectThemeVars(tokens: AliasToken, scope?: string): void`
   - Converts token object to CSS custom properties (e.g., `colorPrimary` → `--color-primary`)
   - Injects them as a `<style>` tag (or updates existing one)
   - `scope` defaults to `:root` but can target a specific selector for sub-tree theming

2. **Implement dark mode algorithm** in `algorithm/dark.ts`:
   - `function deriveDarkMapTokens(seed: SeedToken): MapToken`
   - Inverts background/foreground relationships
   - Adjusts color brightness for accessibility contrast ratios
   - Keeps brand colors recognizable but adjusted for dark backgrounds

3. **Implement `ThemeSwitcher` utility** in `runtime/switcher.ts`:
   - `createThemeSwitcher(options: { defaultMode: 'light' | 'dark', storageKey?: string })`
   - Returns `{ mode, setMode, toggle, tokens }` as reactive state
   - `setMode()` triggers CSS variable update WITHOUT React context change (for pure CSS consumers)
   - Also updates context for consumers that need token values in JS

4. **Update ConfigProvider** to support runtime switching:
   - Accept `mode?: 'light' | 'dark'` prop
   - When mode changes, swap algorithm and regenerate tokens
   - Inject CSS variables so components using CSS vars don't re-render

5. **Create a `useThemeMode()` hook**:
   - Returns current mode and toggle function
   - Syncs with system preference (`prefers-color-scheme`) if no explicit mode set

6. **Write tests**:
   - Dark algorithm produces lighter text on darker backgrounds
   - CSS variable injection creates correct custom properties
   - Theme switch only re-renders context consumers, not the entire tree
   - `useThemeMode()` respects system preference
   - `useThemeMode()` overrides system preference when explicitly set
   - CSS variables update when mode toggles

### Performance Checkpoints
- Theme switch via CSS variables should cause ZERO React re-renders in components that use CSS vars only.
- Measure: toggle theme 100 times — record time per toggle.
- Verify no style tag leaks (old styles cleaned up).

### Compatibility Checkpoints
- CSS variable injection must handle SSR (no `document` on server — skip or use alternative).
- Dark mode must respect `prefers-color-scheme` media query.
- CSS variable names must be valid (no camelCase — use kebab-case).

### Extensibility Checkpoints
- Can a consumer provide a custom mode beyond light/dark (e.g., "high-contrast")?
- Can a consumer provide their own algorithm for any mode?
- Can CSS variables be scoped to a subtree (not just `:root`)?

### Concrete Deliverable
Working runtime theme switching between light and dark modes, CSS variable injection for zero-rerender visual updates, `useThemeMode()` hook with system preference sync, and performance test showing rerender savings.

---

## Day 8 — Theme System Polish, Benchmark & API Freeze

### Learning Goal
Finalize the theme system's public API surface. Write a comprehensive benchmark. Ensure the API is stable enough to depend on from other packages. This is the "API freeze" — after today, changes to theme-system's public API require a breaking change justification.

### High-Yield Reading Focus
Study ant-design's `components/theme/index.ts` — notice what they export publicly vs what stays internal. Count the public exports. Notice the re-export pattern: specific named exports, not `export *`. Also study their `components/theme/interface/` to see how the public type surface is curated.

### Architecture Question Checklist
1. Which functions/types from theme-system should be public? Which should be internal?
2. What would break if you renamed an internal function after consumers depend on it?
3. How do you version a design token type — what's a breaking change vs additive?
4. Should the token derivation algorithm be part of the public API or an implementation detail?
5. What's the minimum set of exports a consumer needs to use your theme system?
6. How would you deprecate a token without breaking consumers?

### Coding Task
1. **Curate the public API** — Update `packages/theme-system/src/index.ts`:
   - Export ONLY: `ConfigProvider`, `useToken`, `useComponentToken`, `useThemeMode`, `createTheme`, `defaultSeed`
   - Export types: `SeedToken`, `MapToken`, `AliasToken`, `ComponentToken`, `ThemeConfig`
   - Everything else is internal — verify it cannot be imported by consumers

2. **Write integration tests**:
   - Full flow: `ConfigProvider` with custom seed → child reads `useToken()` → verify token values
   - Nested providers: outer sets brand color, inner overrides font size → verify merge
   - Dark mode toggle: switch mode → verify token values change correctly
   - SSR simulation: render to string → verify no crashes, tokens have values

3. **Write a benchmark** in `packages/theme-system/benchmark/`:
   - `createTheme()` × 10,000 iterations — measure mean/p95/p99
   - `deriveMapTokens()` × 10,000 iterations — measure color computation overhead
   - CSS variable injection × 1,000 iterations — measure DOM manipulation cost
   - Render 500 `useToken()` consumers → toggle theme → measure React render time

4. **Write API documentation** in `packages/theme-system/README.md`:
   - All public exports with descriptions
   - Usage examples for each hook
   - ConfigProvider props documentation
   - Token customization guide
   - Dark mode setup guide

### Performance Checkpoints
- `createTheme()` must complete in < 0.5ms per call.
- CSS variable injection must complete in < 2ms per call.
- Theme toggle must not cause more than 1 React render per context consumer.

### Compatibility Checkpoints
- Run the full test suite in both Node (vitest) and a simulated browser environment (jsdom).
- Verify SSR rendering produces valid output.
- Verify the package works when consumed via CJS require.

### Extensibility Checkpoints
- Document how to create a custom theme algorithm.
- Document how to add custom seed tokens (extending the type).
- Verify the plugin points are accessible without importing internals.

### Concrete Deliverable
Frozen public API for theme-system, full benchmark results documented, README with API docs, all tests green.

---

# Phase 3: UI Kit (Days 9–12)

---

## Day 9 — Button Component with Token Integration

### Learning Goal
Build a production-quality Button component that consumes tokens from the theme system. Understand how ant-design components are structured: props interface, internal hooks, style generation, and how they connect to the theme. Learn to build components that are independently testable, tree-shakeable, and theme-aware.

### High-Yield Reading Focus
Study ant-design's `components/button/button.tsx` — observe the separation between the component logic, the style hook (`useStyle`), and the props interface. Notice how `useSize`, `useDisabled` are extracted as reusable hooks. Study `components/button/style/index.ts` to see how styles consume tokens. Pay attention to how the component reads from ConfigProvider context for defaults (size, disabled).

### Architecture Question Checklist
1. How does ant-design's Button get its "size" — from props, context, or both? What's the merge priority?
2. Why should component styles be generated from tokens rather than hardcoded?
3. What is a "variant" in component design (primary, default, dashed, link, text) and how do you implement it without massive if/else chains?
4. How do you handle the `disabled` state in an accessible way (not just visual)?
5. Why should the Button component not import directly from `theme-system`'s internals?
6. How does tree-shaking work when a consumer imports only Button but not Input?

### Coding Task
In `packages/ui-kit/src/`:

1. **Set up component structure**:
```
src/
├── button/
│   ├── index.ts          (public barrel)
│   ├── Button.tsx         (component)
│   ├── types.ts           (ButtonProps interface)
│   ├── useButtonStyle.ts  (token-based style hook)
│   └── __tests__/
│       └── Button.test.tsx
├── index.ts               (package barrel - export { Button } from './button')
```

2. **Define `ButtonProps`** in `button/types.ts`:
   - `type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'`
   - `size?: 'small' | 'medium' | 'large'`
   - `disabled?: boolean`
   - `loading?: boolean`
   - `icon?: ReactNode`
   - `onClick?: (e: MouseEvent) => void`
   - `children?: ReactNode`
   - `htmlType?: 'button' | 'submit' | 'reset'`
   - `className?: string`
   - `style?: CSSProperties`

3. **Implement `useButtonStyle(props, tokens)`** in `button/useButtonStyle.ts`:
   - Returns a `style` object and `className` string
   - Maps button `type` to token-based colors (primary → `colorPrimary`, default → `colorBorder`, etc.)
   - Maps `size` to token-based dimensions (`controlHeightSM`, `controlHeight`, `controlHeightLG`)
   - Handles hover/active states via CSS variables or inline style computation
   - Handles disabled state styling (reduced opacity, no pointer events)
   - Handles loading state (reduced opacity, spinner)

4. **Implement `Button` component** in `button/Button.tsx`:
   - Uses `useToken()` from `theme-system` to get tokens
   - Uses `useButtonStyle()` to compute styles
   - Renders a `<button>` element with proper accessibility attributes
   - Supports `ref` forwarding with `React.forwardRef`
   - Merges consumer `className` and `style` with computed ones (consumer wins on conflicts)

5. **Add `theme-system` as a peer dependency** of `ui-kit` in `package.json`.

6. **Write tests**:
   - Renders with default props
   - Each `type` variant renders correct token-based styles
   - Each `size` variant renders correct dimensions
   - Disabled button has `aria-disabled` and doesn't fire onClick
   - Loading button shows loading indicator
   - Ref forwarding works
   - Custom className and style are merged
   - Button respects ConfigProvider theme overrides
   - Button respects ConfigProvider component token overrides

### Performance Checkpoints
- Button should not re-render when sibling state changes (verify with `React.memo` or profiler).
- `useButtonStyle` should be memoized — verify it returns the same object reference when inputs are the same.
- Import only `Button` from `ui-kit` — verify the bundle does NOT include Input or other future components.

### Compatibility Checkpoints
- Button must render correctly in SSR (no useLayoutEffect, no window access).
- Button must be accessible: proper role, aria attributes, keyboard navigation (Enter/Space trigger click).
- Button's HTML output must be valid (no nested buttons, proper type attribute).

### Extensibility Checkpoints
- Can a consumer override Button's colors via ConfigProvider component tokens?
- Can a consumer add a custom `type` variant without modifying the component source?
- Is the style hook reusable for a future IconButton component?

### Concrete Deliverable
Working Button component with all 5 type variants, 3 sizes, disabled/loading states, full token integration, ref forwarding, accessibility, and comprehensive tests.

---

## Day 10 — Input Component & Compound Component Pattern

### Learning Goal
Build an Input component and learn the compound component pattern (Input, Input.Password, Input.Search, Input.TextArea). Understand how ant-design organizes compound components and how they share internal logic. This lays groundwork for form integration.

### High-Yield Reading Focus
Study ant-design's `components/input/` directory. Observe: `Input.tsx` (base), `Password.tsx`, `Search.tsx`, `TextArea.tsx`, and `Group.tsx`. Notice how they share common hooks and types. Study `components/input/hooks/useRemovePasswordTimeout.ts` to see how specialized behavior is extracted into hooks. Look at how `Input` attaches sub-components: `Input.Password = Password`.

### Architecture Question Checklist
1. What is the compound component pattern and when should you use it vs separate components?
2. How does ant-design's Input share logic between Input, Password, and TextArea?
3. Why should Input support both controlled and uncontrolled modes?
4. How do you handle the `value` vs `defaultValue` dichotomy?
5. What is the difference between `onChange` from the DOM and the `onChange` you expose in your API?
6. How does Input connect to a form (preview for Day 13)?

### Coding Task
In `packages/ui-kit/src/input/`:

1. **Define `InputProps`** in `input/types.ts`:
   - `value?: string`
   - `defaultValue?: string`
   - `onChange?: (value: string, e: ChangeEvent) => void` (note: value first, not event first)
   - `onFocus / onBlur`
   - `placeholder?: string`
   - `disabled?: boolean`
   - `readOnly?: boolean`
   - `size?: 'small' | 'medium' | 'large'`
   - `prefix?: ReactNode`
   - `suffix?: ReactNode`
   - `allowClear?: boolean`
   - `status?: 'error' | 'warning'`
   - `maxLength?: number`

2. **Implement `useControlledValue` hook** in `input/hooks/useControlledValue.ts`:
   - Handles both controlled (`value` prop) and uncontrolled (`defaultValue`) modes
   - Returns `[currentValue, setValue]`
   - When in controlled mode, `setValue` calls `onChange` but doesn't update internal state
   - When in uncontrolled mode, `setValue` updates internal state AND calls `onChange`

3. **Implement `useInputStyle` hook** in `input/useInputStyle.ts`:
   - Token-based styling (similar pattern to Button)
   - Focus ring using `colorPrimary`
   - Error/warning states using `colorError`/`colorWarning`
   - Disabled styling
   - Size variants

4. **Implement `Input` component** in `input/Input.tsx`:
   - Uses `useControlledValue` for value management
   - Uses `useToken()` for theme integration
   - Supports `ref` forwarding to the native `<input>`
   - Renders prefix/suffix as wrapper elements
   - Implements `allowClear` as a suffix clear button
   - Supports `status` for validation visual feedback

5. **Implement `Input.Password`** in `input/Password.tsx`:
   - Extends Input with a visibility toggle suffix
   - Manages `type="password"` / `type="text"` toggle

6. **Implement `Input.TextArea`** in `input/TextArea.tsx`:
   - Renders `<textarea>` instead of `<input>`
   - Supports `rows` and `autoSize` props

7. **Attach compound components**: `Input.Password = Password; Input.TextArea = TextArea;`

8. **Write tests**:
   - Controlled mode: value reflects prop, onChange fires
   - Uncontrolled mode: typing updates displayed value
   - allowClear button appears and clears value
   - Password toggle switches between hidden/visible
   - TextArea renders textarea element
   - Status prop applies error/warning styling
   - Size variants apply correct token-based dimensions
   - Ref forwarding provides native element
   - ConfigProvider theme affects Input styling

### Performance Checkpoints
- `useControlledValue` must not cause extra renders when switching between controlled/uncontrolled.
- Input should not re-render when parent re-renders with same props (use `React.memo`).
- Typing into Input must not re-render sibling components.

### Compatibility Checkpoints
- Input must work with native form submission (`<form>`).
- Input must be accessible: label association, aria attributes, keyboard navigation.
- Input must handle IME composition (Chinese/Japanese input) without premature onChange.

### Extensibility Checkpoints
- Can a consumer add a custom suffix/prefix without modifying the component?
- Can the `useControlledValue` hook be reused for other form controls (Select, DatePicker)?
- Can Input connect to an external form library via `onChange`/`value`?

### Concrete Deliverable
Working Input, Input.Password, Input.TextArea with controlled/uncontrolled support, token-based styling, compound component pattern, accessibility, and full test coverage.

---

## Day 11 — Component-Level Style Isolation & CSS Strategy

### Learning Goal
Implement a CSS strategy that provides style isolation between components, supports SSR, and integrates with your token system. Understand the trade-offs between CSS-in-JS, CSS Modules, CSS custom properties, and utility-first approaches. Choose and implement one strategy for your entire ui-kit.

### High-Yield Reading Focus
Study ant-design's CSS-in-JS approach: `components/_util/hooks/useStyle.ts` and `components/theme/util/genComponentStyleHook.ts`. Notice how they generate styles from tokens, cache them by theme hash, and inject them into the DOM. Also study their recent CSS variable mode for comparison. Pay attention to how style registration works — styles are generated once per theme per component, not per instance.

### Architecture Question Checklist
1. What are the trade-offs of CSS-in-JS vs CSS Modules vs CSS custom properties for a component library?
2. How does ant-design ensure styles are generated once per theme, not per component instance?
3. What is style "registration" vs style "injection"? Why does the distinction matter for SSR?
4. How do you prevent style conflicts between your library and consumer's application styles?
5. How does CSS extraction work for SSR — how do styles get into the server-rendered HTML?
6. Why is specificity management important in a component library?

### Coding Task
1. **Implement a style engine** in `packages/ui-kit/src/style/`:
   - `createStyleHook(componentName: string, styleFn: (tokens: AliasToken) => CSSObject): () => string`
   - Style function receives tokens and returns a CSS object
   - Generated CSS is scoped by a unique class prefix (e.g., `mk-button`, `mk-input`)
   - Styles are cached per theme hash — if the theme hasn't changed, don't regenerate
   - Returns a class name to apply to the component root

2. **Implement style injection** in `style/inject.ts`:
   - `injectStyles(css: string, id: string): void` — injects a `<style>` tag with given id
   - Deduplicates — if a style tag with that id exists, update it instead of creating a new one
   - SSR-compatible: provide a `collectStyles()` function that returns all generated CSS as a string for server-side rendering

3. **Implement SSR style collection** in `style/ssr.ts`:
   - `StyleRegistry` component: wraps children, collects styles during render
   - `getStyleTags()`: returns `<style>` tags as string for SSR injection into `<head>`

4. **Refactor Button and Input** to use the new style engine:
   - Replace direct style objects with the style hook
   - Components now receive a className from the style hook instead of inline styles
   - Merge consumer className with generated className

5. **Write tests**:
   - Style hook generates valid CSS
   - Styles are scoped to component (no global selectors)
   - Style cache prevents regeneration for same theme
   - Different themes produce different styles
   - SSR: `collectStyles()` captures all generated styles
   - No style conflicts between Button and Input
   - Consumer className merges correctly

### Performance Checkpoints
- Style generation should happen once per theme change, not per render.
- Verify style cache hit rate: render 100 Buttons — style function should be called only once.
- Measure style injection time for 20 components.

### Compatibility Checkpoints
- Style injection must not crash in SSR (no `document` reference on server).
- Generated CSS must work in legacy browsers (no nesting, no `:has()`).
- Style specificity must be low enough that consumers can override with a single class.

### Extensibility Checkpoints
- Can a consumer override generated styles via ConfigProvider component tokens?
- Can a consumer provide a custom className that overrides library styles?
- Could the style engine be swapped (e.g., from inline CSS to Tailwind classes) without changing components?

### Concrete Deliverable
Working style engine with caching, SSR support, both components refactored to use it, and verified style isolation between components.

---

## Day 12 — Tree-Shaking, Bundle Analysis & UI Kit API Freeze

### Learning Goal
Ensure the ui-kit is properly tree-shakeable — importing only Button should NOT include Input code. Analyze and minimize bundle size. Freeze the public API for ui-kit.

### High-Yield Reading Focus
Study ant-design's build output and `package.json` `sideEffects` field. Look at how `components/index.ts` uses named re-exports (not `export *`) for tree-shaking. Study their build tooling in `scripts/` to understand how ESM output is structured for tree-shaking. Pay attention to the `sideEffects: false` declaration.

### Architecture Question Checklist
1. What does `sideEffects: false` in `package.json` tell bundlers?
2. Why does `export * from './button'` sometimes defeat tree-shaking?
3. How do barrel files (`index.ts`) interact with tree-shaking — when do they help vs hurt?
4. What is "deep import" (`ui-kit/button`) vs "barrel import" (`ui-kit`) and why offer both?
5. How do you verify tree-shaking is working?
6. What causes CSS-in-JS to be un-tree-shakeable?

### Coding Task
1. **Configure tree-shaking**:
   - Add `"sideEffects": false` to ui-kit's `package.json`
   - Ensure each component has its own entry point in `exports`:
     ```json
     "exports": {
       ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" },
       "./button": { "import": "./dist/button/index.mjs", "require": "./dist/button/index.cjs" },
       "./input": { "import": "./dist/input/index.mjs", "require": "./dist/input/index.cjs" }
     }
     ```
   - Configure tsup to produce per-component entry points

2. **Bundle analysis**:
   - Create a test app that imports ONLY `Button` from `ui-kit`
   - Use `esbuild` or `rollup` to bundle it
   - Verify the bundle does NOT contain Input code
   - Record the bundle size: Button-only import vs full import

3. **Deep import support**:
   - Consumers can do `import { Button } from 'ui-kit'` (barrel) OR `import { Button } from 'ui-kit/button'` (deep)
   - Both must work in ESM and CJS
   - Deep import should produce smaller bundles than barrel import

4. **Freeze the public API** — Update `packages/ui-kit/src/index.ts`:
   - Export ONLY: `Button`, `Input`, `Input.Password`, `Input.TextArea`
   - Export types: `ButtonProps`, `InputProps`
   - Document in README

5. **Write a bundle size benchmark** in `packages/ui-kit/benchmark/`:
   - Measure Button-only bundle size
   - Measure Input-only bundle size
   - Measure full ui-kit bundle size
   - Set thresholds: each component < 5KB gzipped, full kit < 15KB gzipped

6. **Write API documentation** in `packages/ui-kit/README.md`:
   - All components with props tables
   - Usage examples
   - Theme customization examples
   - Import patterns (barrel vs deep)

### Performance Checkpoints
- Button-only import must be at least 40% smaller than full kit import.
- Bundle must not include any dead code from unused components.
- Verify no circular dependencies between components.

### Compatibility Checkpoints
- Both barrel and deep imports must work in ESM and CJS.
- Deep imports must resolve correctly in Next.js App Router.
- TypeScript declarations must resolve for both import patterns.

### Extensibility Checkpoints
- Can a consumer build a custom Button variant by composing the existing one?
- Is the component API compatible with `React.ComponentProps<typeof Button>` pattern?
- Can components be wrapped with HOCs without breaking types?

### Concrete Deliverable
Tree-shake-verified ui-kit with per-component entry points, bundle size benchmarks, frozen public API, and comprehensive README.

---

# Phase 4: Form Engine (Days 13–16)

---

## Day 13 — FormStore & Field-Level Subscription

### Learning Goal
Build a form state manager that supports field-level subscriptions — when one field changes, only that field's component re-renders. This is the core innovation that makes large forms performant. Study how ant-design's form store (based on rc-field-form) manages field registration, value updates, and selective notification.

### High-Yield Reading Focus
Study the `rc-field-form` package (used internally by ant-design's Form): focus on `src/useForm.ts` and `src/FieldContext.ts`. Observe: (1) how fields register themselves with the store, (2) how the store maintains a subscriber map keyed by field path, (3) how `setFieldValue` only notifies the affected field's subscriber, (4) how `getFieldValue` reads from a central values object without copying.

### Architecture Question Checklist
1. Why is field-level subscription critical for form performance?
2. How does the store notify only the changed field's component?
3. What is a "field path" and why use dot notation (e.g., `'address.city'`)?
4. How do you handle nested object values (e.g., `{ address: { city: 'NYC' } }`)?
5. What happens when a field unmounts — how do you clean up subscriptions?
6. Why should the store be framework-agnostic (not tied to React)?

### Coding Task
In `packages/core-form/src/`:

1. **Implement `FormStore`** in `store/FormStore.ts` (plain TypeScript, no React):
   - `new FormStore(initialValues?: Record<string, any>)`
   - `getFieldValue(path: string): any` — reads value from nested object by dot path
   - `setFieldValue(path: string, value: any): void` — sets value and notifies subscribers
   - `getFieldsValue(): Record<string, any>` — returns all values (shallow copy)
   - `setFieldsValue(values: Record<string, any>): void` — bulk set, notifies all affected
   - `subscribe(path: string, listener: () => void): () => void` — returns unsubscribe function
   - `subscribeAll(listener: () => void): () => void` — listens to any change
   - Path support: `'name'`, `'address.city'`, `'items.0.name'` (arrays too)

2. **Implement path utilities** in `utils/path.ts`:
   - `getByPath(obj: any, path: string): any`
   - `setByPath(obj: any, path: string, value: any): any` (immutably — returns new object)
   - `parsePath(path: string): string[]` (splits `'a.b.0.c'` into `['a', 'b', '0', 'c']`)

3. **Implement `useFormStore` React hook** in `hooks/useFormStore.ts`:
   - Creates or receives a FormStore instance
   - Returns the store instance

4. **Implement `useField` React hook** in `hooks/useField.ts`:
   - `useField(path: string): { value, onChange, error, touched }`
   - Subscribes to the store for this specific path
   - Re-renders ONLY when this field's value changes
   - Uses `useSyncExternalStore` for safe concurrent-mode subscription

5. **Write tests**:
   - `getByPath` handles nested paths including arrays
   - `setByPath` returns new object (immutability)
   - `FormStore.setFieldValue` notifies only the subscribed path's listener
   - `FormStore.setFieldValue` does NOT notify unrelated paths
   - Multiple fields subscribe independently
   - Unsubscribe stops notifications
   - `useField` re-renders only when its specific path changes (render count test)
   - `useField` works with nested paths

### Performance Checkpoints
- Render a form with 50 fields. Change one field. Verify only 1 component re-renders (use a render counter).
- `setFieldValue` should complete in O(subscribers) time, not O(total fields).
- `getByPath` should not allocate intermediate arrays.

### Compatibility Checkpoints
- `FormStore` must work in Node (no React dependency in the store itself).
- `useField` must use `useSyncExternalStore` for React 19 compatibility.
- Store must handle `undefined` values gracefully.

### Extensibility Checkpoints
- Can a consumer use `FormStore` without React (e.g., in a Vue or vanilla JS app)?
- Can a consumer subscribe to arbitrary computed values (e.g., "total" derived from two fields)?
- Can the store be serialized/deserialized (e.g., for persistence)?

### Concrete Deliverable
Working FormStore with field-level subscriptions, path utilities, React hooks using `useSyncExternalStore`, verified field-level re-render isolation.

---

## Day 14 — Schema Format & Validation Pipeline

### Learning Goal
Design a schema format that describes form structure and validation rules declaratively. Build a validation pipeline that supports sync validators, async validators, and field-level + form-level validation. Understand the separation between "what fields exist" (schema) and "how they're validated" (pipeline).

### High-Yield Reading Focus
Study ant-design's Form `rules` prop format: `{ required, type, min, max, pattern, validator, message }`. Notice how rules are per-field arrays (multiple rules per field, evaluated in order). Study how `rc-field-form` handles async validation in `src/useForm.ts` — observe the Promise aggregation and how it handles concurrent validation races.

### Architecture Question Checklist
1. What belongs in a form schema: just field names and types, or also validation rules and UI hints?
2. Why should validation be a pipeline (ordered array of validators) rather than a single function?
3. How do you handle async validation (e.g., "is this username taken?") without blocking the UI?
4. What happens when a user types faster than async validation resolves — how do you handle stale results?
5. How do you support cross-field validation (e.g., "password must match confirm password")?
6. Should validation run on every keystroke, on blur, or on submit? How do you make this configurable?

### Coding Task
1. **Define the schema format** in `schema/types.ts`:
   ```typescript
   interface FieldSchema {
     name: string              // field path
     label?: string
     type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
     defaultValue?: any
     rules?: ValidationRule[]
     dependencies?: string[]   // other fields this depends on (for cross-field validation)
   }

   interface ValidationRule {
     required?: boolean
     min?: number
     max?: number
     pattern?: RegExp
     validator?: (value: any, formValues: Record<string, any>) => boolean | string | Promise<boolean | string>
     message?: string
     trigger?: 'change' | 'blur' | 'submit'
   }

   interface FormSchema {
     fields: FieldSchema[]
   }
   ```

2. **Implement built-in validators** in `validation/validators.ts`:
   - `requiredValidator(value, rule)` — checks non-empty
   - `minValidator(value, rule)` — checks min length/value
   - `maxValidator(value, rule)` — checks max length/value
   - `patternValidator(value, rule)` — checks regex match
   - `typeValidator(value, rule)` — checks value type

3. **Implement the validation pipeline** in `validation/pipeline.ts`:
   - `async validateField(value: any, rules: ValidationRule[], formValues: Record<string, any>): Promise<string[]>`
   - Runs rules in order, stops at first failure (fail-fast mode) or collects all (full mode)
   - Handles async validators with proper promise management
   - Handles stale async results (if a newer validation starts, discard older pending result)

4. **Integrate validation into FormStore**:
   - `FormStore` now accepts a `FormSchema`
   - `setFieldValue` triggers validation based on `trigger: 'change'`
   - Add `getFieldError(path): string[]` method
   - Add `validateField(path): Promise<string[]>` method
   - Add `validateAll(): Promise<Record<string, string[]>>` method
   - Errors are part of the subscription — `useField` returns `{ value, error, onChange }`

5. **Handle async validation races** in `validation/async.ts`:
   - Use a sequence counter per field
   - When new validation starts, increment counter
   - When result arrives, discard if counter has changed

6. **Write tests**:
   - Required validator catches empty values
   - Min/max validators work for strings (length) and numbers (value)
   - Pattern validator matches/fails correctly
   - Custom validator receives form values for cross-field validation
   - Async validator resolves and updates error state
   - Stale async result is discarded when newer validation starts
   - `validateAll()` aggregates all field errors
   - Trigger modes: change vs blur vs submit
   - `useField` exposes error state reactively

### Performance Checkpoints
- Validation should not block the main thread — async validators run concurrently.
- Validate a form with 50 fields — all sync validators should complete in < 5ms.
- Async validation race: rapidly change a field 10 times — only the last result should be applied.

### Compatibility Checkpoints
- Validation pipeline must work in Node (for server-side form validation).
- Validators must handle `null`, `undefined`, `''`, and `0` edge cases correctly.
- Schema format must be JSON-serializable (for storage/transfer).

### Extensibility Checkpoints
- Can a consumer add custom validator types beyond the built-in set?
- Can a consumer change the fail-fast behavior to collect-all mode?
- Can the schema be loaded from an API response (runtime schema)?

### Concrete Deliverable
Schema-driven validation pipeline integrated into FormStore, with sync and async validation, race condition handling, full test coverage, and reactive error state in `useField`.

---

## Day 15 — Pluggable Renderer Registry & Form-UI Integration

### Learning Goal
Build a renderer registry that maps schema field types to actual React components. Connect the form engine to your ui-kit components. This is where "form engine" meets "UI kit" — the renderer decides WHAT component renders for each field, the form engine decides HOW it connects to state and validation.

### High-Yield Reading Focus
Study ant-design's `components/form/FormItem.tsx` — observe how it acts as a bridge between the form store and the actual input component. Notice how `FormItem` wraps children, injects `value` and `onChange` via `React.cloneElement` or context, and displays validation messages. Also study `components/form/FormList.tsx` for array field rendering patterns.

### Architecture Question Checklist
1. What is a "renderer" in the context of a form engine?
2. Why should the mapping from field type to component be configurable (a registry) rather than hardcoded?
3. How does the form engine pass `value`, `onChange`, and `error` to the rendered component?
4. Should the renderer be responsible for layout (label, error message display) or just the input?
5. How do you handle custom components that don't follow your `{ value, onChange }` contract?
6. What is the benefit of separating schema definition from UI rendering?

### Coding Task
1. **Implement the renderer registry** in `renderer/registry.ts`:
   - `createRendererRegistry()` returns a registry object
   - `registry.register(type: string, component: React.ComponentType<FieldRenderProps>)` — maps a type to a component
   - `registry.get(type: string): React.ComponentType<FieldRenderProps>` — retrieves component
   - `registry.has(type: string): boolean`
   - Default registry includes mappings for: `string → Input`, `password → Input.Password`, `text → Input.TextArea`

2. **Define `FieldRenderProps`** interface:
   - `value: any`
   - `onChange: (value: any) => void`
   - `onBlur: () => void`
   - `error?: string[]`
   - `disabled?: boolean`
   - `label?: string`
   - `placeholder?: string`

3. **Implement `<FormField>` component** in `components/FormField.tsx`:
   - Props: `{ name: string, schema?: FieldSchema, renderer?: React.ComponentType, children?: ReactNode }`
   - Uses `useField(name)` to get value/onChange/error from store
   - If `children` provided: clones children and injects value/onChange (like ant-design)
   - If `renderer` provided: renders that component with FieldRenderProps
   - If neither: looks up the renderer registry by field schema type
   - Wraps everything with label, error message display, and required indicator

4. **Implement `<Form>` component** in `components/Form.tsx`:
   - Props: `{ schema?: FormSchema, store?: FormStore, onSubmit?: (values) => void | Promise<void>, children?: ReactNode }`
   - Creates a FormStore from schema (or uses provided store)
   - Provides store via context
   - Handles form submission: validates all fields, calls onSubmit if valid
   - Supports both declarative (schema-driven) and manual (children-driven) modes:
     ```tsx
     // Schema-driven: auto-generates fields from schema
     <Form schema={mySchema} onSubmit={handleSubmit} />

     // Manual: consumer writes fields explicitly
     <Form store={store} onSubmit={handleSubmit}>
       <FormField name="email"><Input /></FormField>
       <FormField name="password"><Input.Password /></FormField>
     </Form>
     ```

5. **Implement schema-driven rendering** in `components/SchemaRenderer.tsx`:
   - Takes a `FormSchema` and renders each field using the registry
   - Respects field order from schema

6. **Write tests**:
   - Renderer registry registers and retrieves components
   - FormField connects to store and passes value/onChange
   - FormField displays validation errors
   - Form schema-driven mode renders all fields from schema
   - Form manual mode renders children with store connection
   - Form submit validates all fields before calling onSubmit
   - Form submit prevents callback if validation fails
   - Custom renderer can be registered for custom field types
   - Integration: Form with Button (submit), Input fields, validation, and theme

### Performance Checkpoints
- Schema-driven form with 20 fields: changing one field re-renders only that field's component.
- Form submission validation should not cause all fields to re-render until errors are returned.
- Registry lookup must be O(1).

### Compatibility Checkpoints
- `<Form>` must work with native form submission (fires `onSubmit` on Enter in input).
- Schema-driven rendering must work in SSR.
- Registry must accept any React component, not just ui-kit components.

### Extensibility Checkpoints
- Can a consumer register a `DatePicker` renderer without modifying core-form source?
- Can a consumer override the default `string` renderer?
- Can a consumer create a completely custom FormField layout (no wrapping label/error)?

### Concrete Deliverable
Working Form and FormField components, renderer registry with default mappings, both schema-driven and manual rendering modes, full integration with ui-kit Input and Button.

---

## Day 16 — Form-Request Integration, Async Submit & API Freeze

### Learning Goal
Connect the form engine with core-request for form submission. Handle async submission states (loading, success, error). Freeze the core-form public API.

### High-Yield Reading Focus
Study ant-design's Form `onFinish` callback and how it connects to application-level API calls. Notice how the form handles loading state during submission. Study `components/form/Form.tsx` for the submit handling flow: validate → collect values → call onFinish → handle errors.

### Architecture Question Checklist
1. How should the form communicate with an HTTP client — direct integration or loose coupling?
2. Who handles submission loading state — the form or the consumer?
3. How do you display server-side validation errors (e.g., "email already taken") in form fields?
4. What happens if the user submits again while a previous submission is pending?
5. Should the form auto-disable during submission?
6. How do you handle optimistic updates vs waiting for server response?

### Coding Task
1. **Implement `useFormSubmit` hook** in `hooks/useFormSubmit.ts`:
   - `useFormSubmit(store: FormStore, handler: (values) => Promise<any>)`
   - Returns `{ submit, isSubmitting, error, reset }`
   - `submit()`: validates → calls handler → handles success/error
   - Prevents double-submission (ignores submit while isSubmitting)
   - Catches handler errors and exposes them
   - Supports setting server-side field errors: `store.setFieldErrors({ email: ['Already taken'] })`

2. **Implement `createFormClient` utility** in `integration/formClient.ts`:
   - Accepts a `core-request` client instance
   - Returns helpers: `{ submitForm(url, values), createSubmitHandler(url) }`
   - `submitForm` calls `client.post(url, values)` and normalizes errors
   - `createSubmitHandler(url)` returns a function compatible with `<Form onSubmit>`

3. **Add server error mapping**:
   - Define a `ServerErrorResponse` type: `{ errors: Record<string, string[]> }`
   - `createFormClient` auto-maps server errors to field errors on 422 responses
   - `FormStore.setFieldErrors(errors: Record<string, string[]>)` sets multiple field errors at once

4. **Update `<Form>` component**:
   - Accepts `client?: RequestClient` prop for integrated submission
   - Accepts `submitUrl?: string` for convenience
   - When both provided, Form handles submission automatically
   - Disables submit button during submission
   - Displays form-level errors (non-field errors)

5. **Write integration tests**:
   - Form submits to mock server via core-request client
   - Server validation errors appear on correct fields
   - Double-submit is prevented
   - Form-level error is displayed
   - Loading state disables submit button
   - Success callback fires after successful submission
   - Error callback fires after failed submission

6. **Freeze the core-form public API**:
   - Export: `Form`, `FormField`, `FormStore`, `useField`, `useFormStore`, `useFormSubmit`, `createRendererRegistry`, `createFormClient`
   - Export types: `FormSchema`, `FieldSchema`, `ValidationRule`, `FieldRenderProps`
   - Write README documentation

### Performance Checkpoints
- Form submission should not re-render all fields — only the submit button (loading state) and fields with new errors.
- Server error mapping should complete in O(n) where n is the number of error fields.

### Compatibility Checkpoints
- `createFormClient` must work with any client that implements the `RequestClient` interface.
- Server error handling must work with standard REST error formats (422 with error body).
- Form must work in SSR for initial render (no submission on server, obviously).

### Extensibility Checkpoints
- Can a consumer use a different HTTP client by implementing the adapter interface?
- Can a consumer add custom error mapping logic for non-standard server responses?
- Can a consumer use the form without any HTTP integration (pure local state)?

### Concrete Deliverable
Working form-to-server pipeline with core-request integration, server error mapping, loading states, frozen public API, and README.

---

# Phase 5: Integration & Polish (Days 17–20)

---

## Day 17 — Cross-Package Integration Test & Demo App

### Learning Goal
Build a demo application that uses ALL four packages together. This is the integration test — if your API design is good, the packages should compose cleanly. If it's painful, that reveals design problems.

### High-Yield Reading Focus
Study ant-design's own demo site: look at how they use `ConfigProvider`, `Form`, `Button`, and `Input` together in their documentation examples (search their docs or storybook). Notice how few imports are needed for a complete form. The ergonomics of the consumer experience is the ultimate API test.

### Architecture Question Checklist
1. How many imports does a consumer need for a basic themed form with submission? Can you reduce it?
2. Is the integration between packages seamless or does it feel bolted on?
3. Are there any circular dependencies between packages?
4. Does the theme propagate correctly through Form → FormField → Input → styles?
5. Does error state from validation flow correctly from store → field → Input status prop?
6. Is the demo app code something you'd be proud to show in a README?

### Coding Task
1. **Create a demo Next.js app** in `apps/demo/`:
   - Next.js App Router with TypeScript
   - Import all four packages from the monorepo (pnpm workspace link)

2. **Build a login page** (`app/login/page.tsx`):
   - Uses `ConfigProvider` with a custom theme
   - Uses `Form` with schema-driven fields: email (required, email format), password (required, min 8)
   - Uses `Button` for submit (loading state during submission)
   - Uses `createFormClient` with `createClient` for submission
   - Displays validation errors inline
   - Mock server endpoint that returns 422 for "test@test.com"

3. **Build a settings page** (`app/settings/page.tsx`):
   - Nested `ConfigProvider` with different theme for this page
   - Form with multiple field types
   - Real-time validation (validates on change)
   - Cross-field validation (password confirmation)
   - Submit with optimistic loading state

4. **Build a theme switcher** in the layout:
   - Toggle button for light/dark mode
   - Uses `useThemeMode` hook
   - Persists preference

5. **Verify full integration**:
   - Theme tokens flow from ConfigProvider → Button and Input
   - Dark mode toggles all components simultaneously
   - Form validation shows error status on Input components
   - Form submission uses core-request with middleware (add LoggerPlugin)
   - No console errors or warnings

6. **Write E2E integration tests** (use Playwright or test manually):
   - Login flow: fill form → submit → see loading → see result
   - Validation: submit empty form → see errors → fill fields → errors clear
   - Theme: toggle dark mode → all components update
   - Server error: submit with test@test.com → see server error on email field

### Performance Checkpoints
- Profile the login page: identify total render count for a form fill + submit cycle.
- Verify typing in one field doesn't re-render the other field.
- Verify theme toggle doesn't cause form field re-renders (CSS variable approach).

### Compatibility Checkpoints
- Demo app works in Next.js App Router (server components where possible).
- Page loads correctly with SSR (no hydration mismatch).
- Test in both Chrome and Firefox at minimum.

### Extensibility Checkpoints
- How hard would it be to add a "registration" page with different fields? (Should be trivial.)
- Can you swap the theme for the entire app by changing one seed value?
- Can you add a new field type (e.g., Select) to the form by registering a renderer?

### Concrete Deliverable
Working Next.js demo app with login page, settings page, theme switcher, full package integration, and basic E2E test coverage.

---

## Day 18 — Lint, Test Strategy & CI Setup

### Learning Goal
Set up production-quality engineering infrastructure: linting, test configuration, CI pipeline. Understand how ant-design maintains code quality across a large codebase.

### High-Yield Reading Focus
Study ant-design's `.eslintrc.js`, `jest.config.js`, and `.github/workflows/` directory. Notice: (1) how they configure ESLint for a component library (React-specific rules, import ordering, etc.), (2) how they run tests across multiple environments, (3) how their CI validates build, lint, test, and bundle size.

### Architecture Question Checklist
1. What ESLint rules are most important for a library (vs an application)?
2. How do you enforce public/internal API boundaries via lint rules?
3. What's the right test coverage target for a library — 100% or strategic coverage?
4. How should you organize tests — colocated with source or in a separate `__tests__` directory?
5. What should CI validate beyond tests (bundle size, type checking, lint, build)?
6. How do you prevent regressions in bundle size?

### Coding Task
1. **Configure ESLint** at the workspace root:
   - TypeScript-aware rules
   - React hooks rules (exhaustive deps)
   - Import ordering and no-circular-dependency rules
   - No-restricted-imports rule to prevent importing internals across packages
   - Ensure all existing code passes lint

2. **Configure Vitest** for all packages:
   - Shared vitest config at workspace root
   - Per-package config overrides where needed
   - Coverage reporting (target: 80%+ for core logic, 60%+ for components)
   - React testing library setup for component tests

3. **Add type checking script**:
   - `pnpm typecheck` runs `tsc --noEmit` across all packages
   - Fix any type errors

4. **Create CI configuration** (GitHub Actions `.github/workflows/ci.yml`):
   - Trigger on push and PR
   - Steps: install → typecheck → lint → build → test → bundle size check
   - Bundle size check: fail if any package exceeds threshold
   - Cache pnpm store for speed

5. **Add pre-commit hooks** (optional but recommended):
   - lint-staged + husky
   - Run lint and type check on staged files

6. **Audit and fix all existing code**:
   - Run lint on entire codebase, fix violations
   - Run all tests, fix failures
   - Achieve coverage targets

### Performance Checkpoints
- CI pipeline should complete in under 3 minutes.
- Test suite should run in under 30 seconds total.
- Lint should run in under 10 seconds.

### Compatibility Checkpoints
- CI must test against Node 20.
- ESLint config must handle both `.ts` and `.tsx` files.
- Vitest must handle JSX/TSX transformation.

### Extensibility Checkpoints
- Can a new package be added to the monorepo and automatically picked up by lint/test/build?
- Can test configuration be overridden per package for special needs?
- Is the CI pipeline easy to extend with new steps?

### Concrete Deliverable
Complete lint setup passing on all code, Vitest configured with coverage, CI pipeline definition, and all tests green.

---

## Day 19 — Documentation Site & API Reference

### Learning Goal
Build a documentation site that showcases all packages, provides API references, and includes live examples. Good documentation is a product requirement, not an afterthought.

### High-Yield Reading Focus
Study ant-design's documentation structure: component pages have description, when-to-use, examples (live demos), and API tables. Notice how examples are runnable, not just code blocks. Study their `docs/` directory and how documentation is structured.

### Architecture Question Checklist
1. What makes a good component documentation page?
2. How do you keep documentation in sync with the actual API?
3. Should documentation live with the code or in a separate site?
4. What is the minimum viable documentation for a library?
5. How do live examples help vs just API tables?
6. What documentation do LIBRARY AUTHORS need vs what do CONSUMERS need?

### Coding Task
1. **Set up documentation site** using a lightweight tool (Vitepress, Nextra, or simple Next.js pages in the demo app):
   - Home page with project overview
   - Getting started guide (installation, basic setup)
   - Per-package sections

2. **Write core-request documentation**:
   - Overview and philosophy
   - `createClient` API with all options
   - Middleware authoring guide with example
   - Plugin authoring guide with example
   - Adapter authoring guide with example
   - Error handling patterns

3. **Write theme-system documentation**:
   - Token architecture explanation (seed → map → alias diagram)
   - ConfigProvider usage with examples
   - Dark mode setup guide
   - Custom theme creation guide
   - Component token overrides

4. **Write ui-kit documentation**:
   - Button: all variants with live examples
   - Input: all modes with live examples
   - Form integration examples

5. **Write core-form documentation**:
   - FormStore API
   - Schema format reference
   - Validation rules reference
   - Renderer registry guide
   - Form-request integration guide

6. **Create at least 3 live interactive examples**:
   - Themed form with validation
   - Theme switcher demo
   - Custom middleware/plugin example

### Performance Checkpoints
- Documentation site should load in under 2 seconds.
- Live examples should be lazy-loaded (not blocking initial page load).

### Compatibility Checkpoints
- Documentation site must be deployable as static files.
- Live examples must work in modern browsers.
- All code examples must be copy-pasteable and functional.

### Extensibility Checkpoints
- Can documentation be extended easily when new components are added?
- Is the documentation structure scalable to 20+ components?

### Concrete Deliverable
Deployed (or locally running) documentation site with API references for all 4 packages, getting started guide, and at least 3 live interactive examples.

---

## Day 20 — Final Benchmark, Retrospective & Architecture Review

### Learning Goal
Conduct a comprehensive benchmark of the entire system, perform a retrospective analysis of all design decisions, and create an architecture decision record (ADR) document summarizing the key choices and their rationale.

### High-Yield Reading Focus
Study ant-design's benchmark approach: look at their `tests/` and `scripts/` for any performance test files. Study the project's CHANGELOG to see how they communicate breaking changes and design decisions. Think about what you would change if starting over.

### Architecture Question Checklist
1. What was the hardest architectural decision you made and why?
2. Which public API do you think will change first — why?
3. What would you do differently if starting over?
4. Where did you compromise on performance for DX (or vice versa)?
5. Which package has the weakest extensibility story — how would you improve it?
6. What patterns from ant-design did you find most valuable?
7. If you had to support 50 components instead of 2, what would break first in your architecture?
8. What's the biggest technical debt in your codebase right now?

### Coding Task
1. **Write comprehensive benchmarks** in `benchmarks/`:
   - **core-request**: 10K requests through middleware chain — throughput and latency
   - **theme-system**: createTheme × 10K, CSS variable injection × 1K, theme toggle latency
   - **ui-kit**: Render 100 Buttons — initial render time, re-render after theme change
   - **core-form**: 50-field form — render time, single field update time, full validation time
   - **Integration**: Full form (theme + form + request) — end-to-end latency for fill + submit
   - Compare against thresholds and record results

2. **Write Architecture Decision Records** in `docs/adr/`:
   - `001-monorepo-structure.md` — why monorepo, why pnpm
   - `002-adapter-pattern.md` — why adapter for HTTP client
   - `003-token-architecture.md` — why three-layer tokens
   - `004-field-subscription.md` — why field-level subscription
   - `005-style-strategy.md` — why this CSS approach
   - `006-renderer-registry.md` — why pluggable renderers
   - Each ADR: Context → Decision → Consequences → Alternatives Considered

3. **Create a final architecture diagram** (in Mermaid or SVG):
   - Package dependency graph
   - Data flow: theme → component → style
   - Data flow: form → store → field → validation → UI
   - Data flow: form → client → adapter → server

4. **Write a project retrospective** in `docs/RETROSPECTIVE.md`:
   - What worked well
   - What was harder than expected
   - What you'd change if starting over
   - Top 5 things learned
   - Next steps if continuing development

5. **Final polish**:
   - All tests passing
   - All lint passing
   - All packages building
   - Bundle size within thresholds
   - Documentation complete

6. **npm publish dry run**:
   - Run `npm pack --dry-run` for each package
   - Verify only intended files are included
   - Verify package.json fields are correct

### Performance Checkpoints
- All benchmarks recorded with mean, p95, p99 values.
- No benchmark exceeds defined thresholds.
- Bundle size budget: each package < 10KB gzipped, total < 30KB gzipped.

### Compatibility Checkpoints
- All packages build and test on Node 20.
- Demo app runs in Next.js without errors.
- All packages work in ESM and CJS.

### Extensibility Checkpoints
- Document all extension points across all packages.
- Verify each package can be extended without modifying source.
- List recommended plugins/adapters/renderers that could be built.

### Concrete Deliverable
Complete benchmark report, 6 Architecture Decision Records, architecture diagram, retrospective document, all packages passing CI, and npm publish dry run verified.

---

# Appendix: Daily Coaching Protocol

Every day, the coach will:

1. **Start with 5–10 probing questions** about the day's topic — shallow answers will be challenged.
2. **Require architectural explanations in the trainee's own words** — no parroting documentation.
3. **After code submission, deliver a structured code review**:
   - 3 specific improvement points with reasoning
   - Suggested refactoring with code examples
   - Assessment of performance, compatibility, and extensibility compliance
4. **End with 2 reflection questions** and a preview of tomorrow's focus.

The coach will not accept:
- Vague hand-waving ("it's more flexible this way")
- Missing tests for claimed behavior
- Performance claims without measurements
- Compatibility claims without verification
- API surface that hasn't been explicitly justified

---

# Appendix: Reference Architecture Map

```
mini-ecosystem/
├── packages/
│   ├── core-request/        (HTTP client, middleware, plugins)
│   │   ├── src/
│   │   │   ├── adapters/    (fetch, xhr, node-http)
│   │   │   ├── middleware/   (compose, built-in middleware)
│   │   │   ├── plugins/     (retry, logger)
│   │   │   ├── types/       (public.ts, internal.ts)
│   │   │   ├── client.ts    (createClient)
│   │   │   └── index.ts     (public barrel)
│   │   ├── __tests__/
│   │   └── benchmark/
│   │
│   ├── theme-system/        (tokens, algorithms, context)
│   │   ├── src/
│   │   │   ├── tokens/      (types, seed, create)
│   │   │   ├── algorithm/   (default, dark, alias)
│   │   │   ├── context/     (ThemeContext)
│   │   │   ├── provider/    (ConfigProvider)
│   │   │   ├── hooks/       (useToken, useComponentToken, useThemeMode)
│   │   │   ├── runtime/     (cssVars, switcher)
│   │   │   ├── utils/       (color)
│   │   │   └── index.ts
│   │   ├── __tests__/
│   │   └── benchmark/
│   │
│   ├── ui-kit/              (Button, Input, style engine)
│   │   ├── src/
│   │   │   ├── button/      (Button, types, style hook, tests)
│   │   │   ├── input/       (Input, Password, TextArea, hooks, tests)
│   │   │   ├── style/       (engine, inject, ssr)
│   │   │   └── index.ts
│   │   ├── __tests__/
│   │   └── benchmark/
│   │
│   └── core-form/           (store, schema, validation, renderers)
│       ├── src/
│       │   ├── store/       (FormStore)
│       │   ├── schema/      (types)
│       │   ├── validation/  (pipeline, validators, async)
│       │   ├── renderer/    (registry)
│       │   ├── hooks/       (useField, useFormStore, useFormSubmit)
│       │   ├── components/  (Form, FormField, SchemaRenderer)
│       │   ├── integration/ (formClient)
│       │   ├── utils/       (path)
│       │   └── index.ts
│       ├── __tests__/
│       └── benchmark/
│
├── apps/
│   └── demo/                (Next.js demo app)
│
├── docs/
│   ├── adr/                 (Architecture Decision Records)
│   └── site/                (Documentation site)
│
├── benchmarks/              (Cross-package benchmarks)
├── .github/workflows/       (CI)
├── package.json             (workspace root)
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Commands

- **Build all packages**: `pnpm build`
- **Test all packages**: `pnpm test`
- **Lint all packages**: `pnpm lint`
- **Type check all packages**: `pnpm typecheck`
- **Install dependencies**: `pnpm install`
- **Add dependency to specific package**: `pnpm --filter <package-name> add <dependency>`
- **Run demo app**: `pnpm --filter demo dev`

## Architecture Principles

1. **Package Independence**: Each package can be used standalone
2. **Peer Dependencies**: Packages declare what they expect consumers to provide
3. **Framework Agnostic Core**: Core logic (FormStore, tokens) works without React
4. **Performance First**: Field-level subscriptions, CSS variables for theming
5. **Type Safety**: Full TypeScript support with proper public/internal separation
6. **Tree Shaking**: ESM output with sideEffects: false
7. **Extensibility**: Plugin systems, renderer registry, middleware chain