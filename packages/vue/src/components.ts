import {
  getSpringConfig,
  GridDimensions,
  ItemAspectRatio,
  LayoutMode,
  MeetGridResult,
  PipBreakpoint,
  resolveFloatSize,
  SpringPreset,
} from '@thangdevalone/meeting-grid-layout-core'
import { animate, motion, useMotionValue } from 'motion-v'
import {
  computed,
  ComputedRef,
  defineComponent,
  h,
  inject,
  InjectionKey,
  PropType,
  provide,
  ref,
  Ref,
  watch,
} from 'vue'
import { useGridDimensions, useMeetGrid } from './composables'

// ============================================
// Injection Keys
// ============================================

export interface GridContextValue {
  grid: ComputedRef<MeetGridResult>
  springPreset: SpringPreset
  dimensions: Ref<GridDimensions>
}

export const GridContextKey: InjectionKey<GridContextValue> = Symbol('MeetGridContext')

// ============================================
// GridContainer Component
// ============================================

export const GridContainer = defineComponent({
  name: 'GridContainer',
  props: {
    /** Aspect ratio in format "width:height" */
    aspectRatio: {
      type: String,
      default: '16:9',
    },
    /** Gap between items in pixels */
    gap: {
      type: Number,
      default: 8,
    },
    /** Number of items */
    count: {
      type: Number,
      required: true,
    },
    /** Layout mode */
    layoutMode: {
      type: String as PropType<LayoutMode>,
      default: 'gallery',
    },
    /** Index of pinned/focused item (main participant for pin/spotlight modes) */
    pinnedIndex: {
      type: Number,
      default: undefined,
    },
    /**
     * Position of "others" thumbnails when a participant is pinned.
     * In portrait containers, this is forced to 'bottom'.
     * @default 'right'
     */
    othersPosition: {
      type: String as PropType<'left' | 'right' | 'top' | 'bottom'>,
      default: 'right',
    },
    /** Spring animation preset */
    springPreset: {
      type: String as PropType<SpringPreset>,
      default: 'smooth',
    },
    /** Maximum items per page for pagination (0 = no pagination) */
    maxItemsPerPage: {
      type: Number,
      default: 0,
    },
    /** Current page index (0-based) for pagination */
    currentPage: {
      type: Number,
      default: 0,
    },
    /** Maximum visible items (0 = show all). In gallery without pin: limits all items. With pin: limits "others". */
    maxVisible: {
      type: Number,
      default: 0,
    },
    /** Current page for visible items (0-based), used when maxVisible > 0 */
    currentVisiblePage: {
      type: Number,
      default: 0,
    },
    /**
     * Per-item aspect ratio configurations.
     * Use different ratios for mobile (9:16), desktop (16:9).
     * @example ['16:9', '9:16', undefined]
     */
    itemAspectRatios: {
      type: Array as PropType<(ItemAspectRatio | undefined)[]>,
      default: undefined,
    },
    /** Custom width for the floating PiP item in 2-person mode */
    floatWidth: {
      type: Number,
      default: undefined,
    },
    /** Custom height for the floating PiP item in 2-person mode */
    floatHeight: {
      type: Number,
      default: undefined,
    },
    /**
     * Responsive breakpoints for the floating PiP in 2-person mode.
     * When provided, PiP size auto-adjusts based on container width.
     * Use `DEFAULT_FLOAT_BREAKPOINTS` for a ready-made 5-level responsive config.
     */
    floatBreakpoints: {
      type: Array as PropType<PipBreakpoint[]>,
      default: undefined,
    },

    /** HTML tag to render */
    tag: {
      type: String,
      default: 'div',
    },
  },
  setup(props, { slots }) {
    const containerRef = ref<HTMLElement | null>(null)
    const dimensions = useGridDimensions(containerRef)

    const gridOptions = computed(() => ({
      dimensions: dimensions.value,
      count: props.count,
      aspectRatio: props.aspectRatio,
      gap: props.gap,
      layoutMode: props.layoutMode,
      pinnedIndex: props.pinnedIndex,
      othersPosition: props.othersPosition,
      maxItemsPerPage: props.maxItemsPerPage,
      currentPage: props.currentPage,
      maxVisible: props.maxVisible,
      currentVisiblePage: props.currentVisiblePage,
      itemAspectRatios: props.itemAspectRatios,
      floatWidth: props.floatWidth,
      floatHeight: props.floatHeight,
      floatBreakpoints: props.floatBreakpoints,
    }))

    const grid = useMeetGrid(gridOptions)

    // Provide context to children
    provide(GridContextKey, {
      grid,
      springPreset: props.springPreset,
      dimensions,
    })

    return () =>
      h(
        props.tag,
        {
          ref: containerRef,
          style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          },
        },
        slots.default?.()
      )
  },
})

