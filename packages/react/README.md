# @thangdevalone/meeting-grid-layout-react

React 18+ bindings for meeting-grid-layout with Motion animations.

> For full documentation, layout modes, and API reference, see the [main README](https://github.com/thangdevalone/meeting-grid-layout#readme).

## Installation

```bash
npm install @thangdevalone/meeting-grid-layout-react
```

## Quick Start

```tsx
import { GridContainer, GridItem } from '@thangdevalone/meeting-grid-layout-react'

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

| Prop                 | Type                                      | Default     | Description                                                          |
| -------------------- | ----------------------------------------- | ----------- | -------------------------------------------------------------------- |
| `aspectRatio`        | `string`                                  | `'16:9'`    | Default tile aspect ratio                                            |
| `gap`                | `number`                                  | `8`         | Gap between tiles (px)                                               |
| `count`              | `number`                                  | required    | Number of items                                                      |
| `layoutMode`         | `LayoutMode`                              | `'gallery'` | `gallery` \| `spotlight`                                             |
| `pinnedIndex`        | `number`                                  | -           | Pinned participant index                                             |
| `othersPosition`     | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'`   | Thumbnail position in pin mode                                       |
| `springPreset`       | `SpringPreset`                            | `'smooth'`  | Animation preset                                                     |
| `maxItemsPerPage`    | `number`                                  | -           | Max items per page                                                   |
| `currentPage`        | `number`                                  | `0`         | Current page                                                         |
| `maxVisible`         | `number`                                  | -           | Max visible in others area                                           |
| `currentVisiblePage` | `number`                                  | `0`         | Current page for visible items (when maxVisible > 0)                 |
| `itemAspectRatios`   | `(ItemAspectRatio \| undefined)[]`        | -           | Per-item aspect ratios                                               |
| `floatWidth`         | `number`                                  | -           | Width of the auto-float PiP (2-person mode). Overrides breakpoints.  |
| `floatHeight`        | `number`                                  | -           | Height of the auto-float PiP (2-person mode). Overrides breakpoints. |
| `floatBreakpoints`   | `PipBreakpoint[]`                         | -           | Responsive breakpoints for auto-float PiP (see [Responsive PiP](#responsive-pip)) |

### `<GridItem>`

Single grid cell with Motion layout animation.

| Prop               | Type              | Default  | Description                                     |
| ------------------ | ----------------- | -------- | ----------------------------------------------- |
| `index`            | `number`          | required | Item index                                      |
| `disableAnimation` | `boolean`         | `false`  | Disable layout animation                        |
| `itemAspectRatio`  | `ItemAspectRatio` | -        | Per-item aspect ratio (overrides container)      |
| `transition`       | `Transition`      | -        | Custom Motion transition override                |
| `className`        | `string`          | -        | Additional CSS class name                        |
| `style`            | `CSSProperties`   | -        | Custom style (merged with animated styles)       |

Render prop: `{({ contentDimensions, isLastVisibleOther, hiddenCount, isFloat }) => ...}`

### `<FloatingGridItem>`

Draggable Picture-in-Picture overlay with corner snapping.

| Prop              | Type                                                          | Default                          | Description                                      |
| ----------------- | ------------------------------------------------------------- | -------------------------------- | ------------------------------------------------ |
| `children`        | `ReactNode`                                                   | required                         | Content to render inside the floating item       |
| `width`           | `number`                                                      | `120`                            | Floating item width (px). Overridden by `breakpoints`. |
| `height`          | `number`                                                      | `160`                            | Floating item height (px). Overridden by `breakpoints`. |
| `breakpoints`     | `PipBreakpoint[]`                                             | -                                | Responsive breakpoints (see [Responsive PiP](#responsive-pip)) |
| `initialPosition` | `{ x: number; y: number }`                                    | `{ x: 16, y: 16 }`              | Extra offset from anchor corner                  |
| `anchor`          | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'`               | Which corner to snap/anchor the item             |
| `visible`         | `boolean`                                                     | `true`                           | Whether the floating item is visible             |
| `edgePadding`     | `number`                                                      | `12`                             | Minimum padding from container edges (px)        |
| `onAnchorChange`  | `(anchor) => void`                                            | -                                | Callback when anchor corner changes after drag   |
| `transition`      | `Transition`                                                  | `spring (stiffness 400, damping 30)` | Custom Motion transition for snap animation  |
| `borderRadius`    | `number`                                                      | `12`                             | Border radius of the floating item (px)          |
| `boxShadow`       | `string`                                                      | `'0 4px 20px rgba(0,0,0,0.3)'`  | CSS box-shadow of the floating item              |
| `className`       | `string`                                                      | -                                | Additional CSS class name                        |
| `style`           | `CSSProperties`                                               | -                                | Custom style (merged with floating styles)       |

### `<GridOverlay>`

Full-grid overlay for screen sharing, whiteboard, etc.

| Prop              | Type        | Default                | Description              |
| ----------------- | ----------- | ---------------------- | ------------------------ |
| `visible`         | `boolean`   | `true`                 | Show/hide the overlay    |
| `backgroundColor` | `string`    | `'rgba(0,0,0,0.5)'`   | Overlay background color |
| `children`        | `ReactNode` | -                      | Content inside overlay   |

## Responsive PiP

PiP supports responsive breakpoints that auto-adjust size based on container width.

```tsx
import { FloatingGridItem, DEFAULT_FLOAT_BREAKPOINTS } from '@thangdevalone/meet-layout-grid-react'

// Standalone FloatingGridItem — auto-responsive
<FloatingGridItem breakpoints={DEFAULT_FLOAT_BREAKPOINTS}>
  <VideoTile />
</FloatingGridItem>

// Auto-float in 2-person mode — responsive PiP via GridContainer
<GridContainer count={2} floatBreakpoints={DEFAULT_FLOAT_BREAKPOINTS}>
  {participants.map((p, i) => (
    <GridItem key={p.id} index={i}><VideoTile participant={p} /></GridItem>
  ))}
</GridContainer>
```

Resolve PiP size programmatically:

```ts
import { resolveFloatSize, DEFAULT_FLOAT_BREAKPOINTS } from '@thangdevalone/meet-layout-grid-react'

const size = resolveFloatSize(800, DEFAULT_FLOAT_BREAKPOINTS)
// → { width: 160, height: 215 }
```

> See the [main README](https://github.com/thangdevalone/meet-layout-grid#responsive-pip) for full details, default breakpoint table, and custom breakpoint examples.

## Hooks

| Hook                     | Description                               |
| ------------------------ | ----------------------------------------- |
| `useGridDimensions(ref)` | Track element size via ResizeObserver      |
| `useMeetGrid(options)`   | Compute grid layout programmatically      |
| `useGridContext()`       | Access grid context from child components |
| `useGridAnimation()`     | Access animation config from context      |

## Re-exported from Core

| Export                      | Type       | Description                                      |
| --------------------------- | ---------- | ------------------------------------------------ |
| `createMeetGrid`            | function   | Create grid layout (Vanilla JS)                  |
| `createGrid`                | function   | Low-level grid computation                       |
| `resolveFloatSize`          | function   | Resolve PiP size for a given container width     |
| `DEFAULT_FLOAT_BREAKPOINTS` | constant   | Ready-made 5-level responsive PiP breakpoints    |
| `getSpringConfig`           | function   | Get spring config from preset name               |
| `springPresets`             | object     | All spring presets                                |
| `getAspectRatio`            | function   | Parse aspect ratio string                        |
| `PipBreakpoint`             | type       | Breakpoint definition type                       |
| `PaginationInfo`            | type       | Pagination info type                             |
| `ContentDimensions`         | type       | Content dimensions with offset                   |

## License

MIT
