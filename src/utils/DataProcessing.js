import * as d3 from "d3";

const width = window.innerWidth;
const height = window.innerHeight;
// 经度在前，纬度在后
const center = [120.12, 30.18]; // 浙江省几何中心的经纬度
// 建立经纬度和二维坐标系的映射
export const projection = d3
  .geoMercator()
  .center(center)
  .scale(180)
  .translate([width / 2, height / 2]);

// 处理geoJson格式文件
export const checkGeoJsonProcessing = (geoJson, mapValue) => {
  geoJson.features.forEach((feature) => {
    if (feature.geometry.coordinates[0][0][0] === "number") {
      const featureFixed = [feature.geometry.coordinates[0][0]];
      feature.geometry.coordinates[0] = featureFixed;
    }
  });

  // 合并geoJson数据和mapValue数据
  geoJson.features.forEach((feature) => {
    const gdp = mapValue.features[feature.properties.name];
    feature.properties.gdpValue = gdp;
  });
  return geoJson;
};
