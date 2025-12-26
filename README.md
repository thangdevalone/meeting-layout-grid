# Meet Layout Grid

A modern, framework-agnostic responsive grid library for meeting/video layouts with smooth Motion animations.

## Features

- 🎯 **Framework Agnostic Core** - Use with any JavaScript framework
- ⚛️ **React Support** - Hooks and animated components
- 💚 **Vue 3 Support** - Composables and SFC components
- 🅰️ **Angular Support** - Services and directives
- 🎬 **Motion Animations** - Smooth spring-based transitions
- 📐 **Multiple Layout Modes** - Gallery, Speaker, Spotlight, Sidebar
- 📱 **Responsive** - Automatically adapts to container size
- 🪶 **Lightweight** - Minimal bundle size with tree-shaking support

## Packages

| Package | Description |
|---------|-------------|
| `@meet-layout-grid/core` | Core grid calculation logic |
| `@meet-layout-grid/react` | React hooks and components |
| `@meet-layout-grid/vue` | Vue 3 composables and components |
| `@meet-layout-grid/angular` | Angular services and directives |

## Installation

```bash
# Core only
npm install @meet-layout-grid/core

# React
npm install @meet-layout-grid/react

# Vue
npm install @meet-layout-grid/vue

# Angular
npm install @meet-layout-grid/angular
```

## Quick Start

### React

```tsx
import { GridContainer, GridItem, useMeetGrid } from '@meet-layout-grid/react'

function MeetingGrid({ participants }) {
  return (
    <GridContainer aspectRatio="16:9" gap={8}>
      {participants.map((p, index) => (
        <GridItem key={p.id} index={index}>
          <VideoTile participant={p} />
        </GridItem>
      ))}
    </GridContainer>
  )
}
```

### Vue

```vue
<script setup>
import { GridContainer, GridItem } from '@meet-layout-grid/vue'
</script>

<template>
  <GridContainer aspect-ratio="16:9" :gap="8">
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

### Angular

```typescript
import { MeetGridModule } from '@meet-layout-grid/angular'

@Component({
  template: `
    <meet-grid-container aspectRatio="16:9" [gap]="8">
      <div *ngFor="let p of participants; let i = index" [meetGridItem]="i">
        <app-video-tile [participant]="p" />
      </div>
    </meet-grid-container>
  `
})
export class MeetingComponent {}
```

## Layout Modes

- **Gallery** - Equal-sized tiles in a responsive grid
- **Speaker** - Active speaker takes larger space
- **Spotlight** - Single participant in focus
- **Sidebar** - Main view with thumbnail strip

## License

MIT
