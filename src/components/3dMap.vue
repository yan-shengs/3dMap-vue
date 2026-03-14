<template>
  <div id="threeContainer"></div>
</template>

<script lang="js" setup>
import * as THREE from "three";
import initThree from "../utils/Init.js";
import { checkGeoJsonProcessing, projection } from "../utils/DataProcessing.js";
import { waterMapPin, textResource, Render2D } from "../utils/resource.js";

// vue声明周期函数
import { onMounted, onUnmounted } from "vue";
// 地图数据
import mapJson from "../assets/map_ZheJiang.json";
import mapValue from "../assets/values_with_Zhejiang.json";
import heightMap from "../utils/height.js";

let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let reqID = null; // 调用reqID之前需要声明，因此animate函数需要在这行之后，且需要unonmount拿得到
let isStart = false;
let labelRenderer = null;

let pointerDownHandler = null;
let activeGroup = null;
pointerDownHandler = (event) => {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster
    .intersectObjects(scene.children, true)
    .filter((item) => item.object.type !== "Line");

  const hit = intersects.find(
    (item) => item.object.type === "Mesh" || item.object.type === "Sprite",
  );

  if (!hit) {
    if (activeGroup) {
      setGroupState(activeGroup, 1, 1);
      activeGroup = null;
    }
    return;
  }

  const nextGroup = hit.object.parent;
  if (!nextGroup || nextGroup.type !== "Group") return;

  // 点击同一对象：还原
  if (activeGroup === nextGroup) {
    setGroupState(nextGroup, 1, 1);
    activeGroup = null;
    return;
  }

  // 切换选中：先还原旧的，再高亮新的
  if (activeGroup) {
    setGroupState(activeGroup, 1, 1);
  }
  activeGroup = nextGroup;
  setGroupState(activeGroup, 0.4, 1.2);
};

// 监听鼠标交互事件，调用
// window.addEventListener("pointerdown", pointerDownHandler);

