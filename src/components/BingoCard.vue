<script setup>
import { ref, computed, watch } from 'vue'
import confetti from 'canvas-confetti'
import bingoData from '../data/bingo.json'
import { UI_STRINGS, LANGUAGES, FLAG_SVG, detectLanguage } from '../i18n.js'
import { THEMES, detectTheme } from '../theme.js'
import TireIcon from './TireIcon.vue'

const GRID_SIZE = 5
const CELL_COUNT = GRID_SIZE * GRID_SIZE
const FREE_INDEX = 12
const STORAGE_KEY = 'car-bingo-card-v1'
const LANG_STORAGE_KEY = 'car-bingo-lang-v1'
const THEME_STORAGE_KEY = 'car-bingo-theme-v1'

const round = ref(0)
const cells = ref([])
const marked = ref([])
const toast = ref(null)
const showConfirm = ref(false)
const lang = ref(
  LANGUAGES.includes(localStorage.getItem(LANG_STORAGE_KEY))
    ? localStorage.getItem(LANG_STORAGE_KEY)
    : detectLanguage()
)
const theme = ref(
  THEMES.includes(localStorage.getItem(THEME_STORAGE_KEY))
    ? localStorage.getItem(THEME_STORAGE_KEY)
    : detectTheme()
)
let toastTimer = null

const content = computed(() => bingoData[lang.value])
const t = computed(() => UI_STRINGS[lang.value])

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage unavailable (private browsing, full quota, etc.); this just won't persist
  }
}

watch(lang, (value) => {
  safeSetItem(LANG_STORAGE_KEY, value)
})

watch(
  theme,
  (value) => {
    safeSetItem(THEME_STORAGE_KEY, value)
    document.documentElement.setAttribute('data-theme', value)
  },
  { immediate: true }
)

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

function cellText(cell) {
  return cell.free ? content.value.free : bingoData.entries[cell.poolIndex][lang.value]
}

function cellEmoji(cell) {
  return cell.free ? bingoData.freeEmoji : bingoData.entries[cell.poolIndex].emoji
}

const LINES = (() => {
  const lines = []
  for (let r = 0; r < GRID_SIZE; r++) {
    lines.push(Array.from({ length: GRID_SIZE }, (_, c) => r * GRID_SIZE + c))
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    lines.push(Array.from({ length: GRID_SIZE }, (_, r) => r * GRID_SIZE + c))
  }
  lines.push(Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE + i))
  lines.push(Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE + (GRID_SIZE - 1 - i)))
  return lines
})()

function shuffled(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data.cells) || data.cells.length !== CELL_COUNT) return null
    if (!Array.isArray(data.marked) || data.marked.length !== CELL_COUNT) return null
    if (!data.cells.every((cell) => cell && typeof cell === 'object' && 'poolIndex' in cell)) {
      return null
    }
    return data
  } catch {
    return null
  }
}

function saveState() {
  safeSetItem(
    STORAGE_KEY,
    JSON.stringify({ cells: cells.value, marked: marked.value, round: round.value })
  )
}

function newCard() {
  const poolIndices = shuffled(bingoData.entries.map((_, i) => i)).slice(0, CELL_COUNT - 1)
  const nextCells = []
  let poolPtr = 0
  for (let i = 0; i < CELL_COUNT; i++) {
    if (i === FREE_INDEX) {
      nextCells.push({ poolIndex: null, free: true })
    } else {
      nextCells.push({ poolIndex: poolIndices[poolPtr++], free: false })
    }
  }
  cells.value = nextCells
  marked.value = nextCells.map((cell) => cell.free)
  round.value++
  saveState()
}

const completedLines = computed(() =>
  LINES.filter((line) => line.every((idx) => marked.value[idx]))
)

const linedCellSet = computed(() => {
  const set = new Set()
  for (const line of completedLines.value) {
    for (const idx of line) set.add(idx)
  }
  return set
})

const markedCount = computed(() => marked.value.filter(Boolean).length)
const isBlackout = computed(() => markedCount.value === CELL_COUNT)

function showToast(variant) {
  clearTimeout(toastTimer)
  toast.value = { variant, key: Date.now() }
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 2600)
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function burstConfetti(big) {
  confetti({
    particleCount: big ? 160 : 70,
    spread: big ? 100 : 65,
    startVelocity: big ? 45 : 32,
    origin: { y: 0.6 },
    colors: [cssVar('--accent'), cssVar('--accent-2'), '#ffffff'],
  })
}

watch(completedLines, (newLines, oldLines) => {
  if (newLines.length > (oldLines?.length ?? 0)) {
    burstConfetti(false)
    showToast('line')
  }
})

