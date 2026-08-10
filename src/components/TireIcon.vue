<script setup>
const PUFFS = [0, 1, 2, 3]
</script>

<template>
  <span class="tire-wrap" aria-hidden="true">
    <svg class="tire" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="17" fill="#1a1a1a" />
      <circle cx="20" cy="20" r="9.5" fill="#cfd3d8" />
      <circle cx="20" cy="20" r="3" fill="#8a8f98" />
      <g stroke="#8a8f98" stroke-width="2.2" stroke-linecap="round">
        <line x1="20" y1="12" x2="20" y2="17" />
        <line x1="20" y1="23" x2="20" y2="28" />
        <line x1="12" y1="20" x2="17" y2="20" />
        <line x1="23" y1="20" x2="28" y2="20" />
        <line x1="14.3" y1="14.3" x2="17.5" y2="17.5" />
        <line x1="22.5" y1="22.5" x2="25.7" y2="25.7" />
        <line x1="25.7" y1="14.3" x2="22.5" y2="17.5" />
        <line x1="17.5" y1="22.5" x2="14.3" y2="25.7" />
      </g>
    </svg>
    <span class="smoke">
      <span v-for="i in PUFFS" :key="i" class="puff" :style="{ '--i': i }"></span>
    </span>
  </span>
</template>

<style scoped>
.tire-wrap {
  position: relative;
  flex: none;
  margin-bottom: 10px;
}

.tire {
  display: block;
  width: 30px;
  height: 30px;
  animation: tire-spin 1.4s linear infinite;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3));

  @media (max-width: 1024px) {
    width: 22px;
    height: 22px;
  }
}

.smoke {
  position: absolute;
  left: 50%;
  bottom: -2px;
  width: 0;
  height: 0;
  pointer-events: none;
}

.puff {
  position: absolute;
  bottom: 0;
  left: calc(var(--i) * 9px - 16px);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(160, 160, 170, 0.85), rgba(160, 160, 170, 0));
  opacity: 0;
  animation: puff-rise 1s ease-out forwards;
  animation-delay: calc(var(--i) * 0.1s + 0.1s);
}

@keyframes tire-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes puff-rise {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.4);
  }
  25% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: translateY(-22px) scale(1.7);
  }
}
</style>
