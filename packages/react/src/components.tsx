import React, {
    ReactNode,
    useRef,
    forwardRef,
    HTMLAttributes,
    CSSProperties,
} from 'react'
import { motion, HTMLMotionProps, Transition } from 'motion/react'
import {
    MeetGridOptions,
    LayoutMode,
    SpringPreset,
    getSpringConfig,
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
    /** Index of pinned item */
    pinnedIndex?: number
    /** Index of active speaker */
    speakerIndex?: number
    /** Sidebar position */
    sidebarPosition?: 'left' | 'right' | 'bottom'
    /** Sidebar ratio (0-1) */
    sidebarRatio?: number
    /** Spring animation preset */
    springPreset?: SpringPreset
    /** Custom container style */
    style?: CSSProperties
    /** Additional class name */
    className?: string
}

/**
 * Container component for the meet grid.
 * Provides grid context to child GridItem components.
 */
export const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
    function GridContainer(
        {
            children,
            aspectRatio = '16:9',
            gap = 8,
            count,
            layoutMode = 'gallery',
            pinnedIndex,
            speakerIndex,
            sidebarPosition,
            sidebarRatio,
            springPreset = 'smooth',
            style,
            className,
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
            speakerIndex,
            sidebarPosition,
            sidebarRatio,
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
    }
)

// ============================================
// GridItem Component
// ============================================

export interface GridItemProps extends Omit<HTMLMotionProps<'div'>, 'animate' | 'initial' | 'transition'> {
    /** Index of this item in the grid */
    index: number
    /** Children to render inside the item */
    children: ReactNode
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
export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
    function GridItem(
        {
            index,
            children,
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

        const { top, left } = grid.getPosition(index)
        const { width, height } = grid.getItemDimensions(index)
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
                    {children}
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
export const GridOverlay = forwardRef<HTMLDivElement, GridOverlayProps>(
    function GridOverlay({ visible = true, backgroundColor = 'rgba(0,0,0,0.5)', children, style, ...props }, ref) {
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
    }
)
