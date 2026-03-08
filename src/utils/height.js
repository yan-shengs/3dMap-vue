import heights from "../assets/height.json";

const data = {};
let sum = 0;
Object.entries(heights.data).forEach(([key, value]) => {
  sum += Number(value);
});

Object.entries(heights.data).forEach(([key, value]) => {
  data[key] = Number(value) / sum;
});

export default data;
