import React, { ReactNode, useRef, forwardRef, HTMLAttributes, CSSProperties } from 'react'
import { motion, HTMLMotionProps, Transition, useMotionValue, animate } from 'motion/react'
import {
  MeetGridOptions,
  LayoutMode,
  SpringPreset,
  getSpringConfig,
  ItemAspectRatio,
  ContentDimensions,
} from '@thangdevalone/meet-layout-grid-core'
import { useGridDimensions, useMeetGrid, GridContext, useGridContext } from './hooks'

// ============================================
// GridContainer Component
// ============================================

export interface GridContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Children to render inside the grid */
  children: ReactNode
  /** Aspect ratio in format "width:height" (e.g., "16:9") */
  aspectRatio?: string
  /** Gap between items in pixels */
  gap?: number
  /** Number of items (if not using GridItem children) */
  count?: number
  /** Layout mode */
  layoutMode?: LayoutMode
  /** Index of pinned/focused item (main participant for pin/spotlight modes) */
  pinnedIndex?: number
  /**
   * Position of "others" thumbnails when a participant is pinned.
   * In portrait containers, this is forced to 'bottom'.
   * @default 'right'
   */
  othersPosition?: 'left' | 'right' | 'top' | 'bottom'
  /** Spring animation preset */
  springPreset?: SpringPreset
  /** Custom container style */
  style?: CSSProperties
  /** Additional class name */
  className?: string
  /** Maximum items per page for pagination (0 = no pagination) */
  maxItemsPerPage?: number
  /** Current page index (0-based) for pagination */
  currentPage?: number
  /** Maximum visible items (0 = show all). In gallery mode without pin: limits all items. With pin: limits "others". */
  maxVisible?: number
  /** Current page for visible items (0-based), used when maxVisible > 0 */
  currentVisiblePage?: number
  /**
   * Per-item aspect ratio configurations.
   * Use different ratios for mobile (9:16), desktop (16:9).
   * @example ['16:9', '9:16', undefined]
   */
  itemAspectRatios?: (ItemAspectRatio | undefined)[]
}

/**
 * Container component for the meet grid.
 * Provides grid context to child GridItem components.
 */
export const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(function GridContainer(
  {
    children,
    aspectRatio = '16:9',
    gap = 8,
    count,
    layoutMode = 'gallery',
    pinnedIndex,
    othersPosition,
    springPreset = 'smooth',
    style,
    className,
    maxItemsPerPage,
    currentPage,
    maxVisible,
    currentVisiblePage,
    itemAspectRatios,

    ...props
  },
  forwardedRef
) {
  const internalRef = useRef<HTMLDivElement>(null)
  const ref = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef
  const dimensions = useGridDimensions(ref)

  // Count children if count not provided
  const childCount = count ?? React.Children.count(children)

  const gridOptions: MeetGridOptions = {
    dimensions,
    count: childCount,
    aspectRatio,
    gap,
    layoutMode,
    pinnedIndex,
    othersPosition,
    maxItemsPerPage,
    currentPage,
    maxVisible,
    currentVisiblePage,
    itemAspectRatios,
  }

  const grid = useMeetGrid(gridOptions)

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    ...style,
  }

  return (
    <GridContext.Provider value={{ dimensions, grid, springPreset }}>
      <div ref={ref} style={containerStyle} className={className} {...props}>
        {children}
      </div>
    </GridContext.Provider>
  )
})

// ============================================
// GridItem Component
// ============================================

export interface GridItemProps extends Omit<
  HTMLMotionProps<'div'>,
  'animate' | 'initial' | 'transition' | 'children'
> {
  /** Index of this item in the grid */
  index: number
  /**
   * Children to render inside the item.
   * Can be a ReactNode or a render function that receives contentDimensions and visibility info.
   * @example
   * // Simple usage
   * <GridItem index={0}><Video /></GridItem>
   *
   * // With contentDimensions for flexible aspect ratios
   * <GridItem index={0}>
   *   {({ contentDimensions }) => (
   *     <Video style={{
   *       width: contentDimensions.width,
   *       height: contentDimensions.height,
   *       marginTop: contentDimensions.offsetTop,
   *       marginLeft: contentDimensions.offsetLeft
   *     }} />
   *   )}
   * </GridItem>
   *
   * // With hidden count for '+X more' indicator
   * <GridItem index={index}>
   *   {({ isLastVisibleOther, hiddenCount }) => (
   *     <div>
   *       {isLastVisibleOther && hiddenCount > 0 && (
   *         <span className="more-indicator">+{hiddenCount}</span>
   *       )}
   *     </div>
   *   )}
   * </GridItem>
   */
  children:
    | ReactNode
    | ((props: {
        contentDimensions: ContentDimensions
        /** True if this is the last visible item in the "others" section */
        isLastVisibleOther: boolean
        /** Number of hidden items (for '+X more' indicator) */
        hiddenCount: number
      }) => ReactNode)
  /** Optional item-specific aspect ratio (overrides itemAspectRatios from container) */
  itemAspectRatio?: ItemAspectRatio
  /** Custom transition override */
  transition?: Transition
  /** Whether to disable animations */
  disableAnimation?: boolean
  /** Additional class name */
  className?: string
  /** Custom style (merged with animated styles) */
  style?: CSSProperties
}

