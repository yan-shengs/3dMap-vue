import * as THREE from "three";

// 坐标轴辅助工具
export function axes(scene) {
  const axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);
}

// 初始化网格
export function grid(scene) {
  const gridHelper = new THREE.GridHelper(
    100, // 网格大小
    100, // 分段数量
    0x888888, // 主线颜色
    0x444444, // 次线颜色
  );
  scene.add(gridHelper);
}
