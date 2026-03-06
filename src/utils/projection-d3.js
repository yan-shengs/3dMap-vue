import * as d3 from "d3";

const width = window.innerWidth;
const height = window.innerHeight;
// 经度在前，纬度在后
const center = [120.12, 30.18];

const projection = d3
  .geoMercator()
  .center(center)
  .scale(180)
  .translate([width / 2, height / 2]);

export default projection;
