import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// 导入一次后既不用导入，则camer不需要导入

const controls = (camera, renderer) => {
  const control = new OrbitControls(camera, renderer.domElement);
  // 启用阻尼（推荐）
  controls.enableDamping = true;

  // 阻尼系数
  controls.dampingFactor = 0.05;

  // 是否可以缩放
  controls.enableZoom = true;

  // 是否可以旋转
  controls.enableRotate = false;

  // 是否可以平移
  controls.enablePan = true;

  return control;
};

export default controls;
