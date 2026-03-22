import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import * as THREE from "three";
import { projection } from "./dataProcessor";

// 固定常量 - 顶部 - 易修改
// const HDRURL = new URL("../assets/hdr/umhlanga.hdr", import.meta.url).href;
const HDRURL = "/data/hdr/umhlanga.hdr";

// const MatcapURL = new URL(
//   "../assets/777D7D_BDCAD2_3E3C2E_B1B8B6-512px.png",
//   import.meta.url,
// ).href;
const MatcapURL = "/data/matcap.png";

// 水滴地图定位点
// const svgURL = new URL("../assets/location.svg", import.meta.url).href;
const svgURL = "/data/location.svg";

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

export async function waterMapPin() {
  // 使用TextureLoader加载SVG作为纹理
  const textureLoader = new THREE.TextureLoader();
  try {
    const texture = await textureLoader.loadAsync(svgURL);

    texture.generateMipmaps = false; // 避免透明边缘mipmap污染

    return texture;
  } catch (error) {
    console.error("加载地图定位点错误，请检查路径或网路", error);
  }
}

// 文字资源要么使用textCreator函数,要么使用textResource - CSS2DObject

export function textResource(threeContainer, labelRenderer, name) {
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
  // labelObject.position.set(position[0], -position[2], position[1]); // 相对于父物体的位置

  return labelObject;
}

export const drawLineBetween2Spot = (coordStart, coordEnd) => {
  let [x0, y0] = projection([...coordStart]);
  let [x1, y1] = projection([...coordEnd]);

  x0 = (x0 - window.innerWidth / 2) * 3;
  y0 = (y0 - window.innerHeight / 2) * 3;
  x1 = (x1 - window.innerWidth / 2) * 3;
  y1 = (y1 - window.innerHeight / 2) * 3;

  const [z0, z1] = [2, 2];
  // 使用 QuadraticBezierCurve3 创建 三维二次贝塞尔曲线
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x0, -y0, z0),
    new THREE.Vector3((x0 + x1) / 2, -(y0 + y1) / 2, 20),
    new THREE.Vector3(x1, -y1, z1),
  );

  const flySpot = drawflySpot(curve);

  const lineGeometry = new THREE.BufferGeometry();
  // 获取曲线上50个点
  const points = curve.getPoints(50);
  const positions = [];
  const colors = [];
  const color = new THREE.Color();

  // 给每个顶点设置演示 实现渐变
  for (let j = 0; j < points.length; j++) {
    color.setHSL(0.21 + j, 0.77, 0.55 + j * 0.0025); // 色
    colors.push(color.r, color.g, color.b);
    positions.push(points[j].x, points[j].y, points[j].z);
  }
  // 放入顶点 和 设置顶点颜色
  lineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3, true),
  );
  lineGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(colors), 3, true),
  );

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    // color: "red",
    side: THREE.DoubleSide,
  });
  const flyLine = new THREE.Line(lineGeometry, material);

  return { flyLine, flySpot };
};

export const drawflySpot = (curve) => {
  const aGeo = new THREE.SphereGeometry(0.4);
  const aMater = new THREE.MeshBasicMaterial({
    color: "#55a555",
    side: THREE.DoubleSide,
  });
  const aMesh = new THREE.Mesh(aGeo, aMater);
  // 保存曲线实例
  aMesh.curve = curve;
  aMesh._s = 0;
  return aMesh;
};
