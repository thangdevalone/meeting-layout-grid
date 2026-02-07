import { RefObject, useEffect, useMemo, useState, createContext, useContext } from 'react'
import {
  GridDimensions,
  MeetGridOptions,
  MeetGridResult,
  createMeetGrid,
  getSpringConfig,
  SpringPreset,
} from '@thangdevalone/meet-layout-grid-core'

// ============================================
// Context
// ============================================

interface GridContextValue {
  dimensions: GridDimensions
  grid: MeetGridResult | null
  springPreset: SpringPreset
}

const GridContext = createContext<GridContextValue | null>(null)

/**
 * Hook to access the grid context
 */
export function useGridContext(): GridContextValue {
  const context = useContext(GridContext)
  if (!context) {
    throw new Error('useGridContext must be used within a GridContainer')
  }
  return context
}

export { GridContext }

// ============================================
// Hooks
// ============================================

/**
 * A React hook to calculate dimensions of an element using ResizeObserver.
 * @param ref An element ref
 * @returns Dimensions of the element
 */
export function useGridDimensions(ref: RefObject<HTMLElement | null>): GridDimensions {
  const [dimensions, setDimensions] = useState<GridDimensions>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { clientWidth: width, clientHeight: height } = entry.target
        setDimensions((prev) => {
          if (prev.width === width && prev.height === height) {
            return prev
          }
          return { width, height }
        })
      }
    })

    observer.observe(element)

    // Get initial dimensions
    setDimensions({
      width: element.clientWidth,
      height: element.clientHeight,
    })

    return () => {
      observer.disconnect()
    }
  }, [ref])

  return dimensions
}

/**
 * React hook for creating a meet-style responsive grid.
 * @param options Grid options including dimensions, count, aspectRatio, gap, and layoutMode
 * @returns Grid result with width, height, and position getter
 */
export function useMeetGrid(options: MeetGridOptions): MeetGridResult {
  // Serialize itemAspectRatios for dependency comparison
  const itemAspectRatiosKey = options.itemAspectRatios?.join(',') ?? ''

  return useMemo(() => {
    return createMeetGrid(options)
  }, [
    options.dimensions.width,
    options.dimensions.height,
    options.count,
    options.aspectRatio,
    options.gap,
    options.layoutMode,
    options.pinnedIndex,
    options.othersPosition,
    options.maxItemsPerPage,
    options.currentPage,
    options.maxVisible,
    options.currentVisiblePage,
    itemAspectRatiosKey,
  ])
}

/**
 * Hook to get animation configuration for Motion
 */
export function useGridAnimation(preset: SpringPreset = 'smooth') {
  return useMemo(() => getSpringConfig(preset), [preset])
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
} from '@thangdevalone/meet-layout-grid-core'

export {
  createGrid,
  createMeetGrid,
  getGridItemDimensions,
  createGridItemPositioner,
  getSpringConfig,
  springPresets,
} from '@thangdevalone/meet-layout-grid-core'
