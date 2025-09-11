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

**Example Loading Architecture:**
- `useExamples.js` composable manages example state reactively
- MapToolbar dropdown triggers example selection via `setCurrentExample()`
- MapView component dynamically adds layers using format-agnostic layer generation
- CodeEditor displays example styles as formatted JSON in ACE editor
- `layerGenerator.js` utility handles multiple data formats automatically

**Data Format Support:**
- **FlatGeobuf** (`.fgb`) - Efficient binary vector format
- **GeoJSON** (`.geojson`, `.json`) - Standard vector format  
- **GeoTIFF** (`.tif`, `.tiff`, `.geotiff`) - Raster imagery format
- Auto-detection based on URL/file extension with fallback to GeoJSON

### Key Technical Details

- **Vite Configuration**: Optimizes EOX dependencies, uses `@` alias for `src/`
- **Component Lifecycle**: Uses `onMounted` + `nextTick` to ensure DOM ready before connecting layer control to map
- **Styling**: Mix of scoped component styles and fixed positioning for complex layout

### ACE Editor Integration

**Responsive Configuration:**
- CodeEditor uses ResizeObserver for dynamic dimension tracking
- ACE config calculated from container height: `fontSize * 1.4` line-height ratio
- Reactive `maxLines` and `maxPixelHeight` based on available space
- Font configuration: `fontSize: 14, fontFamily: "'IBM Plex Mono'"`
- Minimum constraints: 200px height, 10 lines to ensure usability
- Theme switching: monokai (dark) / textmate (light) based on system preference

**Implementation Pattern:**
```javascript
const editorConfig = computed(() => {
  const fontSize = 14
  const lineHeight = Math.ceil(fontSize * 1.4)
  const availableHeight = containerHeight.value - padding
  const maxLines = Math.floor(availableHeight / lineHeight)
  
  return {
    maxPixelHeight: Math.max(200, availableHeight),
    maxLines: Math.max(10, maxLines),
    // ... other config
  }
})
```

## Dependencies

### EOX Components
- `@eox/map`: Map visualization with dynamic layer support
- `@eox/layercontrol`: Layer management UI
- `@eox/jsonform`: Form/code editor with ACE integration

**EOX Map Layer Configuration:**
- Supports multiple layer types: Vector (for geospatial vectors) and WebGLTile (for rasters)
- Base layers (OSM) + dynamic example layers managed through reactive arrays
- Layer structure: `{ type, source: { type, url, format }, id, title, style, properties }`

**Layer Generation Utilities (`src/utils/layerGenerator.js`):**
- `detectDataFormat(url)` - Auto-detects format from URL/extension
- `generateLayerSource(url, format)` - Creates appropriate source config
- `generateMapLayer(options)` - Complete layer with styling and properties
- `validateDataUrl(url)` - Async URL accessibility validation

**Usage Pattern:**
```javascript
const layer = generateMapLayer({
  dataUrl: 'https://example.com/data.fgb',
  name: 'My Layer',
  style: { /* EOX style config */ },
  id: 'custom-layer-id'
})
```

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