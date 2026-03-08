<template>
  <div id="threeContainer"></div>
</template>

<script lang="js" setup>
import * as THREE from "three";
import processing from "../utils/checkGeoJson.js";
import mapJson from "../assets/map_ZheJiang.json";
import mapValue from "../assets/values_with_Zhejiang.json";
import camera from "../utils/Camera.js";
import renderer from "../utils/renderer.js";
import projection from "../utils/projection-d3.js";
import controls from "../utils/orbitControls.js";
import gridHelper from "../utils/GridHelper.js";
import createTextSprite from "../utils/textCreator.js";
import loaders from "../utils/HDR.js";
import SVGloader from "../utils/SVGloader.js";
import heightMap from "../utils/height.js";
import { onMounted, onUnmounted } from "vue";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// 获取处理后的数据
const Map = processing(mapJson, mapValue);

const scene = new THREE.Scene();

// 修改背景颜色
scene.background = new THREE.Color(0xd4e7fd);

// 增加网格背景
scene.add(gridHelper);

// const axesHelper = new THREE.AxesHelper(100);
// scene.add(axesHelper);

// 初始化摄像头和渲染画布,控制器
const control = controls(camera, renderer);

function animate() {
  requestAnimationFrame(animate);
  control.update();
  renderer.render(scene, camera);
}

loaders(scene);

const handleResize = () => {
  // 1. 获取窗口最新的宽高
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 2. 更新相机
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // 3. 更新渲染器
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

// 在组件挂载后执行DOM操作
onMounted(() => {
  // 挂载到页面
  const threeContainer = document.getElementById("threeContainer");
  threeContainer.appendChild(renderer.domElement);

  handleResize();
  // 监听窗口变化
  window.addEventListener("resize", handleResize);
  // d3处理经纬度
  Map.features.forEach((feature) => {
    // 为每个城市创建一个Group
    const cityGroup = new THREE.Group();
    cityGroup.name = feature.properties.name;

    // 收集当前城市的所有几何体用于合并
    const cityGeometries = [];

    // 增加城市字体
    const centroid = feature.properties.centroid;
    const projectedCentroid = projection(centroid);
    const scale = 3;
    const textX = (projectedCentroid[0] - window.innerWidth / 2) * scale;
    const textY = (projectedCentroid[1] - window.innerHeight / 2) * scale;

    const textSprite = createTextSprite(feature.properties.name, [
      textX,
      heightMap[feature.properties.name] * scale * 5,
      textY,
    ]);
    cityGroup.add(textSprite);

    // 传递转换后的坐标给SVGloader，返回的Group会被添加到cityGroup
    cityGroup.add(SVGloader([textX, textY, 1 + 0.01]));

    feature.geometry.coordinates.forEach((geo) => {
      const linearea = [];
      geo.forEach((area) => {
        // 制作Mesh地图块
        // 制作二维点构建形状路径
        const shape = new THREE.Shape();

        // 获取点的数据
        area.forEach((point, index) => {
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
        console.log(heightMap);
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

        // 收集几何体用于合并
        cityGeometries.push(clonedGeometry);

        // 暂时不创建mesh，等合并后再创建
        // const mesh = new THREE.Mesh(geometry, material);
        // mesh.rotation.x = -Math.PI / 2;
        // cityGroup.add(mesh);

        // 边界线
        // const edges = new THREE.EdgesGeometry(geometry);

        // const line = new THREE.LineSegments(
        //   edges,
        //   new THREE.LineBasicMaterial({ color: 0xffffff }),
        // );

        // line.rotation.x = -Math.PI / 2;

        // cityGroup.add(line);
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

    // 合并当前城市的所有几何体
    if (cityGeometries.length > 0) {
      const mergedGeometry = mergeGeometries(cityGeometries);

      // 创建材质（使用第一个材质的配置）
      const mergedMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xa7b8f9,
        side: THREE.DoubleSide,
        transmission: 1,
        metalness: 0.1,
        ior: 1.5,
        thickness: 0.5,
        roughness: 0.8,
      });

      const mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
      cityGroup.add(mergedMesh);
    }

    // 将整个城市Group添加到场景
    scene.add(cityGroup);
  });

  // 渲染
  animate();
});

onUnmounted(() => {
  // 组件销毁时移除监听，非常重要！
  window.removeEventListener("resize", handleResize);

  // 如果需要，这里还可以释放 GPU 内存
  renderer.dispose();
  scene.clear();
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
