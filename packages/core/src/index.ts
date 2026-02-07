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
 * - gallery: Flexible grid that fills all available space. Supports pin mode with pinnedIndex.
 * - spotlight: Single participant in focus, others hidden
 */
export type LayoutMode = 'gallery' | 'spotlight'

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
 * - 'auto': Use actual content dimensions (requires callback)
 */
export type ItemAspectRatio = string | 'auto'

/**
 * Extended options for meet-style grid with layout modes
 */
export interface MeetGridOptions extends GridOptions {
  /** Layout mode for the grid */
  layoutMode?: LayoutMode
  /** Index of pinned/focused item (main participant for spotlight/pin modes) */
  pinnedIndex?: number
  /**
   * Position of "others" thumbnails when a participant is pinned.
   * In portrait containers, this is forced to 'bottom'.
   * @default 'right'
   */
  othersPosition?: 'left' | 'right' | 'top' | 'bottom'
  /** Maximum items per page for pagination (0 = no pagination) */
  maxItemsPerPage?: number
  /** Current page index (0-based) for pagination */
  currentPage?: number
  /**
   * Maximum visible items (0 = show all).
   * - In gallery mode without pin: limits total items displayed
   * - In gallery mode with pin: limits "others" thumbnails (pinned item always visible)
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
   * - Use undefined to inherit from global aspectRatio
   * @example
   * itemAspectRatios: ["16:9", "9:16", undefined]
   */
  itemAspectRatios?: (ItemAspectRatio | undefined)[]
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
   * @param itemRatio - The item's aspect ratio ("16:9", "9:16", or undefined for cell dimensions)
   * @returns Content dimensions with offset for centering within the cell
   *
   * @example
   * // For a mobile participant (9:16)
   * const content = grid.getItemContentDimensions(0, "9:16")
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
 * @param itemRatio - The content's aspect ratio ("16:9", "9:16", etc.)
 * @param defaultRatio - The default aspect ratio to use if itemRatio is undefined
 * @returns Content dimensions with offset for centering
 */
export function calculateContentDimensions(
  cellDimensions: GridDimensions,
  itemRatio?: ItemAspectRatio,
  defaultRatio?: string
): ContentDimensions {
  const { width: cellW, height: cellH } = cellDimensions

  // Determine effective ratio: use itemRatio, then defaultRatio, or fall back to full cell
  const effectiveRatio = itemRatio ?? (defaultRatio ? defaultRatio : undefined)

  // If no ratio or 'auto', return full cell dimensions
  if (!effectiveRatio || effectiveRatio === 'auto') {
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

// ============================================
// Core Grid Calculation
// ============================================

/**
 * Calculates grid item dimensions for items that can fit in a container.
 * Adapted from: https://stackoverflow.com/a/28268965
 */
export function getGridItemDimensions({ count, dimensions, aspectRatio, gap }: GridOptions): {
  width: number
  height: number
  rows: number
  cols: number
} {
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
 * Create a flexible pin layout grid.
 * Pinned item fills the main area, others are arranged in a compact grid.
 * On portrait containers, others go bottom. On landscape, others go to the specified position.
 */
function createFlexiblePinGrid(options: MeetGridOptions): MeetGridResult {
  const {
    dimensions,
    gap,
    aspectRatio,
    count,
    othersPosition = 'right',
    pinnedIndex = 0,
    maxVisible = 0,
    currentVisiblePage = 0,
  } = options

  if (count === 0) {
    return createEmptyMeetGridResult('gallery')
  }

  if (count === 1) {
    // Single item fills entire container
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
      layoutMode: 'gallery',
      getPosition: () => ({ top: gap, left: gap }),
      getItemDimensions,
      isMainItem: () => true,
      pagination,
      isItemVisible: () => true,
      hiddenCount: 0,
      getLastVisibleOthersIndex: () => -1,
      getItemContentDimensions: createGetItemContentDimensions(
        getItemDimensions,
        options.itemAspectRatios,
        aspectRatio
      ),
    }
  }

  const { width: W, height: H } = dimensions
  const isPortrait = H > W
  const effectivePosition = isPortrait ? 'bottom' : othersPosition
  const isVertical = effectivePosition === 'bottom' || effectivePosition === 'top'
  const ratio = getAspectRatio(aspectRatio)

  // Calculate others pagination
  const totalOthers = count - 1
  const visibleOthers = maxVisible > 0 ? Math.min(maxVisible, totalOthers) : totalOthers

  const othersTotalPages = maxVisible > 0 ? Math.ceil(totalOthers / maxVisible) : 1
  const safeCurrentVisiblePage = Math.min(currentVisiblePage, Math.max(0, othersTotalPages - 1))
  const startOthersIndex = safeCurrentVisiblePage * (maxVisible > 0 ? maxVisible : totalOthers)
  const endOthersIndex = Math.min(startOthersIndex + visibleOthers, totalOthers)
  const itemsOnPage = endOthersIndex - startOthersIndex
  const isPaginationMode = othersTotalPages > 1
  const isActivelyPaginating = isPaginationMode && currentVisiblePage > 0
  const hiddenCount = isActivelyPaginating
    ? 0
    : totalOthers > itemsOnPage
      ? totalOthers - itemsOnPage + 1
      : 0

  // Determine optimal others area size
  let mainWidth: number
  let mainHeight: number
  let othersAreaWidth: number
  let othersAreaHeight: number

  if (isVertical) {
    // Others on top/bottom — find best row configuration
    const areaW = W - gap * 2

    // Use 1:1 ratio for others on mobile portrait, else use global ratio
    const othersRatio = isPortrait ? 1 : ratio

    // Search for best layout
    let bestOthersH = 0
    let bestThumbArea = 0
    const maxRows = Math.min(3, visibleOthers || 1)

    for (let rows = 1; rows <= maxRows; rows++) {
      const cols = Math.ceil((visibleOthers || 1) / rows)
      const thumbW = (areaW - (cols - 1) * gap) / cols
      const thumbH = thumbW * othersRatio
      const requiredH = rows * thumbH + (rows - 1) * gap + gap * 2

      const areaRatio = requiredH / H
      if (areaRatio > 0.5) continue // Others area should not exceed 50%
      if (thumbH < 40) continue // Minimum thumb height

      const thumbArea = thumbW * thumbH
      if (thumbArea > bestThumbArea) {
        bestThumbArea = thumbArea
        bestOthersH = requiredH
      }
    }

    // Fallback
    if (bestOthersH === 0) {
      bestOthersH = H * (isPortrait ? 0.25 : 0.2)
    }

    // Clamp
    const minRatio = 0.12
    const maxRatio = 0.45
    if (bestOthersH / H < minRatio) bestOthersH = H * minRatio
    else if (bestOthersH / H > maxRatio) bestOthersH = H * maxRatio

    othersAreaHeight = bestOthersH
    othersAreaWidth = areaW
    mainHeight = H - othersAreaHeight - gap * 3
    mainWidth = areaW
  } else {
    // Others on left/right — find best column configuration
    const areaH = H - gap * 2

    let bestOthersW = W * 0.2
    let bestScore = 0
    const maxCols = Math.min(3, visibleOthers || 1)

    for (let cols = 1; cols <= maxCols; cols++) {
      const rows = Math.ceil((visibleOthers || 1) / cols)
      const thumbH = (areaH - (rows - 1) * gap) / rows
      const thumbW = thumbH / ratio
      const requiredW = cols * thumbW + (cols - 1) * gap + gap * 2

      const areaRatio = requiredW / W
      const thumbArea = thumbW * thumbH
      const mainAreaBonus = (1 - areaRatio) * 0.5
      const score = thumbArea * (1 + mainAreaBonus)

      if (areaRatio >= 0.1 && areaRatio <= 0.4 && score > bestScore) {
        bestOthersW = requiredW
        bestScore = score
      }
    }

    if (bestOthersW / W < 0.1) bestOthersW = W * 0.12
    else if (bestOthersW / W > 0.4) bestOthersW = W * 0.35

    othersAreaWidth = bestOthersW
    othersAreaHeight = areaH
    mainWidth = W - othersAreaWidth - gap * 2
    mainHeight = areaH
  }

  // Main item fills entire main area
  const mainItemWidth = mainWidth
  const mainItemHeight = mainHeight

  const positions: { position: Position; dimensions: GridDimensions }[] = []

  // Position main item
  let mainLeft: number
  let mainTop: number

  if (isVertical) {
    mainLeft = gap + (mainWidth - mainItemWidth) / 2
    mainTop =
      effectivePosition === 'top'
        ? othersAreaHeight + gap * 2 + (mainHeight - mainItemHeight) / 2
        : gap + (mainHeight - mainItemHeight) / 2
  } else {
    mainLeft =
      effectivePosition === 'left'
        ? othersAreaWidth + gap * 2 + (mainWidth - mainItemWidth) / 2
        : gap + (mainWidth - mainItemWidth) / 2
    mainTop = gap + (mainHeight - mainItemHeight) / 2
  }

  positions[pinnedIndex] = {
    position: { top: mainTop, left: mainLeft },
    dimensions: { width: mainItemWidth, height: mainItemHeight },
  }

  // Layout others with uniform grid inside their area
  {
    // Use 1:1 ratio for others on mobile portrait, else use global ratio
    const othersRatio = isPortrait ? 1 : ratio

    let thumbCols = 1
    let thumbRows = 1
    let thumbWidth = 0
    let thumbHeight = 0

    if (visibleOthers > 0) {
      if (isVertical) {
        let bestScore = -1
        for (let cols = 1; cols <= visibleOthers; cols++) {
          const rows = Math.ceil(visibleOthers / cols)
          const maxTileW = (othersAreaWidth - (cols - 1) * gap) / cols
          const maxTileH = (othersAreaHeight - (rows - 1) * gap) / rows

          let tileW = maxTileW
          let tileH = tileW * othersRatio
          if (tileH > maxTileH) {
            tileH = maxTileH
            tileW = tileH / othersRatio
          }

          const area = tileW * tileH
          const colsMultiplier = cols >= rows ? 1.5 : 0.5
          const score = area * colsMultiplier

          if (score > bestScore) {
            bestScore = score
            thumbCols = cols
            thumbRows = rows
            thumbWidth = tileW
            thumbHeight = tileH
          }
        }
      } else {
        let bestScore = -1
        const targetRatio = 1 / ratio

        for (let rows = 1; rows <= visibleOthers; rows++) {
          const cols = Math.ceil(visibleOthers / rows)

          const maxTileH = (othersAreaHeight - (rows - 1) * gap) / rows
          const idealTileW = maxTileH * targetRatio
          const maxTileW = (othersAreaWidth - (cols - 1) * gap) / cols

          let tileW: number, tileH: number

          if (idealTileW <= maxTileW) {
            tileW = idealTileW
            tileH = maxTileH
          } else {
            tileW = maxTileW
            tileH = tileW / targetRatio
          }

          const area = tileW * tileH * visibleOthers
          if (area > bestScore) {
            bestScore = area
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
      gridStartLeft = gap + (othersAreaWidth - totalGridWidth) / 2
      gridStartTop =
        effectivePosition === 'top'
          ? gap + (othersAreaHeight - totalGridHeight) / 2
          : mainHeight + gap * 2 + (othersAreaHeight - totalGridHeight) / 2
    } else {
      gridStartLeft =
        effectivePosition === 'left'
          ? gap + (othersAreaWidth - totalGridWidth) / 2
          : mainWidth + gap * 2 + (othersAreaWidth - totalGridWidth) / 2
      gridStartTop = gap + (othersAreaHeight - totalGridHeight) / 2
    }

    let othersIndex = 0
    for (let i = 0; i < count; i++) {
      if (i === pinnedIndex) continue

      const isInVisibleRange = othersIndex >= startOthersIndex && othersIndex < endOthersIndex

      if (isInVisibleRange) {
        const pageRelativeIndex = othersIndex - startOthersIndex
        const row = Math.floor(pageRelativeIndex / thumbCols)
        const col = pageRelativeIndex % thumbCols

        // Center last incomplete row
        const itemsInLastRow = itemsOnPage % thumbCols || thumbCols
        let rowLeft = gridStartLeft
        const lastRowIndex = Math.ceil(itemsOnPage / thumbCols) - 1
        if (row === lastRowIndex && itemsInLastRow < thumbCols) {
          const rowWidth = itemsInLastRow * thumbWidth + (itemsInLastRow - 1) * gap
          if (isVertical) {
            rowLeft = gap + (othersAreaWidth - rowWidth) / 2
          } else {
            rowLeft =
              (effectivePosition === 'left' ? gap : mainWidth + gap * 2) +
              (othersAreaWidth - rowWidth) / 2
          }
        }

        positions[i] = {
          position: {
            top: gridStartTop + row * (thumbHeight + gap),
            left: rowLeft + col * (thumbWidth + gap),
          },
          dimensions: { width: thumbWidth, height: thumbHeight },
        }
      } else {
        positions[i] = {
          position: { top: -9999, left: -9999 },
          dimensions: { width: 0, height: 0 },
        }
      }
      othersIndex++
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

  const getItemDimensions = (index: number) =>
    positions[index]?.dimensions ?? { width: 0, height: 0 }

  // Calculate last visible others index
  const getLastVisibleOthersIndex = (): number => {
    if (itemsOnPage === 0) return -1
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
    layoutMode: 'gallery',
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
    getItemContentDimensions: createGetItemContentDimensions(
      getItemDimensions,
      options.itemAspectRatios,
      aspectRatio
    ),
  }
}

/**
 * Create a spotlight layout (single item in focus)
 */
function createSpotlightGrid(options: MeetGridOptions): MeetGridResult {
  const { dimensions, gap, aspectRatio, pinnedIndex = 0, itemAspectRatios } = options
  const { width: W, height: H } = dimensions

  // Get the item's aspect ratio
  const itemRatio = itemAspectRatios?.[pinnedIndex]
  const shouldFill = itemRatio === 'auto'

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
    left: gap + (W - gap * 2 - spotWidth) / 2,
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
    getPosition: (index: number) =>
      index === pinnedIndex ? position : { top: -9999, left: -9999 },
    getItemDimensions,
    isMainItem: (index: number) => index === pinnedIndex,
    pagination,
    isItemVisible: (index: number) => index === pinnedIndex,
    hiddenCount: 0,
    getLastVisibleOthersIndex: () => -1,
    getItemContentDimensions: createGetItemContentDimensions(
      getItemDimensions,
      options.itemAspectRatios,
      aspectRatio
    ),
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
function createPaginationInfo(
  count: number,
  maxItemsPerPage?: number,
  currentPage?: number
): PaginationInfo {
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
 * Check if itemAspectRatios contains mixed (different) ratios
 */
function hasMixedRatios(
  itemAspectRatios: (ItemAspectRatio | undefined)[] | undefined,
  defaultRatio: string
): boolean {
  if (!itemAspectRatios || itemAspectRatios.length === 0) return false
  const ratios = new Set<string>()
  for (const r of itemAspectRatios) {
    ratios.add(r ?? defaultRatio)
  }
  return ratios.size > 1
}

/**
/**
 * Create a flexible gallery grid using a justified layout algorithm.
 * Uses binary search to find the optimal row height that fills the container.
 * Items are packed greedily into rows, then each row is scaled to fill width.
 */
function createFlexibleGalleryGrid(options: MeetGridOptions): MeetGridResult {
  const { dimensions, gap, aspectRatio, count, itemAspectRatios = [] } = options

  if (count === 0) {
    return createEmptyMeetGridResult('gallery')
  }

  const { width: W, height: H } = dimensions
  const availW = W - gap * 2
  const availH = H - gap * 2

  // For each item, compute width/height ratio
  const itemWHRatios: number[] = []
  for (let i = 0; i < count; i++) {
    const ratioStr = itemAspectRatios[i] ?? aspectRatio
    const hw = getAspectRatio(ratioStr)
    itemWHRatios.push(1 / hw) // width / height
  }

  // Pack items into rows given a target row height
  function packRows(rowHeight: number): number[][] {
    const result: number[][] = []
    let currentRow: number[] = []
    let rowW = 0

    for (let i = 0; i < count; i++) {
      const itemW = itemWHRatios[i] * rowHeight
      const gapW = currentRow.length > 0 ? gap : 0

      if (currentRow.length > 0 && rowW + gapW + itemW > availW) {
        result.push(currentRow)
        currentRow = [i]
        rowW = itemW
      } else {
        currentRow.push(i)
        rowW += gapW + itemW
      }
    }
    if (currentRow.length > 0) {
      result.push(currentRow)
    }
    return result
  }

  // Binary search for optimal row height
  // The height that makes total layout height = availH
  let lo = 20
  let hi = availH
  let bestRows: number[][] = []

  for (let iter = 0; iter < 50; iter++) {
    const mid = (lo + hi) / 2
    const rows = packRows(mid)
    const totalH = rows.length * mid + (rows.length - 1) * gap

    if (totalH > availH) {
      hi = mid
    } else {
      lo = mid
    }
  }

  const idealRowH = (lo + hi) / 2
  bestRows = packRows(idealRowH)

  // Ensure we don't have a single item alone in last row when we could redistribute
  if (bestRows.length > 1 && bestRows[bestRows.length - 1].length === 1) {
    const lastItem = bestRows[bestRows.length - 1][0]
    const prevRow = bestRows[bestRows.length - 2]
    // Move last lonely item to previous row if it won't make it too cramped
    if (prevRow.length <= 4) {
      prevRow.push(lastItem)
      bestRows.pop()
    }
  }

  // For each row, scale items to exactly fill availW
  const posMap = new Map<number, { position: Position; dimensions: GridDimensions }>()
  const rowCount = bestRows.length

  // Calculate actual row heights: each row's natural height based on its items fitting availW
  const rowHeights: number[] = []
  for (const row of bestRows) {
    // Sum of natural widths at height=1
    const totalUnitW = row.reduce((s, idx) => s + itemWHRatios[idx], 0)
    // Available width minus gaps
    const netW = availW - (row.length - 1) * gap
    // Row height = netW / totalUnitW (so items at this height fill the width)
    rowHeights.push(netW / totalUnitW)
  }

  // Scale all row heights to fit availH
  const totalRowH = rowHeights.reduce((s, h) => s + h, 0) + (rowCount - 1) * gap
  const globalScale = availH / totalRowH

  let currentTop = gap
  for (let ri = 0; ri < rowCount; ri++) {
    const row = bestRows[ri]
    const finalRowH = rowHeights[ri] * globalScale

    // Calculate individual item widths (proportional to their w/h ratio)
    const totalUnitW = row.reduce((s, idx) => s + itemWHRatios[idx], 0)
    const netW = availW - (row.length - 1) * gap
    const itemWidths = row.map((idx) => (itemWHRatios[idx] / totalUnitW) * netW)

    let currentLeft = gap
    for (let ci = 0; ci < row.length; ci++) {
      posMap.set(row[ci], {
        position: { top: currentTop, left: currentLeft },
        dimensions: { width: itemWidths[ci], height: finalRowH },
      })
      currentLeft += itemWidths[ci] + gap
    }
    currentTop += finalRowH + gap
  }

  const getPosition = (index: number): Position => {
    return posMap.get(index)?.position ?? { top: -9999, left: -9999 }
  }

  const getItemDimensions = (index: number): GridDimensions => {
    return posMap.get(index)?.dimensions ?? { width: 0, height: 0 }
  }

  const pagination = createDefaultPagination(count)

  return {
    width: availW,
    height: availH,
    rows: rowCount,
    cols: rowCount > 0 ? Math.max(...bestRows.map((r) => r.length)) : 0,
    layoutMode: 'gallery',
    getPosition,
    getItemDimensions,
    isMainItem: () => false,
    pagination,
    isItemVisible: () => true,
    hiddenCount: 0,
    getLastVisibleOthersIndex: () => -1,
    getItemContentDimensions: createGetItemContentDimensions(
      getItemDimensions,
      itemAspectRatios,
      aspectRatio
    ),
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

    case 'gallery':
    default: {
      const { maxItemsPerPage, currentPage, pinnedIndex, maxVisible = 0 } = options

      // Gallery with pin uses flexible pin layout
      if (pinnedIndex !== undefined && pinnedIndex >= 0 && pinnedIndex < count) {
        return createFlexiblePinGrid(options)
      }

      // Check for mixed aspect ratios ? use flexible gallery layout
      if (hasMixedRatios(options.itemAspectRatios, options.aspectRatio)) {
        return createFlexibleGalleryGrid(options)
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

      const pagination: PaginationInfo =
        maxItemsPerPage && maxItemsPerPage > 0
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
        getLastVisibleOthersIndex: () => (hiddenCount > 0 ? lastVisibleIndex : -1),
        getItemContentDimensions: createGetItemContentDimensions(
          getItemDimensions,
          options.itemAspectRatios,
          options.aspectRatio
        ),
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