// ============================================
// GridItem Component
// ============================================

export const GridItem = defineComponent({
  name: 'GridItem',
  props: {
    /** Index of this item in the grid */
    index: {
      type: Number,
      required: true,
    },
    /** Whether to disable animations */
    disableAnimation: {
      type: Boolean,
      default: false,
    },
    /** Optional item-specific aspect ratio (overrides itemAspectRatios from container) */
    itemAspectRatio: {
      type: String as PropType<ItemAspectRatio>,
      default: undefined,
    },
    /** HTML tag to render */
    tag: {
      type: String,
      default: 'div',
    },
  },
  setup(props, { slots }) {
    const context = inject(GridContextKey)

    if (!context) {
      console.warn('GridItem must be used inside a GridContainer')
      return () => null
    }

    const { grid, springPreset, dimensions: containerDimensions } = context

    const position = computed(() => grid.value.getPosition(props.index))
    const dimensions = computed(() => grid.value.getItemDimensions(props.index))
    const contentDimensions = computed(() =>
      grid.value.getItemContentDimensions(props.index, props.itemAspectRatio)
    )
    const isMain = computed(() => grid.value.isMainItem(props.index))
    const isVisible = computed(() => grid.value.isItemVisible(props.index))
    const isHidden = computed(() => {
      // Hidden if spotlight mode and not main, OR if pagination says not visible
      if (grid.value.layoutMode === 'spotlight' && !isMain.value) return true
      if (!isVisible.value) return true
      return false
    })

    // Float mode detection
    const isFloat = computed(() => grid.value.floatIndex === props.index)
    const floatDims = computed(() => grid.value.floatDimensions ?? { width: 120, height: 160 })

    // Float state — uses motion values like React version
    const floatAnchor = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>(
      'bottom-right'
    )
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const floatInitialized = ref(false)

    const getFloatCornerPos = (
      corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    ) => {
      const padding = 12
      const dims = containerDimensions.value
      const fw = floatDims.value.width
      const fh = floatDims.value.height
      switch (corner) {
        case 'top-left':
          return { x: padding, y: padding }
        case 'top-right':
          return { x: dims.width - fw - padding, y: padding }
        case 'bottom-left':
          return { x: padding, y: dims.height - fh - padding }
        case 'bottom-right':
        default:
          return { x: dims.width - fw - padding, y: dims.height - fh - padding }
      }
    }

    const findFloatNearestCorner = (posX: number, posY: number) => {
      const fw = floatDims.value.width
      const fh = floatDims.value.height
      const centerX = posX + fw / 2
      const centerY = posY + fh / 2
      const dims = containerDimensions.value
      const isLeft = centerX < dims.width / 2
      const isTop = centerY < dims.height / 2
      if (isTop && isLeft) return 'top-left' as const
      if (isTop && !isLeft) return 'top-right' as const
      if (!isTop && isLeft) return 'bottom-left' as const
      return 'bottom-right' as const
    }

    // Reset floatInitialized when item stops floating (e.g., 2→3 participants)
    // so that re-entering float mode (3→2) re-initializes position correctly
    watch(isFloat, (floating) => {
      if (!floating) {
        floatInitialized.value = false
      }
    })

    // Initialize float position when container has dimensions
    watch(
      [isFloat, () => containerDimensions.value.width, () => containerDimensions.value.height],
      ([floating, w, h]) => {
        if (floating && w > 0 && h > 0 && !floatInitialized.value) {
          const pos = getFloatCornerPos(floatAnchor.value)
          x.set(pos.x)
          y.set(pos.y)
          floatInitialized.value = true
        }
      },
      { immediate: true }
    )

    // Update float position when anchor or container size changes
    watch(
      [floatAnchor, () => containerDimensions.value.width, () => containerDimensions.value.height],
      ([, w, h]) => {
        if (isFloat.value && floatInitialized.value && w > 0 && h > 0) {
          const pos = getFloatCornerPos(floatAnchor.value)
          const springCfg = { type: 'spring' as const, stiffness: 400, damping: 30 }
          animate(x, pos.x, springCfg)
          animate(y, pos.y, springCfg)
        }
      }
    )

    // Calculate if this is the last visible "other" item
    const isLastVisibleOther = computed(() => {
      const lastVisibleOthersIndex = grid.value.getLastVisibleOthersIndex()
      return props.index === lastVisibleOthersIndex
    })
    const hiddenCount = computed(() => grid.value.hiddenCount)

    const springConfig = getSpringConfig(springPreset)

    // ── Grid mode: motion values for position (matching React exactly) ──
    // Uses x/y (CSS transforms, GPU-accelerated) for position animation.
    // On mount / mode switch: set position immediately (no fly-in).
    // On subsequent changes: spring animate.
    const gridX = useMotionValue(0)
    const gridY = useMotionValue(0)
    const gridAnimReady = ref(false)

    watch(
      [
        () => position.value.top,
        () => position.value.left,
        isFloat,
        isHidden,
      ],
      ([, , floating, hidden]) => {
        // Skip when in float mode or hidden — reset so re-entry initializes correctly
        if (floating || hidden) {
          gridAnimReady.value = false
          return
        }

        const pos = position.value
        if (!gridAnimReady.value) {
          // First time visible in grid mode: set position immediately (no animation)
          gridX.set(pos.left)
          gridY.set(pos.top)
          gridAnimReady.value = true
        } else {
          // Subsequent changes: spring animate position
          const cfg = {
            type: 'spring' as const,
            stiffness: springConfig.stiffness,
            damping: springConfig.damping,
          }
          animate(gridX, pos.left, cfg)
          animate(gridY, pos.top, cfg)
        }
      },
      { immediate: true }
    )

    // Slot props for render function
    const slotProps = computed(() => ({
      contentDimensions: contentDimensions.value,
      isLastVisibleOther: isLastVisibleOther.value,
      hiddenCount: hiddenCount.value,
      isFloat: isFloat.value,
    }))

    return () => {
      if (isHidden.value) {
        return null
      }

      // Float mode: render as draggable PiP (matching React approach)
      if (isFloat.value) {
        const dims = containerDimensions.value
        if (dims.width === 0 || dims.height === 0) return null

        const dragConstraints = {
          left: 12,
          right: dims.width - floatDims.value.width - 12,
          top: 12,
          bottom: dims.height - floatDims.value.height - 12,
        }

        const handleDragEnd = () => {
          const currentX = x.get()
          const currentY = y.get()
          const nearestCorner = findFloatNearestCorner(currentX, currentY)
          floatAnchor.value = nearestCorner
          const snapPos = getFloatCornerPos(nearestCorner)
          const springCfg = { type: 'spring' as const, stiffness: 400, damping: 30 }
          animate(x, snapPos.x, springCfg)
          animate(y, snapPos.y, springCfg)
        }

        return h(
          motion.div,
          {
            // Key forces Vue to recreate this element when switching float↔grid
            key: `float-${props.index}`,
            drag: true,
            dragMomentum: false,
            dragElastic: 0.1,
            dragConstraints,
            style: {
              position: 'absolute',
              width: `${floatDims.value.width}px`,
              height: `${floatDims.value.height}px`,
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              cursor: 'grab',
              zIndex: 100,
              touchAction: 'none',
              left: 0,
              top: 0,
              x: x,
              y: y,
            },
            whileDrag: { cursor: 'grabbing', scale: 1.05, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
            transition: { type: 'spring', stiffness: 400, damping: 30 },
            'data-grid-index': props.index,
            'data-grid-float': true,
            onDragEnd: handleDragEnd,
          },
          () => slots.default?.(slotProps.value)
        )
      }

      const itemWidth = dimensions.value.width
      const itemHeight = dimensions.value.height

      if (props.disableAnimation) {
        return h(
          props.tag,
          {
            style: {
              position: 'absolute',
              width: `${itemWidth}px`,
              height: `${itemHeight}px`,
              top: `${position.value.top}px`,
              left: `${position.value.left}px`,
            },
            'data-grid-index': props.index,
            'data-grid-main': isMain.value,
          },
          slots.default?.(slotProps.value)
        )
      }

      // Grid mode: position via motion values, size via CSS
      // - Position: x/y motion values (CSS transforms, GPU-accelerated, spring animated by watcher)
      // - Size: CSS style values
      // Key forces Vue to recreate this element when switching float↔grid
      return h(
        motion.div,
        {
          key: `grid-${props.index}`,
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            x: gridX,
            y: gridY,
            width: `${itemWidth}px`,
            height: `${itemHeight}px`,
          },
          'data-grid-index': props.index,
          'data-grid-main': isMain.value,
        },
        () => slots.default?.(slotProps.value)
      )
    }
  },
})

