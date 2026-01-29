<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { GridContainer, GridItem, LayoutMode } from '@thangdevalone/meet-layout-grid-vue'

// Generate random gradient for participant tiles
function getRandomGradient(seed: number) {
  const hue1 = (seed * 137) % 360
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 45%) 0%, hsl(${hue2}, 70%, 35%) 100%)`
}

// Create participant
function createParticipant(index: number) {
  return {
    id: index,
    name: index === 0 ? 'You' : `User ${index}`,
    gradient: getRandomGradient(index),
    initials: index === 0 ? 'Y' : `U${index}`,
  }
}

// Reactive state
const participants = ref(Array.from({ length: 12 }, (_, i) => createParticipant(i)))
const layoutMode = ref<LayoutMode>('gallery')
const aspectRatio = ref('16:9')
const gap = ref(12)
const speakerIndex = ref(0)
const pinnedIndex = ref<number | null>(null)
const sidebarPosition = ref<'left' | 'right' | 'top' | 'bottom'>('right')

// Pagination state
const paginationEnabled = ref(false)
const itemsPerPage = ref(4)
const currentPage = ref(0)
const othersPage = ref(0)

const layoutModes: { value: LayoutMode; label: string }[] = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'sidebar', label: 'Sidebar' },
]

const aspectRatios = ['16:9', '4:3', '1:1']
const positions = ['left', 'right', 'top', 'bottom'] as const

// Computed
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
  layoutMode.value === 'gallery' ? galleryTotalPages.value : othersTotalPages.value
)
const effectiveCurrentPage = computed(() => 
  layoutMode.value === 'gallery' ? currentPage.value : othersPage.value
)

const showSpeakerControl = computed(() => 
  layoutMode.value === 'speaker' || 
  layoutMode.value === 'spotlight' || 
  layoutMode.value === 'sidebar'
)

const showPositionControl = computed(() =>
  layoutMode.value === 'speaker' || 
  layoutMode.value === 'sidebar' || 
  (layoutMode.value === 'gallery' && pinnedIndex.value !== null)
)

// Actions
function addParticipant() {
  const newId = participants.value.length
  participants.value.push(createParticipant(newId))
}

function removeParticipant() {
  if (participants.value.length > 1) {
    participants.value.pop()
  }
}

function nextSpeaker() {
  speakerIndex.value = (speakerIndex.value + 1) % participants.value.length
}

function togglePin() {
  pinnedIndex.value = pinnedIndex.value !== null ? null : 0
}

function nextPin() {
  if (pinnedIndex.value !== null) {
    pinnedIndex.value = (pinnedIndex.value + 1) % participants.value.length
  }
}

function goToPage(page: number) {
  if (layoutMode.value === 'gallery') {
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

// Grid props computed
const maxItemsPerPageProp = computed(() => 
  layoutMode.value === 'gallery' && paginationEnabled.value ? itemsPerPage.value : 0
)
const maxVisibleOthersProp = computed(() => 
  layoutMode.value !== 'gallery' && paginationEnabled.value ? itemsPerPage.value : 0
)
const pinnedIndexProp = computed(() => 
  layoutMode.value === 'gallery' ? (pinnedIndex.value ?? undefined) : speakerIndex.value
)
</script>

<template>
  <div class="app">
    <!-- Header with controls -->
    <header class="header">
      <div>
        <h1 class="header-title">Meet Layout Grid</h1>
        <p class="header-subtitle">Vue 3 Demo with Motion Animations</p>
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

        <!-- Position control (for speaker/sidebar or gallery with pin) -->
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

        <!-- Speaker change -->
        <div v-if="showSpeakerControl" class="control-group">
          <span class="control-label">Active Speaker</span>
          <div class="control-buttons">
            <button class="btn" @click="nextSpeaker">
              Next Speaker →
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Grid -->
    <div class="grid-wrapper">
      <GridContainer
        class="grid-container"
        :aspect-ratio="aspectRatio"
        :gap="gap"
        :layout-mode="layoutMode"
        :speaker-index="speakerIndex"
        :pinned-index="pinnedIndexProp"
        :sidebar-position="sidebarPosition"
        :count="participants.length"
        :max-items-per-page="maxItemsPerPageProp"
        :current-page="layoutMode === 'gallery' ? currentPage : 0"
        :max-visible-others="maxVisibleOthersProp"
        :current-others-page="layoutMode !== 'gallery' ? othersPage : 0"
        spring-preset="smooth"
      >
        <GridItem
          v-for="(participant, index) in participants"
          :key="participant.id"
          :index="index"
        >
          <div
            class="grid-item"
            :style="{ background: participant.gradient }"
          >
            <!-- Badge for speaker -->
            <div
              v-if="index === speakerIndex && layoutMode !== 'gallery'"
              class="item-badge speaker"
            >
              🎤 Speaking
            </div>

            <!-- Badge for pinned in gallery -->
            <div
              v-if="index === pinnedIndex && layoutMode === 'gallery'"
              class="item-badge pinned"
            >
              📌 Pinned
            </div>

            <div class="grid-item-content">
              <div class="avatar">{{ participant.initials }}</div>
              <span class="participant-name">{{ participant.name }}</span>
            </div>
          </div>
        </GridItem>
      </GridContainer>

      <!-- Pagination controls -->
      <div v-if="paginationEnabled && totalPages > 1" class="pagination-controls">
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
    </div>
  </div>
</template>

<style>
@import './style.css';
</style>
