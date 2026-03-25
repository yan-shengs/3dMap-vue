import { ZJcenter } from '@/config/useMap.config'
import * as d3 from 'd3'

const processingGeo = (GEO) => {
  GEO.features.forEach((feature) => {
    const coordinates = feature.geometry.coordinates
    if (typeof coordinates[0][0][0] === 'number') {
      feature.geometry.coordinates = [coordinates]
    }
  })

  return GEO
}

const processingElevation = (ELE) => {
  const entries = Object.entries(ELE.data).map(([key, value]) => [key, Number(value)])
  const sum = entries.reduce((total, [, value]) => total + value, 0)

  return entries.reduce((acc, [key, value]) => {
    acc[key] = sum ? value / sum : 0
    return acc
  }, {})
}

export const processing = (GEO, GDP, ELE) => {
  const geo = processingGeo(GEO)
  const ele = processingElevation(ELE)

  geo.features.forEach((feature) => {
    feature.properties.GDP = GDP.features[feature.properties.name]
    feature.properties.ELE = ele[feature.properties.name]
  })

  console.log('地图加载数据完毕')
  return geo
}

const projection = d3
  .geoMercator()
  .center(ZJcenter)
  .scale(180)
  .translate([window.innerWidth / 2, window.innerHeight / 2])

export const lngLatToXY = (lngLat, scale = 5) => {
  const projected = projection(lngLat)
  if (!projected) {
    return [0, 0]
  }

  const [x, y] = projected
  const scaleX = (x - window.innerWidth / 2) * scale
  const scaleY = -(y - window.innerHeight / 2) * scale
  return [scaleX, scaleY]
}
