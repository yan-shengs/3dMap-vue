import * as THREE from "three";
import { constant, radarConfig } from "../constant/Config";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/examples/jsm/Addons.js";
import { drawLineBetween2Spot, textResource, waterMapPin } from "./resource";
import { drawRadar } from "./radar";
import { projection } from "./dataProcessor";
import { convertColorSpace } from "three/tsl";

// 定义地图引擎类

export class mapEngine {
  // 构造方法
  constructor() {
    // 初始化循环渲染id
    this.reqID = null;
    // 初始化场景
    // 类比一下摄影棚
    this.scene = new THREE.Scene();
    // 初始化3D渲染器
    this.renderer = new THREE.WebGLRenderer();
    // 初始化2D渲染器
    this.labelRenderer = new CSS2DRenderer();
    // 初始化相机
    this.camera = new THREE.PerspectiveCamera(
      75, // fov 视野角度 一般60,75
      window.innerWidth / window.innerHeight, // aspect 宽高比
      0.1, // near 最近可见距离
      1000, // far 最远可见距离
    );

    /* 用于监听renderer渲染器生成的canvas元素 */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // 初始化flySpot
    this.flySpots = [];
    // 初始化碰撞对象
    this.clickObject = [];
    // 初始化雷达对象
    this.radars = [];

    this.floors = [];

    // 边界线条
    this.linear = [];
    this.lineararea = [];
    this.linearMesh = [];

    this.pins = [];

    this.texts = [];

    this.timer = new THREE.Timer();
  }

  // 初始化
  init() {
    // 初始化3D渲染器配置
    // 设置渲染器画布大小
    this.renderer.setSize(constant.width, constant.height);
    /* 相机和渲染器的关系为
     相机拍摄图片放入渲染器呈现给浏览器
    */

    // 1. 颜色空间校正
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // 2. 电影级色调映射
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 3. 曝光度调节 (根据你的场景灯光自行微调)
    this.renderer.toneMappingExposure = 1.2;

    // 设置2D渲染器
    this.labelRenderer.setSize(constant.width, constant.height);
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.top = "0px";
    this.labelRenderer.domElement.style.pointerEvents = "none"; // 关键：防止遮挡 WebGL 的点击事件

    // 初始化相机配置
    // 设置摄像头位置
    this.camera.position.set(10, 30, 40);
    // 让摄像头看向场景中心,默认看向0,0,0
    this.camera.lookAt(0, 0, 0);

    // 初始化控制器配置
    // 启用阻尼（推荐）
    this.controls.enableDamping = true;

    // 阻尼系数
    this.controls.dampingFactor = 1;

    // 是否可以缩放
    this.controls.enableZoom = true;
    this.controls.minDistance = 30; // 最小缩放距离
    this.controls.maxDistance = 80; // 最大缩放距离

    // 是否可以旋转
    this.controls.enableRotate = true;
    this.controls.minPolarAngle = Math.PI / 6; // 最小角度
    this.controls.maxPolarAngle = Math.PI / 2 - Math.PI / 6; // 最大角度

    // 是否可以平移
    this.controls.enablePan = false;

    // 初始化场景配置
    // 修改背景颜色
    this.scene.background = new THREE.Color(0xd4e7fd);

    // 加入相机
    this.addTOScene(this.camera);

    this.createBottom();

    this.createRadar();
  }

