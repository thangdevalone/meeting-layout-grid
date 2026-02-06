# @thangdevalone/meet-layout-grid-core

Grid calculation logic for meet-layout-grid. No dependencies, works with any framework.

## Installation

```bash
npm install @thangdevalone/meet-layout-grid-core
```

## Usage

```typescript
import { createMeetGrid, createGrid } from '@thangdevalone/meet-layout-grid-core'

// Simple grid
const grid = createGrid({
  dimensions: { width: 800, height: 600 },
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
})

console.log(`Item size: ${grid.width}x${grid.height}`)
console.log(`Grid: ${grid.cols} cols, ${grid.rows} rows`)

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
  layoutMode: 'sidebar', // 'gallery' | 'spotlight' | 'sidebar'
  sidebarPosition: 'bottom', // 'left' | 'right' | 'top' | 'bottom'
  pinnedIndex: 0,
})

for (let i = 0; i < 6; i++) {
  const { width, height } = meetGrid.getItemDimensions(i)
  const isMain = meetGrid.isMainItem(i)
  console.log(`Item ${i}: ${width}x${height}, main: ${isMain}`)
}
```

## API

### `createGrid(options)`

Basic responsive grid.

**Options:**
- `dimensions: { width, height }` — Container size
- `count: number` — Number of items
- `aspectRatio: string` — e.g. `"16:9"`
- `gap: number` — Gap between items (px)

**Returns:**
- `width`, `height` — Item size
- `rows`, `cols` — Grid shape
- `getPosition(index): { top, left }`

### `createMeetGrid(options)`

Meet-style grid with layout modes.

**Extra options:**
- `layoutMode: 'gallery' | 'spotlight' | 'sidebar'`
- `pinnedIndex?: number` — Main participant (enables pin mode in gallery, or main tile in sidebar)
- `sidebarPosition?: 'left' | 'right' | 'top' | 'bottom'`
- `sidebarRatio?: number` — 0–1

**Extra returns:**
- `layoutMode`
- `getItemDimensions(index): { width, height }`
- `isMainItem(index): boolean`

## Layout modes

- **gallery** — Same-size tiles in a grid (use `pinnedIndex` for pin mode)
- **spotlight** — One participant only
- **sidebar** — Main area + thumbnail strip (use `sidebarPosition: 'bottom'` for speaker-like layout)

## License

MIT
