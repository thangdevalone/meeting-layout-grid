# @meet-layout-grid/react

React integration for meet-layout-grid with Motion animations.

## Installation

```bash
npm install @meet-layout-grid/react
```

## Quick Start

```tsx
import { GridContainer, GridItem } from '@meet-layout-grid/react'

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

Container component that calculates grid layout and provides context.

```tsx
<GridContainer
  aspectRatio="16:9"        // Item aspect ratio
  gap={8}                    // Gap between items (px)
  count={6}                  // Number of items
  layoutMode="gallery"       // Layout mode
  speakerIndex={0}           // Active speaker
  pinnedIndex={0}            // Pinned item
  sidebarPosition="right"    // Sidebar position
  sidebarRatio={0.25}        // Sidebar width ratio
  springPreset="smooth"      // Animation preset
>
  {children}
</GridContainer>
```

### `<GridItem>`

Animated grid item with Motion spring animations.

```tsx
<GridItem
  index={0}                  // Item index (required)
  disableAnimation={false}   // Disable animations
>
  {content}
</GridItem>
```

## Hooks

### `useGridDimensions(ref)`

Track element dimensions with ResizeObserver.

```tsx
const ref = useRef<HTMLDivElement>(null)
const dimensions = useGridDimensions(ref)
// { width: number, height: number }
```

### `useMeetGrid(options)`

Calculate grid layout manually.

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

## Layout Modes

- **gallery** - Equal-sized tiles
- **speaker** - Active speaker larger
- **spotlight** - Single participant focus
- **sidebar** - Main view + thumbnails

## Animation Presets

- `snappy` - Quick UI interactions
- `smooth` - Layout changes (default)
- `gentle` - Subtle effects
- `bouncy` - Playful effects

## License

MIT
