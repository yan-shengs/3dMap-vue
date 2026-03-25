import * as THREE from 'three'
const baseJsonUrl = '/data/JSON/'

export const JsonURLConfig = ['Elevation.json', 'GDP.json', 'GEO.json'].map(
  (item) => baseJsonUrl + item,
)

// 浙江几何中心，经度在前，纬度在后
export const ZJcenter = [120.44, 29.05]

export const radarConfig = [
  {
    // position: {
    //   // 位置
    //   x: -100,
    //   y: 0,
    //   z: 0
    // },
    // 注意太高0.2高度防止和底座重叠导致视觉闪烁消失
    position: new THREE.Vector3(0, 0, 0.2),
    radius: 70, // 半径大小
    color: '#11298a', // 颜色
    opacity: 0.3, // 颜色最深的地方的透明度
    angle: Math.PI * 2, // 扫描区域大小的弧度指
    speed: 2, // 旋转的速度
  },
  {
    // position: {
    //   x: 100,
    //   y: 0,
    //   z: 10
    // },
    position: new THREE.Vector3(0, 0, 0.2),
    radius: 50, // 半径大小
    color: '#7b80ac', // 颜色
    opacity: 0.5, // 颜色最深的地方的透明度
    angle: Math.PI * 2, // 扫描区域大小的弧度指
    speed: 2, // 旋转的速度
  },
]