watch(isBlackout, (is) => {
  if (is) {
    burstConfetti(true)
    showToast('blackout')
  }
})

function toggleCell(idx) {
  if (cells.value[idx].free) return
  marked.value[idx] = !marked.value[idx]
  saveState()
}

function requestNewCard() {
  if (markedCount.value <= 1) {
    newCard()
    return
  }
  showConfirm.value = true
}

function confirmNewCard() {
  showConfirm.value = false
  newCard()
}

function cancelNewCard() {
  showConfirm.value = false
}

const saved = loadState()
if (saved) {
  cells.value = saved.cells
  marked.value = saved.marked
  round.value = saved.round ?? 0
} else {
  newCard()
}
</script>

<template>
  <div class="bingo-app">
    <div class="top-bar">
      <div class="lang-switch" role="group" aria-label="Language">
        <button
          v-for="code in LANGUAGES"
          :key="code"
          type="button"
          class="lang-btn"
          :class="{ active: lang === code }"
          :aria-label="UI_STRINGS[code].langName"
          :aria-pressed="lang === code"
          @click="lang = code"
        >
          <span class="flag-icon" v-html="FLAG_SVG[code]"></span>
        </button>
      </div>

      <button
        type="button"
        class="theme-btn"
        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <span class="theme-icon" :key="theme">{{ theme === 'dark' ? '🌙' : '☀️' }}</span>
      </button>
    </div>

    <header class="bingo-header">
      <div class="title-row">
        <TireIcon />
        <h1>{{ content.title }}</h1>
        <TireIcon />
      </div>
      <p class="subtitle">{{ content.subtitle }}</p>
    </header>

    <div class="toolbar">
      <div class="progress">
        <span class="progress-count">{{ markedCount }}</span>
        <span class="progress-total">/ {{ CELL_COUNT }} {{ t.markedOf }}</span>
        <span v-if="completedLines.length" class="progress-lines">
          · {{ completedLines.length }} {{ completedLines.length > 1 ? t.lines : t.line }}
        </span>
      </div>
      <button class="reset-btn" type="button" @click="requestNewCard">
        <span class="reset-icon">↻</span> {{ t.newCard }}
      </button>
    </div>

    <div class="grid-wrap">
      <div class="grid" :key="round">
        <button
          v-for="(cell, idx) in cells"
          :key="idx"
          type="button"
          class="cell"
          :class="{
            marked: marked[idx],
            free: cell.free,
            'in-line': linedCellSet.has(idx),
          }"
          :style="{ '--delay': (idx % GRID_SIZE) * 0.04 + Math.floor(idx / GRID_SIZE) * 0.04 + 's' }"
          :aria-pressed="marked[idx]"
          @click="toggleCell(idx)"
        >
          <span class="cell-emoji" aria-hidden="true">{{ cellEmoji(cell) }}</span>
          <span class="cell-text">{{ cellText(cell) }}</span>
          <span class="stamp" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="toast" :key="toast.key" class="toast" :class="toast.variant">
        {{ toast.variant === 'blackout' ? t.fullCard : t.bingo }}
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showConfirm" class="modal-backdrop" @click.self="cancelNewCard">
        <div class="modal">
          <p class="modal-title">{{ t.confirmTitle }}</p>
          <p class="modal-body">{{ t.confirmBody(markedCount) }}</p>
          <div class="modal-actions">
            <button type="button" class="modal-btn cancel" @click="cancelNewCard">
              {{ t.cancel }}
            </button>
            <button type="button" class="modal-btn confirm" @click="confirmNewCard">
              {{ t.newCard }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.bingo-app {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 20px 60px;
  box-sizing: border-box;
  text-align: center;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.lang-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 20px;
  background: var(--code-bg);
  border: 1px solid var(--border);
}

.lang-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: inherit;
  color: var(--text);
  background: transparent;
  border: none;
  border-radius: 16px;
  padding: 6px 9px;
  cursor: pointer;
  filter: grayscale(0.85) opacity(0.6);
  transition: filter 0.2s ease, background 0.25s ease, transform 0.15s ease;
}

.flag-icon {
  display: block;
  width: 22px;
  line-height: 0;
}

.flag-icon :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}

.lang-btn:hover {
  filter: grayscale(0.3) opacity(0.85);
}

.lang-btn.active {
  filter: grayscale(0) opacity(1);
  background: var(--accent-bg);
  box-shadow: 0 0 0 1.5px var(--accent-border) inset;
}

.lang-btn:active {
  transform: scale(0.88);
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--code-bg);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.theme-btn:hover {
  box-shadow: var(--shadow);
}

