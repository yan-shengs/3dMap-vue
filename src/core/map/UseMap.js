import * as THREE from 'three'
import { lngLatToXY, processing } from '@/core/map/mapDataLoader'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { drawRadar } from '../radar'
import { radarConfig } from '@/config/useMap.config'

export class useMap {
  constructor(resource, labelRenderer, svgtexture, threeContainer) {
    const GEO = resource.jsonResource.find((item) => item.meta === 'GEO')?.data
    const GDP = resource.jsonResource.find((item) => item.meta === 'GDP')?.data
    const Elevation = resource.jsonResource.find((item) => item.meta === 'Elevation')?.data

    this.labelRenderer = labelRenderer
    this.threeContainer = threeContainer
    this.svgtexture = svgtexture
    this.MapData = processing(GEO, GDP, Elevation)

    this.timer = new THREE.Timer()

    this.boundaryRings = []
    this.clickMapObjects = []
    this.MapObjects = []

    this.flyObjects = []
    this.radars = []
  }

  init(matcap) {
    // 地图
    this.createMap(matcap)
    // 边界线
    this.createBoundary()
    // 基座
    this.createBottom()
    // 文字
    this.createText()
    // 水滴定位针
    this.createWaterPin(this.svgtexture)

    // 飞线
    this.createFlySpots()
    // 雷达
    this.createRadar()
  }

  createMap(matcap) {
    this.MapData.features.forEach((feature) => {
      const name = feature.properties.name
      const depth = feature.properties.ELE
      const gdp = feature.properties.GDP
      const multiPolygon = feature.geometry.coordinates

      multiPolygon.forEach((polygon) => {
        const shape = new THREE.Shape()

        // Inner rings are holes of the outer ring.
        polygon.slice(1).forEach((ring) => {
          this.createMeshHoles(shape, ring, name, depth)
        })

        this.createMesh(shape, polygon[0], name, depth, gdp, matcap)
      })
    })
  }

  buildSideMaterial(matcap) {
    if (matcap) {
      return new THREE.MeshMatcapMaterial({ matcap, color: 0x1f3f91 })
    }

    return new THREE.MeshStandardMaterial({
      color: 0x1f3f91,
      metalness: 0.7,
      roughness: 0.35,
    })
  }

