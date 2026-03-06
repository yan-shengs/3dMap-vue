import * as THREE from "three";

// 创建网格
const gridHelper = new THREE.GridHelper(
  100, // 网格大小
  100, // 分段数量
  0x888888, // 主线颜色
  0x444444, // 次线颜色
);

export default gridHelper;
