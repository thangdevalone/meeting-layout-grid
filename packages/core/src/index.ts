// ============================================
// Types
// ============================================

/**
 * Dimensions of an element (width and height in pixels)
 */
export interface GridDimensions {
    width: number
    height: number
}

/**
 * Position of a grid item
 */
export interface Position {
    top: number
    left: number
}

/**
 * Layout modes for the grid
 * - gallery: Equal-sized tiles in a responsive grid
 * - speaker: Active speaker takes larger space (2x size)
 * - spotlight: Single participant in focus, others hidden
 * - sidebar: Main view with thumbnail strip on the side
 */
export type LayoutMode = 'gallery' | 'speaker' | 'spotlight' | 'sidebar'

/**
 * Options for creating a basic grid
 */
export interface GridOptions {
    /** Aspect ratio in format "width:height" (e.g., "16:9", "4:3") */
    aspectRatio: string
    /** Number of items in the grid */
    count: number
    /** Container dimensions */
    dimensions: GridDimensions
    /** Gap between items in pixels */
    gap: number
}

/**
 * Extended options for meet-style grid with layout modes
 */
export interface MeetGridOptions extends GridOptions {
    /** Layout mode for the grid */
    layoutMode?: LayoutMode
    /** Index of pinned item (for speaker/spotlight modes) */
    pinnedIndex?: number
    /** Index of active speaker */
    speakerIndex?: number
    /** Sidebar position (for sidebar mode) */
    sidebarPosition?: 'left' | 'right' | 'bottom'
    /** Sidebar width ratio (0-1) */
    sidebarRatio?: number
}

/**
 * Result from grid calculations
 */
export interface GridResult {
    /** Width of each grid item */
    width: number
    /** Height of each grid item */
    height: number
    /** Number of rows */
    rows: number
    /** Number of columns */
    cols: number
    /** Function to get position of item at index */
    getPosition: (index: number) => Position
}

/**
 * Extended result for meet-style grid
 */
export interface MeetGridResult extends GridResult {
    /** Layout mode used */
    layoutMode: LayoutMode
    /** Get item dimensions (may vary by index in some modes) */
    getItemDimensions: (index: number) => GridDimensions
    /** Check if item is the main/featured item */
    isMainItem: (index: number) => boolean
}

// ============================================
// Utility Functions
// ============================================

/**
 * Parses the Aspect Ratio string to actual ratio (height/width)
 * @param ratio The aspect ratio in the format of "width:height" (e.g., "16:9")
 * @returns The parsed value of aspect ratio (height/width)
 */
export function getAspectRatio(ratio: string): number {
    const [width, height] = ratio.split(':')
    if (!width || !height) {
        throw new Error(
            'meet-layout-grid: Invalid aspect ratio provided, expected format is "width:height".'
        )
    }
    return Number.parseInt(height) / Number.parseInt(width)
}

/**
 * Parse aspect ratio to get width/height multiplier
 */
export function parseAspectRatio(ratio: string): { widthRatio: number; heightRatio: number } {
    const [width, height] = ratio.split(':').map(Number)
    if (!width || !height || isNaN(width) || isNaN(height)) {
        throw new Error(
            'meet-layout-grid: Invalid aspect ratio provided, expected format is "width:height".'
        )
    }
    return { widthRatio: width, heightRatio: height }
}

// ============================================
// Core Grid Calculation
// ============================================

/**
 * Calculates grid item dimensions for items that can fit in a container.
 * Adapted from: https://stackoverflow.com/a/28268965
 */
export function getGridItemDimensions({
    count,
    dimensions,
    aspectRatio,
    gap,
}: GridOptions): { width: number; height: number; rows: number; cols: number } {
    let { width: W, height: H } = dimensions

    if (W === 0 || H === 0 || count === 0) {
        return { width: 0, height: 0, rows: 1, cols: 1 }
    }

    // Account for outer gap
    W -= gap * 2
    H -= gap * 2

    const s = gap
    const N = count
    const r = getAspectRatio(aspectRatio)

    let w = 0
    let h = 0
    let a = 1
    let b = 1

    const widths: number[] = []

    for (let n = 1; n <= N; n++) {
        widths.push((W - s * (n - 1)) / n, (H - s * (n - 1)) / (n * r))
    }

    // Sort in descending order, largest first
    widths.sort((a, b) => b - a)

    for (const width of widths) {
        w = width
        h = w * r

        a = Math.floor((W + s) / (w + s))
        b = Math.floor((H + s) / (h + s))

        if (a * b >= N) {
            // Recalculate rows and cols for accuracy
            a = Math.ceil(N / b)
            b = Math.ceil(N / a)
            break
        }
    }

    return { width: w, height: h, rows: b, cols: a }
}

