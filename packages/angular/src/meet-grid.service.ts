import { Injectable } from '@angular/core'
import {
    GridDimensions,
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
 * Angular service for creating meet-style responsive grids.
 * Provides methods for grid calculations and animation configurations.
 */
@Injectable({
    providedIn: 'root',
})
export class MeetGridService {
    /**
     * Create a meet-style grid with support for different layout modes.
     * @param options Grid options including dimensions, count, aspectRatio, gap, and layoutMode
     * @returns Grid result with width, height, and position getter
     */
    createMeetGrid(options: MeetGridOptions): MeetGridResult {
        return createMeetGrid(options)
    }

    /**
     * Create a basic responsive grid.
     * @param options Grid options
     * @returns Grid result
     */
    createGrid(options: GridOptions): GridResult {
        return createGrid(options)
    }

    /**
     * Get spring animation configuration for Motion.
     * @param preset Spring preset name
     * @returns Spring configuration object
     */
    getSpringConfig(preset: SpringPreset = 'smooth') {
        return getSpringConfig(preset)
    }

    /**
     * Get animation options object for use with Motion's animate function.
     * @param preset Spring preset name
     * @returns Animation options for Motion
     */
    getAnimationOptions(preset: SpringPreset = 'smooth') {
        const config = getSpringConfig(preset)
        return {
            type: config.type,
            stiffness: config.stiffness,
            damping: config.damping,
        }
    }
}
