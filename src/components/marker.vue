<template>
  <h3 id="marker" ref="marker">
    2025年浙江省第四季度GDP数据:{{ name }}:{{ value }}万元
  </h3>
</template>

<script lang="js" setup>
import { defineProps } from "vue";
// 定义vue父子组件传递
const props = defineProps({
  name: String,
  value: String,
});
</script>

<style scoped>
#marker {
  position: fixed;
  left: 24px;
  bottom: 24px;
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  color: #dbe7ff;
  background: rgba(7, 16, 38, 0.72);
  border: 1px solid rgba(123, 169, 255, 0.35);
  backdrop-filter: blur(6px);
  pointer-events: none;
  font-size: 14px;
  line-height: 1.4;
}
</style>
