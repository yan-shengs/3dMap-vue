import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export class Controls {
  constructor(camera, renderer) {
    this.controls = new OrbitControls(camera, renderer.domElement)
  }
  init() {
    this.controls.enableDamping = true
    this.controls.dampingFactor = 1
    this.controls.enableZoom = true
    this.controls.minDistance = 30
    this.controls.maxDistance = 80
    this.controls.enableRotate = true
    this.controls.minPolarAngle = Math.PI / 6
    this.controls.maxPolarAngle = Math.PI / 2 - Math.PI / 6
    this.controls.enablePan = false
  }
  animate() {
    this.controls.update()
  }
}
