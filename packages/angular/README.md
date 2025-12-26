# @meet-layout-grid/angular

Angular integration for meet-layout-grid with Motion animations.

## Installation

```bash
npm install @meet-layout-grid/angular motion
```

## Quick Start

```typescript
import { Component, ElementRef, ViewChild, ViewChildren, QueryList, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { createGridService, animateGridItem, MeetGridResult, LayoutMode } from '@meet-layout-grid/angular'

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid-container" #gridContainer>
      <div
        *ngFor="let participant of participants; let i = index"
        #gridItem
        class="grid-item"
      >
        {{ participant.name }}
      </div>
    </div>
  `,
  styles: [`
    .grid-container { position: relative; width: 100%; height: 100%; }
    .grid-item { position: absolute; }
  `]
})
export class MeetingComponent implements OnInit, OnDestroy {
  @ViewChild('gridContainer', { static: true }) gridContainer!: ElementRef
  @ViewChildren('gridItem') gridItems!: QueryList<ElementRef>
  
  participants = [{ id: 1, name: 'You' }, { id: 2, name: 'User 1' }]
  grid: MeetGridResult | null = null
  
  private gridService = createGridService()
  private resizeObserver: ResizeObserver | null = null
  
  ngOnInit() {
    this.resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      this.updateGrid({ width, height })
    })
    this.resizeObserver.observe(this.gridContainer.nativeElement)
  }
  
  ngOnDestroy() {
    this.resizeObserver?.disconnect()
  }
  
  updateGrid(dimensions: { width: number; height: number }) {
    this.grid = this.gridService.createMeetGrid({
      dimensions,
      count: this.participants.length,
      aspectRatio: '16:9',
      gap: 8,
      layoutMode: 'gallery',
    })
    
    // Animate items
    setTimeout(() => {
      this.gridItems.forEach((item, index) => {
        const position = this.grid!.getPosition(index)
        const size = this.grid!.getItemDimensions(index)
        animateGridItem(item.nativeElement, position, size, 'smooth')
      })
    }, 0)
  }
}
```

## API

### `createGridService()`

Factory function that returns a grid service instance.

```typescript
const gridService = createGridService()

const grid = gridService.createMeetGrid({
  dimensions: { width: 800, height: 600 },
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
  layoutMode: 'gallery',
})
```

### `animateGridItem(element, position, dimensions, preset)`

Animates an element to its grid position using Motion.

```typescript
import { animateGridItem } from '@meet-layout-grid/angular'

// Get element via ViewChild
animateGridItem(
  element.nativeElement,
  { top: 100, left: 50 },
  { width: 320, height: 180 },
  'smooth' // 'snappy' | 'smooth' | 'gentle' | 'bouncy'
)
```

## Layout Modes

- **gallery** - Equal-sized tiles
- **speaker** - Active speaker larger
- **spotlight** - Single participant focus
- **sidebar** - Main view + thumbnails

## License

MIT
