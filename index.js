/* CONSTANTS */

const STROKE_WIDTH = 1.5;
const MS_IN_DAY = 1000 * 60 * 60 * 24;
const CHART_MARGIN = 18;
const CHART_WIDTH = window.innerWidth - CHART_MARGIN * 2;
const CHART_HEIGHT = 54;
const ZOOM_CHART_HEIGHT = 100;

const app = document.getElementById('chart-app');

createChart(chart_data[0]);
// chart_data.forEach(element => createChart(element));

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

  const chartSvg = create('svg', {
    a: {
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
      viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`,
    },
  });
  const chartControlsEl = create('div', { c: ['chart__controls'] });

  const allY = [].concat(...chart.y.map(line => line.data));
  const maxY = Math.max(...allY);

  chart.y.forEach((line, i) => {
    const { data, name } = line;
    let d = '';
    for (let j = 0; j < data.length; j++) {
      const x = Math.trunc((j / (data.length - 1)) * (CHART_WIDTH - STROKE_WIDTH) + STROKE_WIDTH / 2);
      const y = Math.trunc(((maxY - data[j]) / maxY) * (CHART_HEIGHT - STROKE_WIDTH) + STROKE_WIDTH / 2);
      d += (j === 0 ? 'M' : 'L') + `${x} ${y}`;
    }
    const path = create('path', {
      a: {
        stroke: line.color,
        fill: 'none',
        d,
      },
    });
    chartSvg.appendChild(path);

    const switcher = create('div', { c: ['switcher'] });
    const switcherCheckbox = create('input', {
      c: ['switcher__input'],
      a: {
        id: `switcher-${i}`,
        type: 'checkbox',
        checked: true,
      },
    });
    const switcherLabel = create('label', {
      c: ['switcher__label'],
      a: { for: `switcher-${i}` },
      d: { textContent: name}
    });
    
    switcher.appendChild(switcherCheckbox);
    switcher.appendChild(switcherLabel);
    chartControlsEl.appendChild(switcher);
  });
  
  
  const chartWrapperEl = create('section', { c: ['chart'] });
  const chartPreviewEl = create('div', { c: ['chart__preview'] });
  const chartRangeEl = create('div', { c: ['chart__range'] });
  const chartHandleEl = create('div', { c: ['chart__handle'] });
  
  chartWrapperEl.appendChild(chartPreviewEl);
  chartWrapperEl.appendChild(chartControlsEl);
  app.appendChild(chartWrapperEl);

  const chartAdjustLeftEl = create('div', { c: ['chart__adjust'] });

  let startXLeft;
  let currentPosLeft;
  chartAdjustLeftEl.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    startXLeft = getEventX(e);
    currentPosLeft = chart.range.start;
    document.addEventListener('mousemove', adjustLeft, false);
  });

  document.addEventListener('mouseup', function() {
    document.removeEventListener('mousemove', adjustLeft, false);
  });

  const adjustLeft = function(e) {
    const delta = (getEventX(e) - startXLeft) / CHART_WIDTH;
    const direction = Math.sign(delta);
    chart.range.start = limit(currentPosLeft + delta, 0, 1);
    redraw(direction);
  };

  const chartAdjustRightEl = create('div', { c: ['chart__adjust'] });

  let startXRight;
  let currentPosRight;
  chartAdjustRightEl.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    startXRight = getEventX(e);
    currentPosRight = chart.range.end;
    document.addEventListener('mousemove', adjustRight, false);
  });

  document.addEventListener('mouseup', function() {
    document.removeEventListener('mousemove', adjustRight, false);
  });

  const adjustRight = function(e) {
    const delta = -(getEventX(e) - startXRight) / CHART_WIDTH;
    const direction = Math.sign(delta);
    chart.range.end = limit(currentPosRight - delta, 0, 1);
    redraw(direction);
  };

  function redraw(direction) {
    requestAnimationFrame(function() {
      chartRangeEl.style.left = `${chart.range.start * 100}%`;
      chartRangeEl.style.right = `${(1 - chart.range.end) * 100}%`;
    });
  }

  chartPreviewEl.appendChild(chartSvg);
  chartRangeEl.appendChild(chartAdjustLeftEl);
  chartRangeEl.appendChild(chartHandleEl);
  chartRangeEl.appendChild(chartAdjustRightEl);
  chartPreviewEl.appendChild(chartRangeEl);
}

/* UTILS */

function getColumnByKey(columns, key) {
  return columns.find(item => item[0] === key).slice(1)
}

function create(t, { c, a, d }) { // tagName, classList, attrs, domProps
  // create element by tagName
  const e =
    ['svg', 'path'].indexOf(t) > -1
      ? document.createElementNS('http://www.w3.org/2000/svg', t)
      : document.createElement(t);
  // add classes
  if (c) {
    c.forEach(n => e.classList.add(n));
  }
  // set attributes by key
  if (a) {
    for (const k in a) {
      e.setAttribute(k, a[k]);
    }
  }
  // assign dom props
  if (d) {
    for (const p in d) {
      e[p] = d[p];
    }
  }
  return e;
}

function getEventX(e) {
  return e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
}

function limit(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* PERFORMANCE TESTING */

function ctt(fn, msg, count = 1) {
  console.time(msg);
  for (let c = 0; c < count; c++) {
    fn();
  }
  console.timeEnd(msg);
}