  createMesh(shape, ring, name, depth, gdp, matcap, scale = 5) {
    const linePoints = []

    ring.forEach((lngLat, index) => {
      const [x, y] = lngLatToXY(lngLat, scale)
      if (index === 0) {
        shape.moveTo(x, y)
      } else {
        shape.lineTo(x, y)
      }
      linePoints.push([x, y])
    })

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: depth * scale * 5,
      bevelEnabled: true,
    })

    const material = [
      new THREE.MeshPhysicalMaterial({
        color: 0xa7b8f9,
        side: THREE.DoubleSide,
        transmission: 1,
        metalness: 0.1,
        ior: 1.5,
        thickness: 0.5,
        roughness: 0.8,
      }),
      this.buildSideMaterial(matcap),
    ]

    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = name
    mesh.GDP = gdp

    this.clickMapObjects.push(mesh)
    this.MapObjects.push(mesh)
    this.boundaryRings.push({
      name,
      depth,
      ringType: 'outer',
      points: linePoints,
    })
  }

  createMeshHoles(shape, ring, name, depth, scale = 5) {
    const hole = new THREE.Path()
    const linePoints = []

    ring.forEach((lngLat, index) => {
      const [x, y] = lngLatToXY(lngLat, scale)
      if (index === 0) {
        hole.moveTo(x, y)
      } else {
        hole.lineTo(x, y)
      }
      linePoints.push([x, y])
    })

    shape.holes.push(hole)
    this.boundaryRings.push({
      name,
      depth,
      ringType: 'hole',
      points: linePoints,
    })
  }

  createBoundary(scale = 5) {
    this.boundaryRings.forEach((ring) => {
      const height = ring.depth * scale * 5
      const points3D = ring.points.map((p) => new THREE.Vector3(p[0], p[1], height + 0.2))
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points3D)
      const lineMaterial = new THREE.LineBasicMaterial({
        color: ring.ringType === 'hole' ? 0x9fb6ff : 0xffffff,
      })
      const topOutline = new THREE.LineLoop(lineGeometry, lineMaterial)
      this.MapObjects.push(topOutline)
    })
  }

  createBottom() {
    // 1. 创建一个巨大的镂空科技平面几何体 (比如 200x200)
    const floorGeometry = new THREE.PlaneGeometry(200, 200)
    // 2. 使用物理材质，调出“深色科技金属”的质感
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x051325, // 极深的科技蓝/藏青色
      side: THREE.DoubleSide,
      roughness: 0.1, // 粗糙度极低，让它像镜面或打蜡的地板
      metalness: 0.5, // 适度的金属感
      transparent: false, // 透明冲突
      opacity: 0.9, // 稍微带点透明度融入背景
    })
    // 3. 组合成网格模型
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)

    // 4. 接下来的旋转操作在加入scene之前
    this.MapObjects.push(floor)
  }

  // 建立文字
  createText(scale = 5) {
    this.MapData.features.forEach((feature) => {
      // 建立2D画布
      const text = this.textResource(this.labelRenderer, feature.properties.name)
      const [x, y] = lngLatToXY(feature.properties.centroid, scale)
      const z = feature.properties.ELE * scale * 5

      text.position.set(x, y, z + text.scale.z)
      this.MapObjects.push(text)
      // console.log('渲染文字')
    })
  }

  textResource(labelRenderer, name) {
    // 挂载到threeContainer，div元素下
    this.threeContainer.appendChild(labelRenderer.labelRenderer.domElement)
    // --- 2. 创建 HTML 元素并包装 ---
    const div = document.createElement('div')
    div.className = 'label'
    div.textContent = '核心组件'
    // div.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    div.style.color = '#B27860'
    div.style.padding = '5px 10px'
    div.style.borderRadius = '4px'
    // 增加文字
    div.textContent = name
    div.style.font = '24px STHeiti'

    const labelObject = new CSS2DObject(div)
    // labelObject.position.set(position[0], -position[2], position[1]); // 相对于父物体的位置

    return labelObject
  }

  async createWaterPin(svgtexture, scale = 5) {
    this.MapData.features.forEach((feature) => {
      const centroid = feature?.properties?.centroid
      if (!centroid) return
      const z = (feature?.properties?.ELE ?? 0) * scale * 5
      const [x, y] = lngLatToXY(centroid, scale)

      if (!svgtexture) return
      const spriteMaterial = new THREE.SpriteMaterial({ map: svgtexture, color: 0x6b4ed4 })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.set(x, y, sprite.scale.z + z + 0.1)
      // 注意这个顺序是固定的scale增倍一定在设置位置之后，否则定位针会凌空
      sprite.scale.set(sprite.scale.x * 2, sprite.scale.y * 2, sprite.scale.z)

      this.MapObjects.push(sprite)
    })
  }

  createFlySpots() {
    // 经纬度转
    const { flyLine, flySpot } = this.drawLineBetween2Spot(
      // 这里固定杭州和丽水
      this.MapData.features[0].properties.centroid,
      this.MapData.features[this.MapData.features.length - 1].properties.centroid,
    )

    this.flyObjects.push([flyLine, flySpot])

    this.MapObjects.push(flyLine)
    this.MapObjects.push(flySpot)
  }

  drawLineBetween2Spot = (coordStart, coordEnd, scale = 5) => {
    let [x0, y0] = lngLatToXY([...coordStart])
    let [x1, y1] = lngLatToXY([...coordEnd])
    const z0 = (this.MapData.features[0]?.properties?.ELE ?? 0) * scale * 5
    const z1 =
      (this.MapData.features[this.MapData.features.length - 1]?.properties?.ELE ?? 0) * scale * 5

    // 使用 QuadraticBezierCurve3 创建 三维二次贝塞尔曲线
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(x0, y0, z0),
      new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, 20),
      new THREE.Vector3(x1, y1, z1),
    )

    const flySpot = this.drawflySpot(curve)

    const lineGeometry = new THREE.BufferGeometry()
    // 获取曲线上50个点
    const points = curve.getPoints(50)
    const positions = []
    const colors = []
    const color = new THREE.Color()

    // 给每个顶点设置演示 实现渐变
    for (let j = 0; j < points.length; j++) {
      color.setHSL(0.21 + j, 0.77, 0.55 + j * 0.0025) // 色
      colors.push(color.r, color.g, color.b)
      positions.push(points[j].x, points[j].y, points[j].z)
    }
    // 放入顶点 和 设置顶点颜色
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3, true),
    )
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3, true))

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      // color: "red",
      side: THREE.DoubleSide,
    })
    const flyLine = new THREE.Line(lineGeometry, material)

    return { flyLine, flySpot }
  }
  drawflySpot = (curve) => {
    const aGeo = new THREE.SphereGeometry(0.4)
    const aMater = new THREE.MeshBasicMaterial({
      color: '#55a555',
      side: THREE.DoubleSide,
    })
    const aMesh = new THREE.Mesh(aGeo, aMater)
    // 保存曲线实例
    aMesh.curve = curve
    aMesh._s = 0
    return aMesh
  }

  createRadar() {
    radarConfig.forEach((option) => {
      const radar = drawRadar(option, 0)
      this.radars.push(radar)
      this.MapObjects.push(radar)
    })
  }

  animate() {
    this.timer.update()
    const delta = this.timer.getDelta()

    this.flyObjects.forEach(([flyLine, flySpot]) => {
      // flySpot 是 drawflySpot 创建的 Mesh，它身上挂了 curve 与 _s

      if (!flySpot) return

      flySpot._s += delta * 0.3
      if (flySpot._s > 1) flySpot._s = 0

      flySpot.position.copy(flySpot.curve.getPointAt(flySpot._s))
    })

    this.radars.forEach((mesh) => {
      // console.log(mesh);
      mesh.material.uniforms.uTime.value += delta
    })
  }
}
