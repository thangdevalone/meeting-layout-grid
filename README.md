<p align="center">
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-core?color=blue&label=core" alt="npm core" />
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-react?color=blue&label=react" alt="npm react" />
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-vue?color=blue&label=vue" alt="npm vue" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
</p>

<h1 align="center">Meet Layout Grid</h1>

<p align="center">
  A modern, responsive grid library for video meeting layouts with smooth Motion animations.
  <br />
  Works with Vanilla JS, React, and Vue.
</p>

<p align="center">
  <a href="#demos">Demos</a> ·
  <a href="#features">Features</a> ·
  <a href="#packages">Packages</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#layout-modes">Layout Modes</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="./README.vi.md">Tiếng Việt</a>
</p>

---

## Demos

- [React Demo](https://meeting-react-grid.modern-ui.org/)
- [Vue Demo](https://meeting-vue-grid.modern-ui.org/)

---

## Features

| Feature | Description |
|---------|-------------|
| **3 Layout Modes** | Gallery, Spotlight, Sidebar (with top/bottom/left/right positions) |
| **Pin/Focus Support** | Pin any participant to become the main view |
| **Spring Animations** | Smooth Motion (Framer Motion / Motion One) transitions |
| **Pagination** | Split participants across pages with navigation |
| **Max Visible + "+N More"** | Limit visible items and show overflow indicator |
| **Flexible Aspect Ratios** | Per-item ratios (phone 9:16, desktop 16:9, whiteboard fill) |
| **Floating PiP** | Draggable Picture-in-Picture with corner snapping |
| **Zoom Mode** | Full-screen pinned participant with floating PiP |
| **Responsive** | Adapts to container size, last row centered |
| **Framework Support** | Vanilla JS, React 18+, Vue 3 |
| **TypeScript** | Full type definitions |
| **Tree-shakeable** | Import only what you need |

---

## Packages

| Package | Description | Size |
|---------|-------------|------|
| [`@thangdevalone/meet-layout-grid-core`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-core) | Grid math only (Vanilla JS/TS) | ~3KB |
| [`@thangdevalone/meet-layout-grid-react`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-react) | React components + Motion | ~8KB |
| [`@thangdevalone/meet-layout-grid-vue`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-vue) | Vue 3 components + Motion | ~8KB |

---

## Installation

```bash
# Core only (Vanilla JavaScript/TypeScript)
npm install @thangdevalone/meet-layout-grid-core

# React 18+
npm install @thangdevalone/meet-layout-grid-react

# Vue 3
npm install @thangdevalone/meet-layout-grid-vue
```

---

## Quick Start

### React

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

### Vue 3

```vue
<script setup>
import { GridContainer, GridItem } from '@thangdevalone/meet-layout-grid-vue'

const participants = ref([...])
</script>

<template>
  <GridContainer
    aspect-ratio="16:9"
    :gap="8"
    :count="participants.length"
    layout-mode="gallery"
  >
    <GridItem
      v-for="(p, index) in participants"
      :key="p.id"
      :index="index"
    >
      <VideoTile :participant="p" />
    </GridItem>
  </GridContainer>
</template>
```

### Vanilla JavaScript

```javascript
import { createMeetGrid } from '@thangdevalone/meet-layout-grid-core'

const grid = createMeetGrid({
  dimensions: { width: 800, height: 600 },
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
  layoutMode: 'gallery',
})

for (let i = 0; i < 6; i++) {
  const { top, left } = grid.getPosition(i)
  const { width, height } = grid.getItemDimensions(i)
  
  element.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: ${width}px;
    height: ${height}px;
  `
}
```

---

## Layout Modes

| Mode | Description |
|------|-------------|
| `gallery` | Equal-size tiles in a grid. Use `pinnedIndex` for pin mode with sidebar. |
| `spotlight` | Single participant fills the screen |
| `sidebar` | Main view + thumbnail strip (left/right/top/bottom) |

### Gallery with Pin (Sidebar-like)

When `pinnedIndex` is set in gallery mode, it becomes a sidebar layout:

```tsx
<GridContainer
  layoutMode="gallery"
  pinnedIndex={0}           // Pinned participant
  sidebarPosition="right"   // Others on the right
  count={participants.length}
>
```

### Sidebar Positions

| Position | Description |
|----------|-------------|
| `right` | Thumbnails on the right (default) |
| `left` | Thumbnails on the left |
| `top` | Thumbnails on top (horizontal strip) |
| `bottom` | Thumbnails on bottom (speaker-like layout) |

---

## Pagination

Split participants across multiple pages:

```tsx
<GridContainer
  count={participants.length}
  maxItemsPerPage={9}      // For gallery mode
  currentPage={currentPage}
>
```

For sidebar mode, use `maxVisible` and `currentVisiblePage`:

```tsx
<GridContainer
  layoutMode="sidebar"
  pinnedIndex={0}
  maxVisible={4}                    // Max items in sidebar
  currentVisiblePage={othersPage}   // Current page for "others"
>
```

---

## Max Visible with "+N More" Indicator

Limit visible items and show an overflow indicator:

```tsx
<GridContainer
  maxVisible={4}  // Only show 4 items
  count={12}      // Total 12 participants
>
  {participants.map((p, index) => (
    <GridItem key={p.id} index={index}>
      {({ isLastVisibleOther, hiddenCount }) => (
        <>
          {isLastVisibleOther && hiddenCount > 0 ? (
            <div className="more-indicator">+{hiddenCount} more</div>
          ) : (
            <VideoTile participant={p} />
          )}
        </>
      )}
    </GridItem>
  ))}
</GridContainer>
```

---

## Flexible Aspect Ratios

Support different aspect ratios per participant:

```tsx
const itemAspectRatios = [
  "16:9",    // Desktop landscape
  "9:16",    // Mobile portrait  
  "fill",    // Whiteboard (stretch to fill)
  undefined, // Use global aspectRatio
]

<GridContainer
  itemAspectRatios={itemAspectRatios}
  flexLayout={true}  // Enable flexible cell sizing
>
```

| Value | Description |
|-------|-------------|
| `"16:9"` | Fixed landscape ratio |
| `"9:16"` | Portrait video (mobile) |
| `"4:3"` | Classic tablet ratio |
| `"fill"` | Stretch to fill cell (whiteboard/screen share) |
| `undefined` | Use global aspectRatio |

---

## Floating PiP (Picture-in-Picture)

Draggable floating item that snaps to corners:

```tsx
import { FloatingGridItem } from '@thangdevalone/meet-layout-grid-react'

<GridContainer>
  {/* Main content */}
  
  <FloatingGridItem
    width={130}
    height={175}
    anchor="bottom-right"
    visible={true}
  >
    <VideoTile participant={floatingParticipant} />
  </FloatingGridItem>
</GridContainer>
```

---

## Animation Presets

| Preset | Use Case |
|--------|----------|
| `snappy` | Fast UI feedback |
| `smooth` | Layout changes (default) |
| `gentle` | Subtle motion |
| `bouncy` | Slight overshoot |

```tsx
<GridContainer springPreset="smooth">
```

---

## API Reference

### `createMeetGrid(options): MeetGridResult`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dimensions` | `{ width, height }` | required | Container size |
| `count` | `number` | required | Number of items |
| `aspectRatio` | `string` | `'16:9'` | Default tile aspect ratio |
| `gap` | `number` | `8` | Gap between tiles (px) |
| `layoutMode` | `LayoutMode` | `'gallery'` | `gallery` \| `spotlight` \| `sidebar` |
| `pinnedIndex` | `number` | - | Index of pinned/focused participant |
| `sidebarPosition` | `string` | `'right'` | `left` \| `right` \| `top` \| `bottom` |
| `maxItemsPerPage` | `number` | `0` | Max items per page (gallery mode) |
| `currentPage` | `number` | `0` | Current page (0-based) |
| `maxVisible` | `number` | `0` | Max visible items (sidebar mode) |
| `currentVisiblePage` | `number` | `0` | Current page for visible items |
| `itemAspectRatios` | `array` | - | Per-item aspect ratios |
| `flexLayout` | `boolean` | `false` | Enable flexible cell sizing |

### `MeetGridResult` Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getPosition(index)` | `{ top, left }` | Position of item |
| `getItemDimensions(index)` | `{ width, height }` | Cell dimensions |
| `getItemContentDimensions(index, ratio?)` | `ContentDimensions` | Content dimensions with offset |
| `isItemVisible(index)` | `boolean` | Whether item is visible on current page |
| `isMainItem(index)` | `boolean` | Whether item is the main/pinned item |
| `getLastVisibleOthersIndex()` | `number` | Index of last visible item in "others" |
| `hiddenCount` | `number` | Number of hidden items (for "+N more") |

---

## Development

```bash
git clone https://github.com/thangdevalone/meet-layout-grid.git
cd meet-layout-grid

pnpm install
pnpm build

# Run demos
pnpm dev
# React: http://localhost:5173
# Vue: http://localhost:5174
```

Project structure:

```
meet-layout-grid/
├── packages/
│   ├── core/       # Grid logic (framework-agnostic)
│   ├── react/      # React components + hooks
│   └── vue/        # Vue 3 components + composables
├── examples/
│   ├── react-demo/
│   └── vue-demo/
└── package.json
```

---

## License

MIT © [@thangdevalone](https://github.com/thangdevalone)

See [LICENSE](./LICENSE) for details.
