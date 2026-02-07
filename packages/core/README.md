# @thangdevalone/meet-layout-grid-core

Framework-agnostic grid calculation engine for meet-layout-grid. Zero dependencies.

> For full documentation, examples, and API reference, see the [main README](https://github.com/thangdevalone/meet-layout-grid#readme).

## Installation

```bash
npm install @thangdevalone/meet-layout-grid-core
```

## Usage

```typescript
import { createMeetGrid } from '@thangdevalone/meet-layout-grid-core'

const grid = createMeetGrid({
  dimensions: { width: 800, height: 600 },
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
  layoutMode: 'gallery',
  pinnedIndex: 0,
  othersPosition: 'bottom',
})

for (let i = 0; i < 6; i++) {
  const { top, left } = grid.getPosition(i)
  const { width, height } = grid.getItemDimensions(i)
  const isMain = grid.isMainItem(i)
  console.log(`Item ${i}: ${width}x${height} at (${left}, ${top}), main: ${isMain}`)
}
```

## Exports

### Functions

| Function                        | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `createMeetGrid(options)`       | Full meet-style grid with layout modes       |
| `createGrid(options)`           | Basic responsive grid (no layout modes)      |
| `getAspectRatio(ratio)`         | Parse aspect ratio string to numeric value   |
| `getGridItemDimensions(…)`      | Get dimensions for a specific grid item      |
| `createGridItemPositioner(…)`   | Create a reusable position calculator        |
| `getSpringConfig(preset)`       | Get spring animation config from preset name |
| `calculateContentDimensions(…)` | Calculate content size within a cell         |

### Types

| Type                | Description                                |
| ------------------- | ------------------------------------------ |
| `MeetGridOptions`   | Options for `createMeetGrid`               |
| `MeetGridResult`    | Return type of `createMeetGrid`            |
| `GridOptions`       | Options for `createGrid`                   |
| `GridResult`        | Return type of `createGrid`                |
| `GridDimensions`    | `{ width, height }`                        |
| `Position`          | `{ top, left }`                            |
| `LayoutMode`        | `'gallery' \| 'spotlight'`                 |
| `ItemAspectRatio`   | `string \| 'auto'`                         |
| `ContentDimensions` | `{ width, height, offsetTop, offsetLeft }` |
| `PaginationInfo`    | Pagination state details                   |
| `SpringPreset`      | Animation preset names                     |

## License

MIT
