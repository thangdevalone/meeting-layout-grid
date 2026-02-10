import { ref, computed, watch, onMounted, onUnmounted, Ref, ComputedRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import {
    GridDimensions,
    MeetGridOptions,
    MeetGridResult,
    createMeetGrid,
    getSpringConfig,
    SpringPreset,
} from '@thangdevalone/meeting-grid-layout-core'

// ============================================
// Composables
// ============================================

/**
 * Vue composable to track element dimensions using ResizeObserver.
 * @param elementRef A ref to the target element
 * @returns Reactive dimensions object
 */
export function useGridDimensions(
    elementRef: Ref<HTMLElement | null | undefined>
): ComputedRef<GridDimensions> {
    const width = ref(0)
    const height = ref(0)

    useResizeObserver(elementRef, (entries) => {
        const entry = entries[0]
        if (entry) {
            width.value = entry.contentRect.width
            height.value = entry.contentRect.height
        }
    })

    // Get initial dimensions
    onMounted(() => {
        if (elementRef.value) {
            width.value = elementRef.value.clientWidth
            height.value = elementRef.value.clientHeight
        }
    })

    return computed(() => ({
        width: width.value,
        height: height.value,
    }))
}

/**
 * Vue composable for creating a meet-style responsive grid.
 * @param options Reactive or static grid options
 * @returns Reactive grid result
 */
export function useMeetGrid(
    options: Ref<MeetGridOptions> | ComputedRef<MeetGridOptions> | (() => MeetGridOptions)
): ComputedRef<MeetGridResult> {
    const getOptions = typeof options === 'function' ? options : () => options.value

    return computed(() => {
        const opts = getOptions()
        return createMeetGrid(opts)
    })
}

/**
 * Composable to get animation configuration for Motion
 */
export function useGridAnimation(preset: SpringPreset = 'smooth') {
    return computed(() => getSpringConfig(preset))
}

/**
 * Composable to get position for a specific grid item index
 */
export function useGridItemPosition(
    grid: ComputedRef<MeetGridResult>,
    index: Ref<number> | ComputedRef<number> | number
) {
    const getIndex = () => (typeof index === 'number' ? index : index.value)

    const position = computed(() => grid.value.getPosition(getIndex()))
    const dimensions = computed(() => grid.value.getItemDimensions(getIndex()))
    const isMain = computed(() => grid.value.isMainItem(getIndex()))
    const isHidden = computed(() => {
        return grid.value.layoutMode === 'spotlight' && !isMain.value
    })

    return {
        position,
        dimensions,
        isMain,
        isHidden,
    }
}

// Re-export types and utilities from core
export type {
    GridDimensions,
    Position,
    GridOptions,
    MeetGridOptions,
    MeetGridResult,
    LayoutMode,
    SpringPreset,
} from '@thangdevalone/meeting-grid-layout-core'

export {
    createGrid,
    createMeetGrid,
    getGridItemDimensions,
    createGridItemPositioner,
    getSpringConfig,
    springPresets,
    getAspectRatio,
} from '@thangdevalone/meeting-grid-layout-core'
