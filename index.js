/* CONSTANTS */

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const CHART_MARGIN = 18;
const CHART_WIDTH = window.innerWidth - CHART_MARGIN * 2;
const CHART_HEIGHT = 54;
const ZOOM_CHART_HEIGHT = 100;

const app = document.getElementById('chart-app');

const chart0 = createChart(chart_data[0]);
console.log(chart0);
// chart_data.forEach(element => createChart(element));

function createChart(chartData) {
  const { columns, types, names, colors } = chartData;

  let _chart = {
    x: null,
    y: {},
    start: 0,
    end: 1,
    el: {},
    adjustStart: 0,
    adjustCurrent: 0,
    adjustTarget: '',
  };

  for (const key in types) {
    if (types.hasOwnProperty(key)) {
      const type = types[key];
      switch (type) {
        case 'x':
          _chart.x = getByFirst(columns, key).slice(1);
          break;
        case 'line':
          _chart.y[key] = {
            key,
            data: getByFirst(columns, key).slice(1),
            color: colors[key],
            name: names[key],
            active: true,
          };
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

  const _chartY = Object.values(_chart.y);

  const allY = [].concat(..._chartY.map(line => line.data));
  const maxY = Math.max(...allY);

  _chartY.forEach((line) => {
    const { data, name } = line;
    let d = '';
    for (let j = 0; j < data.length; j++) {
      const x = Math.trunc((j / (data.length - 1)) * CHART_WIDTH);
      const y = Math.trunc(((maxY - data[j]) / maxY) * CHART_HEIGHT);
      d += (j === 0 ? 'M' : 'L') + `${x} ${y}`;
    }
    const path = create('path', {
      c: ['fade-out'],
      a: {
        stroke: line.color,
        fill: 'none',
        d,
      },
    });
    chartSvg.appendChild(path);

    const switcher = create('button', { c: ['chart__switcher', 'switcher'] });
    const switcherCheckbox = create('span', {
      c: ['switcher__checkbox'],
      s: {
        backgroundColor: line.color,
      }
    });
    const switcherLabel = create('span', {
      c: ['switcher__label'],
      d: { textContent: name}
    });

    switcher.addEventListener('click', toggleSwitch(line.key), false);
    
    switcher.appendChild(switcherCheckbox);
    switcher.appendChild(switcherLabel);
    chartControlsEl.appendChild(switcher);
    _chart.y[line.key].switcher = switcher;
    _chart.y[line.key].path = path;
  });

  redrawLines();

  function toggleSwitch(key) {
    return function() {
      const line = _chart.y[key];
      line.active = !line.active;
      redrawLines();
    }
  }
  
  const chartWrapperEl = create('section', { c: ['chart'] });
  const chartPreviewEl = create('div', { c: ['chart__preview'] });
  const chartRangeEl = create('div', { c: ['chart__range'] });
  const chartHandleEl = create('div', { c: ['chart__handle'] });
  
  chartWrapperEl.appendChild(chartPreviewEl);
  chartWrapperEl.appendChild(chartControlsEl);
  app.appendChild(chartWrapperEl);

  const chartAdjustLeftEl = create('div', { c: ['chart__adjust'] });
  const chartAdjustRightEl = create('div', { c: ['chart__adjust'] });

  chartAdjustLeftEl.addEventListener('mousedown', startAdjust('start'), false);
  chartAdjustRightEl.addEventListener('mousedown', startAdjust('end'), false);

  document.addEventListener('mouseup', function() {
    document.removeEventListener('mousemove', adjust, false);
  });

  function startAdjust(target) {
    return function(e) {
      e.stopPropagation();
      document.addEventListener('mousemove', adjust, false);
      _chart.adjustStart = getEventX(e);
      _chart.adjustCurrent = _chart[target];
      _chart.adjustTarget = target;
    }
  }

  function adjust(e) {
    const delta = (getEventX(e) - _chart.adjustStart) / CHART_WIDTH;
    const direction = Math.sign(delta);
    _chart[_chart.adjustTarget] = limit(_chart.adjustCurrent + delta, 0, 1);
    redraw(direction);
  };

  function redraw(direction) {
    requestAnimationFrame(function() {
      chartRangeEl.style.left = `${_chart.start * 100}%`;
      chartRangeEl.style.right = `${(1 - _chart.end) * 100}%`;
    });
  }

  function redrawLines() {
    Object.values(_chart.y).forEach(line => {
      toggleClass(line.switcher, line.active, 'active');
      toggleClass(line.path, line.active, 'active');
    });
  }

  chartPreviewEl.appendChild(chartSvg);
  chartRangeEl.appendChild(chartAdjustLeftEl);
  chartRangeEl.appendChild(chartHandleEl);
  chartRangeEl.appendChild(chartAdjustRightEl);
  chartPreviewEl.appendChild(chartRangeEl);

  return _chart;
}

/* UTILS */

function getByFirst(array, key) {
  return array.find(item => item[0] === key)
}

function create(t, { c, a, d, s }) { // tagName, classList, attrs, domProps, style
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
  // assign styles
  if (s) {
    for (const r in s) {
      e.style[r] = s[r];
    }
  }
  return e;
}

function toggleClass(el, state, className) {
  if (state) {
    el.classList.add(className);
  } else {
    el.classList.remove(className);
  }
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
