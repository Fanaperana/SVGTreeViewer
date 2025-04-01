# SVGTreeViewer

A lightweight, customizable tree visualization library for the web. SVGTreeViewer renders hierarchical data in an interactive SVG canvas with panning, zooming, collapsing/expanding, and node dragging capabilities.

![SVGTreeViewer Demo](./public/image.png)

## Features

- **Interactive Tree Visualization**: Display hierarchical data in a tree structure
- **Multiple Root Nodes**: Support for forests (multiple root nodes)
- **Pan & Zoom**: 
  - Smooth panning with mouse drag
  - Mouse wheel zooming
  - Zoom in/out buttons
  - Zoom to fit functionality
- **Node Manipulation**: 
  - Drag & drop nodes to customize layout
  - Save and restore node positions
  - Reset to default layout
  - Export/Import node positions
- **Collapsible Nodes**: 
  - Expand/collapse nodes with children
  - Visual indicators for collapsed/expanded state
  - Double-click to toggle
- **Customizable Appearance**: 
  - HTML templates for nodes
  - Custom styling support
  - Dynamic data insertion
- **Background Options**:
  - Dot pattern
  - Grid pattern
  - Solid color
  - Custom colors
- **Interactive Controls**: 
  - Zoom controls
  - Reset view
  - Center tree
  - Reset layout
- **Modern Connectors**: 
  - S-curved lines
  - Dashed or solid lines
  - Automatic path updates

## Installation

### Self-hosted
Download the latest release and include it in your project:
```html
<script src="dist/browser/bundle.js"></script>
```

## Basic Usage

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Tree Viewer Demo</title>
    <style>
        #tree-container {
            width: 80%;
            height: 80vh;
            border-radius: 20px;
            border: 1px solid grey;
            overflow: hidden;
            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.15);
            position: relative;
            margin: 50px auto;
        }
    </style>
</head>
<body>
    <div id="tree-container"></div>
    
    <script src="dist/browser/bundle.js"></script>
    <script>
        const treeData = [
            { id: 1, parent_id: null, data: { title: "Root", description: "Root node" } },
            { id: 2, parent_id: 1, data: { title: "Child 1", description: "First child" } }
        ];
        
        const viewer = new SVGTreeViewer({
            containerId: 'tree-container',
            data: treeData,
            template: '<div><h3>[data:title]</h3><p>[data:description]</p></div>',
            collapseChild: true
        });
    </script>
</body>
</html>
```

## API Reference

### Options

| Option | Type | Default | Possible Values | Description |
|--------|------|---------|----------------|-------------|
| `containerId` | string | (required) | Any valid DOM ID | Container element ID |
| `data` | Array | `[]` | Array of objects | Tree node data array |
| `idAlias` | string | `"id"` | Any string | Node ID property name |
| `parentIdAlias` | string | `"parent_id"` | Any string | Parent ID property name |
| `collapseChild` | boolean | `false` | `true`, `false` | Show collapse buttons |
| `template` | string | `"<div>[data:text]</div>"` | Any valid HTML | Node template with data markers |
| `nodeWidth` | number | `160` | > 0 | Node width in pixels |
| `nodeHeight` | number | `100` | > 0 | Node height in pixels |
| `nodePadding` | number | `40` | ≥ 0 | Sibling node padding |
| `levelHeight` | number | `150` | > 0 | Vertical level spacing |
| `horizontalSpacing` | number | `200` | > 0 | Horizontal node spacing |
| `backgroundPattern` | string | `"dots"` | `"dots"`, `"grid"`, `"none"` | Background pattern type |
| `backgroundColor` | string | `"#f9f9f9"` | Any valid color | Background color |
| `patternColor` | string | `"#cccccc"` | Any valid color | Pattern color |

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `updateData(data)` | `Array` | void | Update tree data |
| `resetView()` | none | void | Reset view state |
| `resetNodePositions()` | none | void | Reset node positions |
| `toggleNodeCollapse(id)` | `string\|number` | void | Toggle node collapse |
| `centerTree()` | none | void | Center the tree |
| `zoomToFit()` | none | void | Fit tree to view |
| `exportPositions()` | none | `string` | Export node positions |
| `importPositions(json)` | `string` | void | Import node positions |

### Position Management

```javascript
// Export current layout
const positions = viewer.exportPositions();
localStorage.setItem('treeLayout', positions);

// Import saved layout
const savedLayout = localStorage.getItem('treeLayout');
if (savedLayout) {
    viewer.importPositions(savedLayout);
}
```

### Custom Templates

```javascript
const viewer = new SVGTreeViewer({
    containerId: 'tree-container',
    template: `
        <div class="node">
            <h3>[data:title]</h3>
            <p>[data:description]</p>
            <small>[data:role]</small>
        </div>
    `,
    // ... other options
});
```

### Data Structure

```typescript
interface TreeNodeData {
    id: string | number;
    parent_id: string | number | null;
    data: {
        [key: string]: any;  // Custom data properties
    };
}
```

## Interactions

- **Pan Canvas**: Click and drag on empty space
- **Zoom**: 
  - Mouse wheel up/down
  - Zoom buttons
  - Double-click nodes
- **Node Operations**:
  - Drag: Click and hold node
  - Collapse: Click collapse button or double-click
  - Select: Click node
- **View Controls**:
  - Reset: Reset button
  - Center: Center button
  - Fit: Fit to view button

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License

## Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development Server

Run the development server with hot reload:

```bash
npm run dev:vite
```
This will start a dev server at `http://localhost:5173`

### Building

#### Production Build

To create a production build:

```bash
npm run build:vite
```

This generates optimized files in the `dist` folder:

- `bundle.js` - Minified JavaScript bundle
- `bundle.js.map` - Source map file

#### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

### Build Options

The project supports multiple build configurations:

| Command | Output | Description |
|---------|--------|-------------|
| `npm run build:vite` | Production bundle | Optimized, minified build |
| `npm run dev:vite` | Development server | Hot-reload enabled |
| `npm run preview` | Production preview | Test production build |

### Build Output

The production build generates files in the `dist` directory:

```
dist/
  ├── bundle.js        # Main library bundle
  ├── bundle.js.map    # Source maps
  └── index.html       # Demo page
```

### Environment Variables

Build can be customized using `.env` files:

```env
VITE_APP_PORT=3000        # Dev server port
VITE_APP_BASE_URL=/       # Base URL for production
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request