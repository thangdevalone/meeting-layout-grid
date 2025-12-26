import {
    Directive,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    Output,
    EventEmitter,
    NgZone,
} from '@angular/core'
import { animate, AnimationControls } from 'motion'
import {
    MeetGridResult,
    SpringPreset,
    getSpringConfig,
} from '@meet-layout-grid/core'

/**
 * Directive to position and animate a grid item.
 * Apply to elements inside a grid container.
 *
 * @example
 * ```html
 * <div class="grid-container" #container>
 *   <div *ngFor="let item of items; let i = index"
 *        [meetGridItem]="i"
 *        [grid]="grid">
 *     {{ item.name }}
 *   </div>
 * </div>
 * ```
 */
@Directive({
    selector: '[meetGridItem]',
    standalone: true,
})
export class MeetGridItemDirective implements OnInit, OnChanges, OnDestroy {
    /** Index of this item in the grid */
    @Input('meetGridItem') index: number = 0

    /** Grid result from MeetGridService.createMeetGrid() */
    @Input() grid!: MeetGridResult

    /** Spring animation preset */
    @Input() springPreset: SpringPreset = 'smooth'

    /** Whether to disable animations */
    @Input() disableAnimation: boolean = false

    /** Emits when item is the main/featured item */
    @Output() isMainChange = new EventEmitter<boolean>()

    private animationControls: AnimationControls | null = null
    private isHidden = false

    constructor(
        private el: ElementRef<HTMLElement>,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        // Set initial position without animation
        this.el.nativeElement.style.position = 'absolute'
        this.updatePosition(false)
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['grid'] || changes['index'] || changes['springPreset']) {
            this.updatePosition(!changes['grid']?.firstChange)
        }
    }

    ngOnDestroy(): void {
        this.stopAnimation()
    }

    private updatePosition(animate: boolean = true): void {
        if (!this.grid) return

        const position = this.grid.getPosition(this.index)
        const dimensions = this.grid.getItemDimensions(this.index)
        const isMain = this.grid.isMainItem(this.index)

        // Emit main item status change
        this.isMainChange.emit(isMain)

        // Handle spotlight mode visibility
        if (this.grid.layoutMode === 'spotlight' && !isMain) {
            this.hide()
            return
        } else {
            this.show()
        }

        const styles = {
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            top: `${position.top}px`,
            left: `${position.left}px`,
        }

        if (!animate || this.disableAnimation) {
            // Apply styles directly without animation
            Object.assign(this.el.nativeElement.style, styles)
        } else {
            // Animate using Motion
            this.animateToPosition(styles)
        }
    }

    private animateToPosition(styles: Record<string, string>): void {
        this.stopAnimation()

        const springConfig = getSpringConfig(this.springPreset)

        // Run animation outside Angular zone for performance
        this.ngZone.runOutsideAngular(() => {
            this.animationControls = animate(
                this.el.nativeElement,
                {
                    width: styles.width,
                    height: styles.height,
                    top: styles.top,
                    left: styles.left,
                },
                {
                    type: springConfig.type,
                    stiffness: springConfig.stiffness,
                    damping: springConfig.damping,
                }
            )
        })
    }

    private stopAnimation(): void {
        if (this.animationControls) {
            this.animationControls.stop()
            this.animationControls = null
        }
    }

    private hide(): void {
        if (!this.isHidden) {
            this.isHidden = true
            this.el.nativeElement.style.display = 'none'
        }
    }

    private show(): void {
        if (this.isHidden) {
            this.isHidden = false
            this.el.nativeElement.style.display = ''
        }
    }
}

/**
 * Directive to observe element dimensions using ResizeObserver.
 * Emits dimension changes for use with MeetGridService.
 *
 * @example
 * ```html
 * <div meetGridContainer (dimensionsChange)="onDimensionsChange($event)">
 *   ...
 * </div>
 * ```
 */
@Directive({
    selector: '[meetGridContainer]',
    standalone: true,
})
export class MeetGridContainerDirective implements OnInit, OnDestroy {
    /** Emits when container dimensions change */
    @Output() dimensionsChange = new EventEmitter<{ width: number; height: number }>()

    private resizeObserver: ResizeObserver | null = null

    constructor(
        private el: ElementRef<HTMLElement>,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        // Set container styles
        this.el.nativeElement.style.position = 'relative'
        this.el.nativeElement.style.overflow = 'hidden'

        // Observe size changes
        this.ngZone.runOutsideAngular(() => {
            this.resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { clientWidth: width, clientHeight: height } = entry.target
                    this.ngZone.run(() => {
                        this.dimensionsChange.emit({ width, height })
                    })
                }
            })

            this.resizeObserver.observe(this.el.nativeElement)
        })

        // Emit initial dimensions
        const { clientWidth: width, clientHeight: height } = this.el.nativeElement
        this.dimensionsChange.emit({ width, height })
    }

    ngOnDestroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }
    }
}
