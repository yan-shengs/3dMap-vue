import * as THREE from 'three'

export class Renderer {
  constructor() {
    this.renderer = new THREE.WebGLRenderer()
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
  }

  animate(scene, camera) {
    this.renderer.render(scene, camera)
  }

  dispose() {
    this.renderer.dispose()
  }
}