/**
 * Creates a utility function which helps you position grid items in a container.
 */
export function createGridItemPositioner({
    parentDimensions,
    dimensions,
    rows,
    cols,
    count,
    gap,
}: {
    parentDimensions: GridDimensions
    dimensions: GridDimensions
    rows: number
    cols: number
    count: number
    gap: number
}): (index: number) => Position {
    const { width: W, height: H } = parentDimensions
    const { width: w, height: h } = dimensions

    const firstTop = (H - (h * rows + (rows - 1) * gap)) / 2
    let firstLeft = (W - (w * cols + (cols - 1) * gap)) / 2

    const topAdd = h + gap
    const leftAdd = w + gap

    let col = 0
    let row = 0

    const incompleteRowCols = count % cols

    function getPosition(index: number): Position {
        const remaining = count - index

        if (remaining === incompleteRowCols && incompleteRowCols > 0) {
            // In last row with incomplete columns, recalculate firstLeft to center
            firstLeft = (W - (w * remaining + (remaining - 1) * gap)) / 2
        }

        const top = firstTop + row * topAdd
        const left = firstLeft + col * leftAdd

        col++

        if ((index + 1) % cols === 0) {
            // Row traversed completely, increment row and reset col
            row++
            col = 0
        }

        return { top, left }
    }

    return getPosition
}

/**
 * Calculates data required for making a responsive grid.
 */
export function createGrid({ aspectRatio, count, dimensions, gap }: GridOptions): GridResult {
    const { width, height, rows, cols } = getGridItemDimensions({
        aspectRatio,
        count,
        dimensions,
        gap,
    })

    const getPosition = createGridItemPositioner({
        parentDimensions: dimensions,
        dimensions: { width, height },
        rows,
        cols,
        count,
        gap,
    })

    return {
        width,
        height,
        rows,
        cols,
        getPosition,
    }
}

// ============================================
// Meet Grid (with Layout Modes)
// ============================================

/**
 * Create a sidebar layout grid
 */
