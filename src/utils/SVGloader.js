import * as THREE from "three";

const SVGloader = (position) => {
  // 创建一个容器Group，立即返回
  const container = new THREE.Group();

  // 使用TextureLoader加载SVG作为纹理
  const textureLoader = new THREE.TextureLoader();
  const svgURL = new URL("../assets/location.svg", import.meta.url).href;

  textureLoader.load(svgURL, function (texture) {
    // 创建Sprite材质
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      sizeAttenuation: false, // 设置为false使图标大小不随距离变化
    });

    // 创建Sprite
    const sprite = new THREE.Sprite(spriteMaterial);

    // 设置Sprite大小（调整这个值来改变图标大小）
    sprite.scale.set(0.05, 0.05, 1);

    // 设置位置
    sprite.position.set(position[0], 2.1, position[1]);

    console.log("Sprite位置:", sprite.position);

    // 添加到容器中
    container.add(sprite);
  });

  // 立即返回容器，Sprite会异步加载后添加进去
  return container;
};

export default SVGloader;
