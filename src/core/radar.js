import * as THREE from 'three'

// 顶点着色器
const vertexShader = `
// 声明 vUv，传递给片段着色器
varying vec2 vUv;

varying vec2 vPosition;
void main () {
    // Three.js 内部自带了 uv 属性，我们直接拿来用
    vUv = uv;
    // 固定写法
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const fragmentShader = `
  precision highp float;
  
  // 1. 接收顶点着色器传来的 UV 坐标 (非常关键)
  varying vec2 vUv;

  // 2. 这里的名字必须和 JS 中 uniforms 传的名字一模一样！
  uniform float uTime;      // 对应 JS 里的 uTime
  uniform float u_speed;    // 对应 JS 里的 u_speed
  uniform float u_opacity;  // 对应 JS 里的 u_opacity
  uniform vec3 u_color;     // 对应 JS 里的 u_color

  // 靠谱的随机哈希函数，用来生成星辰
  float hash(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    // 3. 将 vUv (范围 0.0~1.0) 映射到 (-1.0~1.0)，把坐标原点放到正方形中心点
    // 这样就不需要 u_resolution 和 gl_FragCoord 了
    vec2 uv = vUv * 2.0 - 1.0;
    
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    float tightness = 5.0;  // 漩涡的卷曲度
    
    // 4. 使用传入的 uTime 和 u_speed 结合计算旋转
    float spiral = a + (r * tightness) - (uTime * u_speed * 1.5);
    
    // 生成带长拖尾的扫描波形 (0.0 到 1.0)
    float phase = fract(spiral / 6.2831853);
    float beam = pow(phase, 12.0); // 指数越高，头部越亮，拖尾越长且自然

    // 生成空间坐标的网格，用来放置星星
    vec2 starGrid = floor(uv * 120.0);
    float starHash = hash(starGrid);
    
    // 只有随机值极高的点才会变成星星
    float sparkles = smoothstep(0.96, 1.0, starHash);
    
    // 让星辰闪烁 (结合时间 uTime、位置和波形)
    sparkles *= sin(uTime * 8.0 + starHash * 100.0) * 0.5 + 0.5;
    
    // 核心特效：星星被漩涡“扫过”时会被彻底点亮
    float stardust = sparkles * beam * 4.0;

    // 内圈使用你传入的颜色 u_color，外圈是神秘的紫色
    vec3 colorStart = u_color; 
    vec3 colorEnd   = vec3(0.7, 0.1, 0.9); // 星云紫
    vec3 baseColor  = mix(colorStart, colorEnd, r); 
    
    // 漩涡本体的柔和发光
    vec3 beamGlow = baseColor * beam * 0.9;
    
    // 星辰尘埃的耀眼高光 (偏向纯白/微蓝)
    vec3 dustColor = vec3(0.9, 0.95, 1.0) * stardust;
    
    // 背景的微弱暗星
    float bgStars = smoothstep(0.99, 1.0, hash(floor(uv * 80.0))) * 0.15;
    
    // 融合颜色
    vec3 finalColor = beamGlow + dustColor + vec3(bgStars);

    // 5. 【非常重要】画圆遮罩！把 PlaneGeometry 这个正方形的四个角变成透明的
    float circleMask = smoothstep(1.0, 0.95, r);
    finalColor *= circleMask;
    
    // 让漩涡在边缘平滑地消散隐入黑暗
    finalColor *= smoothstep(1.3, 0.4, r);

    // 6. 输出最终颜色，并带上透明度 (结合遮罩和 JS 传进来的 u_opacity)
    gl_FragColor = vec4(finalColor, circleMask * u_opacity);
  }
`

export function drawRadar(options, ratio) {
  const { position, radius, color, opacity, speed, angle } = options
  const size = radius * 2
  const plane = new THREE.PlaneGeometry(size, size)

  const material = new THREE.ShaderMaterial({
    transparent: true, // 必须开启，否则无法显示透明边缘
    depthWrite: false, // 解决多个透明物体叠加时的遮挡闪烁问题
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: ratio },
      u_radius: { value: radius },
      u_speed: { value: speed || 1.0 }, // 给个默认值防止没传
      u_opacity: { value: opacity || 1.0 },
      u_width: { value: angle },
      u_color: { value: new THREE.Color(color || 0x0099ff) }, // 转为 Three 的 Color 对象
    },
    vertexShader,
    fragmentShader,
  })

  const planeMesh = new THREE.Mesh(plane, material)
  planeMesh.position.copy(position)

  return planeMesh
}