function createSidebarGrid(options: MeetGridOptions): MeetGridResult {
    const { dimensions, gap, aspectRatio, count, sidebarPosition = 'right', sidebarRatio = 0.25, pinnedIndex = 0 } = options

    if (count === 0) {
        return createEmptyMeetGridResult('sidebar')
    }

    const { width: W, height: H } = dimensions
    const ratio = getAspectRatio(aspectRatio)

    // Calculate main area and sidebar dimensions
    const isVertical = sidebarPosition === 'bottom'

    let mainWidth: number
    let mainHeight: number
    let sidebarWidth: number
    let sidebarHeight: number

    if (isVertical) {
        mainHeight = H * (1 - sidebarRatio) - gap
        mainWidth = W - gap * 2
        sidebarHeight = H * sidebarRatio - gap
        sidebarWidth = W - gap * 2
    } else {
        mainWidth = W * (1 - sidebarRatio) - gap * 2
        mainHeight = H - gap * 2
        sidebarWidth = W * sidebarRatio - gap
        sidebarHeight = H - gap * 2
    }

    // Calculate main item dimensions (maintain aspect ratio)
    let mainItemWidth = mainWidth
    let mainItemHeight = mainItemWidth * ratio
    if (mainItemHeight > mainHeight) {
        mainItemHeight = mainHeight
        mainItemWidth = mainItemHeight / ratio
    }

    // Calculate sidebar items (thumbnails)
    const sidebarCount = count - 1
    let thumbWidth: number
    let thumbHeight: number

    if (sidebarCount > 0) {
        if (isVertical) {
            thumbWidth = Math.min((sidebarWidth - (sidebarCount - 1) * gap) / sidebarCount, sidebarHeight / ratio)
            thumbHeight = thumbWidth * ratio
        } else {
            thumbHeight = Math.min((sidebarHeight - (sidebarCount - 1) * gap) / sidebarCount, sidebarWidth / ratio)
            thumbWidth = thumbHeight / ratio
        }
    } else {
        thumbWidth = 0
        thumbHeight = 0
    }

    // Position getters
    const positions: { position: Position; dimensions: GridDimensions }[] = []

    // Main item position (centered in main area)
    const mainLeft = isVertical
        ? gap + (mainWidth - mainItemWidth) / 2
        : sidebarPosition === 'left'
            ? sidebarWidth + gap * 2 + (mainWidth - mainItemWidth) / 2
            : gap + (mainWidth - mainItemWidth) / 2
    const mainTop = isVertical
        ? gap + (mainHeight - mainItemHeight) / 2
        : gap + (mainHeight - mainItemHeight) / 2

    positions[pinnedIndex] = {
        position: { top: mainTop, left: mainLeft },
        dimensions: { width: mainItemWidth, height: mainItemHeight }
    }

    // Sidebar items
    let sidebarIndex = 0
    for (let i = 0; i < count; i++) {
        if (i === pinnedIndex) continue

        let left: number
        let top: number

        if (isVertical) {
            const totalThumbWidth = sidebarCount * thumbWidth + (sidebarCount - 1) * gap
            const startLeft = gap + (sidebarWidth - totalThumbWidth) / 2
            left = startLeft + sidebarIndex * (thumbWidth + gap)
            top = mainHeight + gap * 2
        } else {
            left = sidebarPosition === 'left' ? gap : mainWidth + gap * 2
            const totalThumbHeight = sidebarCount * thumbHeight + (sidebarCount - 1) * gap
            const startTop = gap + (sidebarHeight - totalThumbHeight) / 2
            top = startTop + sidebarIndex * (thumbHeight + gap)
        }

        positions[i] = {
            position: { top, left },
            dimensions: { width: thumbWidth, height: thumbHeight }
        }
        sidebarIndex++
    }

    return {
        width: mainItemWidth,
        height: mainItemHeight,
        rows: isVertical ? 2 : 1,
        cols: isVertical ? 1 : 2,
        layoutMode: 'sidebar',
        getPosition: (index: number) => positions[index]?.position ?? { top: 0, left: 0 },
        getItemDimensions: (index: number) => positions[index]?.dimensions ?? { width: 0, height: 0 },
        isMainItem: (index: number) => index === pinnedIndex,
    }
}

/**
 * Create a speaker layout grid (active speaker is larger)
 */
function createSpeakerGrid(options: MeetGridOptions): MeetGridResult {
    const { dimensions, gap, aspectRatio, count, speakerIndex = 0 } = options

    if (count === 0) {
        return createEmptyMeetGridResult('speaker')
    }

    if (count === 1) {
        const grid = createGrid({ ...options, count: 1 })
        return {
            ...grid,
            layoutMode: 'speaker',
            getItemDimensions: () => ({ width: grid.width, height: grid.height }),
            isMainItem: () => true,
        }
    }

    const { width: W, height: H } = dimensions
    const ratio = getAspectRatio(aspectRatio)

    // Speaker takes 60% of height, others share the bottom
    const speakerHeight = (H - gap * 3) * 0.65
    const othersHeight = (H - gap * 3) * 0.35

    // Calculate speaker dimensions (maintain aspect ratio)
    let speakerW = W - gap * 2
    let speakerH = speakerW * ratio
    if (speakerH > speakerHeight) {
        speakerH = speakerHeight
        speakerW = speakerH / ratio
    }

    // Calculate other items
    const othersCount = count - 1
    let otherW = Math.min((W - gap * 2 - (othersCount - 1) * gap) / othersCount, othersHeight / ratio)
    let otherH = otherW * ratio
    if (otherH > othersHeight) {
        otherH = othersHeight
        otherW = otherH / ratio
    }

    const positions: { position: Position; dimensions: GridDimensions }[] = []

    // Speaker position (centered at top)
    positions[speakerIndex] = {
        position: {
            top: gap + (speakerHeight - speakerH) / 2,
            left: gap + (W - gap * 2 - speakerW) / 2
        },
        dimensions: { width: speakerW, height: speakerH }
    }

    // Others (centered at bottom)
    const totalOthersWidth = othersCount * otherW + (othersCount - 1) * gap
    const startLeft = gap + (W - gap * 2 - totalOthersWidth) / 2

    let otherIndex = 0
    for (let i = 0; i < count; i++) {
        if (i === speakerIndex) continue

        positions[i] = {
            position: {
                top: speakerHeight + gap * 2 + (othersHeight - otherH) / 2,
                left: startLeft + otherIndex * (otherW + gap)
            },
            dimensions: { width: otherW, height: otherH }
        }
        otherIndex++
    }

    return {
        width: speakerW,
        height: speakerH,
        rows: 2,
        cols: othersCount,
        layoutMode: 'speaker',
        getPosition: (index: number) => positions[index]?.position ?? { top: 0, left: 0 },
        getItemDimensions: (index: number) => positions[index]?.dimensions ?? { width: 0, height: 0 },
        isMainItem: (index: number) => index === speakerIndex,
    }
}

