import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const loaders = (scene) => {
  const loader = new RGBELoader();

  // 不要直接使用loader.load(hdrURL, (texture)=>{})
  // 使用Vite的方式导入静态资源
  const hdrUrl = new URL(
    "../assets/hdr/umhlanga_sunrise_1k.hdr",
    import.meta.url,
  ).href;

  loader.load(hdrUrl, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    // scene.background = texture;
  });
};

export default loaders;
