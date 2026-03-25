// 定义引擎类
import * as THREE from 'three'
import { useMap } from './map/UseMap'
import { Controls } from './watch/Controls'

export class Engine {
  // 数据初始化
  constructor(resource, renderer, labelRenderer, hdrTexture, svgtexture, threeContainer) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xd4e7fd)

    // 加载hdr
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping
    this.scene.environment = hdrTexture

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 45, 40)
    this.camera.lookAt(0, 0, 0)
    this.renderer = renderer
    this.labelRenderer = labelRenderer

    this.control = new Controls(this.camera, this.renderer.renderer)
    this.control.init()

    this.map = new useMap(resource, labelRenderer, svgtexture, threeContainer)

    this.reqID = null
  }

  // 定义初始化函数,实现地图创建等业务
  init(matcap) {
    this.scene.add(this.camera)

    this.map.init(matcap)

    const group = new THREE.Group()
    this.map.MapObjects.forEach((mesh) => {
      group.add(mesh)
    })

    group.rotation.x = -Math.PI / 2

    this.scene.add(group)
  }

  animate() {
    this.reqID = requestAnimationFrame(() => this.animate())

    // 开始渲染
    this.renderer.animate(this.scene, this.camera)
    this.labelRenderer.animate(this.scene, this.camera)
    this.control.animate()
    this.map.animate()
  }

  resize(width, height) {
    // 更新相机
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    // 更新渲染器，2d渲染器
    this.renderer.renderer.setSize(width, height)
    this.labelRenderer.labelRenderer.setSize(width, height)
    this.renderer.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  // 销毁函数
  dispose() {
    // 停止循环渲染功能
    if (this.reqID) {
      cancelAnimationFrame(this.reqID)
      this.reqID = null
      console.log('渲染循环已彻底停止')
    }

    // 如果需要，这里还可以释放 GPU 内存
    this.renderer.dispose()
    // 清理 CSS2D 渲染器
    if (this.labelRenderer && this.labelRenderer.labelRenderer.domElement) {
      // 1. 如果它已经被挂载到了页面上，就把它连根拔起
      if (this.labelRenderer.labelRenderer.domElement.parentNode) {
        this.labelRenderer.labelRenderer.domElement.parentNode.removeChild(
          this.labelRenderer.labelRenderer.domElement,
        )
      }
      // 2. （可选但推荐）把渲染器内部的元素强行清空
      this.labelRenderer.labelRenderer.domElement.innerHTML = ''
    }
    // 1. 递归遍历场景里所有的物体
    this.scene.traverse((child) => {
      // 2. 如果它是一个网格模型（Mesh）
      if (child.isMesh) {
        // 销毁几何体
        if (child.geometry) {
          child.geometry.dispose()
        }

        // 销毁材质
        if (child.material) {
          // 注意：有时候一个 Mesh 会贴多个材质（材质数组），需要遍历销毁
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose())
          } else {
            child.material.dispose()
          }
        }
      }
    })

    // 3. 等骨肉都清理干净了，最后再把这些“空壳”从场景里踢出去！
    this.scene.clear()
  }
}
