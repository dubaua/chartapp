/* CONSTANTS */
const MAX_ZOOM = 0.2;

function createChart({ columns, types, names, colors }) {
  let chartOptions = {
    x: [],
    y: [],
    start: 1 - MAX_ZOOM,
    end: 1,
    adjustStart: 0,
    adjustCurrent: 0,
    adjustTarget: '',
  };

  for (const key in types) {
    switch (types[key]) {
      case 'x':
        chartOptions.x = getByFirst(columns, key).slice(1);
        break;
      case 'line':
        chartOptions.y.push({
          data: getByFirst(columns, key).slice(1),
          color: colors[key],
          name: names[key],
          active: true,
        });
        break;
    }
  }

  const maxY = Math.max(...[].concat(...chartOptions.y.map(line => line.data)));

  // create DOM with hyperscript
  const chartEl = create('section.chart', {}, [
    [
      'div.chart__zoom',
      {},
      [
        [
          'svg',
          {
            a: {
              viewBox: `0 0 ${chartOptions.x.length - 1} ${maxY}`,
              preserveAspectRatio: 'none',
            },
          },
          [['use', { a: { 'xlink:href': '#chart-1' } }]],
        ],
      ],
    ],
    [
      'div.chart__preview',
      { r: bindRel(chartOptions, 'previewEl') },
      [
        [
          'svg',
          {
            a: {
              viewBox: `0 0 ${chartOptions.x.length - 1} ${maxY}`,
              preserveAspectRatio: 'none',
            },
          },
          [
            ['symbol.chart__symbol', { a: { id: 'chart-1' } }, chartOptions.y.map(createPath)],
            ['use', { a: { 'xlink:href': '#chart-1' } }],
          ],
        ],
        [
          'div.chart__range',
          { r: bindRel(chartOptions, 'rangeEl') },
          [
            ['div.chart__adjust', { l: { mousedown: startAdjust('start') } }],
            ['div.chart__handle', { l: { mousedown: startMove } }],
            ['div.chart__adjust', { l: { mousedown: startAdjust('end') } }],
          ],
        ],
      ],
    ],
    ['div.chart__controls', {}, chartOptions.y.map(createSwitcher)],
  ]);

  function createPath({ data, color }, i) {
    return create('path.fade-out', {
      a: {
        stroke: color,
        fill: 'none',
        'vector-effect': 'non-scaling-stroke',
        d: data.reduce((d, y, x) => (d += (x === 0 ? 'M' : 'L') + `${x} ${maxY - y}`), ''),
      },
      r: bindRel(chartOptions.y[i], 'path'),
    });
  }

  function createSwitcher({ name, color }, i) {
    return create(
      'button.chart__switcher.switcher',
      {
        l: { click: toggleSwitch(i) },
        r: bindRel(chartOptions.y[i], 'switcher'),
      },
      [
        ['span.switcher__checkbox', { s: { backgroundColor: color } }],
        ['span.switcher__label', { d: { textContent: name } }],
      ]
    );
  }

  function startAdjust(target) {
    return function(e) {
      e.stopPropagation();
      document.addEventListener('mousemove', adjust, false);
      chartOptions.adjustStart = getEventX(e);
      chartOptions.adjustCurrent = chartOptions[target];
      chartOptions.adjustTarget = target;
    };
  }

  function adjust(e) {
    const delta = (getEventX(e) - chartOptions.adjustStart) / chartOptions.previewEl.offsetWidth;
    chartOptions[chartOptions.adjustTarget] = limit(chartOptions.adjustCurrent + delta, 0, 1);
    redraw(Math.sign(delta));
  }

  function startMove(e) {
    e.stopPropagation();
    document.addEventListener('mousemove', move, false);
    chartOptions.adjustStart = getEventX(e);
    chartOptions.adjustCurrent = [chartOptions.start, chartOptions.end];
  }

  function move(e) {
    const delta = (getEventX(e) - chartOptions.adjustStart) / chartOptions.previewEl.offsetWidth;
    const start = chartOptions.adjustCurrent[0] + delta;
    const end = chartOptions.adjustCurrent[1] + delta;
    if (end <= 1) {
      chartOptions.start = limit(start, 0, 1);
    }
    if (start >= 0) {
      chartOptions.end = limit(end, 0, 1);
    }
    redraw(Math.sign(delta));
  }

  function toggleSwitch(i) {
    return function() {
      const line = chartOptions.y[i];
      line.active = !line.active;
      redrawLines();
    };
  }

  function redraw(direction) {
    requestAnimationFrame(function() {
      chartOptions.rangeEl.style.left = `${chartOptions.start * 100}%`;
      chartOptions.rangeEl.style.right = `${(1 - chartOptions.end) * 100}%`;
    });
  }

  function redrawLines() {
    Object.values(chartOptions.y).forEach(line => {
      toggleClass(line.switcher, line.active, 'active');
      toggleClass(line.path, line.active, 'active');
    });
  }

  document.addEventListener('mouseup', function() {
    document.removeEventListener('mousemove', adjust, false);
    document.removeEventListener('mousemove', move, false);
  });

  redraw();
  redrawLines();

  chartEl.$chart = chartOptions;
  return chartEl;
}

/* UTILS */

function getByFirst(array, key) {
  return array.find(item => item[0] === key);
}

function create(t, { s, l, a, r, d } = {}, h) {
  const [_t, ...c] = t.split('.');
  // create element by tagName
  const e =
    ['svg', 'path', 'use', 'symbol'].indexOf(_t) > -1
      ? document.createElementNS('http://www.w3.org/2000/svg', _t)
      : document.createElement(_t);
  // add classes
  if (c.length) {
    c.forEach(i => e.classList.add(i));
  }
  // set attributes by key
  if (a) {
    for (const k in a) {
      if (k === 'xlink:href') {
        e.setAttributeNS('http://www.w3.org/1999/xlink', k, a[k]);
      } else {
        e.setAttribute(k, a[k]);
      }
    }
  }
  // assign dom props
  if (d) {
    for (const k in d) {
      e[k] = d[k];
    }
  }
  // assign styles
  if (s) {
    for (const k in s) {
      e.style[k] = s[k];
    }
  }
  // bind listeners
  if (l) {
    for (const k in l) {
      e.addEventListener(k, l[k], false);
    }
  }
  // create childs
  if (h) {
    h.forEach(i => (i instanceof Element ? e.appendChild(i) : e.appendChild(create(...i))));
  }
  // bind rel
  if (r) {
    r(e);
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

function bindRel(target, key, el) {
  if (!el) {
    return bindRel.bind(this, target, key);
  }
  target[key] = el;
}

/* PERFORMANCE TESTING */

function ctt(fn, msg, count = 1) {
  console.time(msg);
  for (let c = 0; c < count; c++) {
    fn();
  }
  console.timeEnd(msg);
}

/* USERCODE */

const app = document.getElementById('chart-app');
const chart0 = createChart(chart_data[0]);
console.log(chart0.$chart);
app.appendChild(chart0);
// chart_data.forEach(element => {
//   console.time('creating');
//   const chart = createChart(element)
//   console.timeEnd('creating');
//   app.appendChild(chart);
// });