/**
 * Grid item component with Motion animations.
 * Automatically positions itself based on index in the grid.
 */
export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(function GridItem(
  {
    index,
    children,
    itemAspectRatio,
    transition: customTransition,
    disableAnimation = false,
    className,
    style,
    ...props
  },
  ref
) {
  const { grid, springPreset } = useGridContext()

  if (!grid) {
    return null
  }

  // Hide items not visible (pagination or mode-based hiding)
  if (!grid.isItemVisible(index)) {
    return null
  }

  // Get position and dimensions directly from grid
  const { top, left } = grid.getPosition(index)
  const { width, height } = grid.getItemDimensions(index)
  const contentDimensions = grid.getItemContentDimensions(index, itemAspectRatio)
  const isMain = grid.isMainItem(index)

  // Hide items in spotlight mode if not the main item
  if (grid.layoutMode === 'spotlight' && !isMain) {
    return null
  }

  const springConfig = getSpringConfig(springPreset)
  const transition: Transition = customTransition ?? {
    type: springConfig.type,
    stiffness: springConfig.stiffness,
    damping: springConfig.damping,
  }

  const animatedStyle = {
    position: 'absolute' as const,
    width,
    height,
    top,
    left,
  }

  // Calculate if this is the last visible "other" item
  const lastVisibleOthersIndex = grid.getLastVisibleOthersIndex()
  const isLastVisibleOther = index === lastVisibleOthersIndex
  const hiddenCount = grid.hiddenCount

  // Render children - support both ReactNode and render function
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children({ contentDimensions, isLastVisibleOther, hiddenCount })
    }
    return children
  }

  if (disableAnimation) {
    return (
      <div
        ref={ref}
        style={{ ...animatedStyle, ...style }}
        className={className}
        data-grid-index={index}
        data-grid-main={isMain}
        {...(props as HTMLAttributes<HTMLDivElement>)}
      >
        {renderChildren()}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      layout
      initial={false}
      animate={animatedStyle}
      transition={transition}
      style={style}
      className={className}
      data-grid-index={index}
      data-grid-main={isMain}
      {...props}
    >
      {renderChildren()}
    </motion.div>
  )
})

// ============================================
// FloatingGridItem Component (Draggable with Corner Snap)
// ============================================

export interface FloatingGridItemProps extends Omit<
  HTMLMotionProps<'div'>,
  'animate' | 'initial' | 'children'
