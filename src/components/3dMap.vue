<template>
  <div id="threeContainer"></div>
</template>

<script lang="js" setup>
import * as THREE from "three";
import initThree from "../utils/Init.js";
import processing from "../utils/checkGeoJson.js";
import mapJson from "../assets/map_ZheJiang.json";
import mapValue from "../assets/values_with_Zhejiang.json";
import projection from "../utils/projection-d3.js";
import createTextSprite from "../utils/textCreator.js";
import SVGloader from "../utils/SVGloader.js";
import heightMap from "../utils/height.js";
import { onMounted, onUnmounted } from "vue";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const loadingDom = document.getElementById("loading");

// 在组件挂载后执行DOM操作
onMounted(() => {
  // 初始化THREEjs配置
  initThree().then(({ scene, camera, renderer, controls }) => {
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    // 获取处理后的数据
    const Map = processing(mapJson, mapValue);

    // const axesHelper = new THREE.AxesHelper(100);
    // scene.add(axesHelper);

    // 一闪一闪的部分是因为切hdr光源的原因
    // loaders(scene);

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

    let activeGroup = null;
    let pointerDownHandler = null;

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
          const mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.x = -Math.PI / 2;
          cityGroup.add(mesh);

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
      // if (cityGeometries.length > 0) {
      //   const mergedGeometry = mergeGeometries(cityGeometries);

      //   // 创建材质（使用第一个材质的配置）
      //   const mergedMaterial = new THREE.MeshPhysicalMaterial({
      //     color: 0xa7b8f9,
      //     side: THREE.DoubleSide,
      //     transmission: 1,
      //     metalness: 0.1,
      //     ior: 1.5,
      //     thickness: 0.5,
      //     roughness: 0.8,
      //   });

      //   const mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
      //   cityGroup.add(mergedMesh);
      // }

      // 将整个城市Group添加到场景
      scene.add(cityGroup);
    });

    if (loadingDom) {
      loadingDom.style.zIndex = -1;
    }

    // 渲染
    animate();

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

    window.addEventListener("pointerdown", pointerDownHandler);
  });
});

onUnmounted(() => {
  // 组件销毁时移除监听，非常重要！
  window.removeEventListener("resize", handleResize);
  if (pointerDownHandler) {
    window.removeEventListener("pointerdown", pointerDownHandler);
  }

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
