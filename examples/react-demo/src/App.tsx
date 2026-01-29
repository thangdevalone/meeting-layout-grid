import { useState, useCallback, useRef, useEffect, TouchEvent } from 'react'
import {
    GridContainer,
    GridItem,
    LayoutMode,
} from '@thangdevalone/meet-layout-grid-react'

// Generate random gradient for participant tiles
function getRandomGradient(seed: number) {
    const hue1 = (seed * 137) % 360
    const hue2 = (hue1 + 40) % 360
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 45%) 0%, hsl(${hue2}, 70%, 35%) 100%)`
}

// Initial participants
function createParticipants(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        name: i === 0 ? 'You' : `User ${i}`,
        gradient: getRandomGradient(i),
        initials: i === 0 ? 'Y' : `U${i}`,
    }))
}

const LAYOUT_MODES: { value: LayoutMode; label: string }[] = [
    { value: 'gallery', label: 'Gallery' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'spotlight', label: 'Spotlight' },
    { value: 'sidebar', label: 'Sidebar' },
]

const ASPECT_RATIOS = ['16:9', '4:3', '1:1']

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
    const [speakerIndex, setSpeakerIndex] = useState(0)
    const [pinnedIndex, setPinnedIndex] = useState<number | null>(null) // For gallery pin mode
    const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('right')
    const [currentPage, setCurrentPage] = useState(0) // For gallery mode
    const [othersPage, setOthersPage] = useState(0) // For speaker/sidebar "others"
    const [paginationEnabled, setPaginationEnabled] = useState(false)
    const [itemsPerPage, setItemsPerPage] = useState(4) // Used for all modes

    // Calculate pagination values
    const othersCount = participants.length - 1

    // When pagination is enabled, itemsPerPage controls how many items per page for all modes
    const galleryTotalPages = paginationEnabled && itemsPerPage > 0 ? Math.ceil(participants.length / itemsPerPage) : 1
    const othersTotalPages = paginationEnabled && itemsPerPage > 0 ? Math.ceil(othersCount / itemsPerPage) : 1

    // Use the appropriate total pages based on mode
    const totalPages = layoutMode === 'gallery' ? galleryTotalPages : othersTotalPages
    const effectiveCurrentPage = layoutMode === 'gallery' ? currentPage : othersPage

    // Reset page when participants change or pagination toggles
    useEffect(() => {
        if (currentPage >= galleryTotalPages) {
            setCurrentPage(Math.max(0, galleryTotalPages - 1))
        }
        if (othersPage >= othersTotalPages) {
            setOthersPage(Math.max(0, othersTotalPages - 1))
        }
    }, [participants.length, galleryTotalPages, othersTotalPages, currentPage, othersPage])

    const addParticipant = useCallback(() => {
        setParticipants((prev) => [
            ...prev,
            {
                id: prev.length,
                name: `User ${prev.length}`,
                gradient: getRandomGradient(prev.length),
                initials: `U${prev.length}`,
            },
        ])
    }, [])

    const removeParticipant = useCallback(() => {
        setParticipants((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
    }, [])

    // Simulate speaker changing
    const nextSpeaker = useCallback(() => {
        setSpeakerIndex((prev) => (prev + 1) % participants.length)
    }, [participants.length])

    // Unified pagination controls - works for both gallery and speaker/sidebar
    const goToNextPage = useCallback(() => {
        if (layoutMode === 'gallery') {
            setCurrentPage((prev) => Math.min(prev + 1, galleryTotalPages - 1))
        } else {
            setOthersPage((prev) => Math.min(prev + 1, othersTotalPages - 1))
        }
    }, [layoutMode, galleryTotalPages, othersTotalPages])

    const goToPrevPage = useCallback(() => {
        if (layoutMode === 'gallery') {
            setCurrentPage((prev) => Math.max(prev - 1, 0))
        } else {
            setOthersPage((prev) => Math.max(prev - 1, 0))
        }
    }, [layoutMode])

    const goToPage = useCallback((page: number) => {
        if (layoutMode === 'gallery') {
            setCurrentPage(page)
        } else {
            setOthersPage(page)
        }
    }, [layoutMode])

    // Swipe handlers
    const swipeHandlers = useSwipe(goToNextPage, goToPrevPage)

    return (
        <div className="app">
            {/* Header with controls */}
            <header className="header">
                <div>
                    <h1 className="header-title">Meet Layout Grid</h1>
                    <p className="header-subtitle">React Demo with Motion Animations</p>
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

                    {/* Sidebar position (for speaker/sidebar modes OR gallery with pin) */}
                    {(layoutMode === 'speaker' || layoutMode === 'sidebar' || (layoutMode === 'gallery' && pinnedIndex !== null)) && (
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

                    {/* Speaker change (for speaker/spotlight modes) */}
                    {(layoutMode === 'speaker' || layoutMode === 'spotlight' || layoutMode === 'sidebar') && (
                        <div className="control-group">
                            <span className="control-label">Active Speaker</span>
                            <div className="control-buttons">
                                <button className="btn" onClick={nextSpeaker}>
                                    Next Speaker →
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
                <GridContainer
                    className="grid-container"
                    aspectRatio={aspectRatio}
                    gap={gap}
                    layoutMode={layoutMode}
                    speakerIndex={speakerIndex}
                    pinnedIndex={layoutMode === 'gallery' ? (pinnedIndex ?? undefined) : speakerIndex}
                    sidebarPosition={sidebarPosition}
                    count={participants.length}
                    springPreset="smooth"
                    maxItemsPerPage={layoutMode === 'gallery' && paginationEnabled ? itemsPerPage : 0}
                    currentPage={layoutMode === 'gallery' ? currentPage : 0}
                    maxVisibleOthers={layoutMode !== 'gallery' && paginationEnabled ? itemsPerPage : 0}
                    currentOthersPage={layoutMode !== 'gallery' ? othersPage : 0}
                >
                    {participants.map((participant, index) => (
                        <GridItem key={participant.id} index={index}>
                            <div
                                className="grid-item"
                                style={{
                                    background: participant.gradient,
                                    width: '100%',
                                    height: '100%',
                                }}
                            >
                                {/* Badge for speaker */}
                                {index === speakerIndex && layoutMode !== 'gallery' && (
                                    <div className="item-badge speaker">
                                        🎤 Speaking
                                    </div>
                                )}

                                {/* Badge for pinned in gallery */}
                                {index === pinnedIndex && layoutMode === 'gallery' && (
                                    <div className="item-badge pinned">
                                        📌 Pinned
                                    </div>
                                )}

                                <div className="grid-item-content">
                                    <div
                                        className="avatar"
                                        style={{ background: 'rgba(255,255,255,0.2)' }}
                                    >
                                        {participant.initials}
                                    </div>
                                    <span className="participant-name">{participant.name}</span>
                                </div>
                            </div>
                        </GridItem>
                    ))}
                </GridContainer>

                {/* Pagination controls */}
                {paginationEnabled && totalPages > 1 && (
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
                {paginationEnabled && totalPages > 1 && (
                    <div className="swipe-hint">
                        👆 Swipe left/right to navigate
                    </div>
                )}
            </div>
        </div>
    )
}
