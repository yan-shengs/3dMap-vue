import * as THREE from "three";

// 常量
export const constant = {
  height: window.innerHeight,
  width: window.innerWidth,
};

// 引入数据文件
export const dataConfig = {
  // public下使用绝对路径
  海拔文件: "/data/elevation.json",
  GDP文件: "/data/GDP_ZJ.json",
  GEO省份地图文件: "/data/Province_ZJ.json",
  // 经度在前，纬度在后
  center: [120.12, 30.18], // 浙江省几何中心
};

// 雷达配置项
export const radarConfig = [
  {
    // position: {
    //   // 位置
    //   x: -100,
    //   y: 0,
    //   z: 0
    // },
    position: new THREE.Vector3(0, 0, 0),
    radius: 40, // 半径大小
    color: "#11298a", // 颜色
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
    position: new THREE.Vector3(0, 0, 0),
    radius: 37, // 半径大小
    color: "#7b80ac", // 颜色
    opacity: 0.5, // 颜色最深的地方的透明度
    angle: Math.PI * 2, // 扫描区域大小的弧度指
    speed: 2, // 旋转的速度
  },
];
