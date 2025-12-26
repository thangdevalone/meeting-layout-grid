/**
 * @meet-layout-grid/angular
 * 
 * Angular integration for meet-layout-grid.
 * 
 * NOTE: This package provides core functions and types.
 * For Angular-specific usage, create your own service/directives
 * using these exported functions.
 */

// Re-export everything from core
export type {
    GridDimensions,
    Position,
    GridOptions,
    MeetGridOptions,
    MeetGridResult,
    LayoutMode,
    SpringPreset,
} from '@meet-layout-grid/core'

export {
    createGrid,
    createMeetGrid,
    getGridItemDimensions,
    createGridItemPositioner,
    getSpringConfig,
    springPresets,
    getAspectRatio,
} from '@meet-layout-grid/core'

// Angular-specific utilities
export { animateGridItem, createGridService } from './angular-utils'
