<script setup>
import Map from "./components/3dMap.vue";
</script>

<template>
  <div id="loading"></div>
  <Map />
</template>

<style>
#loading {
  position: absolute;
  height: 200px;
  width: 200px;
  border-radius: 50%;
  border: 5px solid #f3f3f3;
  /* 设置顶部边框为蓝色，作为旋转的主体 */
  border-top: 5px solid #3498db;
  top: 50%;
  left: 50%;
  z-index: 100;
  /* 将元素向左、向上移动自身尺寸的一半 */
  transform: translate(-50%, -50%);
  animation: spin 1s linear infinite;
}

/* 定义旋转动画 */
@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

* {
  box-sizing: border-box;
  margin: 0px;
  padding: 0px;
}
</style>
