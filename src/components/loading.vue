<script setup></script>

<template>
  <div class="loading-container">
    <svg class="vortex-svg" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="cyan-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#48e5e5" />
          <stop offset="50%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#6366f1" />
        </linearGradient>

        <linearGradient id="cyan-blue-light" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#64ffda" />
          <stop offset="100%" stop-color="#818cf8" />
        </linearGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle class="ring orbit-4" cx="120" cy="120" r="100" />

      <circle class="ring orbit-3" cx="120" cy="120" r="85" />
      <circle class="ring orbit-2" cx="120" cy="120" r="70" />
      <circle class="ring orbit-1" cx="120" cy="120" r="55" />

      <circle class="ring core-ring" cx="120" cy="120" r="35" />
    </svg>

    <div class="loading-text">
      <h2>LOADING...</h2>
      <p>Please Wait...</p>
    </div>
  </div>
</template>

<style scoped>
body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #e0eaf5 0%, #b8c6db 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 实现上下居中 */
  justify-content: center;
  position: relative;
}

/* 漩涡 SVG 容器 */
.vortex-svg {
  width: 240px;
  height: 240px;
  filter: drop-shadow(0 0 10px rgba(72, 229, 229, 0.3));
}

/* 基础环形属性 */
.ring {
  fill: none;
  stroke-linecap: round;
  transform-origin: 120px 120px;
}

/* 核心高光白环 */
.core-ring {
  stroke: #ffffff;
  stroke-width: 8;
  filter: url(#glow);
}

/* 各层轨道动画 */
.orbit-1 {
  stroke: url(#cyan-blue);
  stroke-width: 6;
  stroke-dasharray: 100 250;
  animation: spin 2.5s cubic-bezier(0.4, 0.1, 0.6, 0.9) infinite;
}

.orbit-2 {
  stroke: url(#cyan-blue);
  stroke-width: 4;
  stroke-dasharray: 180 300;
  animation: spin-reverse 3.5s linear infinite;
}

.orbit-3 {
  stroke: url(#cyan-blue-light);
  stroke-width: 3;
  stroke-dasharray: 60 150 40 100;
  animation: spin 4s linear infinite;
}

.orbit-4 {
  stroke: rgba(255, 255, 255, 0.6);
  stroke-width: 2;
  stroke-dasharray: 10 40 5 80;
  animation: spin-reverse 2s linear infinite;
}

/* 文本样式 */
.loading-text {
  margin-top: -10px;
  text-align: center;
  color: #ffffff;
  text-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 0 10px rgba(255, 255, 255, 0.8);
}

.loading-text h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 2px;
}

.loading-text p {
  margin: 5px 0 0 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
}

/* 旋转动画关键帧 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spin-reverse {
  0% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>
