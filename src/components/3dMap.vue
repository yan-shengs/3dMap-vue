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
import { onMounted } from "vue";
import controls from "../utils/orbitControls.js";
import gridHelper from "../utils/GridHelper.js";
import createTextSprite from "../utils/textCreator.js";

// 获取处理后的数据
const Map = processing(mapJson, mapValue);

const scene = new THREE.Scene();

// 修改背景颜色
scene.background = new THREE.Color(0x1a1a1a);

// 增加网格背景
scene.add(gridHelper);

// 初始化摄像头和渲染画布,控制器
const control = controls(camera, renderer);

function animate() {
  requestAnimationFrame(animate);
  control.update();
  renderer.render(scene, camera);
}

// 在组件挂载后执行DOM操作
onMounted(() => {
  // 挂载到页面
  const threeContainer = document.getElementById("threeContainer");
  threeContainer.appendChild(renderer.domElement);

  // d3处理经纬度
  Map.features.forEach((feature) => {
    // 增加城市字体
    const centroid = feature.properties.centroid;
    const projectedCentroid = projection(centroid);
    const scale = 0.8;
    const textX = (projectedCentroid[0] - window.innerWidth / 2) * scale;
    const textY = (projectedCentroid[1] - window.innerHeight / 2) * scale;
    
    const textSprite = createTextSprite(feature.properties.name, [textX, 1, textY]);
    scene.add(textSprite);
    
    feature.geometry.coordinates.forEach((geo) => {
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
          const scale = 0.8;
          const scaledX = (x - window.innerWidth / 2) * scale;
          const scaledY = (y - window.innerHeight / 2) * scale;

          // 第一个点使用moveTo，其余点使用lineTo
          if (index === 0) {
            shape.moveTo(scaledX, -scaledY);
          } else {
            shape.lineTo(scaledX, -scaledY);
          }
        });
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.6,
          bevelEnabled: false,
        });
        // ExtrudeGeometry代替ShapeGeometry
        // const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
          color: 0x728bd2,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        // 旋转Mesh
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

        // 边界线
        const edges = new THREE.EdgesGeometry(geometry);

        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0xffffff }),
        );

        line.rotation.x = -Math.PI / 2;

        scene.add(line);
      });
    });
  });

  // 渲染
  animate();
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
