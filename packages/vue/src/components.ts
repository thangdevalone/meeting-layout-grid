import {
  getSpringConfig,
  GridDimensions,
  ItemAspectRatio,
  LayoutMode,
  MeetGridResult,
  SpringPreset,
} from '@thangdevalone/meet-layout-grid-core'
import { motion } from 'motion-v'
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

    // Float drag state
    const floatAnchor = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right')
    const floatDragging = ref(false)
    const floatDragOffset = ref({ x: 0, y: 0 })
    const floatStartPos = ref({ x: 0, y: 0 })
    const floatDisplayPos = ref({ x: 0, y: 0 })
    const floatInitialized = ref(false)

    const getFloatCornerPos = (corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
      const padding = 12
      const dims = containerDimensions.value
      const fw = floatDims.value.width
      const fh = floatDims.value.height
      switch (corner) {
        case 'top-left': return { x: padding, y: padding }
        case 'top-right': return { x: dims.width - fw - padding, y: padding }
        case 'bottom-left': return { x: padding, y: dims.height - fh - padding }
        case 'bottom-right':
        default: return { x: dims.width - fw - padding, y: dims.height - fh - padding }
      }
    }

    const findFloatNearestCorner = (x: number, y: number) => {
      const fw = floatDims.value.width
      const fh = floatDims.value.height
      const centerX = x + fw / 2
      const centerY = y + fh / 2
      const dims = containerDimensions.value
      const isLeft = centerX < dims.width / 2
      const isTop = centerY < dims.height / 2
      if (isTop && isLeft) return 'top-left' as const
      if (isTop && !isLeft) return 'top-right' as const
      if (!isTop && isLeft) return 'bottom-left' as const
      return 'bottom-right' as const
    }

    const floatCornerPos = computed(() => getFloatCornerPos(floatAnchor.value))

    const handleFloatDragStart = (e: MouseEvent | TouchEvent) => {
      floatDragging.value = true
      const pos = 'touches' in e ? e.touches[0] : e
      floatStartPos.value = { x: pos.clientX, y: pos.clientY }
      floatDragOffset.value = { x: 0, y: 0 }
    }

    const handleFloatDragMove = (e: MouseEvent | TouchEvent) => {
      if (!floatDragging.value) return
      e.preventDefault()
      const pos = 'touches' in e ? e.touches[0] : e
      floatDragOffset.value = {
        x: pos.clientX - floatStartPos.value.x,
        y: pos.clientY - floatStartPos.value.y,
      }
      floatDisplayPos.value = {
        x: floatCornerPos.value.x + floatDragOffset.value.x,
        y: floatCornerPos.value.y + floatDragOffset.value.y,
      }
    }

    const handleFloatDragEnd = () => {
      if (!floatDragging.value) return
      floatDragging.value = false
      const nearest = findFloatNearestCorner(floatDisplayPos.value.x, floatDisplayPos.value.y)
      floatAnchor.value = nearest
      floatDisplayPos.value = getFloatCornerPos(nearest)
      floatDragOffset.value = { x: 0, y: 0 }
    }

    // Calculate if this is the last visible "other" item
    const isLastVisibleOther = computed(() => {
      const lastVisibleOthersIndex = grid.value.getLastVisibleOthersIndex()
      return props.index === lastVisibleOthersIndex
    })
    const hiddenCount = computed(() => grid.value.hiddenCount)

    const springConfig = getSpringConfig(springPreset)

    // Slot props for render function
    const slotProps = computed(() => ({
      contentDimensions: contentDimensions.value,
      isLastVisibleOther: isLastVisibleOther.value,
      hiddenCount: hiddenCount.value,
    }))

    return () => {
      if (isHidden.value) {
        return null
      }

      // Float mode: render as draggable PiP
      if (isFloat.value) {
        const dims = containerDimensions.value
        if (dims.width === 0 || dims.height === 0) return null

        // Initialize position on first render
        if (!floatInitialized.value) {
          floatDisplayPos.value = floatCornerPos.value
          floatInitialized.value = true
        }

        return h(
          motion.div,
          {
            animate: {
              x: floatDisplayPos.value.x,
              y: floatDisplayPos.value.y,
              opacity: 1,
              scale: floatDragging.value ? 1.05 : 1,
            },
            transition: floatDragging.value
              ? { duration: 0 }
              : { type: 'spring', stiffness: 400, damping: 30 },
            style: {
              position: 'absolute',
              width: `${floatDims.value.width}px`,
              height: `${floatDims.value.height}px`,
              borderRadius: '12px',
              boxShadow: floatDragging.value
                ? '0 8px 32px rgba(0,0,0,0.4)'
                : '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              cursor: floatDragging.value ? 'grabbing' : 'grab',
              zIndex: 100,
              touchAction: 'none',
              left: 0,
              top: 0,
            },
            'data-grid-index': props.index,
            'data-grid-float': true,
            onMousedown: handleFloatDragStart,
            onMousemove: handleFloatDragMove,
            onMouseup: handleFloatDragEnd,
            onMouseleave: handleFloatDragEnd,
            onTouchstart: handleFloatDragStart,
            onTouchmove: handleFloatDragMove,
            onTouchend: handleFloatDragEnd,
          },
          () => slots.default?.(slotProps.value)
        )
      }

      const animateProps = {
        width: dimensions.value.width,
        height: dimensions.value.height,
        top: position.value.top,
        left: position.value.left,
      }

      if (props.disableAnimation) {
        return h(
          props.tag,
          {
            style: {
              position: 'absolute',
              ...animateProps,
              width: `${animateProps.width}px`,
              height: `${animateProps.height}px`,
              top: `${animateProps.top}px`,
              left: `${animateProps.left}px`,
            },
            'data-grid-index': props.index,
            'data-grid-main': isMain.value,
          },
          // Pass all slot props
          slots.default?.(slotProps.value)
        )
      }

      return h(
        motion.div,
        {
          as: props.tag,
          animate: animateProps,
          transition: {
            type: springConfig.type,
            stiffness: springConfig.stiffness,
            damping: springConfig.damping,
          },
          style: {
            position: 'absolute',
          },
          'data-grid-index': props.index,
          'data-grid-main': isMain.value,
        },
        // Pass all slot props
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
    /** Width of the floating item */
    width: {
      type: Number,
      default: 120,
    },
    /** Height of the floating item */
    height: {
      type: Number,
      default: 160,
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

    // Drag state
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    const startPos = ref({ x: 0, y: 0 })
    const displayPosition = ref({ x: 0, y: 0 })
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

      switch (corner) {
        case 'top-left':
          return { x: padding, y: padding }
        case 'top-right':
          return { x: dims.width - props.width - padding, y: padding }
        case 'bottom-left':
          return { x: padding, y: dims.height - props.height - padding }
        case 'bottom-right':
        default:
          return { x: dims.width - props.width - padding, y: dims.height - props.height - padding }
      }
    }

    // Find nearest corner based on current position
    const findNearestCorner = (
      x: number,
      y: number
    ): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
      const centerX = x + props.width / 2
      const centerY = y + props.height / 2
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

    const currentPos = computed(() => getCornerPosition(currentAnchor.value))

    // Drag handlers
    const handleDragStart = (e: MouseEvent | TouchEvent) => {
      isDragging.value = true
      const pos = 'touches' in e ? e.touches[0] : e
      startPos.value = { x: pos.clientX, y: pos.clientY }
      dragOffset.value = { x: 0, y: 0 }
    }

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.value) return
      e.preventDefault()
      const pos = 'touches' in e ? e.touches[0] : e
      dragOffset.value = {
        x: pos.clientX - startPos.value.x,
        y: pos.clientY - startPos.value.y,
      }
      // Update display position during drag
      displayPosition.value = {
        x: currentPos.value.x + dragOffset.value.x,
        y: currentPos.value.y + dragOffset.value.y,
      }
    }

    const handleDragEnd = () => {
      if (!isDragging.value) return
      isDragging.value = false

      // Calculate final position
      const finalX = displayPosition.value.x
      const finalY = displayPosition.value.y

      // Find nearest corner and snap
      const nearestCorner = findNearestCorner(finalX, finalY)
      currentAnchor.value = nearestCorner
      emit('anchorChange', nearestCorner)

      // Update display position to corner (will animate)
      displayPosition.value = getCornerPosition(nearestCorner)
      dragOffset.value = { x: 0, y: 0 }
    }

    return () => {
      const dims = containerDimensions.value

      // Don't render if not visible or container has no dimensions yet
      if (!props.visible || dims.width === 0 || dims.height === 0) {
        return null
      }

      // Initialize position on first render
      if (!isInitialized.value) {
        displayPosition.value = currentPos.value
        isInitialized.value = true
      }

      return h(
        motion.div,
        {
          animate: {
            x: displayPosition.value.x,
            y: displayPosition.value.y,
            opacity: 1,
            scale: isDragging.value ? 1.05 : 1,
          },
          transition: isDragging.value
            ? { duration: 0 }
            : { type: 'spring', stiffness: 400, damping: 30 },
          style: {
            position: 'absolute',
            width: `${props.width}px`,
            height: `${props.height}px`,
            borderRadius: `${props.borderRadius}px`,
            boxShadow: isDragging.value ? '0 8px 32px rgba(0,0,0,0.4)' : props.boxShadow,
            overflow: 'hidden',
            cursor: isDragging.value ? 'grabbing' : 'grab',
            zIndex: 100,
            touchAction: 'none',
            left: 0,
            top: 0,
          },
          onMousedown: handleDragStart,
          onMousemove: handleDragMove,
          onMouseup: handleDragEnd,
          onMouseleave: handleDragEnd,
          onTouchstart: handleDragStart,
          onTouchmove: handleDragMove,
          onTouchend: handleDragEnd,
        },
        slots.default?.()
      )
    }
  },
})
