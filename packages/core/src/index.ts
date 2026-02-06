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
 * - gallery: Equal-sized tiles in a responsive grid (use pinnedIndex for pin mode)
 * - spotlight: Single participant in focus, others hidden
 * - sidebar: Main view with thumbnail strip on the side (use sidebarPosition for top/bottom/left/right)
 */
export type LayoutMode = 'gallery' | 'spotlight' | 'sidebar'

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
 * Aspect ratio configuration for individual items
 * - string: Custom ratio like "16:9", "9:16", "4:3", "1:1"
 * - 'fill': Stretch to fill the entire cell (useful for whiteboard)
 * - 'auto': Use actual content dimensions (requires callback)
 */
export type ItemAspectRatio = string | 'fill' | 'auto'

/**
 * Flex layout item info for variable-sized cells
 */
export interface FlexItemInfo {
    /** Item index */
    index: number
    /** Width of this item's cell */
    width: number
    /** Height of this item's cell */
    height: number
    /** Left position */
    left: number
    /** Top position */
    top: number
    /** Row this item belongs to */
    row: number
    /** Width weight factor (based on aspect ratio) */
    widthFactor: number
}

/**
 * Extended options for meet-style grid with layout modes
 */
export interface MeetGridOptions extends GridOptions {
    /** Layout mode for the grid */
    layoutMode?: LayoutMode
    /** Index of pinned/focused item (main participant for spotlight/sidebar modes) */
    pinnedIndex?: number
    /** Sidebar position (for sidebar mode) */
    sidebarPosition?: 'left' | 'right' | 'top' | 'bottom'
    /** Sidebar width ratio (0-1) */
    sidebarRatio?: number
    /** Maximum items per page for pagination (0 = no pagination) */
    maxItemsPerPage?: number
    /** Current page index (0-based) for pagination */
    currentPage?: number
    /** 
     * Maximum visible items (0 = show all).
     * - In gallery mode: limits total items displayed
     * - In sidebar mode: limits "others" in the thumbnail strip (main item always visible)
     * When set, shows a '+X' indicator on the last visible item.
     * @default 0
     */
    maxVisible?: number
    /** Current page for items (0-based), used when maxVisible > 0 for pagination */
    currentVisiblePage?: number
    /**
     * Per-item aspect ratio configurations (index-based)
     * Allows different aspect ratios per participant:
     * - Use "9:16" for mobile/portrait participants
     * - Use "16:9" for desktop/landscape participants  
     * - Use "fill" for whiteboard (full cell, no ratio constraint)
     * - Use undefined to inherit from global aspectRatio
     * @example
     * itemAspectRatios: ["16:9", "9:16", "fill", undefined]
     */
    itemAspectRatios?: (ItemAspectRatio | undefined)[]
    /**
     * Enable flexible cell sizing based on item aspect ratios.
     * When true, portrait items (9:16) get narrower cells, landscape items (16:9) get wider cells.
     * Items are packed into rows intelligently.
     * @default false
     */
    flexLayout?: boolean
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
 * Content dimensions result with positioning info
 */
export interface ContentDimensions extends GridDimensions {
    /** Offset from cell top to center the content */
    offsetTop: number
    /** Offset from cell left to center the content */
    offsetLeft: number
}

/**
 * Extended result for meet-style grid
 */
export interface MeetGridResult extends GridResult {
    /** Layout mode used */
    layoutMode: LayoutMode
    /** Get item cell dimensions (the grid cell size, may vary by index in some modes) */
    getItemDimensions: (index: number) => GridDimensions
    /** Check if item is the main/featured item */
    isMainItem: (index: number) => boolean
    /** Pagination info (if pagination is enabled) */
    pagination: PaginationInfo
    /** Check if item should be visible on current page */
    isItemVisible: (index: number) => boolean
    /**
     * Number of hidden items (for '+X more' indicator).
     * When maxVisible is set and there are more participants than allowed,
     * this indicates how many are hidden.
     */
    hiddenCount: number
    /**
     * Get the last visible item index in the "others" section.
     * Returns -1 if no items are visible or if there's no "others" section.
     * Useful for showing '+X more' indicator on the last visible item.
     */
    getLastVisibleOthersIndex: () => number
    /**
     * Get the actual content dimensions within a cell.
     * Use this when items have different aspect ratios (e.g., phone vs desktop).
     * Returns dimensions fitted within the cell while maintaining the item's aspect ratio.
     * 
     * @param index - The item index
     * @param itemRatio - The item's aspect ratio ("16:9", "9:16", "fill", or undefined for cell dimensions)
     * @returns Content dimensions with offset for centering within the cell
     * 
     * @example
     * // For a mobile participant (9:16)
     * const content = grid.getItemContentDimensions(0, "9:16")
     * 
     * // For whiteboard (fill entire cell)
     * const content = grid.getItemContentDimensions(1, "fill")
     * 
     * // Apply in React:
     * <div style={{ 
     *   width: content.width, 
     *   height: content.height,
     *   marginTop: content.offsetTop,
     *   marginLeft: content.offsetLeft
     * }}>
     */
    getItemContentDimensions: (index: number, itemRatio?: ItemAspectRatio) => ContentDimensions
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

/**
 * Calculate content dimensions that fit within a cell while maintaining aspect ratio
 * @param cellDimensions - The cell dimensions to fit content into
 * @param itemRatio - The content's aspect ratio ("16:9", "9:16", "fill", etc.)
 * @param defaultRatio - The default aspect ratio to use if itemRatio is undefined
 * @returns Content dimensions with offset for centering
 */
export function calculateContentDimensions(
    cellDimensions: GridDimensions,
    itemRatio?: ItemAspectRatio,
    defaultRatio?: string
): ContentDimensions {
    const { width: cellW, height: cellH } = cellDimensions

    // Determine effective ratio: use itemRatio, then defaultRatio, or fall back to 'fill' behavior
    const effectiveRatio = itemRatio ?? (defaultRatio ? defaultRatio : undefined)

    // If no ratio or 'fill', return full cell dimensions
    if (!effectiveRatio || effectiveRatio === 'fill' || effectiveRatio === 'auto') {
        return {
            width: cellW,
            height: cellH,
            offsetTop: 0,
            offsetLeft: 0,
        }
    }

    // Parse the aspect ratio (effectiveRatio is guaranteed to be a string here)
    const ratio = getAspectRatio(effectiveRatio)

    // Calculate content dimensions that fit within cell maintaining aspect ratio
    let contentW = cellW
    let contentH = contentW * ratio

    if (contentH > cellH) {
        contentH = cellH
        contentW = contentH / ratio
    }

    // Center content within cell
    const offsetTop = (cellH - contentH) / 2
    const offsetLeft = (cellW - contentW) / 2

    return {
        width: contentW,
        height: contentH,
        offsetTop,
        offsetLeft,
    }
}

/**
 * Create a getItemContentDimensions function for a grid result
 */
function createGetItemContentDimensions(
    getItemDimensions: (index: number) => GridDimensions,
    itemAspectRatios?: (ItemAspectRatio | undefined)[],
    defaultRatio?: string
): (index: number, itemRatio?: ItemAspectRatio) => ContentDimensions {
    return (index: number, itemRatio?: ItemAspectRatio): ContentDimensions => {
        const cellDimensions = getItemDimensions(index)
        // Priority: 1. explicit itemRatio param, 2. itemAspectRatios[index], 3. defaultRatio
        const effectiveRatio = itemRatio ?? itemAspectRatios?.[index] ?? defaultRatio
        return calculateContentDimensions(cellDimensions, effectiveRatio, defaultRatio)
    }
}

/**
 * Calculate flex layout with variable cell sizes.
 * Each item maintains its aspect ratio.
 * Items in the same row have the same height but different widths.
 */
export function calculateFlexLayout(
    options: {
        dimensions: GridDimensions
        count: number
        aspectRatio: string
        gap: number
        itemAspectRatios?: (ItemAspectRatio | undefined)[]
        preferHorizontal?: boolean
    }
): FlexItemInfo[] {
    const { dimensions, count, aspectRatio, gap, itemAspectRatios, preferHorizontal } = options

    if (count === 0 || dimensions.width === 0 || dimensions.height === 0) {
        return []
    }

    const containerWidth = dimensions.width - gap * 2
    const containerHeight = dimensions.height - gap * 2

    // Get aspect ratio value for each item (width/height)
    const getItemAspectValue = (index: number): number => {
        const itemRatio = itemAspectRatios?.[index] ?? aspectRatio
        if (!itemRatio || itemRatio === 'fill' || itemRatio === 'auto') {
            return 16 / 9
        }
        const parsed = parseAspectRatio(itemRatio)
        return parsed ? parsed.widthRatio / parsed.heightRatio : 16 / 9
    }

    // Build aspect values array
    const aspectValues: number[] = []
    for (let i = 0; i < count; i++) {
        aspectValues.push(getItemAspectValue(i))
    }

    // Determine grid dimensions
    const avgAspect = aspectValues.reduce((a, b) => a + b, 0) / count
    const containerAspect = containerWidth / containerHeight
    let numRows: number

    if (preferHorizontal) {
        // For horizontal strips, try single row first
        // If items would be too small or exceed height, use more rows
        const sumAspects = aspectValues.reduce((a, b) => a + b, 0)
        const singleRowHeight = containerWidth / sumAspects

        if (singleRowHeight <= containerHeight) {
            // Single row fits
            numRows = 1
        } else {
            // Need multiple rows - calculate optimal
            numRows = Math.ceil(Math.sqrt(count * containerHeight / containerWidth / avgAspect))
            numRows = Math.max(1, Math.min(count, numRows))
        }
    } else {
        numRows = Math.round(Math.sqrt(count / (containerAspect / avgAspect)))
        numRows = Math.max(1, Math.min(count, numRows))
    }

    const itemsPerRow = Math.ceil(count / numRows)

    // Keep original order (no sorting) - this ensures +N items stay at the end
    // Distribute items into rows
    const rows: number[][] = []
    for (let i = 0; i < count; i += itemsPerRow) {
        const row: number[] = []
        for (let j = i; j < Math.min(i + itemsPerRow, count); j++) {
            row.push(j) // Use original index
        }
        rows.push(row)
    }

    // For each row, calculate height that fills width while maintaining aspect ratios
    // Total width = sum(height * aspect[i]) + gaps = containerWidth
    // So: height = (containerWidth - gaps) / sum(aspects)
    const rowHeights: number[] = []
    for (const row of rows) {
        const sumAspects = row.reduce((sum, idx) => sum + aspectValues[idx], 0)
        const totalGapWidth = (row.length - 1) * gap
        const height = (containerWidth - totalGapWidth) / sumAspects
        rowHeights.push(height)
    }

    // Check if rows fit in container height, scale down if needed
    const totalGapHeight = (rows.length - 1) * gap
    const totalNaturalHeight = rowHeights.reduce((a, b) => a + b, 0)

    // Only scale down, never up (to prevent width overflow)
    const scale = Math.min(1, (containerHeight - totalGapHeight) / totalNaturalHeight)

    for (let i = 0; i < rowHeights.length; i++) {
        rowHeights[i] *= scale
    }

    // Calculate total scaled height for vertical centering
    const totalScaledHeight = rowHeights.reduce((a, b) => a + b, 0) + totalGapHeight
    const verticalOffset = (containerHeight - totalScaledHeight) / 2

    // Calculate positions
    const items: FlexItemInfo[] = []
    let currentTop = gap + verticalOffset

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex]
        const rowHeight = rowHeights[rowIndex]

