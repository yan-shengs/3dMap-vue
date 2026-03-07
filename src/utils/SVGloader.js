import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

const SVGloader = (scene, position) => {
  const loader = new SVGLoader();

  const svgURL = new URL("../assets/location.svg", import.meta.url).href;

  loader.load(svgURL, function (data) {
    console.log("✅ SVG加载成功", data);
    const paths = data.paths;

    // 创建一个Group来组合所有SVG路径
    const svgGroup = new THREE.Group();

    paths.forEach((path) => {
      const shapes = SVGLoader.createShapes(path);

      shapes.forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.5,
          bevelEnabled: false,
        });

        const material = new THREE.MeshBasicMaterial({
          color: path.color || 0xff0000,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        svgGroup.add(mesh);
      });
    });

    // SVG坐标系调整：缩放、旋转、定位
    svgGroup.scale.set(0.02, -0.02, 0.02); // 再增大缩放
    svgGroup.rotation.x = -Math.PI / 2;
    svgGroup.rotation.y = Math.PI / 2;
    svgGroup.rotation.z = Math.PI / 2;

    // 设置位置（y轴提高，确保在地图上方可见）
    svgGroup.position.set(position[0], 1, position[1]);

    console.log("SVG位置:", svgGroup.position);
    console.log("SVG子对象数量:", svgGroup.children.length);

    scene.add(svgGroup);
  });
};

export default SVGloader;
