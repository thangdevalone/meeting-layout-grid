import { useState, useCallback, useRef, useEffect, TouchEvent } from 'react'
import {
    GridContainer,
    GridItem,
    FloatingGridItem,
    LayoutMode,
    ItemAspectRatio,
} from '@thangdevalone/meet-layout-grid-react'

// Generate random gradient for participant tiles
function getRandomGradient(seed: number) {
    const hue1 = (seed * 137) % 360
    const hue2 = (hue1 + 40) % 360
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 45%) 0%, hsl(${hue2}, 70%, 35%) 100%)`
}

// Device types with different aspect ratios
type ParticipantType =
    | 'desktop'      // 16:9 - standard laptop/desktop
    | 'phone-916'    // 9:16 - standard phone portrait  
    | 'phone-919'    // 9:19 - modern tall phones (Samsung, iPhone)
    | 'phone-34'     // 3:4 - older phones, some tablets
    | 'tablet'       // 4:3 - iPad and tablets

interface Participant {
    id: number
    name: string
    gradient: string
    initials: string
    type: ParticipantType
}

function createParticipants(count: number): Participant[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        name: i === 0 ? 'You' : `User ${i}`,
        gradient: getRandomGradient(i),
        initials: i === 0 ? 'Y' : `U${i}`,
        type: 'desktop' as ParticipantType, // Default all to desktop
    }))
}

const LAYOUT_MODES: { value: LayoutMode; label: string }[] = [
    { value: 'gallery', label: 'Gallery' },
    { value: 'spotlight', label: 'Spotlight' },
    { value: 'sidebar', label: 'Sidebar' },
]

const ASPECT_RATIOS = ['16:9', '4:3', '1:1', 'Flex']

// Hook for swipe gesture
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
    const touchStartX = useRef<number | null>(null)
    const touchEndX = useRef<number | null>(null)
    const minSwipeDistance = 50

    const onTouchStart = (e: TouchEvent) => {
        touchEndX.current = null
        touchStartX.current = e.targetTouches[0].clientX
    }

    const onTouchMove = (e: TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX
    }

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return

        const distance = touchStartX.current - touchEndX.current
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            onSwipeLeft()
        } else if (isRightSwipe) {
            onSwipeRight()
        }
    }

    return { onTouchStart, onTouchMove, onTouchEnd }
}

export default function App() {
    const [participants, setParticipants] = useState(() => createParticipants(12))
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('gallery')
    const [aspectRatio, setAspectRatio] = useState('16:9')
    const [gap, setGap] = useState(12)
    const [pinnedIndex, setPinnedIndex] = useState<number | null>(null)
    const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('right')
    const [currentPage, setCurrentPage] = useState(0)
    const [othersPage, setOthersPage] = useState(0)
    const [paginationEnabled, setPaginationEnabled] = useState(false)
    const [itemsPerPage, setItemsPerPage] = useState(4)
    const [maxVisible, setMaxVisible] = useState(0)
    const [zoomMode, setZoomMode] = useState(false)
    const [floatingIndex, setFloatingIndex] = useState(0)

    // Responsive floating size
    const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 768px)').matches)
    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)')
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    const floatingSize = isMobile ? { width: 90, height: 120 } : { width: 130, height: 175 }

    // Flex mode is when aspectRatio === 'Flex'
    const flexibleRatiosEnabled = aspectRatio === 'Flex'
    const effectiveAspectRatio = flexibleRatiosEnabled ? '16:9' : aspectRatio

    // Calculate pagination values
    const othersCount = participants.length - 1

    // When gallery has pinned participant, it uses sidebar layout internally
    const isGalleryWithPin = layoutMode === 'gallery' && pinnedIndex !== null

    // When pagination is enabled, itemsPerPage controls how many items per page for all modes
    const galleryTotalPages = paginationEnabled && itemsPerPage > 0 ? Math.ceil(participants.length / itemsPerPage) : 1
    const othersTotalPages = paginationEnabled && itemsPerPage > 0 ? Math.ceil(othersCount / itemsPerPage) : 1

    // Use the appropriate total pages based on mode (gallery with pin uses othersPage)
    const totalPages = layoutMode === 'gallery' && !isGalleryWithPin ? galleryTotalPages : othersTotalPages
    const effectiveCurrentPage = layoutMode === 'gallery' && !isGalleryWithPin ? currentPage : othersPage

    // Reset page when participants change or pagination toggles
    useEffect(() => {
        if (currentPage >= galleryTotalPages) {
            setCurrentPage(Math.max(0, galleryTotalPages - 1))
        }
        if (othersPage >= othersTotalPages) {
            setOthersPage(Math.max(0, othersTotalPages - 1))
        }
    }, [participants.length, galleryTotalPages, othersTotalPages, currentPage, othersPage])

    // Auto-switch floatingIndex when it matches pinnedIndex (so floating window always shows different participant)
    useEffect(() => {
        if (pinnedIndex !== null && floatingIndex === pinnedIndex && participants.length > 1) {
            // Find a different participant to show as floating
            const newFloatingIndex = pinnedIndex === 0 ? 1 : 0
            setFloatingIndex(newFloatingIndex)
        }
    }, [pinnedIndex, floatingIndex, participants.length])

    const addParticipant = useCallback(() => {
        setParticipants((prev) => [
            ...prev,
            {
                id: prev.length,
                name: `User ${prev.length}`,
                gradient: getRandomGradient(prev.length),
                initials: `U${prev.length}`,
                type: 'desktop' as ParticipantType,
            },
        ])
    }, [])

    const removeParticipant = useCallback(() => {
        setParticipants((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
    }, [])

    const toggleParticipantType = useCallback((index: number) => {
        setParticipants((prev) => prev.map((p, i) => {
            if (i !== index) return p
            const types: ParticipantType[] = ['desktop', 'phone-916', 'phone-919', 'phone-34', 'tablet']
            const currentIdx = types.indexOf(p.type)
            const newType = types[(currentIdx + 1) % types.length]
            return {
                ...p,
                type: newType,
                name: i === 0 ? 'You' : `User ${i}`,
                initials: i === 0 ? 'Y' : `U${i}`,
            }
        }))
    }, [])

    const getParticipantRatio = useCallback((type: ParticipantType, index: number): ItemAspectRatio | undefined => {
        if (!flexibleRatiosEnabled) return undefined

        const isMainItem = pinnedIndex !== null && index === pinnedIndex
        if (isMainItem) return 'fill'

        switch (type) {
            case 'phone-916': return '9:16'
            case 'phone-919': return '9:19'
            case 'phone-34': return '3:4'
            case 'tablet': return '4:3'
            default: return '16:9'
        }
    }, [flexibleRatiosEnabled, pinnedIndex])

    // Build itemAspectRatios array
    const itemAspectRatios = flexibleRatiosEnabled
        ? participants.map((p, i) => getParticipantRatio(p.type, i))
        : undefined

    // Simulate pinned/focus changing
    const nextPinned = useCallback(() => {
        setPinnedIndex((prev) => ((prev ?? 0) + 1) % participants.length)
    }, [participants.length])

    // Unified pagination controls - works for both gallery and sidebar
    const goToNextPage = useCallback(() => {
        // Gallery with pin uses sidebar layout internally, so use othersPage
        if (layoutMode === 'gallery' && pinnedIndex === null) {
            setCurrentPage((prev) => Math.min(prev + 1, galleryTotalPages - 1))
        } else {
            setOthersPage((prev) => Math.min(prev + 1, othersTotalPages - 1))
        }
    }, [layoutMode, pinnedIndex, galleryTotalPages, othersTotalPages])

    const goToPrevPage = useCallback(() => {
        if (layoutMode === 'gallery' && pinnedIndex === null) {
            setCurrentPage((prev) => Math.max(prev - 1, 0))
        } else {
            setOthersPage((prev) => Math.max(prev - 1, 0))
        }
    }, [layoutMode, pinnedIndex])

    const goToPage = useCallback((page: number) => {
        if (layoutMode === 'gallery' && pinnedIndex === null) {
            setCurrentPage(page)
        } else {
            setOthersPage(page)
        }
    }, [layoutMode, pinnedIndex])

    // Swipe handlers
    const swipeHandlers = useSwipe(goToNextPage, goToPrevPage)

    return (
        <div className="app">
            {/* Header with controls */}
            <header className="header">
                <div className="header-left">
                    <div>
                        <h1 className="header-title">Meet Layout Grid</h1>
                        <p className="header-subtitle">React Demo with Motion Animations</p>
                    </div>
                    <a
                        href="https://github.com/thangdevalone/meeting-layout-grid"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-github"
                    >
                        Star on GitHub
                    </a>
                </div>

                <div className="controls">
                    {/* Participants control */}
                    <div className="control-group">
                        <span className="control-label">Participants</span>
                        <div className="control-buttons">
                            <button className="btn btn-icon" onClick={removeParticipant}>
                                −
                            </button>
                            <span className="participant-count">{participants.length}</span>
                            <button className="btn btn-icon" onClick={addParticipant}>
                                +
                            </button>
                        </div>
                    </div>

                    {/* Layout mode */}
                    <div className="control-group">
                        <span className="control-label">Layout</span>
                        <div className="control-buttons">
                            {LAYOUT_MODES.map((mode) => (
                                <button
                                    key={mode.value}
                                    className={`btn ${layoutMode === mode.value ? 'active' : ''}`}
                                    onClick={() => {
                                        setLayoutMode(mode.value)
                                        // Reset pagination when changing layout
                                        setPaginationEnabled(false)
                                        setCurrentPage(0)
                                        setOthersPage(0)
                                    }}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aspect ratio */}
                    <div className="control-group">
                        <span className="control-label">Aspect Ratio</span>
                        <div className="control-buttons">
                            {ASPECT_RATIOS.map((ratio) => (
                                <button
                                    key={ratio}
                                    className={`btn ${aspectRatio === ratio ? 'active' : ''}`}
                                    onClick={() => setAspectRatio(ratio)}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gap control */}
                    <div className="control-group">
                        <span className="control-label">Gap</span>
                        <div className="control-buttons">
                            <button
                                className="btn btn-icon"
                                onClick={() => setGap((g) => Math.max(0, g - 4))}
                            >
                                −
                            </button>
                            <span className="participant-count">{gap}px</span>
                            <button
                                className="btn btn-icon"
                                onClick={() => setGap((g) => g + 4)}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Pagination toggle */}
                    <div className="control-group">
                        <span className="control-label">Pagination</span>
                        <div className="control-buttons">
                            <button
                                className={`btn ${paginationEnabled ? 'active' : ''}`}
                                onClick={() => setPaginationEnabled(!paginationEnabled)}
                            >
                                {paginationEnabled ? 'On' : 'Off'}
                            </button>
                        </div>
                    </div>

                    {/* Items per page (when pagination enabled) */}
                    {paginationEnabled && (
                        <div className="control-group">
                            <span className="control-label">Items/Page</span>
                            <div className="control-buttons">
                                <button
                                    className="btn btn-icon"
                                    onClick={() => setItemsPerPage((n) => Math.max(1, n - 1))}
                                >
                                    −
                                </button>
                                <span className="participant-count">{itemsPerPage}</span>
                                <button
                                    className="btn btn-icon"
                                    onClick={() => setItemsPerPage((n) => n + 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Max Visible (when not using pagination) */}
                    {!paginationEnabled && (
                        <div className="control-group">
                            <span className="control-label">Max Visible</span>
                            <div className="control-buttons">
                                <button
                                    className="btn btn-icon"
                                    onClick={() => setMaxVisible((n) => Math.max(0, n - 1))}
                                >
                                    −
                                </button>
                                <span className="participant-count">{maxVisible === 0 ? 'All' : maxVisible}</span>
                                <button
                                    className="btn btn-icon"
                                    onClick={() => setMaxVisible((n) => n + 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sidebar position (for sidebar modes OR gallery with pin) */}
                    {(layoutMode === 'sidebar' || (layoutMode === 'gallery' && pinnedIndex !== null)) && (
                        <div className="control-group">
                            <span className="control-label">Others Position</span>
                            <div className="control-buttons">
                                {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                                    <button
                                        key={pos}
                                        className={`btn ${sidebarPosition === pos ? 'active' : ''}`}
                                        onClick={() => setSidebarPosition(pos)}
                                    >
                                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pin control (for gallery mode only) */}
                    {layoutMode === 'gallery' && (
                        <div className="control-group">
                            <span className="control-label">Pin</span>
                            <div className="control-buttons">
                                <button
                                    className={`btn ${pinnedIndex !== null ? 'active' : ''}`}
                                    onClick={() => setPinnedIndex(pinnedIndex !== null ? null : 0)}
                                >
                                    {pinnedIndex !== null ? `📌 #${pinnedIndex + 1}` : 'None'}
                                </button>
                                {pinnedIndex !== null && (
                                    <button
                                        className="btn"
                                        onClick={() => setPinnedIndex((prev) =>
                                            prev !== null ? (prev + 1) % participants.length : 0
                                        )}
                                    >
                                        Next →
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Zoom Mode (for gallery with pin) */}
                    {layoutMode === 'gallery' && pinnedIndex !== null && (
                        <div className="control-group">
                            <span className="control-label">Zoom</span>
                            <div className="control-buttons">
                                <button
                                    className={`btn ${zoomMode ? 'active' : ''}`}
                                    onClick={() => setZoomMode(!zoomMode)}
                                >
                                    {zoomMode ? '🔍 On' : '🔍 Off'}
                                </button>
                                {zoomMode && (
                                    <button
                                        className="btn"
                                        onClick={() => setFloatingIndex((prev) =>
                                            (prev + 1) % participants.length
                                        )}
                                        title="Change floating participant"
                                    >
                                        Float: {participants[floatingIndex]?.name || 'You'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pinned change (for spotlight/sidebar modes) */}
                    {(layoutMode === 'spotlight' || layoutMode === 'sidebar') && (
                        <div className="control-group">
                            <span className="control-label">Active Pinned</span>
                            <div className="control-buttons">
                                <button className="btn" onClick={nextPinned}>
                                    Next Pinned →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Grid with swipe support */}
            <div
                className="grid-wrapper"
                {...(paginationEnabled ? swipeHandlers : {})}
            >
                {/* Zoom Mode: Pinned fills screen, one participant floats */}
                {zoomMode && isGalleryWithPin && pinnedIndex !== null ? (
                    <GridContainer
                        className="grid-container"
                        aspectRatio="16:9"
                        gap={0}
                        layoutMode="spotlight"
                        pinnedIndex={pinnedIndex}
                        count={participants.length}
                        springPreset="smooth"
                        flexLayout={true}
                        itemAspectRatios={participants.map(() => 'fill' as ItemAspectRatio)}
                    >
                        {/* Pinned participant fills the screen */}
                        {participants.map((participant, index) => {
                            // Only render the pinned participant in spotlight
                            if (index !== pinnedIndex) return null

                            return (
                                <GridItem key={participant.id} index={index} itemAspectRatio="fill">
                                    {() => (
                                        <div
                                            className="grid-item"
                                            style={{
                                                background: participant.gradient,
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                            }}
                                        >
                                            <div className="item-badge pinned">
                                                Pinned (Zoom)
                                            </div>
                                            <div className="grid-item-content">
                                                <div
                                                    className="avatar"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.2)',
                                                        fontSize: '2rem',
                                                        width: '80px',
                                                        height: '80px',
                                                    }}
                                                >
                                                    {participant.initials}
                                                </div>
                                                <span
                                                    className="participant-name"
                                                    style={{
                                                        color: '#fff',
                                                        fontSize: '1.2rem',
                                                    }}
                                                >
                                                    {participant.name}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </GridItem>
                            )
                        })}

                        {/* Floating participant (draggable PiP) - inside GridContainer for context */}
                        {floatingIndex !== pinnedIndex && participants[floatingIndex] && (
                            <FloatingGridItem
                                key={`floating-${floatingIndex}`}
                                width={floatingSize.width}
                                height={floatingSize.height}
                                anchor="bottom-right"
                                initialPosition={{ x: 12, y: 12 }}
                                borderRadius={isMobile ? 10 : 12}
                                visible={true}
                            >
                                <div
                                    className="grid-item"
                                    style={{
                                        background: participants[floatingIndex]?.gradient || '#666',
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: isMobile ? '10px' : '12px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            fontSize: isMobile ? '0.55rem' : '0.7rem',
                                            background: 'rgba(0,0,0,0.5)',
                                            padding: isMobile ? '2px 4px' : '2px 6px',
                                            borderRadius: '4px',
                                            color: '#fff',
                                        }}
                                    >
                                        {isMobile ? 'Drag' : 'Drag me'}
                                    </div>
                                    <div
                                        className="avatar"
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            width: isMobile ? '32px' : '44px',
                                            height: isMobile ? '32px' : '44px',
                                            fontSize: isMobile ? '0.75rem' : '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                        }}
                                    >
                                        {participants[floatingIndex]?.initials || 'Y'}
                                    </div>
                                    <span
                                        className="participant-name"
                                        style={{ fontSize: isMobile ? '0.6rem' : '0.75rem', marginTop: isMobile ? '3px' : '6px', color: '#fff' }}
                                    >
                                        {participants[floatingIndex]?.name || 'You'}
                                    </span>
                                </div>
                            </FloatingGridItem>
                        )}
                    </GridContainer>
                ) : (
                    /* Normal Mode: Standard grid layout */
                    <GridContainer
                        className="grid-container"
                        aspectRatio={effectiveAspectRatio}
                        gap={gap}
                        layoutMode={layoutMode}
                        pinnedIndex={pinnedIndex ?? undefined}
                        sidebarPosition={sidebarPosition}
                        count={participants.length}
                        springPreset="smooth"
                        maxItemsPerPage={paginationEnabled && !isGalleryWithPin && layoutMode === 'gallery' ? itemsPerPage : 0}
                        currentPage={currentPage}
                        maxVisible={paginationEnabled && (layoutMode === 'sidebar' || isGalleryWithPin) ? itemsPerPage : (!paginationEnabled ? maxVisible : 0)}
                        currentVisiblePage={othersPage}
                        itemAspectRatios={itemAspectRatios}
                        flexLayout={flexibleRatiosEnabled}
                    >
                        {participants.map((participant, index) => (
                            <GridItem key={participant.id} index={index} itemAspectRatio={getParticipantRatio(participant.type, index)}>
                                {({ isLastVisibleOther, hiddenCount }) => {
                                    // If this is the last visible item AND there are hidden items,
                                    // show ONLY the "+X" indicator (no participant content)
                                    // BUT only when pagination is OFF - with pagination ON, users can navigate
                                    if (isLastVisibleOther && hiddenCount > 0 && !paginationEnabled) {
                                        return (
                                            <div
                                                className="grid-item more-indicator-cell"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 50%, rgba(236, 72, 153, 0.9) 100%)',
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative',
                                                    backdropFilter: 'blur(12px)',
                                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 'clamp(24px, 5vw, 48px)',
                                                        fontWeight: 700,
                                                        color: '#fff',
                                                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                                    }}
                                                >
                                                    +{hiddenCount}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 'clamp(10px, 2vw, 14px)',
                                                        color: 'rgba(255,255,255,0.8)',
                                                        marginTop: '4px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                    }}
                                                >
                                                    more
                                                </span>
                                            </div>
                                        )
                                    }

                                    // Normal participant cell
                                    return (
                                        <div
                                            className="grid-item"
                                            style={{
                                                background: participant.gradient,
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: participant.type.startsWith('phone-') && flexibleRatiosEnabled
                                                    ? '16px'
                                                    : '12px',
                                                border: participant.type.startsWith('phone-') && flexibleRatiosEnabled
                                                    ? '3px solid #333'
                                                    : 'none',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                boxShadow: flexibleRatiosEnabled && participant.type.startsWith('phone-')
                                                    ? '0 8px 32px rgba(0,0,0,0.5)'
                                                    : 'none',
                                            }}
                                        >
                                            {/* Badge for main participant (pinned) */}
                                            {index === pinnedIndex && layoutMode !== 'gallery' && (
                                                <div className="item-badge pinned">
                                                    📌 Pinned
                                                </div>
                                            )}

                                            {/* Badge for pinned in gallery */}
                                            {index === pinnedIndex && layoutMode === 'gallery' && (
                                                <div className="item-badge pinned">
                                                    📌 Pinned
                                                </div>
                                            )}

                                            {/* Type indicator when flexible ratios enabled */}
                                            {flexibleRatiosEnabled && (
                                                <button
                                                    className="type-badge"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleParticipantType(index)
                                                    }}
                                                    title="Click to change participant type"
                                                >
                                                    {participant.type === 'phone-916' && '9:16'}
                                                    {participant.type === 'phone-919' && '9:19'}
                                                    {participant.type === 'phone-34' && '3:4'}
                                                    {participant.type === 'tablet' && '4:3'}
                                                    {participant.type === 'desktop' && '16:9'}
                                                </button>
                                            )}

                                            <div className="grid-item-content">
                                                <div
                                                    className="avatar"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.2)'
                                                    }}
                                                >
                                                    {participant.initials}
                                                </div>
                                                <span
                                                    className="participant-name"
                                                    style={{
                                                        color: '#fff'
                                                    }}
                                                >
                                                    {participant.name}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }}
                            </GridItem>
                        ))}
                    </GridContainer>
                )}


                {/* Pagination controls */}
                {paginationEnabled && totalPages > 1 && !zoomMode && (
                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            onClick={goToPrevPage}
                            disabled={effectiveCurrentPage === 0}
                        >
                            ←
                        </button>

                        <div className="pagination-dots">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    className={`pagination-dot ${effectiveCurrentPage === i ? 'active' : ''}`}
                                    onClick={() => goToPage(i)}
                                />
                            ))}
                        </div>

                        <button
                            className="pagination-btn"
                            onClick={goToNextPage}
                            disabled={effectiveCurrentPage === totalPages - 1}
                        >
                            →
                        </button>
                    </div>
                )}

                {/* Swipe hint */}
                {paginationEnabled && totalPages > 1 && !zoomMode && (
                    <div className="swipe-hint">
                        👆 Swipe left/right to navigate
                    </div>
                )}
            </div>
        </div >
    )
}
