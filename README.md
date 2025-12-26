# Meet Layout Grid

A modern, framework-agnostic responsive grid library for meeting/video layouts with smooth Motion animations.

## Features

- 🎯 **4 Layout Modes**: Gallery, Speaker, Spotlight, Sidebar
- 🎬 **Smooth Animations**: Built-in Motion spring animations
- 📱 **Responsive**: Auto-adapts to container dimensions
- 🔧 **Framework Support**: Vanilla JS, React, Vue 3
- 📦 **Tree-shakeable**: Only import what you need
- 💪 **TypeScript**: Full type definitions included

## Packages

| Package | Description |
|---------|-------------|
| `@thangdevalone/meet-layout-grid-core` | Core grid calculations (vanilla JS) |
| `@thangdevalone/meet-layout-grid-react` | React hooks and components with Motion |
| `@thangdevalone/meet-layout-grid-vue` | Vue 3 composables and components with Motion |

## Installation

```bash
# Core only (vanilla JavaScript)
npm install @thangdevalone/meet-layout-grid-core

# React
npm install @thangdevalone/meet-layout-grid-react

# Vue 3
npm install @thangdevalone/meet-layout-grid-vue
```

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

// Position each item
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

## Layout Modes

| Mode | Description |
|------|-------------|
| `gallery` | Equal-sized tiles in responsive grid |
| `speaker` | Active speaker takes 65% of space |
| `spotlight` | Single participant in focus |
| `sidebar` | Main view with thumbnail strip |

## Animation Presets

- `snappy` - Quick UI interactions
- `smooth` - Layout changes (default)
- `gentle` - Subtle effects
- `bouncy` - Playful effects

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run demos
cd examples/react-demo && pnpm dev   # http://localhost:5173
cd examples/vue-demo && pnpm dev     # http://localhost:5174
```

## License

MIT © ThangDevAlone
