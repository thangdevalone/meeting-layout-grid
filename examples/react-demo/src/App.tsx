import { useState, useCallback } from 'react'
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

export default function App() {
    const [participants, setParticipants] = useState(() => createParticipants(6))
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('gallery')
    const [aspectRatio, setAspectRatio] = useState('16:9')
    const [gap, setGap] = useState(12)
    const [speakerIndex, setSpeakerIndex] = useState(0)

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
                                    onClick={() => setLayoutMode(mode.value)}
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

            {/* Grid */}
            <div className="grid-wrapper">
                <GridContainer
                    className="grid-container"
                    aspectRatio={aspectRatio}
                    gap={gap}
                    layoutMode={layoutMode}
                    speakerIndex={speakerIndex}
                    pinnedIndex={speakerIndex}
                    count={participants.length}
                    springPreset="smooth"
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
            </div>
        </div>
    )
}