// ============================================
// GridOverlay Component
// ============================================

export const GridOverlay = defineComponent({
  name: 'GridOverlay',
  props: {
    /** Whether to show the overlay */
    visible: {
      type: Boolean,
      default: true,
    },
    /** Background color */
    backgroundColor: {
      type: String,
      default: 'rgba(0,0,0,0.5)',
    },
  },
  setup(props, { slots }) {
    return () => {
      if (!props.visible) {
        return null
      }

      return h(
        'div',
        {
          style: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: props.backgroundColor,
          },
        },
        slots.default?.()
      )
    }
  },
})

// ============================================
// FloatingGridItem Component (Draggable with Corner Snap)
// ============================================

export const FloatingGridItem = defineComponent({
  name: 'FloatingGridItem',
  props: {
    /** Width of the floating item (px). Overridden by `breakpoints` when provided. */
    width: {
      type: Number,
      default: 120,
    },
    /** Height of the floating item (px). Overridden by `breakpoints` when provided. */
    height: {
      type: Number,
      default: 160,
    },
    /**
     * Responsive breakpoints for PiP sizing.
     * When provided, width/height auto-adjust based on container width.
     * Overrides the fixed `width`/`height` props.
     * Use `DEFAULT_FLOAT_BREAKPOINTS` for a ready-made 5-level responsive config.
     */
    breakpoints: {
      type: Array as PropType<PipBreakpoint[]>,
      default: undefined,
    },
    /** Initial position (x, y from container edges) */
    initialPosition: {
      type: Object as PropType<{ x: number; y: number }>,
      default: () => ({ x: 16, y: 16 }),
    },
    /** Which corner to anchor */
    anchor: {
      type: String as PropType<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>,
      default: 'bottom-right',
    },
    /** Whether the item is visible */
    visible: {
      type: Boolean,
      default: true,
    },
    /** Padding from container edges */
    edgePadding: {
      type: Number,
      default: 12,
    },
    /** Border radius */
    borderRadius: {
      type: Number,
      default: 12,
    },
    /** Box shadow */
    boxShadow: {
      type: String,
      default: '0 4px 20px rgba(0,0,0,0.3)',
    },
  },
  emits: ['anchorChange'],
  setup(props, { slots, emit }) {
    const context = inject(GridContextKey)

    if (!context) {
      console.warn('FloatingGridItem must be used inside a GridContainer')
      return () => null
    }

    const { dimensions } = context
    const currentAnchor = ref(props.anchor)

    // Resolve responsive size from breakpoints (if provided), otherwise use fixed width/height
    const effectiveSize = computed(() => {
      if (props.breakpoints && props.breakpoints.length > 0 && dimensions.value.width > 0) {
        return resolveFloatSize(dimensions.value.width, props.breakpoints)
      }
      return { width: props.width, height: props.height }
    })

    // Motion values for position (matching React pattern)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const isInitialized = ref(false)

    // Get container dimensions from context
    const containerDimensions = computed(() => ({
      width: dimensions.value.width,
      height: dimensions.value.height,
    }))

    // Calculate corner positions
    const getCornerPosition = (
      corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    ) => {
      const padding = props.edgePadding + props.initialPosition.x
      const dims = containerDimensions.value
      const ew = effectiveSize.value.width
      const eh = effectiveSize.value.height

      switch (corner) {
        case 'top-left':
          return { x: padding, y: padding }
        case 'top-right':
          return { x: dims.width - ew - padding, y: padding }
        case 'bottom-left':
          return { x: padding, y: dims.height - eh - padding }
        case 'bottom-right':
        default:
          return { x: dims.width - ew - padding, y: dims.height - eh - padding }
      }
    }

    // Find nearest corner based on current position
    const findNearestCorner = (
      posX: number,
      posY: number
    ): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
      const centerX = posX + effectiveSize.value.width / 2
      const centerY = posY + effectiveSize.value.height / 2
      const dims = containerDimensions.value
      const containerCenterX = dims.width / 2
      const containerCenterY = dims.height / 2

      const isLeft = centerX < containerCenterX
      const isTop = centerY < containerCenterY

      if (isTop && isLeft) return 'top-left'
      if (isTop && !isLeft) return 'top-right'
      if (!isTop && isLeft) return 'bottom-left'
      return 'bottom-right'
    }

    // Initialize float position when container has dimensions
    watch(
      [() => containerDimensions.value.width, () => containerDimensions.value.height],
      ([w, h]) => {
        if (w > 0 && h > 0 && !isInitialized.value) {
          const pos = getCornerPosition(currentAnchor.value)
          x.set(pos.x)
          y.set(pos.y)
          isInitialized.value = true
        }
      },
      { immediate: true }
    )

    // Update position when anchor changes (e.g. prop change)
    watch(
      [
        () => props.anchor,
        () => containerDimensions.value.width,
        () => containerDimensions.value.height,
      ],
      ([newAnchor, w, h]) => {
        if (isInitialized.value && w > 0 && h > 0 && newAnchor !== currentAnchor.value) {
          currentAnchor.value = newAnchor
          const pos = getCornerPosition(newAnchor)
          const springCfg = { type: 'spring' as const, stiffness: 400, damping: 30 }
          animate(x, pos.x, springCfg)
          animate(y, pos.y, springCfg)
        }
      }
    )

    // Update position when effective size changes (responsive breakpoint change)
    watch(
      [() => effectiveSize.value.width, () => effectiveSize.value.height],
      () => {
        if (isInitialized.value && containerDimensions.value.width > 0 && containerDimensions.value.height > 0) {
          const pos = getCornerPosition(currentAnchor.value)
          const springCfg = { type: 'spring' as const, stiffness: 400, damping: 30 }
          animate(x, pos.x, springCfg)
          animate(y, pos.y, springCfg)
        }
      }
    )

    return () => {
      const dims = containerDimensions.value

      // Don't render if not visible or container has no dimensions yet
      if (!props.visible || dims.width === 0 || dims.height === 0) {
        return null
      }

      const ew = effectiveSize.value.width
      const eh = effectiveSize.value.height
      const padding = props.edgePadding + props.initialPosition.x
      const dragConstraints = {
        left: padding,
        right: dims.width - ew - padding,
        top: padding,
        bottom: dims.height - eh - padding,
      }

      const handleDragEnd = () => {
        const currentX = x.get()
        const currentY = y.get()
        const nearestCorner = findNearestCorner(currentX, currentY)
        currentAnchor.value = nearestCorner
        emit('anchorChange', nearestCorner)
        const snapPos = getCornerPosition(nearestCorner)
        const springCfg = { type: 'spring' as const, stiffness: 400, damping: 30 }
        animate(x, snapPos.x, springCfg)
        animate(y, snapPos.y, springCfg)
      }

      return h(
        motion.div,
        {
          drag: true,
          dragMomentum: false,
          dragElastic: 0.1,
          dragConstraints,
          style: {
            position: 'absolute',
            width: `${ew}px`,
            height: `${eh}px`,
            borderRadius: `${props.borderRadius}px`,
            boxShadow: props.boxShadow,
            overflow: 'hidden',
            cursor: 'grab',
            zIndex: 100,
            touchAction: 'none',
            left: 0,
            top: 0,
            x: x,
            y: y,
          },
          whileDrag: { cursor: 'grabbing', scale: 1.05, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
          transition: { type: 'spring', stiffness: 400, damping: 30 },
          onDragEnd: handleDragEnd,
        },
        slots.default?.()
      )
    }
  },
})
