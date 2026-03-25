import { JsonURLConfig } from '@/config/useMap.config'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { jsonLoader } from '@/utils/jsonLoader'
import * as THREE from 'three'

export class ResourceManager {
  constructor() {
    this.jsonResource = []
    this.MatcapURL = '/data/MatCap/matcap.png'
    this.HDRURL = '/data/HDR/umhlanga.hdr'
    this.svgURL = '/data/location.svg'
  }

  async init() {
    this.jsonResource = await Promise.all(
      JsonURLConfig.map(async (url) => {
        const data = await jsonLoader(url)
        const name = url.split('/').pop().split('.')[0]
        return {
          meta: name,
          data,
        }
      }),
    )

    const matcap = await this.matcapMatri()

    const hdr = await this.HDRAsync()
    const svg = await this.SVGloader()
    return [this.jsonResource, matcap, hdr, svg]
  }

  HDRAsync = async () => {
    // 异步加载hdr资源
    try {
      // 初始化HDR加载器
      const HDRloader = new HDRLoader()
      // 导入HDR路径

      const texture = await HDRloader.loadAsync(this.HDRURL, (xhr) => {
        if (xhr.total > 0) {
          // 计算百分比
          const percent = Math.floor((xhr.loaded / xhr.total) * 100)

          // 手动把数字塞进 HTML 里
          // progressText.innerText = percent;

          console.log(`当前进度: ${percent}%`)
        }
      })

      return texture
    } catch (error) {
      console.error('HDR 加载失败，请检查路径或网络', error)

      // 补救措施，增加自然光
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
      hemiLight.position.set(0, 200, 0) // 放到场景正上方
      return hemiLight
    }
  }

  matcapMatri = async () => {
    try {
      const textureLoader = new THREE.TextureLoader()
      const tex = await textureLoader.loadAsync(this.MatcapURL)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    } catch (error) {
      console.warn('matcap加载失败，请检查网络', error)
      return null
    }
  }

  SVGloader = async () => {
    // 使用TextureLoader加载SVG作为纹理
    const textureLoader = new THREE.TextureLoader()
    try {
      const texture = await textureLoader.loadAsync(this.svgURL)

      texture.generateMipmaps = false // 避免透明边缘mipmap污染

      return texture
    } catch (error) {
      console.error('加载地图定位点错误，请检查路径或网路', error)
    }
  }
}
