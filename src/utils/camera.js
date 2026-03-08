import * as THREE from "three";
// 1. 创建摄像头
const camera = new THREE.PerspectiveCamera(
  75, // fov 视野角度
  window.innerWidth / window.innerHeight, // aspect 宽高比
  0.1, // near 最近可见距离
  1000, // far 最远可见距离
);

// 2. 设置摄像头位置
camera.position.set(10, 30, 40);

// 3. 让摄像头看向场景中心（可选）
camera.lookAt(0, 0, 0);

export default camera;
