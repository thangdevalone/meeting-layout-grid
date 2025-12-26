import { Component, OnInit, OnDestroy, ElementRef, ViewChild, QueryList, ViewChildren } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
    createGridService,
    animateGridItem,
    MeetGridResult,
    LayoutMode,
} from '@meet-layout-grid/angular'

interface Participant {
    id: number
    name: string
    gradient: string
    initials: string
}

function getRandomGradient(seed: number): string {
    const hue1 = (seed * 137) % 360
    const hue2 = (hue1 + 40) % 360
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 45%) 0%, hsl(${hue2}, 70%, 35%) 100%)`
}

function createParticipant(index: number): Participant {
    return {
        id: index,
        name: index === 0 ? 'You' : `User ${index}`,
        gradient: getRandomGradient(index),
        initials: index === 0 ? 'Y' : `U${index}`,
    }
}

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="app">
      <!-- Header with controls -->
      <header class="header">
        <div>
          <h1 class="header-title">Meet Layout Grid</h1>
          <p class="header-subtitle">Angular Demo with Motion Animations</p>
        </div>

        <div class="controls">
          <!-- Participants control -->
          <div class="control-group">
            <span class="control-label">Participants</span>
            <div class="control-buttons">
              <button class="btn btn-icon" (click)="removeParticipant()">−</button>
              <span class="participant-count">{{ participants.length }}</span>
              <button class="btn btn-icon" (click)="addParticipant()">+</button>
            </div>
          </div>

          <!-- Layout mode -->
          <div class="control-group">
            <span class="control-label">Layout</span>
            <div class="control-buttons">
              <button
                *ngFor="let mode of layoutModes"
                [class.active]="layoutMode === mode.value"
                class="btn"
                (click)="setLayoutMode(mode.value)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <!-- Aspect ratio -->
          <div class="control-group">
            <span class="control-label">Aspect Ratio</span>
            <div class="control-buttons">
              <button
                *ngFor="let ratio of aspectRatios"
                [class.active]="aspectRatio === ratio"
                class="btn"
                (click)="setAspectRatio(ratio)"
              >
                {{ ratio }}
              </button>
            </div>
          </div>

          <!-- Gap control -->
          <div class="control-group">
            <span class="control-label">Gap</span>
            <div class="control-buttons">
              <button class="btn btn-icon" (click)="decreaseGap()">−</button>
              <span class="participant-count">{{ gap }}px</span>
              <button class="btn btn-icon" (click)="increaseGap()">+</button>
            </div>
          </div>

          <!-- Speaker change -->
          <div class="control-group" *ngIf="showSpeakerControl">
            <span class="control-label">Active Speaker</span>
            <div class="control-buttons">
              <button class="btn" (click)="nextSpeaker()">Next Speaker →</button>
            </div>
          </div>
        </div>
      </header>

      <!-- Grid -->
      <div class="grid-wrapper">
        <div class="grid-container" #gridContainer>
          <div
            *ngFor="let participant of participants; let i = index"
            #gridItem
            class="grid-item-wrapper"
            [attr.data-index]="i"
            [style.display]="isItemHidden(i) ? 'none' : 'block'"
          >
            <div class="grid-item" [style.background]="participant.gradient">
              <!-- Badge for speaker -->
              <div
                *ngIf="i === speakerIndex && layoutMode !== 'gallery'"
                class="item-badge speaker"
              >
                🎤 Speaking
              </div>

              <div class="grid-item-content">
                <div class="avatar">{{ participant.initials }}</div>
                <span class="participant-name">{{ participant.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .grid-item-wrapper {
      position: absolute;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
    @ViewChild('gridContainer', { static: true }) gridContainer!: ElementRef<HTMLElement>
    @ViewChildren('gridItem') gridItems!: QueryList<ElementRef<HTMLElement>>

    participants: Participant[] = []
    layoutMode: LayoutMode = 'gallery'
    aspectRatio = '16:9'
    gap = 12
    speakerIndex = 0
    grid: MeetGridResult | null = null

    private gridService = createGridService()
    private resizeObserver: ResizeObserver | null = null
    private dimensions = { width: 0, height: 0 }

    layoutModes = [
        { value: 'gallery' as LayoutMode, label: 'Gallery' },
        { value: 'speaker' as LayoutMode, label: 'Speaker' },
        { value: 'spotlight' as LayoutMode, label: 'Spotlight' },
        { value: 'sidebar' as LayoutMode, label: 'Sidebar' },
    ]

    aspectRatios = ['16:9', '4:3', '1:1']

    ngOnInit() {
        // Initialize participants
        for (let i = 0; i < 6; i++) {
            this.participants.push(createParticipant(i))
        }

        // Setup resize observer
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                this.dimensions = {
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                }
                this.updateGrid()
            }
        })

        this.resizeObserver.observe(this.gridContainer.nativeElement)
    }

    ngOnDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
        }
    }

    get showSpeakerControl(): boolean {
        return (
            this.layoutMode === 'speaker' ||
            this.layoutMode === 'spotlight' ||
            this.layoutMode === 'sidebar'
        )
    }

    isItemHidden(index: number): boolean {
        if (!this.grid) return false
        return this.grid.layoutMode === 'spotlight' && !this.grid.isMainItem(index)
    }

    updateGrid() {
        if (this.dimensions.width === 0 || this.dimensions.height === 0) return

        this.grid = this.gridService.createMeetGrid({
            dimensions: this.dimensions,
            count: this.participants.length,
            aspectRatio: this.aspectRatio,
            gap: this.gap,
            layoutMode: this.layoutMode,
            speakerIndex: this.speakerIndex,
            pinnedIndex: this.speakerIndex,
        })

        // Animate grid items
        setTimeout(() => this.animateItems(), 0)
    }

    animateItems() {
        if (!this.grid || !this.gridItems) return

        this.gridItems.forEach((itemRef, index) => {
            const element = itemRef.nativeElement
            const position = this.grid!.getPosition(index)
            const dimensions = this.grid!.getItemDimensions(index)

            animateGridItem(element, position, dimensions, 'smooth')
        })
    }

    addParticipant() {
        this.participants.push(createParticipant(this.participants.length))
        setTimeout(() => this.updateGrid(), 0)
    }

    removeParticipant() {
        if (this.participants.length > 1) {
            this.participants.pop()
            setTimeout(() => this.updateGrid(), 0)
        }
    }

    setLayoutMode(mode: LayoutMode) {
        this.layoutMode = mode
        this.updateGrid()
    }

    setAspectRatio(ratio: string) {
        this.aspectRatio = ratio
        this.updateGrid()
    }

    increaseGap() {
        this.gap += 4
        this.updateGrid()
    }

    decreaseGap() {
        this.gap = Math.max(0, this.gap - 4)
        this.updateGrid()
    }

    nextSpeaker() {
        this.speakerIndex = (this.speakerIndex + 1) % this.participants.length
        this.updateGrid()
    }
}
