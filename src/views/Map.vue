<script setup>
// 引入组件
import LoadingComponent from '@/components/loading.vue'
import Mark from '@/components/mark.vue'
// 自定义类、函数
import { Engine } from '@/core/Engine'
import { ResourceManager } from '@/core/resource/ResourceManager'
import { LabelRenderer } from '@/core/watch/labelRenderer'
import { Renderer } from '@/core/watch/Renderer'
// 引入vue组件
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

// 定义loading状态
const loadingStatus = ref(true)
// 定义mark状态、传输组件数据
const markStatus = ref(false)
const areaName = ref('')
const areaGDP = ref('')
const threeContainer = ref(null)

let resource = null
let engine = null
let renderer = null
let labelRenderer = null
let activeGroup = null
const onPointerdown = (event) => {
  pointerDownHandler(event, engine.camera, engine.map.clickMapObjects)
}

// 设置监听器，窗口变化
const handleResize = () => {
  // 获取窗口最新的宽高
  const width = window.innerWidth
  const height = window.innerHeight

  if (engine) {
    engine.resize(width, height)
  }
}

const pointerDownHandler = (event, camera, clickObjects) => {
  const mouse = new THREE.Vector2()
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  // console.log('展示', clickObjects)
  const intersects = raycaster
    .intersectObjects(clickObjects, true)
    .filter((item) => item.object.type !== 'Line')

  const hit = intersects.find(
    (item) => item.object.type === 'Mesh' || item.object.type === 'Sprite',
  )

  if (!hit) {
    if (activeGroup) {
      setGroupState(activeGroup, 1, 1)
      activeGroup = null
      areaName.value = ''
      areaGDP.value = ''
      markStatus.value = false
    }
    return
  }

  const nextGroup = hit.object
  // if (!nextGroup || nextGroup.type !== "Group") return;

  // 点击同一对象：还原
  if (activeGroup === nextGroup) {
    setGroupState(nextGroup, 1, 1)
    activeGroup = null
    areaName.value = ''
    areaGDP.value = ''
    markStatus.value = false
    return
  }

  // 切换选中：先还原旧的，再高亮新的
  if (activeGroup) {
    setGroupState(activeGroup, 1, 1)
  }
  activeGroup = nextGroup
  setGroupState(activeGroup, 0.6, activeGroup.scale.z * 1.1)

  areaName.value = activeGroup.name
  areaGDP.value = String(activeGroup.GDP)

  markStatus.value = true
}

const setGroupState = (group, opacity = 1, scaleY = 1) => {
  if (!group) return

  // 统一按固定值设置，避免反复点击导致累乘/累除
  group.scale.z = scaleY

  group.children.forEach((item) => {
    if (item.type !== 'Mesh') return

    const materials = Array.isArray(item.material) ? item.material : [item.material]

    materials.forEach((mat) => {
      if (!mat) return
      mat.transparent = opacity < 1
      mat.opacity = opacity
    })
  })
}

onMounted(() => {
  resource = new ResourceManager()

  resource.init().then(([, matcap, hdrTexture, svgtexture]) => {
    console.log('资源数据加载完成')

    renderer = new Renderer()
    labelRenderer = new LabelRenderer()
    engine = new Engine(
      resource,
      renderer,
      labelRenderer,
      hdrTexture,
      svgtexture,
      threeContainer.value,
    )

    threeContainer.value.appendChild(renderer.renderer.domElement)
    threeContainer.value.appendChild(labelRenderer.labelRenderer.domElement)
    renderer.init()
    labelRenderer.init()
    engine.init(matcap)

    // 开始渲染
    engine.animate()
    loadingStatus.value = false

    handleResize()

    window.addEventListener('resize', handleResize)
    window.addEventListener('pointerdown', onPointerdown)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('pointerdown', onPointerdown)
  engine.dispose()
  // 清除原生变量
  let resource = null
  let engine = null
  let renderer = null
  let labelRenderer = null
  let activeGroup = null
})
</script>

<template>
  <LoadingComponent id="loading" v-if="loadingStatus" />
  <Mark id="mark" v-show="markStatus" :areaName="areaName" :areaGDP="areaGDP" />
  <div ref="threeContainer" id="viewContent"><RouterView /></div>
</template>

<style scoped>
#loading {
  position: absolute;
  z-index: 9999;
  width: 100%;
  height: 100%;
}

#mark {
  /* 固定位置 */
  position: absolute;
  bottom: 0;
  margin-left: 15px;
  margin-bottom: 15px;
  z-index: 9999;
}

#viewContent {
  position: absolute;
  z-index: 0;
  inset: 0;
}
</style>
