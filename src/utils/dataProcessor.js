import * as d3 from "d3";
import { dataConfig, constant } from "../constant/Config";

// 读取json文件
export async function readJson(url) {
  try {
    const resultObj = await fetch(url);
    const json = await resultObj.json();
    return json;
  } catch (error) {
    console.error("网络错误或路径错误", error);
    return null;
  }
}

// 解析Json文件,除了Promise对象
export const GEO = await readJson(dataConfig.GEO省份地图文件);
export const GDP = await readJson(dataConfig.GDP文件);
export const EVL = await readJson(dataConfig.海拔文件);

// 建立经纬度和二维坐标系的映射
export const projection = d3
  .geoMercator()
  .center(dataConfig.center)
  .scale(180)
  .translate([constant.width / 2, constant.height / 2]);

// 处理GEO文件
export const checkProcessing = (GEO, GDP, ElV) => {
  // 处理海拔、GDP数据
  const features = GEO.features;
  features.forEach((feature) => {
    const mapName = feature.properties.name;
    feature.properties.elevation = ElV.data[mapName];
    feature.properties.GDP = GDP.features[mapName];
  });

  // 处理同一 GeoJSON 文件混用 Polygon 和 MultiPolygon 是高频问题
  // Polygon三层嵌套，MultiPoly四层嵌套
  // 渲染的对象是point，因此推荐转四层
  features.forEach((feature) => {
    const geometry = feature.geometry;
    const coordinates = geometry.coordinates;
    // 更好的逻辑应该是通过判断type是Polygon还是MultiPolygon
    // 这里的逻辑是判断三层是否为点数组，否则叠加一层
    const area = coordinates[0][0][0];
    if (typeof area === "number") {
      geometry.coordinates = [coordinates];
      geometry.type = "MultiPolygon";
    }
  });

  return GEO;
};

// 归一化海拔，有利于后续地图高度处理
export function elevationSort(ElV) {
  const data = ElV.data;
  const key = Object.keys(data);
  const value = Object.values(data);
  const len = value.length;
  const dataSort = {};
  let sum = 0;
  // 累加GDP
  for (let i = 0; i < len; i++) {
    sum += Number(value[i]);
  }

  value.forEach((v, i) => {
    dataSort[key[i]] = Number(v) / sum;
  });

  // 当然，这里使用Object.entries()也行

  return dataSort;
}

// 这里没有太负责没必要定义成函数