        // Calculate row width and center horizontally
        let rowWidth = 0
        for (const idx of row) {
            rowWidth += rowHeight * aspectValues[idx]
        }
        rowWidth += (row.length - 1) * gap
        const horizontalOffset = (containerWidth - rowWidth) / 2

        let currentLeft = gap + horizontalOffset

        for (const itemIndex of row) {
            const aspect = aspectValues[itemIndex]
            const itemWidth = rowHeight * aspect

            items[itemIndex] = {
                index: itemIndex,
                width: itemWidth,
                height: rowHeight,
                left: currentLeft,
                top: currentTop,
                row: rowIndex,
                widthFactor: aspect,
            }

            currentLeft += itemWidth + gap
        }

        currentTop += rowHeight + gap
    }

    return items
}

/**
 * Calculate flex strip layout for sidebar (single row/column of items with different aspects).
 * Used for sidebar modes where "others" need flexible sizing.
 * 
 * @param options - Strip layout options
 * @returns Array of items with positions and dimensions relative to strip origin
 */
export function calculateFlexStrip(
    options: {
        /** Strip dimensions (width x height) */
        dimensions: GridDimensions
        /** Number of items */
        count: number
        /** Default aspect ratio */
        aspectRatio: string
        /** Gap between items */
        gap: number
        /** Per-item aspect ratios */
        itemAspectRatios?: (ItemAspectRatio | undefined)[]
        /** Direction of the strip */
        direction: 'horizontal' | 'vertical'
        /** Offset to add to all positions */
        offset?: { left: number; top: number }
    }
): FlexItemInfo[] {
    const { dimensions, count, aspectRatio, gap, itemAspectRatios, direction, offset = { left: 0, top: 0 } } = options

    if (count === 0 || dimensions.width === 0 || dimensions.height === 0) {
        return []
    }

    const stripWidth = dimensions.width
    const stripHeight = dimensions.height

    // Get aspect ratio value for each item (width/height)
    const getItemAspectValue = (index: number): number => {
        const itemRatio = itemAspectRatios?.[index] ?? aspectRatio
        if (!itemRatio || itemRatio === 'fill' || itemRatio === 'auto') {
            return 16 / 9
        }
        const parsed = parseAspectRatio(itemRatio)
        return parsed ? parsed.widthRatio / parsed.heightRatio : 16 / 9
    }

    // Build aspect values array
    const aspectValues: number[] = []
    for (let i = 0; i < count; i++) {
        aspectValues.push(getItemAspectValue(i))
    }

    const items: FlexItemInfo[] = []

    if (direction === 'horizontal') {
        // Horizontal strip: all items have same height, different widths
        // Height is stripHeight, width of item i = height * aspect[i]
        const availableHeight = stripHeight
        const totalGaps = (count - 1) * gap

        // Calculate what widths would be at full height
        let totalNaturalWidth = 0
        for (let i = 0; i < count; i++) {
            totalNaturalWidth += availableHeight * aspectValues[i]
        }
        totalNaturalWidth += totalGaps

        // Scale to fit stripWidth
        let scale = (stripWidth - totalGaps) / (totalNaturalWidth - totalGaps)
        // Allow stretching to fill space, but cap at 2x to prevent overly large items
        scale = Math.min(scale, 2)

        const itemHeight = availableHeight * scale

        // Calculate total width after scaling
        let scaledTotalWidth = totalGaps
        for (let i = 0; i < count; i++) {
            scaledTotalWidth += itemHeight * aspectValues[i]
        }

        // Center horizontally
        let currentLeft = offset.left + (stripWidth - scaledTotalWidth) / 2
        const itemTop = offset.top + (stripHeight - itemHeight) / 2

        for (let i = 0; i < count; i++) {
            const itemWidth = itemHeight * aspectValues[i]
            items[i] = {
                index: i,
                width: itemWidth,
                height: itemHeight,
                left: currentLeft,
                top: itemTop,
                row: 0,
                widthFactor: aspectValues[i],
            }
            currentLeft += itemWidth + gap
        }
    } else {
        // Vertical strip: all items have same width, different heights
        // Width is stripWidth, height of item i = width / aspect[i]
        const availableWidth = stripWidth
        const totalGaps = (count - 1) * gap

        // Calculate what heights would be at full width
        let totalNaturalHeight = 0
        for (let i = 0; i < count; i++) {
            totalNaturalHeight += availableWidth / aspectValues[i]
        }
        totalNaturalHeight += totalGaps

        // Scale to fit stripHeight
        let scale = (stripHeight - totalGaps) / (totalNaturalHeight - totalGaps)
        // Allow stretching to fill space, but cap at 2x to prevent overly large items
        scale = Math.min(scale, 2)

        const itemWidth = availableWidth * scale

        // Calculate total height after scaling
        let scaledTotalHeight = totalGaps
        for (let i = 0; i < count; i++) {
            scaledTotalHeight += itemWidth / aspectValues[i]
        }

        // Center vertically
        let currentTop = offset.top + (stripHeight - scaledTotalHeight) / 2
        const itemLeft = offset.left + (stripWidth - itemWidth) / 2

        for (let i = 0; i < count; i++) {
            const itemHeight = itemWidth / aspectValues[i]
            items[i] = {
                index: i,
                width: itemWidth,
                height: itemHeight,
                left: itemLeft,
                top: currentTop,
                row: i,
                widthFactor: aspectValues[i],
            }
            currentTop += itemHeight + gap
        }
    }

    return items
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

    const minCols = 1

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
    const { dimensions, gap, aspectRatio, count, sidebarPosition = 'right', sidebarRatio = 0.25, pinnedIndex = 0, maxVisible = 0, currentVisiblePage = 0, flexLayout = false, itemAspectRatios } = options

    if (count === 0) {
        return createEmptyMeetGridResult('sidebar')
    }

    if (count === 1) {
        // Single item fills the entire container
        const { width: W, height: H } = dimensions
        const mainWidth = W - gap * 2
        const mainHeight = H - gap * 2
        const getItemDimensions = () => ({ width: mainWidth, height: mainHeight })
        const pagination = createDefaultPagination(1)
        return {
            width: mainWidth,
            height: mainHeight,
            rows: 1,
            cols: 1,
            layoutMode: 'sidebar',
            getPosition: () => ({ top: gap, left: gap }),
            getItemDimensions,
            isMainItem: () => true,
            pagination,
            isItemVisible: () => true,
            hiddenCount: 0,
            getLastVisibleOthersIndex: () => -1,
            getItemContentDimensions: createGetItemContentDimensions(getItemDimensions, options.itemAspectRatios, aspectRatio),
        }
    }

    const { width: W, height: H } = dimensions
    const ratio = getAspectRatio(aspectRatio)

    const isVertical = sidebarPosition === 'bottom' || sidebarPosition === 'top'

    let mainWidth: number
    let mainHeight: number
    let sidebarWidth: number
    let sidebarHeight: number

    if (isVertical) {
        // Horizontal sidebar (top/bottom)
        const totalOthersCalc = count - 1
        const visibleOthersCalc = maxVisible > 0 ? Math.min(maxVisible, totalOthersCalc) : totalOthersCalc

        const baseSidebarW = W - gap * 2
        const targetRatio = 1 / ratio  // w/h ratio (16:9 = 1.78)

        // Portrait mode needs larger sidebar for visible thumbnails
        const isPortraitMode = H > W * 1.2
        const maxSidebarRatio = isPortraitMode ? 0.45 : 0.38
        const minSidebarRatio = isPortraitMode ? 0.25 : 0.18
        const minThumbH = isPortraitMode ? 70 : 60

        let bestSidebarH = 0
        let bestThumbArea = 0

        const maxRows = Math.min(3, visibleOthersCalc || 1)

        for (let rows = 1; rows <= maxRows; rows++) {
            const cols = Math.ceil((visibleOthersCalc || 1) / rows)

            const thumbW = (baseSidebarW - (cols - 1) * gap) / cols
            const thumbH = thumbW / targetRatio
            const requiredSidebarH = rows * thumbH + (rows - 1) * gap + gap * 2

            const sidebarRatioCalc = requiredSidebarH / H

            // Skip if sidebar would be too large or thumbnails too small
            if (sidebarRatioCalc > maxSidebarRatio + 0.05 || thumbH < minThumbH) continue

            const thumbArea = thumbW * thumbH

            // Prefer config with larger thumbnails
            if (thumbArea > bestThumbArea) {
                bestThumbArea = thumbArea
                bestSidebarH = requiredSidebarH
            }
        }

        // Fallback - use minimum visible size
        if (bestSidebarH === 0) {
            bestSidebarH = H * (isPortraitMode ? 0.30 : 0.25)
        }

        // Clamp to bounds
        if (bestSidebarH / H < minSidebarRatio) bestSidebarH = H * minSidebarRatio
        else if (bestSidebarH / H > maxSidebarRatio) bestSidebarH = H * maxSidebarRatio

        sidebarHeight = bestSidebarH
        sidebarWidth = baseSidebarW
        // Layout: gap + mainHeight + gap + sidebarHeight + gap = H
        mainHeight = H - sidebarHeight - gap * 3
        mainWidth = baseSidebarW
    } else {
        // Vertical sidebar (left/right)
        // Calculate sidebar width dynamically based on thumbnail aspect ratio
        // Thumbnails must have correct aspect ratio, main item adapts

        const totalOthersCalc = count - 1
        const visibleOthersCalc = maxVisible > 0 ? Math.min(maxVisible, totalOthersCalc) : totalOthersCalc

        const baseSidebarH = H - gap * 2
        let bestSidebarW = W * sidebarRatio - gap
        let bestScore = 0
        const maxCols = Math.min(3, visibleOthersCalc || 1)

        for (let cols = 1; cols <= maxCols; cols++) {
            const rows = Math.ceil((visibleOthersCalc || 1) / cols)

            // Calculate thumbnail dimensions with correct aspect ratio
            const thumbH = (baseSidebarH - (rows - 1) * gap) / rows
            const thumbW = thumbH / ratio  // ratio = height/width, so width = height/ratio

            // Calculate required sidebar width
            const requiredSidebarW = cols * thumbW + (cols - 1) * gap + gap * 2

            // Check if this fits within reasonable bounds (12% - 40% of container)
            const sidebarRatioTest = requiredSidebarW / W

            // Calculate thumbnail area
            const thumbArea = thumbW * thumbH

            // Score: balance thumbnail size with main area preservation
            // Prefer smaller sidebar when thumbnails are still decent
            const mainAreaBonus = (1 - sidebarRatioTest) * 0.5  // Bonus for smaller sidebar
            const score = thumbArea * (1 + mainAreaBonus)

            if (sidebarRatioTest >= 0.12 && sidebarRatioTest <= 0.40 && score > bestScore) {
                bestSidebarW = requiredSidebarW
                bestScore = score
            }
        }

        if (bestSidebarW / W < 0.12) bestSidebarW = W * 0.15
        else if (bestSidebarW / W > 0.40) bestSidebarW = W * 0.35

        sidebarWidth = bestSidebarW
        sidebarHeight = baseSidebarH
        mainWidth = W - sidebarWidth - gap * 2
        mainHeight = baseSidebarH
    }

    // Main item fills entire area in sidebar layout
    const mainItemWidth = mainWidth
    const mainItemHeight = mainHeight

    const totalOthers = count - 1
    const visibleOthers = maxVisible > 0 ? Math.min(maxVisible, totalOthers) : totalOthers

    const othersTotalPages = maxVisible > 0 ? Math.ceil(totalOthers / maxVisible) : 1
    const safeCurrentVisiblePage = Math.min(currentVisiblePage, Math.max(0, othersTotalPages - 1))
    const startOthersIndex = safeCurrentVisiblePage * (maxVisible > 0 ? maxVisible : totalOthers)
    const endOthersIndex = Math.min(startOthersIndex + visibleOthers, totalOthers)
    const itemsOnPage = endOthersIndex - startOthersIndex
    const isPaginationMode = othersTotalPages > 1
    const isActivelyPaginating = isPaginationMode && currentVisiblePage > 0
    const hiddenCount = isActivelyPaginating ? 0 : (totalOthers > itemsOnPage ? totalOthers - itemsOnPage + 1 : 0)

    const positions: { position: Position; dimensions: GridDimensions }[] = []

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

    let sidebarOffsetLeft: number
    let sidebarOffsetTop: number

    if (isVertical) {
        sidebarOffsetLeft = gap
        sidebarOffsetTop = sidebarPosition === 'top' ? gap : mainHeight + gap * 2
    } else {
        sidebarOffsetLeft = sidebarPosition === 'left' ? gap : mainWidth + gap * 2
        sidebarOffsetTop = gap
    }

    if (flexLayout && itemAspectRatios && itemsOnPage > 0) {
        const othersAspectRatios: (ItemAspectRatio | undefined)[] = []
        const originalIndices: number[] = []

        let othersIdx = 0
        for (let i = 0; i < count; i++) {
            if (i === pinnedIndex) continue
            if (othersIdx >= startOthersIndex && othersIdx < endOthersIndex) {
                othersAspectRatios.push(itemAspectRatios[i])
                originalIndices.push(i)
            }
            othersIdx++
        }

        // Calculate flex grid layout (multi-row/multi-col, auto-optimized)
        const flexItems = calculateFlexLayout({
            dimensions: { width: sidebarWidth + gap * 2, height: sidebarHeight + gap * 2 },
            count: itemsOnPage,
            aspectRatio,
            gap,
            itemAspectRatios: othersAspectRatios,
            preferHorizontal: isVertical, // bottom/top sidebars should use horizontal layout
        })

        for (let i = 0; i < flexItems.length; i++) {
            const originalIndex = originalIndices[i]
            const flexItem = flexItems[i]
            positions[originalIndex] = {
                position: {
                    top: flexItem.top + sidebarOffsetTop - gap,
                    left: flexItem.left + sidebarOffsetLeft - gap
                },
                dimensions: { width: flexItem.width, height: flexItem.height }
            }
        }

        // Hidden items (not on current page)
        let sidebarIndex = 0
        for (let i = 0; i < count; i++) {
            if (i === pinnedIndex) continue
            const isInVisibleRange = sidebarIndex >= startOthersIndex && sidebarIndex < endOthersIndex
            if (!isInVisibleRange) {
                positions[i] = {
                    position: { top: -9999, left: -9999 },
                    dimensions: { width: 0, height: 0 }
                }
            }
            sidebarIndex++
        }
    } else {
        // Standard uniform grid for sidebar items
        let thumbCols = 1
        let thumbRows = 1
        let thumbWidth = 0
        let thumbHeight = 0

        if (visibleOthers > 0) {
            if (isVertical) {
                // Horizontal sidebar
                let bestScore = -1
                for (let cols = 1; cols <= visibleOthers; cols++) {
                    const rows = Math.ceil(visibleOthers / cols)
                    const maxTileW = (sidebarWidth - (cols - 1) * gap) / cols
                    const maxTileH = (sidebarHeight - (rows - 1) * gap) / rows

                    let tileW = maxTileW
                    let tileH = tileW * ratio
                    if (tileH > maxTileH) {
                        tileH = maxTileH
                        tileW = tileH / ratio
                    }

                    // Score based on area AND how close the aspect ratio is to ideal (16:9)
                    const area = tileW * tileH
                    const itemRatio = tileW / tileH
                    const idealRatio = 16 / 9
                    const ratioScore = 1 / (1 + Math.abs(Math.log(itemRatio / idealRatio)))

                    // For horizontal sidebars (bottom/top), strongly prefer more columns
                    // This creates a horizontal strip layout instead of stacking vertically
                    const colsMultiplier = cols >= rows ? 1.5 : 0.5
                    const score = area * ratioScore * colsMultiplier

                    if (score > bestScore) {
                        bestScore = score
                        thumbCols = cols
                        thumbRows = rows
                        thumbWidth = tileW
                        thumbHeight = tileH
                    }
                }
            } else {
                // Vertical sidebar - thumbnails with correct aspect ratio
                // Sidebar width was calculated for correct aspect ratio, now find best layout
                let bestScore = -1
                const targetRatio = 1 / ratio  // Convert h/w to w/h ratio

                for (let rows = 1; rows <= visibleOthers; rows++) {
                    const cols = Math.ceil(visibleOthers / rows)

                    // Calculate tile size to fill height with correct aspect ratio
                    const maxTileH = (sidebarHeight - (rows - 1) * gap) / rows
                    const idealTileW = maxTileH * targetRatio
                    const maxTileW = (sidebarWidth - (cols - 1) * gap) / cols

                    let tileW: number, tileH: number

                    if (idealTileW <= maxTileW) {
                        // Fits - use ideal width
                        tileW = idealTileW
                        tileH = maxTileH
                    } else {
                        // Width constrained - fit to width
                        tileW = maxTileW
                        tileH = tileW / targetRatio
                    }

                    // Score based on area coverage
                    const area = tileW * tileH * visibleOthers
                    const score = area

                    if (score > bestScore) {
                        bestScore = score
                        thumbCols = cols
                        thumbRows = rows
                        thumbWidth = tileW
                        thumbHeight = tileH
                    }
                }
            }
        }

        // Calculate grid start position
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

            const isInVisibleRange = sidebarIndex >= startOthersIndex && sidebarIndex < endOthersIndex

            if (isInVisibleRange) {
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
                positions[i] = {
                    position: { top: -9999, left: -9999 },
                    dimensions: { width: 0, height: 0 }
                }
            }
            sidebarIndex++
        }
    }

    // Create pagination info for others
    const pagination: PaginationInfo = {
        enabled: maxVisible > 0 && totalOthers > maxVisible,
        currentPage: safeCurrentVisiblePage,
        totalPages: othersTotalPages,
        itemsOnPage: itemsOnPage,
        startIndex: startOthersIndex,
        endIndex: endOthersIndex,
    }

    const getItemDimensions = (index: number) => positions[index]?.dimensions ?? { width: 0, height: 0 }

    // Calculate last visible others index
    const getLastVisibleOthersIndex = (): number => {
        if (itemsOnPage === 0) return -1
        // Find the original index of the last visible "other"
        let othersIdx = 0
        let lastVisibleOriginalIdx = -1
        for (let i = 0; i < count; i++) {
            if (i === pinnedIndex) continue
            if (othersIdx >= startOthersIndex && othersIdx < endOthersIndex) {
                lastVisibleOriginalIdx = i
            }
            othersIdx++
        }
        return lastVisibleOriginalIdx
    }

    return {
        width: mainItemWidth,
        height: mainItemHeight,
        rows: isVertical ? 2 : 1,
        cols: isVertical ? 1 : 2,
        layoutMode: 'sidebar',
        getPosition: (index: number) => positions[index]?.position ?? { top: 0, left: 0 },
        getItemDimensions,
        isMainItem: (index: number) => index === pinnedIndex,
        pagination,
        isItemVisible: (index: number) => {
            if (index === pinnedIndex) return true
            let sIdx = 0
            for (let i = 0; i < index; i++) {
                if (i !== pinnedIndex) sIdx++
            }
            return sIdx >= startOthersIndex && sIdx < endOthersIndex
        },
        hiddenCount,
        getLastVisibleOthersIndex,
        getItemContentDimensions: createGetItemContentDimensions(getItemDimensions, options.itemAspectRatios, aspectRatio),
    }
}



