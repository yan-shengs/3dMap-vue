import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { MeshBasicNodeMaterial } from "three/webgpu";
import * as THREE from "three";

// 固定常量 - 顶部 - 易修改
const HDRURL = new URL("../assets/hdr/umhlanga_sunrise_1k.hdr", import.meta.url)
  .href;

const MatcapURL = new URL(
  "../assets/777D7D_BDCAD2_3E3C2E_B1B8B6-512px.png",
  import.meta.url,
).href;

// 水滴地图定位点
const svgURL = new URL("../assets/location.svg", import.meta.url).href;

export async function HDRAsync(scene) {
  // 异步加载hdr资源
  try {
    // 初始化HDR加载器
    const HDRloader = new HDRLoader();
    // 导入HDR路径

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
}

// 异步加载matcap的资源
export const matcapMatri = async () => {
  try {
    const textureLoader = new THREE.TextureLoader();
    const tex = await textureLoader.loadAsync(MatcapURL);
    tex.colorSpace = THREE.SRGBColorSpace;

    return tex;
  } catch (error) {
    console.log("matcap资源加载失败，请检查路径或网络", error);

    // Matcap 加载失败，切换至标准 PBR 材质补救
    // 补救：创建一个具有金属感的标准材质
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: 0x3169dc, // 基础蓝色
      metalness: 1.0, // 全金属
      roughness: 0.1, // 比较光滑，能反射 HDR 环境
    });

    // 如果 HDR 加载成功了，这个材质会自动反射 HDR 的光影，视觉效果不亚于 Matcap
    return fallbackMaterial;
  }
};

export async function loadResource(scene) {
  // 初始化HDR资源
  await HDRAsync(scene);

  // 初始化Matcap资源
  const tex = await matcapMatri();

  return tex;
}

export async function waterMapPin(scene, position) {
  // 使用TextureLoader加载SVG作为纹理
  const textureLoader = new THREE.TextureLoader();
  try {
    const texture = await textureLoader.loadAsync(svgURL);

    texture.generateMipmaps = false; // 避免透明边缘mipmap污染

    // 创建Sprite材质
    const spriteMaterial = new THREE.SpriteMaterial({
      color: 0xd7e6fc,
      map: texture, //加载svg图片
      transparent: true,
      depthTest: false, // 透明物体通常关闭
      sizeAttenuation: false, // 设置为false使图标大小不随距离变化
    });

    // 创建Sprite
    const sprite = new THREE.Sprite(spriteMaterial);

    // 设置Sprite大小（调整这个值来改变图标大小）
    sprite.scale.set(0.08, 0.08, 1);

    // 这里设置Mesh地图为x z轴，因此sprite跟着一起设置
    sprite.position.set(position[0], -position[2], position[1]);

    scene.add(sprite);
  } catch (error) {
    console.error("加载地图定位点错误，请检查路径或网路", error);
  }
}

// 文字资源要么使用textCreator函数,要么使用textResource - CSS2DObject

// --- 1. 初始化 CSS2D 渲染器 ---
export const Render2D = () => {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  labelRenderer.domElement.style.pointerEvents = "none"; // 关键：防止遮挡 WebGL 的点击事件
  return labelRenderer;
};

export function textResource(
  threeContainer,
  labelRenderer,
  name,
  mapMesh,
  position,
) {
  // 挂载到threeContainer，div元素下
  threeContainer.appendChild(labelRenderer.domElement);
  // --- 2. 创建 HTML 元素并包装 ---
  const div = document.createElement("div");
  div.className = "label";
  div.textContent = "核心组件";
  // div.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  div.style.color = "#B27860";
  div.style.padding = "5px 10px";
  div.style.borderRadius = "4px";
  // 增加文字
  div.textContent = name;
  div.style.font = "24px STHeiti";

  const labelObject = new CSS2DObject(div);
  labelObject.position.set(position[0], -position[2], position[1]); // 相对于父物体的位置

  mapMesh.add(labelObject);

  return;
}
