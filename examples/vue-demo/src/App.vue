<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { GridContainer, GridItem, FloatingGridItem, LayoutMode, ItemAspectRatio } from '@thangdevalone/meet-layout-grid-vue'

// Device types with different aspect ratios
type ParticipantType = 
  | 'desktop'      // 16:9 - standard laptop/desktop
  | 'phone-916'    // 9:16 - standard phone portrait  
  | 'phone-919'    // 9:19 - modern tall phones
  | 'phone-34'     // 3:4 - older phones
  | 'tablet'       // 4:3 - iPad and tablets

interface Participant {
  id: number
  name: string
  gradient: string
  initials: string
  type: ParticipantType
}

// Swipe gesture tracking
const touchStartX = ref<number | null>(null)
const touchEndX = ref<number | null>(null)
const minSwipeDistance = 50

function onTouchStart(e: TouchEvent) {
  touchEndX.value = null
  touchStartX.value = e.targetTouches[0].clientX
}

function onTouchMove(e: TouchEvent) {
  touchEndX.value = e.targetTouches[0].clientX
}

function onTouchEnd() {
  if (!touchStartX.value || !touchEndX.value) return

  const distance = touchStartX.value - touchEndX.value
  const isLeftSwipe = distance > minSwipeDistance
  const isRightSwipe = distance < -minSwipeDistance

  if (isLeftSwipe) {
    goToNextPage()
  } else if (isRightSwipe) {
    goToPrevPage()
  }
}

