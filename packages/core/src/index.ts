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
    /** Index of focused item (for speaker/spotlight modes) - alias for speakerIndex/pinnedIndex */
    focusIndex?: number
    /** Index of pinned item (for sidebar/spotlight modes) */
    pinnedIndex?: number
    /** Index of active speaker */
    speakerIndex?: number
    /** Sidebar position (for sidebar mode) */
    sidebarPosition?: 'left' | 'right' | 'top' | 'bottom'
    /** Sidebar width ratio (0-1) */
    sidebarRatio?: number
    /** Maximum items per page for pagination (0 = no pagination) */
    maxItemsPerPage?: number
    /** Current page index (0-based) for pagination */
    currentPage?: number
    /** Maximum visible "others" in speaker/sidebar modes (0 = show all) */
    maxVisibleOthers?: number
    /** Current page for "others" in speaker/sidebar modes (0-based) */
    currentOthersPage?: number
}

/**
 * Pagination info returned with grid result
 */
export interface PaginationInfo {
    /** Whether pagination is enabled */
    enabled: boolean
    /** Current page (0-based) */
    currentPage: number
    /** Total number of pages */
    totalPages: number
    /** Items shown on current page */
    itemsOnPage: number
    /** Start index of items on current page */
    startIndex: number
    /** End index of items on current page (exclusive) */
    endIndex: number
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
    /** Pagination info (if pagination is enabled) */
    pagination: PaginationInfo
    /** Check if item should be visible on current page */
    isItemVisible: (index: number) => boolean
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
    let a = 1 // cols
    let b = 1 // rows

    // For mobile/portrait views with 2+ items, ensure minimum 2 columns
    const isPortrait = H > W
    const minCols = (N >= 2 && isPortrait) ? 2 : 1

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

        // Ensure minimum columns constraint
        if (a < minCols && N >= minCols) {
            continue
        }

