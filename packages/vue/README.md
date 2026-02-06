# @thangdevalone/meet-layout-grid-vue

Vue 3 bindings for meet-layout-grid with Motion (motion-v) animations.

## Installation

```bash
npm install @thangdevalone/meet-layout-grid-vue
```

## Quick start

```vue
<script setup>
import { GridContainer, GridItem } from '@thangdevalone/meet-layout-grid-vue'
import { ref } from 'vue'

const participants = ref([
  { id: 1, name: 'You' },
  { id: 2, name: 'User 1' },
])
</script>

<template>
  <GridContainer
    aspect-ratio="16:9"
    :gap="8"
    :count="participants.length"
    layout-mode="gallery"
  >
    <GridItem
      v-for="(participant, index) in participants"
      :key="participant.id"
      :index="index"
    >
      <VideoTile :participant="participant" />
    </GridItem>
  </GridContainer>
</template>
```

## Components

### `<GridContainer>`

Wraps the grid and provides layout via provide/inject.

```vue
<GridContainer
  aspect-ratio="16:9"
  :gap="8"
  :count="6"
  layout-mode="gallery"
  :pinned-index="0"
  sidebar-position="right"
  :sidebar-ratio="0.25"
  spring-preset="smooth"
  tag="div"
>
  <slot />
</GridContainer>
```

### `<GridItem>`

One grid cell; uses motion-v for animation.

```vue
<GridItem :index="0" :disable-animation="false" tag="div">
  <slot />
</GridItem>
```

## Composables

### `useGridDimensions(ref)`

Tracks element size (ResizeObserver).

```ts
import { useGridDimensions } from '@thangdevalone/meet-layout-grid-vue'
import { ref } from 'vue'

const containerRef = ref<HTMLElement | null>(null)
const dimensions = useGridDimensions(containerRef)
// ComputedRef<{ width: number, height: number }>
```

### `useMeetGrid(options)`

Compute grid layout yourself.

```ts
import { useMeetGrid } from '@thangdevalone/meet-layout-grid-vue'
import { computed } from 'vue'

const options = computed(() => ({
  dimensions: dimensions.value,
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
  layoutMode: 'sidebar',
  sidebarPosition: 'bottom', // speaker-like layout
}))

const grid = useMeetGrid(options)
```

### `useGridItemPosition(grid, index)`

Get position and size for one item.

```ts
import { useGridItemPosition } from '@thangdevalone/meet-layout-grid-vue'

const { position, dimensions, isMain, isHidden } = useGridItemPosition(grid, 0)
```

## Layout modes

- **gallery** — Same-size tiles (use `pinnedIndex` to pin a participant)
- **spotlight** — Single participant
- **sidebar** — Main + thumbnails (use `sidebarPosition: 'bottom'` for speaker-like layout)

## License

MIT