  // 建立地图块
  createMesh(features, projection, tex, heightMap) {
    const scale = 3;

    features.forEach((feature) => {
      const group = new THREE.Group();
      feature.geometry.coordinates.forEach((area) => {
        // 制作Mesh地图块
        // 制作二维点构建形状路径
        const shape = new THREE.Shape();
        area.forEach((multipoint) => {
          // 获取点的数据
          multipoint.forEach((point, index) => {
            const longitude = point[0];
            const latitude = point[1];

            // 使用d3的projection函数进行坐标转换
            // 转换后latitude需要填上负号

            const projectedPoint = projection([longitude, latitude]);
            const [x, y] = projectedPoint;

            // 缩放坐标到合适的范围（投影后的坐标通常很大，需要缩小）

            const scaledX = (x - window.innerWidth / 2) * scale;
            const scaledY = (y - window.innerHeight / 2) * scale;

            this.linear.push([scaledX, scaledY]);

            // 第一个点使用moveTo，其余点使用lineTo
            if (index === 0) {
              shape.moveTo(scaledX, -scaledY);
            } else {
              shape.lineTo(scaledX, -scaledY);
            }
          });
          this.lineararea.push({
            name: feature.properties.name,
            points: this.linear,
          });
          this.linear = [];
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
            new THREE.MeshMatcapMaterial({ matcap: tex, color: 0x1f3f91 }), //侧面
          ];
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
          group.name = feature.properties.name;
          group.GDP = feature.properties.GDP;
          this.clickObject.push(group);
        });
      });
    });
  }

  createLinear(heightMap) {
    const scale = 3;
    // const Lines = [];
    this.lineararea.forEach((area) => {
      const height = heightMap[area.name] * scale * 5;
      // 由于存在地图块Mesh设置材质属性开启倒角默认是增加高度0.2
      const points3D = area.points.map(
        (p) => new THREE.Vector3(p[0], -p[1], height + 0.2),
      );
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points3D);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
      // Lines.push(points3D);
      const topOutline = new THREE.LineLoop(lineGeometry, lineMaterial);
      this.linearMesh.push(topOutline);
    });
  }

  // 建立水滴定位针
  async createWaterPin(features, heightMap) {
    this.pins = [];
    const scale = 3;

    const tasks = features.map(async (feature) => {
      const centroid = feature?.properties?.centroid;
      if (!centroid) return;

      const height = (heightMap?.[feature.properties.name] ?? 0) * scale * 5;
      const projected = projection(centroid);
      if (!projected) return;
      const [x, y] = projected;

      const scaledX = (x - window.innerWidth / 2) * scale;
      const scaledY = (y - window.innerHeight / 2) * scale;

      const texture = await waterMapPin();
      if (!texture) return;
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      this.setScale(sprite, [
        sprite.scale.x,
        sprite.scale.y,
        sprite.scale.z * 1.8,
      ]);
      sprite.position.set(scaledX, -scaledY, height + sprite.scale.z);
      this.pins.push(sprite);
    });

    await Promise.all(tasks);
  }

  createFlySpots(features) {
    // 经纬度转
    const { flyLine, flySpot } = drawLineBetween2Spot(
      features[0].properties.centroid,
      features[features.length - 1].properties.centroid,
    );
    const group = new THREE.Group();
    group.add(flyLine);
    group.add(flySpot);

    this.flySpots.push(group);
  }

  // 建立文字
  createText(threeContainer, features, heightMap) {
    const scale = 3;
    console.log(features);
    features.forEach((feature) => {
      const text = textResource(
        threeContainer,
        this.labelRenderer,
        feature.properties.name,
      );
      const [x, y] = projection(feature.properties.centroid);
      const scaledX = (x - window.innerWidth / 2) * scale;
      const scaledY = (y - window.innerHeight / 2) * scale;
      const height = heightMap[feature.properties.name] * scale * 5;

      this.setPosition(text, [scaledX, -scaledY, height + text.scale.z]);
      this.texts.push(text);
    });
  }

  createBottom() {
    // 1. 创建一个巨大的镂空科技平面几何体 (比如 200x200)
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    // 2. 使用物理材质，调出“深色科技金属”的质感
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x051325, // 极深的科技蓝/藏青色
      side: THREE.DoubleSide,
      roughness: 0.1, // 粗糙度极低，让它像镜面或打蜡的地板
      metalness: 0.5, // 适度的金属感
      transparent: false, // 透明冲突
      opacity: 0.9, // 稍微带点透明度融入背景
    });
    // 3. 组合成网格模型
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);

    // 4. 接下来的旋转操作在加入scene之前
    this.floors.push(floor);
  }

  createRadar() {
    radarConfig.forEach((option) => {
      const radar = drawRadar(option, 0);
      this.radars.push(radar);
    });
  }

  // 增加场景
  addTOScene(obj) {
    // 加入相机
    this.scene.add(obj);
  }

  setRotation(mesh, [x, y, z]) {
    mesh.rotation.set(x, y, z);
  }

  setScale(mesh, [x, y, z]) {
    mesh.scale.set(x, y, z);
  }

  setPosition(mesh, [x, y, z]) {
    mesh.position.set(x, y, z);
  }

  // 更新
  animate(engine) {
    this.reqID = requestAnimationFrame(() => this.animate(engine));
    if (engine) {
      engine.renderer.render(engine.scene, engine.camera);
      engine.labelRenderer.render(engine.scene, engine.camera);
    }

    this.controls.update();
    // 1.  核心：必须先更新计时器，它才会去计算当前帧的时间
    this.timer.update();
    const delta = this.timer.getDelta();
    // console.log(delta);
    this.radars.forEach((mesh) => {
      // console.log(mesh);
      mesh.material.uniforms.uTime.value += delta;
    });

    this.flySpots.forEach((fly) => {
      // flySpot 是 drawflySpot 创建的 Mesh，它身上挂了 curve 与 _s
      const flySpot = fly.children.find(
        (child) => child?.curve && child?._s !== undefined,
      );
      if (!flySpot) return;

      flySpot._s += delta * 0.3;
      if (flySpot._s > 1) flySpot._s = 0;

      flySpot.position.copy(flySpot.curve.getPointAt(flySpot._s));
    });
  }

  // 销毁
  dispose() {
    // 停止循环渲染功能
    if (this.reqID) {
      cancelAnimationFrame(this.reqID);
      this.reqID = null;
      console.log("渲染循环已彻底停止");
    }

    // 如果需要，这里还可以释放 GPU 内存
    this.renderer.dispose();
    // 清理 CSS2D 渲染器
    if (this.labelRenderer && this.labelRenderer.domElement) {
      // 1. 如果它已经被挂载到了页面上，就把它连根拔起
      if (this.labelRenderer.domElement.parentNode) {
        this.labelRenderer.domElement.parentNode.removeChild(
          this.labelRenderer.domElement,
        );
      }
      // 2. （可选但推荐）把渲染器内部的元素强行清空
      this.labelRenderer.domElement.innerHTML = "";
    }
    // 1. 递归遍历场景里所有的物体
    this.scene.traverse((child) => {
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
    this.scene.clear();
  }
}

// // 4. 平面默认是竖着的，需要把它平放倒在地上,绕x轴转
// this.setRotation(floor, [-Math.PI / 2, 0, 0]);
// // 稍微往下沉一点，防止和你的模型底部重叠闪烁
// floor.position.y = -0.1;
