# @meet-layout-grid/core

Core grid calculation logic for meet-layout-grid library. Zero dependencies, framework-agnostic.

## Installation

```bash
npm install @meet-layout-grid/core
```

## Usage

```typescript
import { createMeetGrid, createGrid } from '@meet-layout-grid/core'

// Basic grid
const grid = createGrid({
  dimensions: { width: 800, height: 600 },
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
})

console.log(`Item size: ${grid.width}x${grid.height}`)
console.log(`Grid: ${grid.cols} cols, ${grid.rows} rows`)

// Position each item
for (let i = 0; i < 6; i++) {
  const { top, left } = grid.getPosition(i)
  console.log(`Item ${i}: top=${top}, left=${left}`)
}

// Meet-style grid with layout modes
const meetGrid = createMeetGrid({
  dimensions: { width: 800, height: 600 },
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
  layoutMode: 'speaker', // 'gallery' | 'speaker' | 'spotlight' | 'sidebar'
  speakerIndex: 0,
})

// Items may have different sizes in speaker mode
for (let i = 0; i < 6; i++) {
  const { width, height } = meetGrid.getItemDimensions(i)
  const isMain = meetGrid.isMainItem(i)
  console.log(`Item ${i}: ${width}x${height}, main: ${isMain}`)
}
```

## API

### `createGrid(options)`

Creates a basic responsive grid.

**Options:**
- `dimensions: { width, height }` - Container dimensions
- `count: number` - Number of items
- `aspectRatio: string` - Aspect ratio (e.g., "16:9")
- `gap: number` - Gap between items in pixels

**Returns:**
- `width: number` - Item width
- `height: number` - Item height
- `rows: number` - Number of rows
- `cols: number` - Number of columns
- `getPosition(index): { top, left }` - Position getter

### `createMeetGrid(options)`

Creates a meet-style grid with layout modes.

**Additional Options:**
- `layoutMode: 'gallery' | 'speaker' | 'spotlight' | 'sidebar'`
- `pinnedIndex?: number` - Index of pinned item
- `speakerIndex?: number` - Index of active speaker
- `sidebarPosition?: 'left' | 'right' | 'bottom'`
- `sidebarRatio?: number` - Sidebar width ratio (0-1)

**Additional Returns:**
- `layoutMode: LayoutMode` - Current layout mode
- `getItemDimensions(index): { width, height }` - Per-item dimensions
- `isMainItem(index): boolean` - Check if item is featured

## Layout Modes

- **Gallery** - Equal-sized tiles in a responsive grid
- **Speaker** - Active speaker takes larger space (65% height)
- **Spotlight** - Single participant in focus, others hidden
- **Sidebar** - Main view with thumbnail strip

## License

MIT
