# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Lint code**: `npm run lint` (auto-fixes issues)
- **Format code**: `npm run format`

## Project Architecture

This is a Vue 3 + Vite application that provides a style editor for geospatial data visualization using EOX web components.

### Core Components

The application is built around three main EOX web components:
- `@eox/map` - Interactive map component (OpenLayers-based)
- `@eox/layercontrol` - Layer management UI
- `@eox/jsonform` - Form component with code editor capabilities

### Application Structure

- **Main Layout** (`src/App.vue`): Split-pane interface with resizable sidebar
  - Left sidebar: Contains code editor (via `eox-jsonform`) and toolbar
  - Right main area: Map view (`eox-map`)
  - Top-right overlay: Layer control panel (`eox-layercontrol`)

- **Sidebar Resizing**: Custom drag-to-resize implementation using mouse events and `requestAnimationFrame`

### Style Examples System

Examples are organized in `src/examples/`:
- Each example exports name, dataUrl, and style configuration
- Style definitions are stored as JSON files (e.g., `cerulean/style.json`)
- Examples are aggregated in `src/examples/examples.js`

### Key Technical Details

- **Vite Configuration**: Optimizes EOX dependencies, uses `@` alias for `src/`
- **Component Lifecycle**: Uses `onMounted` + `nextTick` to ensure DOM ready before connecting layer control to map
- **Styling**: Mix of scoped component styles and fixed positioning for complex layout

## Dependencies

### EOX Components
- `@eox/map`: Map visualization
- `@eox/layercontrol`: Layer management
- `@eox/jsonform`: Form/code editor with ACE integration

### Development Stack
- Vue 3 with Composition API
- Vite for build tooling
- ESLint + Prettier for code quality
- Vue DevTools integration

## IDE Setup

Recommended VS Code extensions (see `.vscode/extensions.json`):
- Vue.volar (Vue language support)
- ESLint
- Prettier
- EditorConfig

Auto-formatting and ESLint fixes on save are enabled by default.