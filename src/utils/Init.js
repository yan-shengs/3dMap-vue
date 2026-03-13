import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

// 初始化函数
const initThree = async () => {
  // 初始化相机
  const camera = new THREE.PerspectiveCamera(
    75, // fov 视野角度 一般60,75
    window.innerWidth / window.innerHeight, // aspect 宽高比
    0.1, // near 最近可见距离
    1000, // far 最远可见距离
  );
  // 设置摄像头位置
  camera.position.set(10, 30, 40);
  // 让摄像头看向场景中心,默认看向0,0,0
  camera.lookAt(0, 0, 0);

  // 初始化渲染器
  const renderer = new THREE.WebGLRenderer();
  // 设置渲染器大小
  renderer.setSize(window.innerWidth, window.innerHeight);
  /* 相机和渲染器的关系为
     相机拍摄图片放入渲染器呈现给浏览器
  */

  // 初始化网格
  const gridHelper = new THREE.GridHelper(
    100, // 网格大小
    100, // 分段数量
    0x888888, // 主线颜色
    0x444444, // 次线颜色
  );

  // 初始化控制器
  /* 用于监听renderer渲染器生成的canvas元素 */
  const controls = new OrbitControls(camera, renderer.domElement);
  // 启用阻尼（推荐）
  controls.enableDamping = true;

  // 阻尼系数
  controls.dampingFactor = 1;

  // 是否可以缩放
  controls.enableZoom = true;
  controls.minDistance = 30; // 最小缩放距离
  controls.maxDistance = 80; // 最大缩放距离

  // 是否可以旋转
  controls.enableRotate = true;
  controls.minPolarAngle = Math.PI / 6; // 最小角度
  controls.maxPolarAngle = Math.PI / 2 - Math.PI / 6; // 最大角度

  // 是否可以平移
  controls.enablePan = false;

  // 初始化场景,类比一下摄影棚
  const scene = new THREE.Scene();
  // 修改背景颜色
  scene.background = new THREE.Color(0xd4e7fd);

  // 加入相机
  scene.add(camera);
  // 加入网格
  scene.add(gridHelper);
  try {
    // 初始化HDR加载器
    const HDRloader = new HDRLoader();
    // 导入HDR路径
    const HDRURL = new URL(
      "../assets/hdr/umhlanga_sunrise_1k.hdr",
      import.meta.url,
    ).href;
    const texture = await HDRloader.loadAsync(HDRURL, (xhr) => {
      if (xhr.total > 0) {
        // 计算百分比
        const percent = Math.floor((xhr.loaded / xhr.total) * 100);

        // 手动把数字塞进 HTML 里
        // progressText.innerText = percent;

        console.log(`当前进度: ${percent}%`);
      }
    });

    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  } catch (error) {
    console.error("HDR 加载失败，请检查路径或网络", error);

    // 补救措施，增加自然光
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0); // 放到场景正上方
    scene.add(hemiLight);
  }

  return { scene, camera, renderer, controls };
};

export default initThree;