.theme-btn:active {
  transform: scale(0.88);
}

.theme-icon {
  font-size: 16px;
  line-height: 1;
  display: inline-block;
  animation: theme-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes theme-pop {
  0% {
    transform: scale(0.4) rotate(-90deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.2) rotate(10deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.bingo-header h1 {
  margin: 0 0 10px;
}

.subtitle {
  color: var(--text);
  font-size: 15px;
  margin-bottom: 24px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.progress {
  font-size: 14px;
  color: var(--text);
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.progress-count {
  font-family: var(--heading);
  font-size: 20px;
  color: var(--text-h);
  font-variant-numeric: tabular-nums;
}

.progress-lines {
  color: var(--accent);
  font-weight: 600;
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--accent-border);
  background: var(--accent-bg);
  color: var(--accent);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.reset-btn:hover {
  box-shadow: var(--shadow);
}

.reset-btn:active {
  transform: scale(0.94);
}

.reset-icon {
  display: inline-block;
  transition: transform 0.4s ease;
}

.reset-btn:active .reset-icon {
  transform: rotate(-180deg);
}

.grid-wrap {
  perspective: 1200px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
  font-size: 12px;
  line-height: 1.25;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  transform-origin: center;
  opacity: 1;
  animation: cell-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--delay);
  transition: transform 0.15s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  @media (max-width: 480px) {
    font-size: 10px;
    padding: 4px;
  }
}

.cell:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.cell:active {
  transform: scale(0.92);
}

.cell.free {
  cursor: default;
  font-weight: 700;
  color: var(--accent);
  border-color: var(--accent-border);
  background: var(--accent-bg);
}

.cell-emoji {
  position: relative;
  z-index: 1;
  font-size: 20px;
  line-height: 1;
  transition: transform 0.2s ease;

  @media (max-width: 480px) {
    font-size: 16px;
  }
}

.cell-text {
  position: relative;
  z-index: 1;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cell.marked .cell-emoji {
  transform: scale(1.1) rotate(-6deg);
}

.stamp {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: radial-gradient(circle at center, var(--accent) 0%, var(--accent-2) 100%);
  opacity: 0;
  transform: scale(0);
  z-index: 0;
}

.cell.marked .stamp {
  animation: stamp-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.cell.marked .cell-text {
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.cell.marked::after {
  content: '✕';
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
  opacity: 0;
  animation: check-in 0.35s ease 0.08s forwards;
}

.cell.in-line {
  animation: line-glow 1.1s ease-in-out 1;
}

@keyframes cell-in {
  from {
    opacity: 0;
    transform: scale(0.5) rotateX(40deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotateX(0deg);
  }
}

@keyframes stamp-in {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-25deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.15) rotate(6deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes check-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  70% {
    opacity: 1;
    transform: scale(1.3);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes line-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(170, 59, 255, 0.6);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(170, 59, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(170, 59, 255, 0);
  }
}

.toast {
  position: fixed;
  left: 50%;
  top: 18%;
  transform: translate(-50%, 0);
  padding: 18px 36px;
  border-radius: 14px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #fff;
  background: var(--accent-gradient);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  z-index: 50;
  pointer-events: none;
}

.toast.blackout {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 3px rgba(255, 255, 255, 0.4);
}

.toast-enter-active {
  animation: toast-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  animation: toast-out 0.4s ease forwards;
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px) scale(0.6) rotate(-4deg);
  }
  60% {
    opacity: 1;
    transform: translate(-50%, 4px) scale(1.08) rotate(2deg);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1) rotate(0deg);
  }
}

@keyframes toast-out {
  to {
    opacity: 0;
    transform: translate(-50%, -16px) scale(0.8);
  }
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(8, 6, 13, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  box-sizing: border-box;
}

.modal {
  width: 100%;
  max-width: 340px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
  text-align: center;
}

.modal-title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-h);
  margin-bottom: 8px;
}

.modal-body {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.modal-btn {
  flex: 1;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.modal-btn:active {
  transform: scale(0.94);
}

.modal-btn.cancel {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-h);
}

.modal-btn.cancel:hover {
  box-shadow: var(--shadow);
}

.modal-btn.confirm {
  border: 1px solid transparent;
  background: var(--accent-gradient);
  color: #fff;
}

.modal-btn.confirm:hover {
  box-shadow: var(--shadow);
}

.modal-enter-active .modal {
  animation: modal-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active .modal {
  animation: modal-in 0.2s ease reverse;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes modal-in {
  0% {
    opacity: 0;
    transform: scale(0.75) translateY(10px);
  }
  60% {
    opacity: 1;
    transform: scale(1.03) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