/**
 * Create a spotlight layout (single item in focus)
 */
function createSpotlightGrid(options: MeetGridOptions): MeetGridResult {
    const { dimensions, gap, aspectRatio, pinnedIndex = 0, flexLayout = false, itemAspectRatios } = options
    const { width: W, height: H } = dimensions

    // Get the item's aspect ratio (if flexLayout enabled)
    const itemRatio = flexLayout && itemAspectRatios?.[pinnedIndex]
    const shouldFill = itemRatio === 'fill' || itemRatio === 'auto'

    let spotWidth: number
    let spotHeight: number

    if (shouldFill) {
        // Fill mode: spotlight fills entire container
        spotWidth = W - gap * 2
        spotHeight = H - gap * 2
    } else {
        // Standard mode: maintain aspect ratio
        const ratio = itemRatio ? getAspectRatio(itemRatio) : getAspectRatio(aspectRatio)
        spotWidth = W - gap * 2
        spotHeight = spotWidth * ratio
        if (spotHeight > H - gap * 2) {
            spotHeight = H - gap * 2
            spotWidth = spotHeight / ratio
        }
    }



    const position: Position = {
        top: gap + (H - gap * 2 - spotHeight) / 2,
        left: gap + (W - gap * 2 - spotWidth) / 2
    }

    const pagination = createDefaultPagination(1) // Spotlight shows only 1 item
    const getItemDimensions = (index: number) =>
        index === pinnedIndex ? { width: spotWidth, height: spotHeight } : { width: 0, height: 0 }

    return {
        width: spotWidth,
        height: spotHeight,
        rows: 1,
        cols: 1,
        layoutMode: 'spotlight',
        getPosition: (index: number) => index === pinnedIndex ? position : { top: -9999, left: -9999 },
        getItemDimensions,
        isMainItem: (index: number) => index === pinnedIndex,
        pagination,
        isItemVisible: (index: number) => index === pinnedIndex,
        hiddenCount: 0,
        getLastVisibleOthersIndex: () => -1,
        getItemContentDimensions: createGetItemContentDimensions(getItemDimensions, options.itemAspectRatios, aspectRatio),
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
    const getItemDimensions = () => ({ width: 0, height: 0 })
    return {
        width: 0,
        height: 0,
        rows: 0,
        cols: 0,
        layoutMode,
        getPosition: () => ({ top: 0, left: 0 }),
        getItemDimensions,
        isMainItem: () => false,
        pagination: createDefaultPagination(0),
        isItemVisible: () => false,
        hiddenCount: 0,
        getLastVisibleOthersIndex: () => -1,
        getItemContentDimensions: () => ({ width: 0, height: 0, offsetTop: 0, offsetLeft: 0 }),
    }
}

/**
 * Create a meet-style grid with support for different layout modes.
 * This is the main function for creating video conferencing-style layouts.
 */
export function createMeetGrid(options: MeetGridOptions): MeetGridResult {
    const { layoutMode = 'gallery', count, flexLayout = false } = options

    if (count === 0) {
        return createEmptyMeetGridResult(layoutMode)
    }

    switch (layoutMode) {
        case 'spotlight':
            return createSpotlightGrid(options)

        case 'sidebar':
            return createSidebarGrid(options)

        case 'gallery':
        default: {
            const { maxItemsPerPage, currentPage, pinnedIndex, sidebarPosition = 'right', dimensions, maxVisible = 0 } = options

            // Gallery with pin uses sidebar layout (portrait: bottom, landscape: user-defined)
            if (pinnedIndex !== undefined && pinnedIndex >= 0 && pinnedIndex < count) {
                const isPortrait = dimensions.width < dimensions.height
                const effectiveSidebarPosition = isPortrait ? 'bottom' : sidebarPosition
                return createSidebarGrid({ ...options, sidebarPosition: effectiveSidebarPosition })
            }

            // Priority: pagination > maxVisible
            let visibleCount = count
            let hiddenCount = 0
            let startIndex = 0
            let endIndex = count

            if (maxItemsPerPage && maxItemsPerPage > 0) {
                const pagination = createPaginationInfo(count, maxItemsPerPage, currentPage)
                visibleCount = pagination.itemsOnPage
                startIndex = pagination.startIndex
                endIndex = pagination.endIndex
            } else if (maxVisible > 0 && count > maxVisible) {
                visibleCount = maxVisible
                // +1 because the last slot shows the indicator instead of a participant
                hiddenCount = count - maxVisible + 1
                startIndex = 0
                endIndex = maxVisible
            }

            const pagination: PaginationInfo = maxItemsPerPage && maxItemsPerPage > 0
                ? createPaginationInfo(count, maxItemsPerPage, currentPage)
                : {
                    enabled: false,
                    currentPage: 0,
                    totalPages: 1,
                    itemsOnPage: visibleCount,
                    startIndex,
                    endIndex,
                }

            const effectiveCount = visibleCount

            if (flexLayout && options.itemAspectRatios) {
                const pageItemRatios = options.itemAspectRatios.slice(startIndex, startIndex + effectiveCount)

                const flexItems = calculateFlexLayout({
                    dimensions: options.dimensions,
                    count: effectiveCount,
                    aspectRatio: options.aspectRatio,
                    gap: options.gap,
                    itemAspectRatios: pageItemRatios,
                })

                // Create getters for flex layout
                const getPosition = (index: number): Position => {
                    const relativeIndex = index - startIndex
                    if (relativeIndex < 0 || relativeIndex >= effectiveCount) {
                        return { top: -9999, left: -9999 }
                    }
                    const item = flexItems[relativeIndex]
                    return item ? { top: item.top, left: item.left } : { top: -9999, left: -9999 }
                }

                const getItemDimensions = (index: number): GridDimensions => {
                    const relativeIndex = index - startIndex
                    if (relativeIndex < 0 || relativeIndex >= effectiveCount) {
                        return { width: 0, height: 0 }
                    }
                    const item = flexItems[relativeIndex]
                    return item ? { width: item.width, height: item.height } : { width: 0, height: 0 }
                }

                // For flex layout, content fills the cell (already properly sized)
                const getItemContentDimensions = (index: number): ContentDimensions => {
                    const dims = getItemDimensions(index)
                    return {
                        width: dims.width,
                        height: dims.height,
                        offsetTop: 0,
                        offsetLeft: 0,
                    }
                }

                // Get last visible index (for +X indicator)
                const lastVisibleIndex = endIndex - 1

                return {
                    width: flexItems[0]?.width ?? 0,
                    height: flexItems[0]?.height ?? 0,
                    rows: Math.max(...flexItems.map(i => i.row)) + 1,
                    cols: flexItems.filter(i => i.row === 0).length,
                    layoutMode: 'gallery',
                    getPosition,
                    getItemDimensions,
                    isMainItem: () => false,
                    pagination,
                    isItemVisible: (index: number) => index >= startIndex && index < endIndex,
                    hiddenCount,
                    getLastVisibleOthersIndex: () => hiddenCount > 0 ? lastVisibleIndex : -1,
                    getItemContentDimensions,
                }
            }

            // Standard uniform grid
            const grid = createGrid({ ...options, count: effectiveCount })

            // Create position getter that maps original index to relative index
            const getPosition = (index: number): Position => {
                const relativeIndex = index - startIndex
                if (relativeIndex < 0 || relativeIndex >= effectiveCount) {
                    return { top: -9999, left: -9999 }
                }
                return grid.getPosition(relativeIndex)
            }

            const getItemDimensions = () => ({ width: grid.width, height: grid.height })

            // Get last visible index (for +X indicator)
            const lastVisibleIndex = endIndex - 1

            return {
                ...grid,
                layoutMode: 'gallery',
                getPosition,
                getItemDimensions,
                isMainItem: () => false,
                pagination,
                isItemVisible: (index: number) => index >= startIndex && index < endIndex,
                hiddenCount,
                getLastVisibleOthersIndex: () => hiddenCount > 0 ? lastVisibleIndex : -1,
                getItemContentDimensions: createGetItemContentDimensions(getItemDimensions, options.itemAspectRatios, options.aspectRatio),
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
