import React, { ReactNode, useRef, forwardRef, HTMLAttributes, CSSProperties } from 'react'
import { motion, HTMLMotionProps, Transition, useMotionValue, animate } from 'motion/react'
import {
  MeetGridOptions,
  LayoutMode,
  SpringPreset,
  getSpringConfig,
  ItemAspectRatio,
  ContentDimensions,
} from '@thangdevalone/meeting-grid-layout-core'
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
  /** Custom width for the floating PiP item in 2-person mode */
  floatWidth?: number
  /** Custom height for the floating PiP item in 2-person mode */
  floatHeight?: number
  /**
   * Responsive breakpoints for the floating PiP in 2-person mode.
   * When provided, PiP size auto-adjusts based on container width.
   * Use `DEFAULT_FLOAT_BREAKPOINTS` for a ready-made 5-level responsive config.
   * @example
   * floatBreakpoints={DEFAULT_FLOAT_BREAKPOINTS}
   * floatBreakpoints={[
   *   { minWidth: 0, width: 80, height: 110 },
   *   { minWidth: 600, width: 150, height: 200 },
   * ]}
   */
  floatBreakpoints?: PipBreakpoint[]
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
    floatWidth,
    floatHeight,
    floatBreakpoints,

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
    floatWidth,
    floatHeight,
    floatBreakpoints,
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
        /** True if this item is rendered as a floating PiP */
        isFloat: boolean
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
 * When the grid marks this item as float (2-person mode), renders as a draggable PiP.
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
  const { grid, springPreset, dimensions: containerDimensions } = useGridContext()

  // Compute all grid-derived values upfront (safe even when grid is null)
  // so that hooks below can reference them without conditional returns before hooks
  const isFloat = grid ? grid.floatIndex === index : false
  const isVisible = grid ? grid.isItemVisible(index) : false
  const isMain = grid ? grid.isMainItem(index) : false
  const isHidden =
    !grid || !isVisible || (grid.layoutMode === 'spotlight' && !isMain)

  const position = grid && !isHidden ? grid.getPosition(index) : { top: 0, left: 0 }
  const itemDims = grid && !isHidden ? grid.getItemDimensions(index) : { width: 0, height: 0 }

  // Float mode state
  const floatDims = grid?.floatDimensions ?? { width: 120, height: 160 }
  const [floatAnchor, setFloatAnchor] = React.useState<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('bottom-right')
  const floatX = useMotionValue(0)
  const floatY = useMotionValue(0)
  const [floatInitialized, setFloatInitialized] = React.useState(false)

  const getFloatCornerPos = React.useCallback(
    (corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
      const padding = 12
      const fw = floatDims.width
      const fh = floatDims.height
      switch (corner) {
        case 'top-left':
          return { x: padding, y: padding }
        case 'top-right':
          return { x: containerDimensions.width - fw - padding, y: padding }
        case 'bottom-left':
          return { x: padding, y: containerDimensions.height - fh - padding }
        case 'bottom-right':
        default:
          return {
            x: containerDimensions.width - fw - padding,
            y: containerDimensions.height - fh - padding,
          }
      }
    },
    [containerDimensions.width, containerDimensions.height, floatDims.width, floatDims.height]
  )

  // Reset floatInitialized when item stops floating (e.g., 2→3 participants)
  // so that re-entering float mode (3→2) re-initializes position correctly
  React.useEffect(() => {
    if (!isFloat) {
      setFloatInitialized(false)
    }
  }, [isFloat])

  // Initialize float position
  React.useEffect(() => {
    if (
      isFloat &&
      containerDimensions.width > 0 &&
      containerDimensions.height > 0 &&
      !floatInitialized
    ) {
      const pos = getFloatCornerPos(floatAnchor)
      floatX.set(pos.x)
      floatY.set(pos.y)
      setFloatInitialized(true)
    }
  }, [
    isFloat,
    containerDimensions.width,
    containerDimensions.height,
    floatAnchor,
    getFloatCornerPos,
    floatInitialized,
    floatX,
    floatY,
  ])

  // Update float position when anchor or container size changes
  React.useEffect(() => {
    if (
      isFloat &&
      floatInitialized &&
      containerDimensions.width > 0 &&
      containerDimensions.height > 0
    ) {
      const pos = getFloatCornerPos(floatAnchor)
      const cfg = { type: 'spring' as const, stiffness: 400, damping: 30 }
      animate(floatX, pos.x, cfg)
      animate(floatY, pos.y, cfg)
    }
  }, [
    isFloat,
    floatAnchor,
    containerDimensions.width,
    containerDimensions.height,
    getFloatCornerPos,
    floatInitialized,
    floatX,
    floatY,
  ])

  // ── Grid mode: motion values for position (x/y = CSS transforms, GPU-accelerated) ──
  // Width/height use the animate prop (Motion only supports transforms in style motion values).
  // On mount / mode switch: set position immediately (no fly-in animation).
  // On subsequent changes: animate with spring.
  const gridX = useMotionValue(0)
  const gridY = useMotionValue(0)
  const gridAnimReady = useRef(false)

  const springConfig = getSpringConfig(springPreset)

  React.useEffect(() => {
    // Skip when in float mode or hidden — reset so re-entry initializes correctly
    if (isFloat || isHidden) {
      gridAnimReady.current = false
      return
    }

    if (!gridAnimReady.current) {
      // First time visible in grid mode: set position immediately (no animation)
      gridX.set(position.left)
      gridY.set(position.top)
      gridAnimReady.current = true
    } else {
      // Subsequent changes: spring animate position
      const cfg = {
        type: 'spring' as const,
        stiffness: springConfig.stiffness,
        damping: springConfig.damping,
      }
      animate(gridX, position.left, cfg)
      animate(gridY, position.top, cfg)
    }
  }, [
    position.top,
    position.left,
    isFloat,
    isHidden,
    gridX,
    gridY,
    springConfig.stiffness,
    springConfig.damping,
  ])

  // ── All hooks declared above — safe to do conditional returns below ──

  if (isHidden) {
    return null
  }

  const contentDimensions = grid!.getItemContentDimensions(index, itemAspectRatio)

  const transition: Transition = customTransition ?? {
    type: springConfig.type,
    stiffness: springConfig.stiffness,
    damping: springConfig.damping,
  }

  // Calculate if this is the last visible "other" item
  const lastVisibleOthersIndex = grid!.getLastVisibleOthersIndex()
  const isLastVisibleOther = index === lastVisibleOthersIndex
  const hiddenCount = grid!.hiddenCount

  // Render children - support both ReactNode and render function
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children({ contentDimensions, isLastVisibleOther, hiddenCount, isFloat })
    }
    return children
  }

  // Float mode: render as draggable PiP
  if (isFloat) {
    if (containerDimensions.width === 0 || containerDimensions.height === 0) return null

    const findNearestCorner = (posX: number, posY: number) => {
      const centerX = posX + floatDims.width / 2
      const centerY = posY + floatDims.height / 2
      const isLeft = centerX < containerDimensions.width / 2
      const isTop = centerY < containerDimensions.height / 2
      if (isTop && isLeft) return 'top-left' as const
      if (isTop && !isLeft) return 'top-right' as const
      if (!isTop && isLeft) return 'bottom-left' as const
      return 'bottom-right' as const
    }

    const dragConstraints = {
      left: 12,
      right: containerDimensions.width - floatDims.width - 12,
      top: 12,
      bottom: containerDimensions.height - floatDims.height - 12,
    }

    const handleDragEnd = () => {
      const currentX = floatX.get()
      const currentY = floatY.get()
      const nearestCorner = findNearestCorner(currentX, currentY)
      setFloatAnchor(nearestCorner)
      const snapPos = getFloatCornerPos(nearestCorner)
      const springCfg = { type: 'spring' as const, stiffness: 400, damping: 30 }
      animate(floatX, snapPos.x, springCfg)
      animate(floatY, snapPos.y, springCfg)
    }

    const floatingStyle: CSSProperties = {
      position: 'absolute',
      width: floatDims.width,
      height: floatDims.height,
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      cursor: 'grab',
      zIndex: 100,
      touchAction: 'none',
      left: 0,
      top: 0,
      ...style,
    }

    return (
      <motion.div
        ref={ref}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={dragConstraints}
        style={{ ...floatingStyle, x: floatX, y: floatY }}
        className={className}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing', scale: 1.05, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        data-grid-index={index}
        data-grid-float={true}
        {...props}
      >
        {renderChildren()}
      </motion.div>
    )
  }

  if (disableAnimation) {
    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          width: itemDims.width,
          height: itemDims.height,
          top: position.top,
          left: position.left,
          ...style,
        }}
        className={className}
        data-grid-index={index}
        data-grid-main={isMain}
        {...(props as HTMLAttributes<HTMLDivElement>)}
      >
        {renderChildren()}
      </div>
    )
  }

  // Grid mode: hybrid animation approach
  // - Position: motion values (x/y CSS transforms) → GPU-accelerated, no mount animation
  // - Size: animate prop → spring animation handled by Motion
  // initial = animate on mount → no mount animation for size
  // Subsequent animate changes → Motion springs from previous to new size
  return (
    <motion.div
      ref={ref}
      initial={{ width: itemDims.width, height: itemDims.height }}
      animate={{ width: itemDims.width, height: itemDims.height }}
      transition={transition}
      style={{ position: 'absolute', top: 0, left: 0, x: gridX, y: gridY, ...style }}
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
  /** Width of the floating item (px). Overridden by `breakpoints` when provided. */
  width?: number
  /** Height of the floating item (px). Overridden by `breakpoints` when provided. */
  height?: number
  /**
   * Responsive breakpoints for PiP sizing.
   * When provided, width/height auto-adjust based on container width.
   * Overrides the fixed `width`/`height` props.
   * Use `DEFAULT_FLOAT_BREAKPOINTS` for a ready-made 5-level responsive config.
   *
   * @example
   * // Use default responsive breakpoints
   * breakpoints={DEFAULT_FLOAT_BREAKPOINTS}
   *
   * // Custom breakpoints
   * breakpoints={[
   *   { minWidth: 0, width: 80, height: 110 },
   *   { minWidth: 600, width: 150, height: 200 },
   *   { minWidth: 1200, width: 250, height: 330 },
   * ]}
   */
  breakpoints?: PipBreakpoint[]
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
      breakpoints,
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

    // Resolve responsive size from breakpoints (if provided), otherwise use fixed width/height
    const resolvedSize = React.useMemo(() => {
      if (breakpoints && breakpoints.length > 0 && dimensions.width > 0) {
        return resolveFloatSize(dimensions.width, breakpoints)
      }
      return null
    }, [breakpoints, dimensions.width])

    const effectiveWidth = resolvedSize?.width ?? width
    const effectiveHeight = resolvedSize?.height ?? height

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
            return { x: dimensions.width - effectiveWidth - padding, y: padding }
          case 'bottom-left':
            return { x: padding, y: dimensions.height - effectiveHeight - padding }
          case 'bottom-right':
          default:
            return {
              x: dimensions.width - effectiveWidth - padding,
              y: dimensions.height - effectiveHeight - padding,
            }
        }
      },
      [dimensions.width, dimensions.height, effectiveWidth, effectiveHeight, edgePadding, initialPosition.x]
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

    // Update position when anchor or effective size changes (after initialization)
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
      const centerX = posX + effectiveWidth / 2
      const centerY = posY + effectiveHeight / 2
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
      right: dimensions.width - effectiveWidth - edgePadding,
      top: edgePadding,
      bottom: dimensions.height - effectiveHeight - edgePadding,
    }

    const floatingStyle: CSSProperties = {
      position: 'absolute',
      width: effectiveWidth,
      height: effectiveHeight,
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
