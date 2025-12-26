<script setup lang="ts">
import { ref, computed } from 'vue'
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
const participants = ref(Array.from({ length: 6 }, (_, i) => createParticipant(i)))
const layoutMode = ref<LayoutMode>('gallery')
const aspectRatio = ref('16:9')
const gap = ref(12)
const speakerIndex = ref(0)

const layoutModes: { value: LayoutMode; label: string }[] = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'sidebar', label: 'Sidebar' },
]

const aspectRatios = ['16:9', '4:3', '1:1']

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

const showSpeakerControl = computed(() => 
  layoutMode.value === 'speaker' || 
  layoutMode.value === 'spotlight' || 
  layoutMode.value === 'sidebar'
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
              @click="layoutMode = mode.value"
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
        :pinned-index="speakerIndex"
        :count="participants.length"
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

            <div class="grid-item-content">
              <div class="avatar">{{ participant.initials }}</div>
              <span class="participant-name">{{ participant.name }}</span>
            </div>
          </div>
        </GridItem>
      </GridContainer>
    </div>
  </div>
</template>