/**
 * Create a spotlight layout (single item in focus)
 */
function createSpotlightGrid(options: MeetGridOptions): MeetGridResult {
    const { dimensions, gap, aspectRatio, pinnedIndex = 0 } = options
    const { width: W, height: H } = dimensions
    const ratio = getAspectRatio(aspectRatio)

    // Full container for spotlight item
    let spotWidth = W - gap * 2
    let spotHeight = spotWidth * ratio
    if (spotHeight > H - gap * 2) {
        spotHeight = H - gap * 2
        spotWidth = spotHeight / ratio
    }

    const position: Position = {
        top: gap + (H - gap * 2 - spotHeight) / 2,
        left: gap + (W - gap * 2 - spotWidth) / 2
    }

    return {
        width: spotWidth,
        height: spotHeight,
        rows: 1,
        cols: 1,
        layoutMode: 'spotlight',
        getPosition: (index: number) => index === pinnedIndex ? position : { top: -9999, left: -9999 },
        getItemDimensions: (index: number) =>
            index === pinnedIndex ? { width: spotWidth, height: spotHeight } : { width: 0, height: 0 },
        isMainItem: (index: number) => index === pinnedIndex,
    }
}

/**
 * Create an empty meet grid result
 */
function createEmptyMeetGridResult(layoutMode: LayoutMode): MeetGridResult {
    return {
        width: 0,
        height: 0,
        rows: 0,
        cols: 0,
        layoutMode,
        getPosition: () => ({ top: 0, left: 0 }),
        getItemDimensions: () => ({ width: 0, height: 0 }),
        isMainItem: () => false,
    }
}

/**
 * Create a meet-style grid with support for different layout modes.
 * This is the main function for creating video conferencing-style layouts.
 */
export function createMeetGrid(options: MeetGridOptions): MeetGridResult {
    const { layoutMode = 'gallery', count } = options

    if (count === 0) {
        return createEmptyMeetGridResult(layoutMode)
    }

    switch (layoutMode) {
        case 'spotlight':
            return createSpotlightGrid(options)

        case 'speaker':
            return createSpeakerGrid(options)

        case 'sidebar':
            return createSidebarGrid(options)

        case 'gallery':
        default: {
            const grid = createGrid(options)
            return {
                ...grid,
                layoutMode: 'gallery',
                getItemDimensions: () => ({ width: grid.width, height: grid.height }),
                isMainItem: () => false,
            }
        }
    }
}

// ============================================
// Animation Helpers
// ============================================

/**
 * Spring animation configuration presets
 */
export const springPresets = {
    /** Snappy animations for UI interactions */
    snappy: { stiffness: 400, damping: 30 },
    /** Smooth animations for layout changes */
    smooth: { stiffness: 300, damping: 30 },
    /** Gentle animations for subtle effects */
    gentle: { stiffness: 200, damping: 25 },
    /** Bouncy animations for playful effects */
    bouncy: { stiffness: 400, damping: 15 },
} as const

export type SpringPreset = keyof typeof springPresets

/**
 * Get spring configuration for Motion animations
 */
export function getSpringConfig(preset: SpringPreset = 'smooth') {
    return {
        type: 'spring' as const,
        ...springPresets[preset],
    }
}
