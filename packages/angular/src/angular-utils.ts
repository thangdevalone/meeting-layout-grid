import { animate, AnimationControls } from 'motion'
import {
    MeetGridOptions,
    MeetGridResult,
    createMeetGrid,
    createGrid,
    GridOptions,
    GridResult,
    getSpringConfig,
    SpringPreset,
} from '@meet-layout-grid/core'

/**
 * Factory function to create a grid service instance.
 * Use this in Angular's provider or directly in components.
 * 
 * @example
 * ```typescript
 * // In a component
 * private gridService = createGridService()
 * 
 * updateGrid(dimensions: { width: number; height: number }) {
 *   this.grid = this.gridService.createMeetGrid({
 *     dimensions,
 *     count: this.participants.length,
 *     aspectRatio: '16:9',
 *     gap: 8,
 *     layoutMode: 'gallery',
 *   })
 * }
 * ```
 */
export function createGridService() {
    return {
        createMeetGrid(options: MeetGridOptions): MeetGridResult {
            return createMeetGrid(options)
        },
        createGrid(options: GridOptions): GridResult {
            return createGrid(options)
        },
        getSpringConfig(preset: SpringPreset = 'smooth') {
            return getSpringConfig(preset)
        },
    }
}

/**
 * Animate a grid item element to its new position.
 * Use this with Angular's ViewChild or ElementRef.
 * 
 * @param element - The HTML element to animate
 * @param position - The target position { top, left }
 * @param dimensions - The target dimensions { width, height }
 * @param preset - Spring animation preset
 * @returns Animation controls
 * 
 * @example
 * ```typescript
 * // In a component
 * @ViewChild('gridItem') gridItemRef!: ElementRef<HTMLElement>
 * 
 * updateItemPosition(index: number) {
 *   const { top, left } = this.grid.getPosition(index)
 *   const { width, height } = this.grid.getItemDimensions(index)
 *   
 *   animateGridItem(
 *     this.gridItemRef.nativeElement,
 *     { top, left },
 *     { width, height },
 *     'smooth'
 *   )
 * }
 * ```
 */
export function animateGridItem(
    element: HTMLElement,
    position: { top: number; left: number },
    dimensions: { width: number; height: number },
    preset: SpringPreset = 'smooth'
): AnimationControls {
    const springConfig = getSpringConfig(preset)

    return animate(
        element,
        {
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            top: `${position.top}px`,
            left: `${position.left}px`,
        },
        {
            type: springConfig.type,
            stiffness: springConfig.stiffness,
            damping: springConfig.damping,
        }
    )
}

// Type exports for convenience
export type GridService = ReturnType<typeof createGridService>
