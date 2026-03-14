import * as THREE from "three";

export function createTextSprite(text, centerid) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // 设置canvas尺寸
  canvas.width = 256;
  canvas.height = 128;

  // 设置字体样式
  context.font = "bold 24px STHeiti";
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // 在canvas中心绘制文本
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    color: 0xc89775,
    map: texture,
  });

  const sprite = new THREE.Sprite(material);

  // 调整精灵大小
  sprite.scale.set(10 * 0.8, 5 * 0.8, 1 * 0.8);

  // 设置位置（centerid需要经过projection转换）
  sprite.position.set(centerid[0], 2.6 || centerid[1], centerid[2] || 1);

  return sprite;
}