// Generate random gradient for participant tiles
function getRandomGradient(seed: number) {
  const hue1 = (seed * 137) % 360
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 45%) 0%, hsl(${hue2}, 70%, 35%) 100%)`
}

// Create participant
function createParticipant(index: number): Participant {
  return {
    id: index,
    name: index === 0 ? 'You' : `User ${index}`,
    gradient: getRandomGradient(index),
    initials: index === 0 ? 'Y' : `U${index}`,
    type: 'desktop',
  }
}

// Reactive state
const participants = ref<Participant[]>(Array.from({ length: 12 }, (_, i) => createParticipant(i)))
const layoutMode = ref<LayoutMode>('gallery')
const aspectRatio = ref('16:9')
const gap = ref(12)
const pinnedIndex = ref<number | null>(0) // Main participant for all modes
const sidebarPosition = ref<'left' | 'right' | 'top' | 'bottom'>('right')

// Pagination state
const paginationEnabled = ref(false)
const itemsPerPage = ref(4)
const currentPage = ref(0)
const othersPage = ref(0)
const maxVisible = ref(0)

// Zoom mode state
const zoomMode = ref(false)
const floatingIndex = ref(0) // Which participant to show as floating (default: "You")

// Responsive floating size
const isMobile = ref(window.matchMedia('(max-width: 768px)').matches)
onMounted(() => {
  const mediaQuery = window.matchMedia('(max-width: 768px)')
  const handler = (e: MediaQueryListEvent) => { isMobile.value = e.matches }
  mediaQuery.addEventListener('change', handler)
  onUnmounted(() => mediaQuery.removeEventListener('change', handler))
})
const floatingSize = computed(() => isMobile.value ? { width: 90, height: 120 } : { width: 130, height: 175 })

const layoutModes: { value: LayoutMode; label: string }[] = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'sidebar', label: 'Sidebar' },
]

const aspectRatios = ['16:9', '4:3', '1:1', 'Flex']
const positions = ['left', 'right', 'top', 'bottom'] as const


const flexibleRatiosEnabled = computed(() => aspectRatio.value === 'Flex')
const effectiveAspectRatio = computed(() => flexibleRatiosEnabled.value ? '16:9' : aspectRatio.value)

function getParticipantRatio(type: ParticipantType, index: number): ItemAspectRatio | undefined {
  if (!flexibleRatiosEnabled.value) return undefined

  const isMainItem = pinnedIndex.value !== null && index === pinnedIndex.value
  if (isMainItem) return 'fill'

  switch (type) {
    case 'phone-916': return '9:16'
    case 'phone-919': return '9:19'
    case 'phone-34': return '3:4'
    case 'tablet': return '4:3'
    default: return '16:9'
  }
}

const itemAspectRatios = computed(() =>
  flexibleRatiosEnabled.value
    ? participants.value.map((p, i) => getParticipantRatio(p.type, i))
    : undefined
)

const othersCount = computed(() => participants.value.length - 1)
const galleryTotalPages = computed(() => 
  paginationEnabled.value && itemsPerPage.value > 0 
    ? Math.ceil(participants.value.length / itemsPerPage.value) 
    : 1
)
const othersTotalPages = computed(() => 
  paginationEnabled.value && itemsPerPage.value > 0 
    ? Math.ceil(othersCount.value / itemsPerPage.value) 
    : 1
)
const totalPages = computed(() => 
  layoutMode.value === 'gallery' && pinnedIndex.value === null 
    ? galleryTotalPages.value 
    : othersTotalPages.value
)
const effectiveCurrentPage = computed(() => 
  layoutMode.value === 'gallery' && pinnedIndex.value === null 
    ? currentPage.value 
    : othersPage.value
)

const showPinnedControl = computed(() => 
  layoutMode.value === 'spotlight' || 
  layoutMode.value === 'sidebar'
)

const showPositionControl = computed(() =>
  layoutMode.value === 'sidebar' || 
  (layoutMode.value === 'gallery' && pinnedIndex.value !== null)
)

function addParticipant() {
  const newId = participants.value.length
  participants.value.push(createParticipant(newId))
}

function removeParticipant() {
  if (participants.value.length > 1) {
    participants.value.pop()
  }
}

function nextPinned() {
  pinnedIndex.value = ((pinnedIndex.value ?? 0) + 1) % participants.value.length
}

function togglePin() {
  pinnedIndex.value = pinnedIndex.value !== null ? null : 0
}

function nextPin() {
  if (pinnedIndex.value !== null) {
    pinnedIndex.value = (pinnedIndex.value + 1) % participants.value.length
  }
}

function toggleParticipantType(index: number) {
  const types: ParticipantType[] = ['desktop', 'phone-916', 'phone-919', 'phone-34', 'tablet']
  const current = participants.value[index]
  const currentIdx = types.indexOf(current.type)
  const newType = types[(currentIdx + 1) % types.length]
  participants.value[index] = {
    ...current,
    type: newType,
    name: index === 0 ? 'You' : `User ${index}`,
    initials: index === 0 ? 'Y' : `U${index}`,
  }
}

function getTypeBadge(type: ParticipantType): string {
  switch (type) {
    case 'phone-916': return '📱 9:16'
    case 'phone-919': return '📱 9:19'
    case 'phone-34': return '📱 3:4'
    case 'tablet': return '📱 4:3'
    default: return '💻 16:9'
  }
}

function goToPage(page: number) {
  // When gallery has pin, it uses sidebar layout internally, so update othersPage
  if (layoutMode.value === 'gallery' && pinnedIndex.value === null) {
    currentPage.value = page
  } else {
    othersPage.value = page
  }
}


function goToPrevPage() {
  if (effectiveCurrentPage.value > 0) {
    goToPage(effectiveCurrentPage.value - 1)
  }
}

function goToNextPage() {
  if (effectiveCurrentPage.value < totalPages.value - 1) {
    goToPage(effectiveCurrentPage.value + 1)
  }
}

function changeLayoutMode(mode: LayoutMode) {
  layoutMode.value = mode
  // Reset pagination when changing layout
  paginationEnabled.value = false
  currentPage.value = 0
  othersPage.value = 0
}

// Watch for page bounds
watch([totalPages, layoutMode], () => {
  if (layoutMode.value === 'gallery' && currentPage.value >= galleryTotalPages.value) {
    currentPage.value = Math.max(0, galleryTotalPages.value - 1)
  }
  if (layoutMode.value !== 'gallery' && othersPage.value >= othersTotalPages.value) {
    othersPage.value = Math.max(0, othersTotalPages.value - 1)
  }
})

// Auto-switch floatingIndex when it matches pinnedIndex
watch([pinnedIndex, floatingIndex], () => {
  if (pinnedIndex.value !== null && floatingIndex.value === pinnedIndex.value && participants.value.length > 1) {
    floatingIndex.value = pinnedIndex.value === 0 ? 1 : 0
  }
})

const isGalleryWithPin = computed(() => layoutMode.value === 'gallery' && pinnedIndex.value !== null)

// Gallery mode pagination uses maxItemsPerPage
// Sidebar mode (and gallery with pin) uses maxVisible for "others" pagination
const maxItemsPerPageProp = computed(() => {
  // Only use maxItemsPerPage for pure gallery mode (no pin)
  if (paginationEnabled.value && layoutMode.value === 'gallery' && pinnedIndex.value === null) {
    return itemsPerPage.value
  }
  return 0
})

const maxVisibleProp = computed(() => {
  // For sidebar mode or gallery with pin, use maxVisible for pagination
  if (paginationEnabled.value && (layoutMode.value === 'sidebar' || isGalleryWithPin.value)) {
    return itemsPerPage.value
  }
  // When pagination is off, use maxVisible setting
  if (!paginationEnabled.value) {
    return maxVisible.value
  }
  return 0
})
const pinnedIndexProp = computed(() => pinnedIndex.value ?? undefined)

function toggleZoomMode() {
  zoomMode.value = !zoomMode.value
}

function nextFloating() {
  if (participants.value.length > 1) {
    let next = (floatingIndex.value + 1) % participants.value.length
    // Skip the pinned participant
    if (next === pinnedIndex.value) {
      next = (next + 1) % participants.value.length
    }
    floatingIndex.value = next
  }
}

const floatingParticipant = computed(() => participants.value[floatingIndex.value])
const pinnedParticipant = computed(() => pinnedIndex.value !== null ? participants.value[pinnedIndex.value] : null)
</script>

<template>
  <div class="app">
    <!-- Header with controls -->
    <header class="header">
      <div class="header-left">
        <div>
          <h1 class="header-title">Meet Layout Grid</h1>
          <p class="header-subtitle">Vue 3 Demo with Motion Animations</p>
        </div>
        <a
          href="https://github.com/thangdevalone/meeting-layout-grid"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-github"
        >
          Star on GitHub
        </a>
      </div>

      <div class="controls">
        <!-- Participants control -->
        <div class="control-group">
          <span class="control-label">Participants</span>
          <div class="control-buttons">
            <button class="btn btn-icon" @click="removeParticipant">−</button>
            <span class="participant-count">{{ participants.length }}</span>
            <button class="btn btn-icon" @click="addParticipant">+</button>
          </div>
        </div>

        <!-- Layout mode -->
        <div class="control-group">
          <span class="control-label">Layout</span>
          <div class="control-buttons">
            <button
              v-for="mode in layoutModes"
              :key="mode.value"
              :class="['btn', { active: layoutMode === mode.value }]"
              @click="changeLayoutMode(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>

        <!-- Aspect ratio -->
        <div class="control-group">
          <span class="control-label">Aspect Ratio</span>
          <div class="control-buttons">
            <button
              v-for="ratio in aspectRatios"
              :key="ratio"
              :class="['btn', { active: aspectRatio === ratio }]"
              @click="aspectRatio = ratio"
            >
              {{ ratio }}
            </button>
          </div>
        </div>

        <!-- Gap control -->
        <div class="control-group">
          <span class="control-label">Gap</span>
          <div class="control-buttons">
            <button class="btn btn-icon" @click="gap = Math.max(0, gap - 4)">−</button>
            <span class="participant-count">{{ gap }}px</span>
            <button class="btn btn-icon" @click="gap += 4">+</button>
          </div>
        </div>

        <!-- Pagination toggle -->
        <div class="control-group">
          <span class="control-label">Pagination</span>
          <div class="control-buttons">
            <button
              :class="['btn', { active: paginationEnabled }]"
              @click="paginationEnabled = !paginationEnabled"
            >
              {{ paginationEnabled ? 'On' : 'Off' }}
            </button>
          </div>
        </div>

        <!-- Items per page (when pagination enabled) -->
        <div v-if="paginationEnabled" class="control-group">
          <span class="control-label">Items/Page</span>
          <div class="control-buttons">
            <button class="btn btn-icon" @click="itemsPerPage = Math.max(1, itemsPerPage - 1)">−</button>
            <span class="participant-count">{{ itemsPerPage }}</span>
            <button class="btn btn-icon" @click="itemsPerPage++">+</button>
          </div>
        </div>

        <!-- Max Visible (when pagination disabled) -->
        <div v-if="!paginationEnabled" class="control-group">
          <span class="control-label">Max Visible</span>
          <div class="control-buttons">
            <button class="btn btn-icon" @click="maxVisible = Math.max(0, maxVisible - 1)">−</button>
            <span class="participant-count">{{ maxVisible === 0 ? 'All' : maxVisible }}</span>
            <button class="btn btn-icon" @click="maxVisible++">+</button>
          </div>
        </div>

        <!-- Position control (for sidebar or gallery with pin) -->
        <div v-if="showPositionControl" class="control-group">
          <span class="control-label">Others Position</span>
          <div class="control-buttons">
            <button
              v-for="pos in positions"
              :key="pos"
              :class="['btn', { active: sidebarPosition === pos }]"
              @click="sidebarPosition = pos"
            >
              {{ pos.charAt(0).toUpperCase() + pos.slice(1) }}
            </button>
          </div>
        </div>

        <!-- Pin control (gallery only) -->
        <div v-if="layoutMode === 'gallery'" class="control-group">
          <span class="control-label">Pin</span>
          <div class="control-buttons">
            <button
              :class="['btn', { active: pinnedIndex !== null }]"
              @click="togglePin"
            >
              {{ pinnedIndex !== null ? `📌 #${pinnedIndex + 1}` : 'None' }}
            </button>
            <button
              v-if="pinnedIndex !== null"
              class="btn"
              @click="nextPin"
            >
              Next →
            </button>
          </div>
        </div>

        <!-- Zoom Mode control (gallery only with pin) -->
        <div v-if="layoutMode === 'gallery' && pinnedIndex !== null" class="control-group">
          <span class="control-label">Zoom</span>
          <div class="control-buttons">
            <button
              :class="['btn', { active: zoomMode }]"
              @click="toggleZoomMode"
            >
              {{ zoomMode ? '🔍 On' : 'Off' }}
            </button>
            <button
              v-if="zoomMode"
              class="btn"
              @click="nextFloating"
            >
              Float: {{ floatingParticipant?.name }}
            </button>
          </div>
        </div>

        <!-- Pinned change -->
        <div v-if="showPinnedControl" class="control-group">
          <span class="control-label">Active Pinned</span>
          <div class="control-buttons">
            <button class="btn" @click="nextPinned">
              Next Pinned →
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Grid with swipe support -->
    <div 
      class="grid-wrapper"
      @touchstart="paginationEnabled && totalPages > 1 && !zoomMode ? onTouchStart($event) : undefined"
      @touchmove="paginationEnabled && totalPages > 1 && !zoomMode ? onTouchMove($event) : undefined"
      @touchend="paginationEnabled && totalPages > 1 && !zoomMode ? onTouchEnd() : undefined"
    >
      <!-- Zoom Mode: Pinned fills screen, floating PiP -->
      <GridContainer
        v-if="zoomMode && isGalleryWithPin && pinnedParticipant"
        class="grid-container"
        aspect-ratio="16:9"
        :gap="0"
        layout-mode="spotlight"
        :pinned-index="pinnedIndex ?? undefined"
        :count="participants.length"
        spring-preset="smooth"
        :flex-layout="true"
        :item-aspect-ratios="participants.map(() => 'fill' as ItemAspectRatio)"
      >
        <!-- Only render the pinned participant -->
        <GridItem
          v-for="(participant, index) in participants"
          :key="participant.id"
          :index="index"
          item-aspect-ratio="fill"
        >
          <template v-if="index === pinnedIndex">
            <div
              class="grid-item"
              :style="{ 
                background: participant.gradient,
                width: '100%',
                height: '100%',
              }"
            >
              <div class="item-badge pinned">Pinned (Zoom)</div>
              <div class="grid-item-content">
                <div 
                  class="avatar" 
                  :style="{ 
                    background: 'rgba(255,255,255,0.2)',
                    fontSize: '2rem',
                    width: '80px',
                    height: '80px',
                  }"
                >{{ participant.initials }}</div>
                <span 
                  class="participant-name" 
                  :style="{ 
                    color: '#fff',
                    fontSize: '1.2rem',
                  }"
                >{{ participant.name }}</span>
              </div>
            </div>
          </template>
        </GridItem>

        <!-- Floating participant (draggable PiP) -->
        <FloatingGridItem
          v-if="floatingIndex !== pinnedIndex && floatingParticipant"
          :key="`floating-${floatingIndex}`"
          :width="floatingSize.width"
          :height="floatingSize.height"
          anchor="bottom-right"
          :initial-position="{ x: 12, y: 12 }"
          :border-radius="isMobile ? 10 : 12"
          :visible="true"
        >
          <div
            class="grid-item"
            :style="{
              background: floatingParticipant?.gradient || '#666',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: isMobile ? '10px' : '12px',
              border: '2px solid rgba(255,255,255,0.3)',
              position: 'relative',
            }"
          >
            <div
              :style="{
                position: 'absolute',
                top: '4px',
                right: '4px',
                fontSize: isMobile ? '0.55rem' : '0.7rem',
                background: 'rgba(0,0,0,0.5)',
                padding: isMobile ? '2px 4px' : '2px 6px',
                borderRadius: '4px',
                color: '#fff',
              }"
            >
              {{ isMobile ? 'Drag' : 'Drag me' }}
            </div>
            <div
              class="avatar"
              :style="{
                background: 'rgba(255,255,255,0.2)',
                width: isMobile ? '32px' : '44px',
                height: isMobile ? '32px' : '44px',
                fontSize: isMobile ? '0.75rem' : '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }"
            >{{ floatingParticipant?.initials || 'Y' }}</div>
            <span
              class="participant-name"
              :style="{ fontSize: isMobile ? '0.6rem' : '0.75rem', marginTop: isMobile ? '3px' : '6px', color: '#fff' }"
            >{{ floatingParticipant?.name || 'You' }}</span>
          </div>
        </FloatingGridItem>
      </GridContainer>

      <!-- Normal Mode: Standard grid layout -->
      <GridContainer
        v-else
        class="grid-container"
        :aspect-ratio="effectiveAspectRatio"
        :gap="gap"
        :layout-mode="layoutMode"
        :pinned-index="pinnedIndexProp"
        :sidebar-position="sidebarPosition"
        :count="participants.length"
        :max-items-per-page="maxItemsPerPageProp"
        :current-page="currentPage"
        :max-visible="maxVisibleProp"
        :current-visible-page="othersPage"
        :item-aspect-ratios="itemAspectRatios"
        :flex-layout="flexibleRatiosEnabled"
        spring-preset="smooth"
      >
        <GridItem
          v-for="(participant, index) in participants"
          :key="participant.id"
          :index="index"
          :item-aspect-ratio="getParticipantRatio(participant.type, index)"
          v-slot="{ isLastVisibleOther, hiddenCount }"
        >
          <!-- +N MORE indicator only when pagination is OFF -->
          <div
            v-if="isLastVisibleOther && hiddenCount > 0 && !paginationEnabled"
            class="grid-item more-indicator-cell"
            :style="{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 50%, rgba(236, 72, 153, 0.9) 100%)',
              borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            }"
          >
            <span
              :style="{
                fontSize: 'clamp(24px, 5vw, 48px)',
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }"
            >
              +{{ hiddenCount }}
            </span>
            <span
              :style="{
                fontSize: 'clamp(10px, 2vw, 14px)',
                color: 'rgba(255,255,255,0.8)',
                marginTop: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }"
            >
              more
            </span>
          </div>
          <!-- Normal participant cell -->
          <div
            v-else
            class="grid-item"
            :style="{ 
              background: participant.gradient,
              borderRadius: participant.type.startsWith('phone-') && flexibleRatiosEnabled ? '16px' : '12px',
              border: participant.type.startsWith('phone-') && flexibleRatiosEnabled ? '3px solid #333' : 'none',
            }"
          >
            <!-- Badge for main participant (pinned) -->
            <div
              v-if="index === pinnedIndex && layoutMode !== 'gallery'"
              class="item-badge pinned"
            >
              📌 Pinned
            </div>

            <!-- Badge for pinned in gallery -->
            <div
              v-if="index === pinnedIndex && layoutMode === 'gallery'"
              class="item-badge pinned"
            >
              📌 Pinned
            </div>

            <!-- Type indicator when flexible ratios enabled -->
            <button
              v-if="flexibleRatiosEnabled"
              class="type-badge"
              @click.stop="toggleParticipantType(index)"
              title="Click to change participant type"
            >
              {{ getTypeBadge(participant.type) }}
            </button>

            <div class="grid-item-content">
              <div class="avatar" :style="{ background: 'rgba(255,255,255,0.2)' }">{{ participant.initials }}</div>
              <span class="participant-name" :style="{ color: '#fff' }">{{ participant.name }}</span>
            </div>
          </div>
        </GridItem>
      </GridContainer>

      <!-- Pagination controls (hidden in zoom mode) -->
      <div v-if="paginationEnabled && totalPages > 1 && !zoomMode" class="pagination-controls">
        <button
          class="pagination-btn"
          :disabled="effectiveCurrentPage === 0"
          @click="goToPrevPage"
        >
          ←
        </button>

        <div class="pagination-dots">
          <button
            v-for="i in totalPages"
            :key="i"
            :class="['pagination-dot', { active: effectiveCurrentPage === i - 1 }]"
            @click="goToPage(i - 1)"
          />
        </div>

        <button
          class="pagination-btn"
          :disabled="effectiveCurrentPage === totalPages - 1"
          @click="goToNextPage"
        >
          →
        </button>
      </div>

      <!-- Swipe hint (hidden in zoom mode) -->
      <div v-if="paginationEnabled && totalPages > 1 && !zoomMode" class="swipe-hint">
        👆 Swipe left/right to navigate
      </div>
    </div>
  </div>
</template>

<style>
@import './style.css';
</style>
