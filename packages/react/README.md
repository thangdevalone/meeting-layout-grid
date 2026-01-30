# @thangdevalone/meet-layout-grid-react

React bindings for meet-layout-grid with Motion animations.

## Installation

```bash
npm install @thangdevalone/meet-layout-grid-react
```

## Quick start

```tsx
import { GridContainer, GridItem } from '@thangdevalone/meet-layout-grid-react'

function MeetingGrid({ participants }) {
  return (
    <GridContainer
      aspectRatio="16:9"
      gap={8}
      layoutMode="gallery"
      count={participants.length}
    >
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

Wraps the grid, computes layout, provides context.

```tsx
<GridContainer
  aspectRatio="16:9"
  gap={8}
  count={6}
  layoutMode="gallery"
  speakerIndex={0}
  pinnedIndex={0}
  sidebarPosition="right"
  sidebarRatio={0.25}
  springPreset="smooth"
>
  {children}
</GridContainer>
```

### `<GridItem>`

One grid cell; uses Motion for layout animation.

```tsx
<GridItem index={0} disableAnimation={false}>
  {content}
</GridItem>
```

## Hooks

### `useGridDimensions(ref)`

Uses ResizeObserver to track element size.

```tsx
const ref = useRef<HTMLDivElement>(null)
const dimensions = useGridDimensions(ref)
// { width: number, height: number }
```

### `useMeetGrid(options)`

Compute grid layout yourself.

```tsx
const grid = useMeetGrid({
  dimensions: { width: 800, height: 600 },
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
  layoutMode: 'speaker',
})

const { top, left } = grid.getPosition(index)
const { width, height } = grid.getItemDimensions(index)
```

## Layout modes

- **gallery** — Same-size tiles
- **speaker** — One large tile
- **spotlight** — Single participant
- **sidebar** — Main + thumbnails

## Animation presets

- `snappy` — Fast feedback
- `smooth` — Layout changes (default)
- `gentle` — Subtle
- `bouncy` — Slight overshoot

## License

MIT