        if (a * b >= N) {
            // Recalculate rows and cols for accuracy
            a = Math.max(minCols, Math.ceil(N / b))
            b = Math.ceil(N / a)
            break
        }
    }

    // Final check: ensure minimum columns
    if (a < minCols && N >= minCols) {
        a = minCols
        b = Math.ceil(N / a)
        // Recalculate dimensions for new grid
        w = (W - s * (a - 1)) / a
        h = w * r
        // Check if height fits
        const requiredHeight = b * h + (b - 1) * s
        if (requiredHeight > H) {
            const scale = H / requiredHeight
            h = h * scale
            w = h / r
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

    const incompleteRowCols = count % cols
    const lastRowStartIndex = incompleteRowCols > 0 ? count - incompleteRowCols : count - cols

    function getPosition(index: number): Position {
        // Calculate row and col directly from index (pure function)
        const row = Math.floor(index / cols)
        const col = index % cols

        // Check if this item is in the last incomplete row
        const isInLastRow = incompleteRowCols > 0 && index >= lastRowStartIndex

        let leftOffset = firstLeft
        if (isInLastRow) {
            // Center the incomplete last row
            const lastRowItemCount = incompleteRowCols
            const colInLastRow = index - lastRowStartIndex
            leftOffset = (W - (w * lastRowItemCount + (lastRowItemCount - 1) * gap)) / 2

            const top = firstTop + row * topAdd
            const left = leftOffset + colInLastRow * leftAdd
            return { top, left }
        }

        const top = firstTop + row * topAdd
        const left = leftOffset + col * leftAdd

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
    const { dimensions, gap, aspectRatio, count, sidebarPosition = 'right', sidebarRatio = 0.25, pinnedIndex = 0, maxVisibleOthers = 0, currentOthersPage = 0 } = options

    if (count === 0) {
        return createEmptyMeetGridResult('sidebar')
    }

    if (count === 1) {
        const grid = createGrid({ ...options, count: 1 })
        const pagination = createDefaultPagination(1)
        return {
            ...grid,
            layoutMode: 'sidebar',
            getItemDimensions: () => ({ width: grid.width, height: grid.height }),
            isMainItem: () => true,
            pagination,
            isItemVisible: () => true,
        }
    }

    const { width: W, height: H } = dimensions
    const ratio = getAspectRatio(aspectRatio)

    // Calculate main area and sidebar dimensions
    const isVertical = sidebarPosition === 'bottom' || sidebarPosition === 'top'

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

    // Calculate how many others to show and which page
    const totalOthers = count - 1
    const visibleOthers = maxVisibleOthers > 0 ? Math.min(maxVisibleOthers, totalOthers) : totalOthers

    // Calculate pagination for others
    const othersTotalPages = maxVisibleOthers > 0 ? Math.ceil(totalOthers / maxVisibleOthers) : 1
    const safeCurrentOthersPage = Math.min(currentOthersPage, Math.max(0, othersTotalPages - 1))
    const startOthersIndex = safeCurrentOthersPage * maxVisibleOthers
    const endOthersIndex = Math.min(startOthersIndex + visibleOthers, totalOthers)
    const itemsOnPage = endOthersIndex - startOthersIndex
    const hiddenCount = totalOthers - itemsOnPage

    // Calculate optimal grid for sidebar items
    let thumbCols = 1
    let thumbRows = 1
    let thumbWidth = 0
    let thumbHeight = 0

    if (visibleOthers > 0) {
        // Find best grid configuration for sidebar - prioritize filling space
        let bestArea = 0

        if (isVertical) {
            // Horizontal sidebar - try different column counts
            for (let cols = 1; cols <= visibleOthers; cols++) {
                const rows = Math.ceil(visibleOthers / cols)
                // Calculate max tile size that fits
                const maxTileW = (sidebarWidth - (cols - 1) * gap) / cols
                const maxTileH = (sidebarHeight - (rows - 1) * gap) / rows

                // Use max size that fits, maintaining aspect ratio
                let tileW = maxTileW
                let tileH = tileW * ratio
                if (tileH > maxTileH) {
                    tileH = maxTileH
                    tileW = tileH / ratio
                }

                if (tileW * tileH > bestArea) {
                    bestArea = tileW * tileH
                    thumbCols = cols
                    thumbRows = rows
                    thumbWidth = tileW
                    thumbHeight = tileH
                }
            }
        } else {
            // Vertical sidebar - try different row counts
            for (let rows = 1; rows <= visibleOthers; rows++) {
                const cols = Math.ceil(visibleOthers / rows)
                // Calculate max tile size that fits
                const maxTileH = (sidebarHeight - (rows - 1) * gap) / rows
                const maxTileW = (sidebarWidth - (cols - 1) * gap) / cols

                // Use max size that fits, maintaining aspect ratio
                let tileH = maxTileH
                let tileW = tileH / ratio
                if (tileW > maxTileW) {
                    tileW = maxTileW
                    tileH = tileW * ratio
                }

                if (tileW * tileH > bestArea) {
                    bestArea = tileW * tileH
                    thumbCols = cols
                    thumbRows = rows
                    thumbWidth = tileW
                    thumbHeight = tileH
                }
            }
        }
    }

    // Position getters
    const positions: { position: Position; dimensions: GridDimensions }[] = []

    // Main item position (centered in main area)
    let mainLeft: number
    let mainTop: number

    if (isVertical) {
        mainLeft = gap + (mainWidth - mainItemWidth) / 2
        mainTop = sidebarPosition === 'top'
            ? sidebarHeight + gap * 2 + (mainHeight - mainItemHeight) / 2
            : gap + (mainHeight - mainItemHeight) / 2
    } else {
        mainLeft = sidebarPosition === 'left'
            ? sidebarWidth + gap * 2 + (mainWidth - mainItemWidth) / 2
            : gap + (mainWidth - mainItemWidth) / 2
        mainTop = gap + (mainHeight - mainItemHeight) / 2
    }

    positions[pinnedIndex] = {
        position: { top: mainTop, left: mainLeft },
        dimensions: { width: mainItemWidth, height: mainItemHeight }
    }

    // Sidebar grid
    const totalGridWidth = thumbCols * thumbWidth + (thumbCols - 1) * gap
    const totalGridHeight = thumbRows * thumbHeight + (thumbRows - 1) * gap

    let gridStartLeft: number
    let gridStartTop: number

    if (isVertical) {
        gridStartLeft = gap + (sidebarWidth - totalGridWidth) / 2
        gridStartTop = sidebarPosition === 'top'
            ? gap + (sidebarHeight - totalGridHeight) / 2
            : mainHeight + gap * 2 + (sidebarHeight - totalGridHeight) / 2
    } else {
        gridStartLeft = sidebarPosition === 'left'
            ? gap + (sidebarWidth - totalGridWidth) / 2
            : mainWidth + gap * 2 + (sidebarWidth - totalGridWidth) / 2
        gridStartTop = gap + (sidebarHeight - totalGridHeight) / 2
    }

    let sidebarIndex = 0
    for (let i = 0; i < count; i++) {
        if (i === pinnedIndex) continue

        // Check if this item is in the visible range for current page
        const isInVisibleRange = sidebarIndex >= startOthersIndex && sidebarIndex < endOthersIndex

        if (isInVisibleRange) {
            // Calculate position relative to current page
            const pageRelativeIndex = sidebarIndex - startOthersIndex
            const row = Math.floor(pageRelativeIndex / thumbCols)
            const col = pageRelativeIndex % thumbCols

            // Center last incomplete row
            const itemsInLastRow = itemsOnPage % thumbCols || thumbCols
            let rowLeft = gridStartLeft
            const lastRowIndex = Math.ceil(itemsOnPage / thumbCols) - 1
            if (row === lastRowIndex && itemsInLastRow < thumbCols) {
                const rowWidth = itemsInLastRow * thumbWidth + (itemsInLastRow - 1) * gap
                if (isVertical) {
                    rowLeft = gap + (sidebarWidth - rowWidth) / 2
                } else {
                    rowLeft = (sidebarPosition === 'left' ? gap : mainWidth + gap * 2) + (sidebarWidth - rowWidth) / 2
                }
            }

            positions[i] = {
                position: {
                    top: gridStartTop + row * (thumbHeight + gap),
                    left: rowLeft + col * (thumbWidth + gap)
                },
                dimensions: { width: thumbWidth, height: thumbHeight }
            }
        } else {
            // Hidden items - position off-screen
            positions[i] = {
                position: { top: -9999, left: -9999 },
                dimensions: { width: 0, height: 0 }
            }
        }
        sidebarIndex++
    }

    // Create pagination info for others
    const pagination: PaginationInfo = {
        enabled: maxVisibleOthers > 0 && totalOthers > maxVisibleOthers,
        currentPage: safeCurrentOthersPage,
        totalPages: othersTotalPages,
        itemsOnPage: itemsOnPage,
        startIndex: startOthersIndex,
        endIndex: endOthersIndex,
    }

    return {
        width: mainItemWidth,
        height: mainItemHeight,
        rows: isVertical ? 1 + thumbRows : thumbRows,
        cols: isVertical ? thumbCols : 1 + thumbCols,
        layoutMode: 'sidebar',
        getPosition: (index: number) => positions[index]?.position ?? { top: 0, left: 0 },
        getItemDimensions: (index: number) => positions[index]?.dimensions ?? { width: 0, height: 0 },
        isMainItem: (index: number) => index === pinnedIndex,
        pagination,
        isItemVisible: (index: number) => {
            if (index === pinnedIndex) return true
            // Find the sidebar index (position among others, skipping pinned)
            let sIdx = 0
            for (let i = 0; i < index; i++) {
                if (i !== pinnedIndex) sIdx++
            }
            // Check if within current page range
            return sIdx >= startOthersIndex && sIdx < endOthersIndex
        },
        // Extra info
        hiddenCount,
    } as MeetGridResult & { hiddenCount: number }
}

/**
 * Create a speaker layout grid (active speaker is larger)
 */
function createSpeakerGrid(options: MeetGridOptions): MeetGridResult {
    const { dimensions, gap, aspectRatio, count, speakerIndex = 0, maxVisibleOthers = 0, currentOthersPage = 0 } = options

    if (count === 0) {
        return createEmptyMeetGridResult('speaker')
    }

    if (count === 1) {
        const grid = createGrid({ ...options, count: 1 })
        const pagination = createDefaultPagination(1)
        return {
            ...grid,
            layoutMode: 'speaker',
            getItemDimensions: () => ({ width: grid.width, height: grid.height }),
            isMainItem: () => true,
            pagination,
            isItemVisible: () => true,
        }
    }

    const { width: W, height: H } = dimensions
    const ratio = getAspectRatio(aspectRatio)

    // Calculate how many others to show and which page
    const totalOthers = count - 1
    const visibleOthers = maxVisibleOthers > 0 ? Math.min(maxVisibleOthers, totalOthers) : totalOthers

    // Calculate pagination for others
    const othersTotalPages = maxVisibleOthers > 0 ? Math.ceil(totalOthers / maxVisibleOthers) : 1
    const safeCurrentOthersPage = Math.min(currentOthersPage, Math.max(0, othersTotalPages - 1))
    const startOthersIndex = safeCurrentOthersPage * maxVisibleOthers
    const endOthersIndex = Math.min(startOthersIndex + visibleOthers, totalOthers)
    const itemsOnPage = endOthersIndex - startOthersIndex
    const hiddenCount = totalOthers - itemsOnPage

    // Speaker takes 65% of height, others share the bottom 35%
    const speakerAreaHeight = (H - gap * 3) * 0.65
    const othersAreaHeight = (H - gap * 3) * 0.35
    const othersAreaWidth = W - gap * 2

    // Calculate speaker dimensions (maintain aspect ratio)
    let speakerW = W - gap * 2
    let speakerH = speakerW * ratio
    if (speakerH > speakerAreaHeight) {
        speakerH = speakerAreaHeight
        speakerW = speakerH / ratio
    }

    // Calculate optimal grid for visible others
    let bestCols = 1
    let bestTileW = 0
    let bestTileH = 0

    if (visibleOthers > 0) {
        for (let cols = 1; cols <= visibleOthers; cols++) {
            const rows = Math.ceil(visibleOthers / cols)

            // Calculate tile size for this configuration
            const maxTileW = (othersAreaWidth - (cols - 1) * gap) / cols
            const maxTileH = (othersAreaHeight - (rows - 1) * gap) / rows

            let tileW = maxTileW
            let tileH = tileW * ratio
            if (tileH > maxTileH) {
                tileH = maxTileH
                tileW = tileH / ratio
            }

            // Keep the configuration with largest tiles
            if (tileW * tileH > bestTileW * bestTileH) {
                bestCols = cols
                bestTileW = tileW
                bestTileH = tileH
            }
        }
    }

    const otherCols = bestCols
    const otherRows = Math.ceil(visibleOthers / otherCols) || 1
    const otherW = bestTileW
    const otherH = bestTileH

    const positions: { position: Position; dimensions: GridDimensions }[] = []

    // Speaker position (centered at top)
    positions[speakerIndex] = {
        position: {
            top: gap + (speakerAreaHeight - speakerH) / 2,
            left: gap + (W - gap * 2 - speakerW) / 2
        },
        dimensions: { width: speakerW, height: speakerH }
    }

    // Others grid (centered at bottom)
    const totalGridWidth = otherCols * otherW + (otherCols - 1) * gap
    const totalGridHeight = otherRows * otherH + (otherRows - 1) * gap
    const gridStartLeft = gap + (othersAreaWidth - totalGridWidth) / 2
    const gridStartTop = speakerAreaHeight + gap * 2 + (othersAreaHeight - totalGridHeight) / 2

    let otherIndex = 0
    for (let i = 0; i < count; i++) {
        if (i === speakerIndex) continue

        // Check if this item is in the visible range for current page
        const isInVisibleRange = otherIndex >= startOthersIndex && otherIndex < endOthersIndex

        if (isInVisibleRange) {
            // Calculate position relative to current page
            const pageRelativeIndex = otherIndex - startOthersIndex
            const row = Math.floor(pageRelativeIndex / otherCols)
            const col = pageRelativeIndex % otherCols

            // Center last incomplete row
            const lastRowIndex = Math.ceil(itemsOnPage / otherCols) - 1
            const itemsInLastRow = itemsOnPage % otherCols || otherCols
            let rowStartLeft = gridStartLeft
            if (row === lastRowIndex && itemsInLastRow < otherCols) {
                const rowWidth = itemsInLastRow * otherW + (itemsInLastRow - 1) * gap
                rowStartLeft = gap + (othersAreaWidth - rowWidth) / 2
            }

            positions[i] = {
                position: {
                    top: gridStartTop + row * (otherH + gap),
                    left: rowStartLeft + col * (otherW + gap)
                },
                dimensions: { width: otherW, height: otherH }
            }
        } else {
            // Hidden items
            positions[i] = {
                position: { top: -9999, left: -9999 },
                dimensions: { width: 0, height: 0 }
            }
        }
        otherIndex++
    }

    const pagination: PaginationInfo = {
        enabled: maxVisibleOthers > 0 && totalOthers > maxVisibleOthers,
        currentPage: safeCurrentOthersPage,
        totalPages: othersTotalPages,
        itemsOnPage: itemsOnPage,
        startIndex: startOthersIndex,
        endIndex: endOthersIndex,
    }

    return {
        width: speakerW,
        height: speakerH,
        rows: 1 + otherRows,
        cols: otherCols,
        layoutMode: 'speaker',
        getPosition: (index: number) => positions[index]?.position ?? { top: 0, left: 0 },
        getItemDimensions: (index: number) => positions[index]?.dimensions ?? { width: 0, height: 0 },
        isMainItem: (index: number) => index === speakerIndex,
        pagination,
        isItemVisible: (index: number) => {
            if (index === speakerIndex) return true
            let sIdx = 0
            for (let i = 0; i < index; i++) {
                if (i !== speakerIndex) sIdx++
            }
            // Check if within current page range
            return sIdx >= startOthersIndex && sIdx < endOthersIndex
        },
        hiddenCount,
    } as MeetGridResult & { hiddenCount: number }
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

    const pagination = createDefaultPagination(1) // Spotlight shows only 1 item
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
        pagination,
        isItemVisible: (index: number) => index === pinnedIndex,
    }
}

/**
 * Create default pagination info (no pagination)
 */
function createDefaultPagination(count: number): PaginationInfo {
    return {
        enabled: false,
        currentPage: 0,
        totalPages: 1,
        itemsOnPage: count,
        startIndex: 0,
        endIndex: count,
    }
}

/**
 * Create pagination info based on options
 */
function createPaginationInfo(count: number, maxItemsPerPage?: number, currentPage?: number): PaginationInfo {
    if (!maxItemsPerPage || maxItemsPerPage <= 0 || maxItemsPerPage >= count) {
        return createDefaultPagination(count)
    }

    const totalPages = Math.ceil(count / maxItemsPerPage)
    const page = Math.min(Math.max(0, currentPage ?? 0), totalPages - 1)
    const startIndex = page * maxItemsPerPage
    const endIndex = Math.min(startIndex + maxItemsPerPage, count)

    return {
        enabled: true,
        currentPage: page,
        totalPages,
        itemsOnPage: endIndex - startIndex,
        startIndex,
        endIndex,
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
        pagination: createDefaultPagination(0),
        isItemVisible: () => false,
    }
}

/**
 * Create a meet-style grid with support for different layout modes.
 * This is the main function for creating video conferencing-style layouts.
 */
export function createMeetGrid(options: MeetGridOptions): MeetGridResult {
    const { layoutMode = 'gallery', count, focusIndex = 0 } = options

    // Map focusIndex to speakerIndex and pinnedIndex if they're not explicitly provided
    const speakerIndex = options.speakerIndex ?? focusIndex
    const pinnedIndex = options.pinnedIndex ?? focusIndex
    const normalizedOptions = { ...options, speakerIndex, pinnedIndex }

    if (count === 0) {
        return createEmptyMeetGridResult(layoutMode)
    }

    switch (layoutMode) {
        case 'spotlight':
            return createSpotlightGrid(normalizedOptions)

        case 'speaker':
            return createSpeakerGrid(normalizedOptions)

        case 'sidebar':
            return createSidebarGrid(normalizedOptions)

        case 'gallery':
        default: {
            const { maxItemsPerPage, currentPage, sidebarPosition = 'right' } = normalizedOptions

            // If there's a pinned participant in gallery, use sidebar layout
            if (pinnedIndex !== undefined && pinnedIndex >= 0 && pinnedIndex < count) {
                return createSidebarGrid({ ...options, sidebarPosition })
            }

            const pagination = createPaginationInfo(count, maxItemsPerPage, currentPage)

            // For pagination, calculate grid based on items on current page
            const effectiveCount = pagination.enabled ? pagination.itemsOnPage : count
            const grid = createGrid({ ...options, count: effectiveCount })

            // Create position getter that maps original index to page-relative index
            const getPosition = (index: number): Position => {
                if (!pagination.enabled) {
                    return grid.getPosition(index)
                }
                // Map to page-relative index
                const pageRelativeIndex = index - pagination.startIndex
                if (pageRelativeIndex < 0 || pageRelativeIndex >= pagination.itemsOnPage) {
                    return { top: -9999, left: -9999 }
                }
                return grid.getPosition(pageRelativeIndex)
            }

            return {
                ...grid,
                layoutMode: 'gallery',
                getPosition,
                getItemDimensions: () => ({ width: grid.width, height: grid.height }),
                isMainItem: () => false,
                pagination,
                isItemVisible: (index: number) => index >= pagination.startIndex && index < pagination.endIndex,
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
