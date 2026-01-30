<p align="center">
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-core?color=blue&label=core" alt="npm core" />
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-react?color=blue&label=react" alt="npm react" />
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-vue?color=blue&label=vue" alt="npm vue" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
</p>

<h1 align="center">Meet Layout Grid</h1>

<p align="center">
  Responsive grid for video meeting layouts. Works with Vanilla JS, React, and Vue. Uses Motion for layout animations.
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#packages">Packages</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#algorithm">Algorithm</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="./README.vi.md">Tiếng Việt</a>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **4 layout modes** | Gallery, Speaker, Spotlight, Sidebar |
| **Spring animations** | Motion (Framer Motion / Motion One) for layout transitions |
| **Responsive** | Adapts to container size; last row can be centered |
| **Pagination** | Optional pagination for many participants or small screens |
| **Vanilla / React / Vue** | Core is framework-agnostic; React 18+ and Vue 3 packages available |
| **Tree-shakeable** | Import only what you use |
| **TypeScript** | Typed APIs |

---

## Packages

Monorepo with three publishable packages:

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

With pnpm:

```bash
pnpm add @thangdevalone/meet-layout-grid-react
```

With yarn:

```bash
yarn add @thangdevalone/meet-layout-grid-react
```

---

## Quick Start

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

---

## Algorithm

### Tile fitting (Speaker / Sidebar)

For layouts where one area is “main” and the rest is a grid, the library picks the column count that gives the largest tile area in the secondary area:

```
Given: N items, area W × H, aspect ratio R, gap G

For each column count C from 1 to N:
  1. rows = ceil(N / C)
  2. tileW = (W - (C - 1) × G) / C
  3. tileH = tileW × R
  4. If total height > H, scale down:
     scale = H / (rows × tileH + (rows - 1) × G)
     tileH = tileH × scale, tileW = tileH / R
  5. area = tileW × tileH

Pick (C, rows) with max area
```

### Position calculation

Positions are computed from index with a pure function so the same index always gets the same coordinates (avoids overlap on re-renders). The last row is centered when it has fewer items than the others.

---

## Layout Modes

| Mode | Description |
|------|-------------|
| `gallery` | Same-size tiles in a grid; last row centered |
| `speaker` | One large tile (~65%), rest in a grid below |
| `spotlight` | One participant only |
| `sidebar` | Main area + thumbnail strip (left/right/bottom) |

---

## Animation Presets

| Preset | Use |
|--------|-----|
| `snappy` | Fast UI feedback |
| `smooth` | Layout changes (default) |
| `gentle` | Subtle motion |
| `bouncy` | Slight overshoot |

---

## Pagination

Use `maxItemsPerPage` and `currentPage` so tiles don’t get too small when there are many participants:

```tsx
<GridContainer
  count={participants.length}
  maxItemsPerPage={9}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
>
  {/* ... */}
</GridContainer>
```

Tiles are sized by “items on this page,” not total count.

---

## Development

- Node.js 18+
- pnpm 8+

```bash
git clone https://github.com/thangdevalone/meet-layout-grid.git
cd meet-layout-grid

pnpm install
pnpm build

# Demos
cd examples/react-demo && pnpm dev   # http://localhost:5173
cd examples/vue-demo && pnpm dev    # http://localhost:5174
```

Structure:

```
meet-layout-grid/
├── packages/
│   ├── core/       # Grid logic
│   ├── react/      # React bindings
│   └── vue/        # Vue 3 bindings
├── examples/
│   ├── react-demo/
│   └── vue-demo/
└── package.json
```

---

## API Reference

### Core: `createMeetGrid(options): MeetGrid`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dimensions` | `{ width, height }` | required | Container size |
| `count` | `number` | required | Number of items |
| `aspectRatio` | `string` | `'16:9'` | Tile aspect ratio |
| `gap` | `number` | `8` | Gap between tiles (px) |
| `layoutMode` | `LayoutMode` | `'gallery'` | `gallery` \| `speaker` \| `spotlight` \| `sidebar` |
| `focusIndex` | `number` | `0` | Focused item (speaker/spotlight) |
| `maxItemsPerPage` | `number` | - | Max items per page |
| `currentPage` | `number` | `0` | Current page (0-based) |
| `sidebarPosition` | `'left' \| 'right' \| 'bottom'` | `'right'` | Sidebar position |

---

## License

MIT. You can use it in personal and commercial projects; keep attribution as required in the [LICENSE](./LICENSE) file.

Maintained by [@thangdevalone](https://github.com/thangdevalone).
