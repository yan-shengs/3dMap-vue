const processing = (geoJson, mapValue) => {
  // 处理geoJson格式文件
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

export default processing;
