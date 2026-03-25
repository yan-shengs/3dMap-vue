import * as THREE from 'three'

// 创建XYZ辅助线
export const axes = (scene) => {
  const axesHelper = new THREE.AxesHelper(300)
  scene.add(axesHelper)
}

// 创建网格
export const grid = (scene) => {
  const gridHelper = new THREE.GridHelper(
    100, // 网格大小
    100, // 分段数量
    0x888888, // 主线颜色
    0x444444, // 次线颜色
  )
  scene.add(gridHelper)
}