> {
  /** Children to render inside the floating item */
  children: ReactNode
  /** Width of the floating item */
  width?: number
  /** Height of the floating item */
  height?: number
  /** Initial position (x, y from container edges) */
  initialPosition?: { x: number; y: number }
  /** Which corner to anchor: 'top-left', 'top-right', 'bottom-left', 'bottom-right' */
  anchor?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Whether the item is visible */
  visible?: boolean
  /** Padding from container edges */
  edgePadding?: number
  /** Callback when anchor changes after snap */
  onAnchorChange?: (anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void
  /** Custom transition */
  transition?: Transition
  /** Border radius */
  borderRadius?: number
  /** Box shadow */
  boxShadow?: string
  /** Additional class name */
  className?: string
  /** Custom style */
  style?: CSSProperties
}

/**
 * Floating Grid Item component that can be dragged around the screen.
 * Snaps to the nearest corner when released (like iOS/Android PiP).
 * Perfect for Picture-in-Picture style floating video in zoom mode.
 */
export const FloatingGridItem = forwardRef<HTMLDivElement, FloatingGridItemProps>(
  function FloatingGridItem(
    {
      children,
      width = 120,
      height = 160,
      initialPosition = { x: 16, y: 16 },
      anchor: initialAnchor = 'bottom-right',
      visible = true,
      edgePadding = 12,
      onAnchorChange,
      transition,
      borderRadius = 12,
      boxShadow = '0 4px 20px rgba(0,0,0,0.3)',
      className,
      style,
      ...props
    },
    ref
  ) {
    const { dimensions } = useGridContext()
    const [currentAnchor, setCurrentAnchor] = React.useState(initialAnchor)

    // Use motion values for direct control over position
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const [isInitialized, setIsInitialized] = React.useState(false)

    // Calculate corner positions
    const getCornerPosition = React.useCallback(
      (corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
        const padding = edgePadding + initialPosition.x

        switch (corner) {
          case 'top-left':
            return { x: padding, y: padding }
          case 'top-right':
            return { x: dimensions.width - width - padding, y: padding }
          case 'bottom-left':
            return { x: padding, y: dimensions.height - height - padding }
          case 'bottom-right':
          default:
            return {
              x: dimensions.width - width - padding,
              y: dimensions.height - height - padding,
            }
        }
      },
      [dimensions.width, dimensions.height, width, height, edgePadding, initialPosition.x]
    )

    // Initialize position when dimensions are available
    React.useEffect(() => {
      if (dimensions.width > 0 && dimensions.height > 0 && !isInitialized) {
        const pos = getCornerPosition(currentAnchor)
        x.set(pos.x)
        y.set(pos.y)
        setIsInitialized(true)
      }
    }, [dimensions.width, dimensions.height, currentAnchor, getCornerPosition, isInitialized, x, y])

    // Update position when anchor changes (after initialization)
    React.useEffect(() => {
      if (isInitialized && dimensions.width > 0 && dimensions.height > 0) {
        const pos = getCornerPosition(currentAnchor)
        const springConfig = { type: 'spring' as const, stiffness: 400, damping: 30 }
        animate(x, pos.x, springConfig)
        animate(y, pos.y, springConfig)
      }
    }, [currentAnchor, dimensions.width, dimensions.height, getCornerPosition, isInitialized, x, y])

    if (!visible || dimensions.width === 0 || dimensions.height === 0) return null

    // Find nearest corner based on current position
    const findNearestCorner = (
      posX: number,
      posY: number
    ): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
      const centerX = posX + width / 2
      const centerY = posY + height / 2
      const containerCenterX = dimensions.width / 2
      const containerCenterY = dimensions.height / 2

      const isLeft = centerX < containerCenterX
      const isTop = centerY < containerCenterY

      if (isTop && isLeft) return 'top-left'
      if (isTop && !isLeft) return 'top-right'
      if (!isTop && isLeft) return 'bottom-left'
      return 'bottom-right'
    }

    // Constrain position within container bounds (for drag)
    const dragConstraints = {
      left: edgePadding,
      right: dimensions.width - width - edgePadding,
      top: edgePadding,
      bottom: dimensions.height - height - edgePadding,
    }

    const floatingStyle: CSSProperties = {
      position: 'absolute',
      width,
      height,
      borderRadius,
      boxShadow,
      overflow: 'hidden',
      cursor: 'grab',
      zIndex: 100,
      touchAction: 'none',
      left: 0,
      top: 0,
      ...style,
    }

    const handleDragEnd = () => {
      // Get current position from motion values
      const currentX = x.get()
      const currentY = y.get()

      // Find nearest corner and snap
      const nearestCorner = findNearestCorner(currentX, currentY)

      // Update anchor state
      setCurrentAnchor(nearestCorner)
      onAnchorChange?.(nearestCorner)

      // Animate to corner position
      const snapPos = getCornerPosition(nearestCorner)
      const springConfig = { type: 'spring' as const, stiffness: 400, damping: 30 }
      animate(x, snapPos.x, springConfig)
      animate(y, snapPos.y, springConfig)
    }

    return (
      <motion.div
        ref={ref}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={dragConstraints}
        style={{ ...floatingStyle, x, y }}
        className={className}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing', scale: 1.05, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        transition={transition ?? { type: 'spring', stiffness: 400, damping: 30 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

// ============================================
// Utility Components
// ============================================

export interface GridOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether to show the overlay */
  visible?: boolean
  /** Overlay background color */
  backgroundColor?: string
}

/**
 * Overlay component for grid items (e.g., for muted indicator, name label)
 */
export const GridOverlay = forwardRef<HTMLDivElement, GridOverlayProps>(function GridOverlay(
  { visible = true, backgroundColor = 'rgba(0,0,0,0.5)', children, style, ...props },
  ref
) {
  if (!visible) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
})
