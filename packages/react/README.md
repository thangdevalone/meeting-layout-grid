# @thangdevalone/meet-layout-grid-react

React 18+ bindings for meet-layout-grid with Motion animations.

> For full documentation, layout modes, and API reference, see the [main README](https://github.com/thangdevalone/meet-layout-grid#readme).

## Installation

```bash
npm install @thangdevalone/meet-layout-grid-react
```

## Quick Start

```tsx
import { GridContainer, GridItem } from '@thangdevalone/meet-layout-grid-react'

function MeetingGrid({ participants }) {
  return (
    <GridContainer aspectRatio="16:9" gap={8} layoutMode="gallery" count={participants.length}>
      {participants.map((p, index) => (
        <GridItem key={p.id} index={index}>
          <VideoTile participant={p} />
        </GridItem>
      ))}
    </GridContainer>
  )
}
```

## Components

### `<GridContainer>`

Wraps the grid, computes layout, and provides context to children.

| Prop               | Type           | Default     | Description                    |
| ------------------ | -------------- | ----------- | ------------------------------ |
| `aspectRatio`      | `string`       | `'16:9'`    | Default tile aspect ratio      |
| `gap`              | `number`       | `8`         | Gap between tiles (px)         |
| `count`            | `number`       | required    | Number of items                |
| `layoutMode`       | `LayoutMode`   | `'gallery'` | `gallery` \| `spotlight`       |
| `pinnedIndex`      | `number`       | -           | Pinned participant index       |
| `othersPosition`   | `string`       | `'right'`   | Thumbnail position in pin mode |
| `springPreset`     | `SpringPreset` | `'smooth'`  | Animation preset               |
| `maxItemsPerPage`  | `number`       | -           | Max items per page             |
| `currentPage`      | `number`       | `0`         | Current page                   |
| `maxVisible`       | `number`       | -           | Max visible in others area     |
| `itemAspectRatios` | `array`        | -           | Per-item aspect ratios         |

### `<GridItem>`

Single grid cell with Motion layout animation.

| Prop               | Type      | Default  | Description              |
| ------------------ | --------- | -------- | ------------------------ |
| `index`            | `number`  | required | Item index               |
| `disableAnimation` | `boolean` | `false`  | Disable layout animation |

Render prop: `{({ contentDimensions, isLastVisibleOther, hiddenCount }) => ...}`

### `<FloatingGridItem>`

Draggable Picture-in-Picture overlay with corner snapping.

| Prop             | Type       | Default          | Description                  |
| ---------------- | ---------- | ---------------- | ---------------------------- |
| `width`          | `number`   | -                | Floating item width          |
| `height`         | `number`   | -                | Floating item height         |
| `anchor`         | `string`   | `'bottom-right'` | Corner anchor position       |
| `visible`        | `boolean`  | `true`           | Show/hide the floating item  |
| `edgePadding`    | `number`   | -                | Padding from container edges |
| `borderRadius`   | `number`   | -                | Border radius                |
| `onAnchorChange` | `function` | -                | Callback when anchor changes |

### `<GridOverlay>`

Full-grid overlay for screen sharing, whiteboard, etc.

| Prop              | Type      | Default | Description              |
| ----------------- | --------- | ------- | ------------------------ |
| `visible`         | `boolean` | `false` | Show/hide the overlay    |
| `backgroundColor` | `string`  | -       | Overlay background color |

## Hooks

| Hook                     | Description                               |
| ------------------------ | ----------------------------------------- |
| `useGridDimensions(ref)` | Track element size via ResizeObserver     |
| `useMeetGrid(options)`   | Compute grid layout programmatically      |
| `useGridContext()`       | Access grid context from child components |
| `useGridAnimation()`     | Access animation config from context      |

## License

MIT
