import {
    getSpringConfig,
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
    ref
} from 'vue'
import { useGridDimensions, useMeetGrid } from './composables'

// ============================================
// Injection Keys
// ============================================

export interface GridContextValue {
    grid: ComputedRef<MeetGridResult>
    springPreset: SpringPreset
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
        /** Index of pinned item */
        pinnedIndex: {
            type: Number,
            default: undefined,
        },
        /** Index of active speaker */
        speakerIndex: {
            type: Number,
            default: undefined,
        },
        /** Sidebar position */
        sidebarPosition: {
            type: String as PropType<'left' | 'right' | 'top' | 'bottom'>,
            default: 'right',
        },
        /** Sidebar ratio (0-1) */
        sidebarRatio: {
            type: Number,
            default: 0.25,
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
        /** Maximum visible "others" in speaker/sidebar modes (0 = show all) */
        maxVisibleOthers: {
            type: Number,
            default: 0,
        },
        /** Current page for "others" in speaker/sidebar modes (0-based) */
        currentOthersPage: {
            type: Number,
            default: 0,
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
            speakerIndex: props.speakerIndex,
            sidebarPosition: props.sidebarPosition,
            sidebarRatio: props.sidebarRatio,
            maxItemsPerPage: props.maxItemsPerPage,
            currentPage: props.currentPage,
            maxVisibleOthers: props.maxVisibleOthers,
            currentOthersPage: props.currentOthersPage,
        }))

        const grid = useMeetGrid(gridOptions)

        // Provide context to children
        provide(GridContextKey, {
            grid,
            springPreset: props.springPreset,
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

        const { grid, springPreset } = context

        const position = computed(() => grid.value.getPosition(props.index))
        const dimensions = computed(() => grid.value.getItemDimensions(props.index))
        const isMain = computed(() => grid.value.isMainItem(props.index))
        const isVisible = computed(() => grid.value.isItemVisible(props.index))
        const isHidden = computed(() => {
            // Hidden if spotlight mode and not main, OR if pagination says not visible
            if (grid.value.layoutMode === 'spotlight' && !isMain.value) return true
            if (!isVisible.value) return true
            return false
        })

        const springConfig = getSpringConfig(springPreset)

        return () => {
            if (isHidden.value) {
                return null
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
                    slots.default?.()
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
                slots.default
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
