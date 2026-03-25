<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  areaName: String,
  areaGDP: String,
})
</script>

<template>
  <div id="mark">浙江省2025年第四季度GDP数据:{{ areaName }} - {{ areaGDP }}(万亿)</div>
</template>

<style scoped>
#mark {
  /* 修改字体 */
  font-family: FangSong;
  font-size: 2rem;

  /* 背景 */
  color: #dbe7ff;
  border-radius: 1rem;
  background: rgba(7, 16, 38, 0.72);
  border: 1px solid rgba(123, 169, 255, 0.35);
  backdrop-filter: blur(0.6rem);
  pointer-events: none;

  /* 美化 */
  /* 在内容基础上撑大盒子使得border-radius的圆角不那么突兀 */
  padding: 0.25rem 0.35rem;
}
</style>
