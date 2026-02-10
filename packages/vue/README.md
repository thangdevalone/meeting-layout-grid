# @thangdevalone/meeting-grid-layout-vue

Vue 3 bindings for meeting-grid-layout with motion-v animations.

> For full documentation, layout modes, and API reference, see the [main README](https://github.com/thangdevalone/meeting-grid-layout#readme).

## Installation

```bash
npm install @thangdevalone/meeting-grid-layout-vue
```

## Quick Start

```vue
<script setup>
import { GridContainer, GridItem } from '@thangdevalone/meeting-grid-layout-vue'
import { ref } from 'vue'

const participants = ref([
  { id: 1, name: 'You' },
  { id: 2, name: 'User 1' },
])
</script>

<template>
  <GridContainer aspect-ratio="16:9" :gap="8" :count="participants.length" layout-mode="gallery">
    <GridItem v-for="(participant, index) in participants" :key="participant.id" :index="index">
      <VideoTile :participant="participant" />
    </GridItem>
  </GridContainer>
</template>
```

## Components

### `<GridContainer>`

Wraps the grid and provides layout via `provide`/`inject`.

| Prop                 | Type           | Default     | Description                    |
| -------------------- | -------------- | ----------- | ------------------------------ |
| `aspect-ratio`       | `string`       | `'16:9'`    | Default tile aspect ratio      |
| `gap`                | `number`       | `8`         | Gap between tiles (px)         |
| `count`              | `number`       | required    | Number of items                |
| `layout-mode`        | `LayoutMode`   | `'gallery'` | `gallery` \| `spotlight`       |
| `pinned-index`       | `number`       | -           | Pinned participant index       |
| `others-position`    | `string`       | `'right'`   | Thumbnail position in pin mode |
| `spring-preset`      | `SpringPreset` | `'smooth'`  | Animation preset               |
| `max-items-per-page` | `number`       | -           | Max items per page             |
| `current-page`       | `number`       | `0`         | Current page                   |
| `max-visible`        | `number`       | -           | Max visible in others area     |
| `item-aspect-ratios` | `array`        | -           | Per-item aspect ratios         |
| `tag`                | `string`       | `'div'`     | Root HTML element tag          |

### `<GridItem>`

Single grid cell with motion-v animation.

| Prop                | Type      | Default  | Description              |
| ------------------- | --------- | -------- | ------------------------ |
| `index`             | `number`  | required | Item index               |
| `disable-animation` | `boolean` | `false`  | Disable layout animation |
| `tag`               | `string`  | `'div'`  | Root HTML element tag    |

### `<FloatingGridItem>`

Draggable Picture-in-Picture overlay with corner snapping.

| Prop            | Type      | Default          | Description                  |
| --------------- | --------- | ---------------- | ---------------------------- |
| `width`         | `number`  | -                | Floating item width          |
| `height`        | `number`  | -                | Floating item height         |
| `anchor`        | `string`  | `'bottom-right'` | Corner anchor position       |
| `visible`       | `boolean` | `true`           | Show/hide the floating item  |
| `edge-padding`  | `number`  | -                | Padding from container edges |
| `border-radius` | `number`  | -                | Border radius                |

### `<GridOverlay>`

Full-grid overlay for screen sharing, whiteboard, etc.

| Prop               | Type      | Default | Description              |
| ------------------ | --------- | ------- | ------------------------ |
| `visible`          | `boolean` | `false` | Show/hide the overlay    |
| `background-color` | `string`  | -       | Overlay background color |

## Composables

| Composable                         | Description                           |
| ---------------------------------- | ------------------------------------- |
| `useGridDimensions(ref)`           | Track element size via ResizeObserver |
| `useMeetGrid(options)`             | Compute grid layout programmatically  |
| `useGridAnimation()`               | Access animation config from context  |
| `useGridItemPosition(grid, index)` | Get position and size for one item    |

## License

MIT
