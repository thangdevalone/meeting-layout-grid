# @meet-layout-grid/vue

Vue 3 integration for meet-layout-grid with Motion animations.

## Installation

```bash
npm install @meet-layout-grid/vue
```

## Quick Start

```vue
<script setup>
import { GridContainer, GridItem } from '@meet-layout-grid/vue'
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

Container component with provide/inject context.

```vue
<GridContainer
  aspect-ratio="16:9"
  :gap="8"
  :count="6"
  layout-mode="gallery"
  :speaker-index="0"
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

Animated grid item with motion-v animations.

```vue
<GridItem
  :index="0"
  :disable-animation="false"
  tag="div"
>
  <slot />
</GridItem>
```

## Composables

### `useGridDimensions(ref)`

```ts
import { useGridDimensions } from '@meet-layout-grid/vue'
import { ref } from 'vue'

const containerRef = ref<HTMLElement | null>(null)
const dimensions = useGridDimensions(containerRef)
// ComputedRef<{ width: number, height: number }>
```

### `useMeetGrid(options)`

```ts
import { useMeetGrid } from '@meet-layout-grid/vue'
import { computed } from 'vue'

const options = computed(() => ({
  dimensions: dimensions.value,
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
  layoutMode: 'speaker',
}))

const grid = useMeetGrid(options)
```

### `useGridItemPosition(grid, index)`

```ts
import { useGridItemPosition } from '@meet-layout-grid/vue'

const { position, dimensions, isMain, isHidden } = useGridItemPosition(grid, 0)
```

## Layout Modes

- **gallery** - Equal-sized tiles
- **speaker** - Active speaker larger
- **spotlight** - Single participant focus
- **sidebar** - Main view + thumbnails

## License

MIT
