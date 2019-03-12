const STROKE_WIDTH = 3;
const STROKE_LINECAP = 'square';
const STROKE_LINEJOIN = 'round';
const PATH_ACСURACY = 2; // digits after the decimal point
const MS_IN_DAY = 1000 * 60 * 60 * 24;
const app = document.getElementById('chart-app');

const chartWidth = window.innerWidth;
const chartHeight = 108;
const zoomChartHeight = 200;

createChart(chart_data[0]);

function createChart(chartData) {
  const { columns, types, names, colors } = chartData;

  let chart = {
    x: null,
    y: [],
  };

  for (const key in types) {
    if (types.hasOwnProperty(key)) {
      const type = types[key];
      switch (type) {
        case 'x':
          chart.x = getColumnByKey(columns, key);
          break;
        case 'line':
          chart.y.push({
            key,
            data: getColumnByKey(columns, key),
            color: colors[key],
            name: names[key],
          });
          break;
      }
    }
  }

  const chartWrapperEl = createElement('section');
  const chartSvg = createElementNS('svg');
  chartSvg.setAttribute('width', chartWidth);
  chartSvg.setAttribute('height', chartHeight);
  chartSvg.setAttribute('viewBox', [0, 0, chartWidth, chartHeight].join(' '));
  chartSvg.setAttribute('fill', 'none');

  const zoomChartSvg = createElementNS('svg');
  zoomChartSvg.setAttribute('width', chartWidth);
  zoomChartSvg.setAttribute('height', zoomChartHeight);
  zoomChartSvg.setAttribute('viewBox', [0, 0, chartWidth, chartHeight].join(' '));
  zoomChartSvg.setAttribute('fill', 'none');

  const allY = [].concat(...chart.y.map(line => line.data));
  const maxY = Math.max(...allY);

  chart.y.forEach(line => {
    const path = createElementNS('path');
    path.setAttribute('stroke', line.color);
    path.setAttribute('stroke-width', STROKE_WIDTH);
    path.setAttribute('stroke-linecap', STROKE_LINECAP);
    path.setAttribute('stroke-linejoin', STROKE_LINEJOIN);
    const { data } = line;
    let d = '';
    for (let i = 0; i < data.length; i++) {
      const x = ((i / (data.length - 1)) * (chartWidth - STROKE_WIDTH) + STROKE_WIDTH / 2).toFixed(PATH_ACСURACY);
      const y = (((maxY - data[i]) / maxY) * (chartHeight - STROKE_WIDTH) + STROKE_WIDTH / 2).toFixed(PATH_ACСURACY);
      if (i === 0) {
        d += `M${x} ${y}`;
      } else {
        d += `L${x} ${y}`;
      }
    }
    path.setAttribute('d', d);
    chartSvg.appendChild(path);
  });

  chartWrapperEl.appendChild(chartSvg);
  app.appendChild(chartWrapperEl);
}

/* UTILS */
function getColumnByKey(columns, key) {
  let result;
  columns.forEach(column => {
    if (column[0] === key) {
      result = column.slice(1);
    }
  });
  return result;
}

function createElement(tagName) {
  return document.createElement(tagName);
}

function createElementNS(tagName) {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

/* TESTING */

function ctt(fn, msg, count = 1) {
  console.time(msg);
  for (let c = 0; c < count; c++) {
    fn();
  }
  console.timeEnd(msg);
}

function pt(fn, msg, count = 1) {
  const s = performance.now();
  for (let c = 0; c < count; c++) {
    fn();
  }
  console.log(msg + ':', performance.now() - s);
}
