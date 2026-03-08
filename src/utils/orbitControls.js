import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// 导入一次后既不用导入，则camer不需要导入

const controls = (camera, renderer) => {
  const control = new OrbitControls(camera, renderer.domElement);
  // 启用阻尼（推荐）
  control.enableDamping = true;

  // 阻尼系数
  control.dampingFactor = 1;

  // 是否可以缩放
  control.enableZoom = true;
  control.minDistance = 30; // 最小缩放距离
  control.maxDistance = 80; // 最大缩放距离

  // 是否可以旋转
  control.enableRotate = true;
  control.minPolarAngle = Math.PI / 6; // 最小角度
  control.maxPolarAngle = Math.PI / 2 - Math.PI / 6; // 最大角度

  // 是否可以平移
  control.enablePan = false;

  return control;
};

export default controls;