const setGroupState = (group, opacity = 1, scaleY = 1) => {
  if (!group) return;

  // 统一按固定值设置，避免反复点击导致累乘/累除
  group.scale.y = scaleY;

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
const handleResize = () => {
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

let start = () => {
  if (isStart) {
    releaseComponenets();
  }

  isStart = true;

  const loading = document.getElementById("loading");
  // 初始化THREEjs配置, 需要在onMount之外以免unonmount拿不到
  ({ scene, camera, renderer, controls } = initThree());
  labelRenderer = Render2D();

  // 挂载到页面
  const threeContainer = document.getElementById("threeContainer");
  threeContainer.appendChild(renderer.domElement);
  // 获取处理后的数据
  const Mapdata = checkGeoJsonProcessing(mapJson, mapValue);
  // d3处理经纬度
  Mapdata.features.forEach((feature) => {
    // 每个城市创建一个Group
    const cityGroup = new THREE.Group();
    cityGroup.name = feature.properties.name;

    // 增加城市字体
    const centroid = feature.properties.centroid; // 城市中心点
    const projectedCentroid = projection(centroid);
    const scale = 3;
    const textX = (projectedCentroid[0] - window.innerWidth / 2) * scale;
    const textY = (projectedCentroid[1] - window.innerHeight / 2) * scale;

    // 传递转换后的坐标给SVGloader，添加到cityGroup
    waterMapPin(cityGroup, [textX, textY, 1 + 0.01]);

    feature.geometry.coordinates.forEach((area) => {
      const linearea = [];
      area.forEach((pointer) => {
        // 制作Mesh地图块
        // 制作二维点构建形状路径
        const shape = new THREE.Shape();

        // 获取点的数据
        pointer.forEach((point, index) => {
          const longitude = point[0];
          const latitude = point[1];

          // 使用d3的projection函数进行坐标转换
          // 转换后latitude需要填上负号

          const projectedPoint = projection([longitude, latitude]);
          const [x, y] = projectedPoint;

          // 缩放坐标到合适的范围（投影后的坐标通常很大，需要缩小）
          const scale = 3;
          const scaledX = (x - window.innerWidth / 2) * scale;
          const scaledY = (y - window.innerHeight / 2) * scale;

          linearea.push([scaledX, scaledY]);

          // 第一个点使用moveTo，其余点使用lineTo
          if (index === 0) {
            shape.moveTo(scaledX, -scaledY);
          } else {
            shape.lineTo(scaledX, -scaledY);
          }
        });

        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: heightMap[feature.properties.name] * scale * 5,
          bevelEnabled: true,
        });
        // ExtrudeGeometry代替ShapeGeometry
        // const geometry = new THREE.ShapeGeometry(shape);
        const material = [
          new THREE.MeshPhysicalMaterial({
            color: 0xa7b8f9,
            side: THREE.DoubleSide,
            transmission: 1, // 透明度（玻璃关键）
            metalness: 0.1,
            ior: 1.5, // 折射率（玻璃约1.5）
            thickness: 0.5, // 厚度
            roughness: 0.8,
          }),
          new THREE.MeshStandardMaterial({ color: 0x1f3f91 }), //侧面
        ];

        // 克隆几何体并应用旋转变换
        const clonedGeometry = geometry.clone();
        clonedGeometry.rotateX(-Math.PI / 2);

        // 暂时不创建mesh，等合并后再创建
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;

        // 加入城市字体
        textResource(threeContainer, labelRenderer, cityGroup.name, cityGroup, [
          textX,
          textY,
          1 + 0.01,
        ]);

        cityGroup.add(mesh);
      });
      // 倒角默认0.2 + 安全距离防闪烁 0.05
      const zHeight = -heightMap[feature.properties.name] * scale * 5 - 0.25; // 假设地图厚度是 5
      const points3D = linearea.map((coord) => {
        // 把经纬度映射到 X 和 Y，Z 轴设为固定高度
        return new THREE.Vector3(coord[0], coord[1], zHeight);
      });

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points3D);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
      // 画顶部的线
      const topOutline = new THREE.LineLoop(lineGeometry, lineMaterial);

      topOutline.rotation.x = Math.PI / 2;
      cityGroup.add(topOutline);
    });
    // 将整个城市Group添加到场景
    scene.add(cityGroup);
  });

  // 移除loading动画
  if (loading) {
    loading.style.display = "none";
  }

  handleResize();
  // 监听窗口变化
  window.addEventListener("resize", handleResize);

  // 开始渲染
  animate();
  // 循环渲染功能
  function animate() {
    reqID = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); // 增加2d循环渲染，必须加这一行，HTML 标签才会跟随 3D 物体
  }
};

// 释放定时器，threejs实例，销毁组件附加功能
function releaseComponenets() {
  // 停止循环渲染功能
  if (reqID) {
    cancelAnimationFrame(reqID);
    reqID = null;
    console.log("渲染循环已彻底停止");
  }

  // 组件销毁时移除监听，非常重要！
  window.removeEventListener("resize", handleResize);
  if (pointerDownHandler) {
    window.removeEventListener("pointerdown", pointerDownHandler);
  }

  // 如果需要，这里还可以释放 GPU 内存
  renderer.dispose();
  // 清理 CSS2D 渲染器
  if (labelRenderer && labelRenderer.domElement) {
    // 1. 如果它已经被挂载到了页面上，就把它连根拔起
    if (labelRenderer.domElement.parentNode) {
      labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
    }
    // 2. （可选但推荐）把渲染器内部的元素强行清空
    labelRenderer.domElement.innerHTML = "";
  }
  // 1. 递归遍历场景里所有的物体
  scene.traverse((child) => {
    // 2. 如果它是一个网格模型（Mesh）
    if (child.isMesh) {
      // 销毁几何体
      if (child.geometry) {
        child.geometry.dispose();
      }

      // 销毁材质
      if (child.material) {
        // 注意：有时候一个 Mesh 会贴多个材质（材质数组），需要遍历销毁
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });

  // 3. 等骨肉都清理干净了，最后再把这些“空壳”从场景里踢出去！
  scene.clear();

  isStart = false;
}

// 在组件挂载后执行DOM操作
onMounted(() => {
  // 开始加载设置
  start();
  // 坐标轴
  // const axesHelper = new THREE.AxesHelper(100);
  // scene.add(axesHelper);
});

onUnmounted(() => {
  releaseComponenets();
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
