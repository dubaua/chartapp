/* CONSTANTS */

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const CHART_MARGIN = 18;
const CHART_WIDTH = window.innerWidth - CHART_MARGIN * 2;
const ZOOM_CHART_HEIGHT = 100;
const DAYS_TO_SHOW = 28;

function createChart({ columns, types, names, colors }) {
  let chartOptions = {
    x: [],
    y: {},
    start: 0,
    end: 1,
    adjustStart: 0,
    adjustCurrent: 0,
    adjustTarget: '',
  };

  for (const key in types) {
    if (types.hasOwnProperty(key)) {
      const type = types[key];
      switch (type) {
        case 'x':
          chartOptions.x = getByFirst(columns, key).slice(1);
          break;
        case 'line':
          chartOptions.y[key] = {
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

  chartOptions.start = 1 - DAYS_TO_SHOW / chartOptions.x.length;

  const chartOptionsY = Object.values(chartOptions.y);
  const allY = [].concat(...chartOptionsY.map(line => line.data));
  const maxY = Math.max(...allY);

  const chartEl = create('section.chart', {}, [
    ['div.chart__zoom', {}, [
      [
        'svg',
        {
          a: {
            viewBox: `0 0 ${chartOptions.x.length - 1} ${maxY}`,
            preserveAspectRatio: 'none',
          },
        },
        [
          ['use', {a:{'xlink:href': '#chart-1'}}]
        ]
      ],
    ]],
    [
      'div.chart__preview',
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
          [
            ['symbol.chart__symbol', {a: {id: 'chart-1'}}, chartOptionsY.map(createPath)],
            ['use', {a:{'xlink:href': '#chart-1'}}]
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
    ['div.chart__controls', {}, chartOptionsY.map(createSwitcher)],
  ]);

  function createPath({ data, key, color }) {
    return create('path.fade-out', {
      a: {
        stroke: color,
        fill: 'none',
        'vector-effect': 'non-scaling-stroke',
        d: data.reduce((d, y, x) => d+= (x === 0 ? 'M' : 'L') + `${x} ${maxY - y}`, ''),
      },
      r: bindRel(chartOptions.y[key], 'path'),
    });
  }

  function createSwitcher({ name, key, color }) {
    return create(
      'button.chart__switcher.switcher',
      {
        l: { click: toggleSwitch(key) },
        r: bindRel(chartOptions.y[key], 'switcher'),
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
    const delta = (getEventX(e) - chartOptions.adjustStart) / CHART_WIDTH;
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
    const delta = (getEventX(e) - chartOptions.adjustStart) / CHART_WIDTH;
    const start = chartOptions.adjustCurrent[0] + delta;
    const end = chartOptions.adjustCurrent[1] + delta;
    if (start < 0 || end > 1) {
      return;
    }
    chartOptions.start = limit(start, 0, 1);
    chartOptions.end = limit(end, 0, 1);
    redraw(Math.sign(delta));
  }

  function toggleSwitch(key) {
    return function() {
      const line = chartOptions.y[key];
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

  chartEl.$chart = chartOptions
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
        e.setAttributeNS('http://www.w3.org/1999/xlink', k, a[k])
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

