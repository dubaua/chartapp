/* CONSTANTS */

const STROKE_WIDTH = 1.5;
const STROKE_LINECAP = 'round';
const STROKE_LINEJOIN = 'round';
const PATH_ACСURACY = 2; // digits after the decimal point
const MS_IN_DAY = 1000 * 60 * 60 * 24;
const CHART_MARGIN = 18;
const CHART_WIDTH = window.innerWidth - CHART_MARGIN * 2;
const CHART_HEIGHT = 54;
const ZOOM_CHART_HEIGHT = 100;

const app = document.getElementById('chart-app');

createChart(chart_data[0]);

function createChart(chartData) {
  const { columns, types, names, colors } = chartData;

  let chart = {
    x: null,
    y: [],
    range: {
      start: 0,
      end: 1,
    },
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
            active: true,
          });
          break;
      }
    }
  }



  const chartSvg = createElementNS('svg');
  chartSvg.setAttribute('width', CHART_WIDTH);
  chartSvg.setAttribute('height', CHART_HEIGHT);
  chartSvg.setAttribute('viewBox', [0, 0, CHART_WIDTH, CHART_HEIGHT].join(' '));
  chartSvg.setAttribute('fill', 'none');

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
      const x = ((i / (data.length - 1)) * (CHART_WIDTH - STROKE_WIDTH) + STROKE_WIDTH / 2).toFixed(PATH_ACСURACY);
      const y = (((maxY - data[i]) / maxY) * (CHART_HEIGHT - STROKE_WIDTH) + STROKE_WIDTH / 2).toFixed(PATH_ACСURACY);
      if (i === 0) {
        d += `M${x} ${y}`;
      } else {
        d += `L${x} ${y}`;
      }
    }
    path.setAttribute('d', d);
    chartSvg.appendChild(path);
  });

  const chartWrapperEl = createElement('section', 'chart');
  const chartPreviewEl = createElement('div', 'chart__preview');
  const chartRangeEl = createElement('div', 'chart__range');
  const chartHandleEl = createElement('div', 'chart__handle');



  chartWrapperEl.appendChild(chartPreviewEl);
  app.appendChild(chartWrapperEl);

  const leftLimit = chartPreviewEl.offsetLeft;
  const chartPreviewWidth = chartPreviewEl.offsetWidth;

  const chartAdjustLeftEl = createElement('div', 'chart__adjust');

  chartAdjustLeftEl.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    chartAdjustLeftEl.addEventListener('mousemove', adjustLeft, false);
  });

  chartAdjustLeftEl.addEventListener('mouseup', function(e) {
    e.stopPropagation();
    chartAdjustLeftEl.removeEventListener('mousemove', adjustLeft, false);
  });

  chartAdjustLeftEl.addEventListener('mouseout', function(e) {
    e.stopPropagation();
    chartAdjustLeftEl.removeEventListener('mousemove', adjustLeft, false);
  });

  chartAdjustLeftEl.addEventListener('mouseleave', function(e) {
    e.stopPropagation();
    chartAdjustLeftEl.removeEventListener('mousemove', adjustLeft, false);
  });

  const adjustLeft = function(e) {
    const x = getEventX(e);
    console.log(x);
    const newPosX = (x - leftLimit) / chartPreviewWidth * 100;
    // chartRangeEl.style.left = `${newPosX}%`;
  }

  const chartAdjustRightEl = createElement('div', 'chart__adjust');

  chartPreviewEl.appendChild(chartSvg);
  chartRangeEl.appendChild(chartAdjustLeftEl);
  chartRangeEl.appendChild(chartHandleEl);
  chartRangeEl.appendChild(chartAdjustRightEl);
  chartPreviewEl.appendChild(chartRangeEl);
  
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

function createElement(tagName, className) {
  const el = document.createElement(tagName);
  el.classList.add(className);
  return el;
}

function createElementNS(tagName) {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

function getEventX(e) {
  return e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
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
