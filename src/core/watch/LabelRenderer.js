import { CSS2DRenderer } from 'three/examples/jsm/Addons.js'

export class LabelRenderer {
  constructor() {
    this.labelRenderer = new CSS2DRenderer()
  }

  init() {
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight)
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0px'
    this.labelRenderer.domElement.style.pointerEvents = 'none'
  }

  animate(scene, camera) {
    this.labelRenderer.render(scene, camera)
  }

  dispose() {
    this.renderer.dispose()
  }
}
