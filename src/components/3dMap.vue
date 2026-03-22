<template>
  <div id="threeContainer" ref="threeContainer">
    <Loading v-if="loading" />
    <Marker v-show="markerStatus" :name="name" :value="value" />
  </div>
</template>

<script lang="js" setup>
// 引入loading等组件
import Loading from "./loading.vue";
import Marker from "./marker.vue";
// 引入三方库
import * as THREE from "three";
// 引入vue函数
import { onMounted, onUnmounted, ref } from "vue";
// 引入自定义库
import { mapEngine } from "../utils/engine.js";
// 引入辅助函数
import { axes } from "../utils/helper.js";

import { loadResource } from "../utils/resource.js";
import {
  checkProcessing,
  elevationSort,
  EVL,
  GDP,
  GEO,
  projection,
} from "../utils/dataProcessor.js";

const loading = ref(true);
const markerStatus = ref(false);
const threeContainer = ref(null);

const name = ref("");
const value = ref("");

let onWindowResize = null;
let onPointerDown = null;

let pointerDownHandler = null;
let activeGroup = null;
pointerDownHandler = (event, camera, scene) => {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  // console.log("展示", scene);
  const intersects = raycaster
    .intersectObjects(scene, true)
    .filter((item) => item.object.type !== "Line");

  const hit = intersects.find(
    (item) => item.object.type === "Mesh" || item.object.type === "Sprite",
  );

  if (!hit) {
    if (activeGroup) {
      setGroupState(activeGroup, 1, 1);
      activeGroup = null;
      name.value = "";
      value.value = "";
      markerStatus.value = false;
    }
    return;
  }

  const nextGroup = hit.object;
  // if (!nextGroup || nextGroup.type !== "Group") return;

  // 点击同一对象：还原
  if (activeGroup === nextGroup) {
    setGroupState(nextGroup, 1, 1);
    activeGroup = null;
    name.value = "";
    value.value = "";
    markerStatus.value = false;
    return;
  }

  // 切换选中：先还原旧的，再高亮新的
  if (activeGroup) {
    setGroupState(activeGroup, 1, 1);
  }
  activeGroup = nextGroup;
  setGroupState(activeGroup, 0.6, activeGroup.scale.z * 1.1);
  // meshValue.value = activeGroup.gdpValue;
  // console.log(meshValue.value);
  // name.value = activeGroup.name;
  // marker.value.style.opacity = 1;
  console.log(activeGroup);
  name.value = activeGroup.parent.name;
  value.value = activeGroup.parent.GDP;
  // name.value = "tex";
  // value.value = "12";
  markerStatus.value = true;
};

const setGroupState = (group, opacity = 1, scaleY = 1) => {
  if (!group) return;

  // 统一按固定值设置，避免反复点击导致累乘/累除
  group.scale.z = scaleY;

  group.children.forEach((item) => {
    if (item.type !== "Mesh") return;

    const materials = Array.isArray(item.material)
      ? item.material
      : [item.material];

    materials.forEach((mat) => {
      if (!mat) return;
      mat.transparent = opacity < 1;
      mat.opacity = opacity;
    });
  });
};

// 浏览器窗口实时渲染更新
const handleResize = (camera, renderer, labelRenderer) => {
  // 1. 获取窗口最新的宽高
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 2. 更新相机
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // 3. 更新渲染器，2d渲染器
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};
// 开始加载设置 给onmouted和unonmouted接收
let engine = null;

// 在组件挂载后执行DOM操作
onMounted(() => {
  engine = new mapEngine();
  // 在init之前需要先进行渲染器的元素挂载
  // 挂载到页面
  threeContainer.value.appendChild(engine.renderer.domElement);
  threeContainer.value.appendChild(engine.labelRenderer.domElement);
  // 异步资源加载
  loadResource(engine.scene).then(async (tex) => {
    engine.init();

    // 加入基座
    engine.floors.forEach((floor) => {
      engine.setRotation(floor, [-Math.PI / 2, 0, 0]);

      floor.position.y = -0.1;
      engine.addTOScene(floor);
    });

    engine.radars.forEach((radar) => {
      engine.addTOScene(radar);
    });

    engine.createFlySpots(checkProcessing(GEO, GDP, EVL).features);

    engine.createMesh(
      checkProcessing(GEO, GDP, EVL).features,
      projection,
      tex,
      elevationSort(EVL),
    );

    await engine.createWaterPin(
      checkProcessing(GEO, GDP, EVL).features,
      elevationSort(EVL),
    );

    engine.createText(
      threeContainer.value,
      checkProcessing(GEO, GDP, EVL).features,
      elevationSort(EVL),
    );

    const objs = new THREE.Group();
    engine.clickObject.forEach((mesh) => {
      // engine.setRotation(mesh, [-Math.PI / 2, 0, 0]);
      objs.add(mesh);
      // engine.addTOScene(mesh);
    });
    engine.pins.forEach((p) => {
      // engine.setRotation(mesh, [-Math.PI / 2, 0, 0]);
      objs.add(p);
      // engine.addTOScene(mesh);
    });

    engine.texts.forEach((text) => {
      objs.add(text);
    });

    engine.flySpots.forEach((fly) => {
      objs.add(fly);
      console.log(fly);
    });

    objs.rotation.x = -Math.PI / 2;
    engine.addTOScene(objs);

    engine.createLinear(elevationSort(EVL));

    engine.linearMesh.forEach((line) => {
      engine.setRotation(line, [-Math.PI / 2, 0, 0]);
      engine.addTOScene(line);
    });

    axes(engine.scene);

    engine.animate(engine);
    loading.value = false;

    console.log(engine.scene);

    handleResize(engine.camera, engine.renderer, engine.labelRenderer);

    // 专门定义带名字的包裹函数，加上安全防线！
    onWindowResize = () => {
      if (!engine) return; // 终极安全锁：如果引擎被销毁了，啥也不干！
      handleResize(engine.camera, engine.renderer, engine.labelRenderer);
    };

    onPointerDown = (event) => {
      if (!engine) return; // 终极安全锁
      pointerDownHandler(event, engine.camera, engine.clickObject);
    };

    window.addEventListener("resize", onWindowResize);
    // 监听鼠标交互事件，调用
    window.addEventListener("pointerdown", onPointerDown);
  });
});

onUnmounted(() => {
  // 亲手解绑 DOM 事件（防止内存泄漏）
  window.removeEventListener("resize", onWindowResize);
  window.removeEventListener("pointerdown", onPointerDown);
  // 清理内存
  engine.dispose();
  // 实现engine垃圾回收
  engine = null;
});
</script>

<style scoped>
#threeContainer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
