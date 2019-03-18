/* CONSTANTS */
const MAX_ZOOM = 0.2;

function createChart({ columns, types, names, colors }) {
  let $ = {
    x: [],
    y: [],
    start: 1 - MAX_ZOOM,
    end: 1,
    isAdjusting: false,
    eventType: '',
    adjustStart: 0,
    adjustCurrent: [0, 0],
    chartWidth: 0,
  };

  for (const key in types) {
    switch (types[key]) {
      case 'x':
        $.x = getByFirst(columns, key).slice(1);
        break;
      case 'line':
        $.y.push({
          data: getByFirst(columns, key).slice(1),
          color: colors[key],
          name: names[key],
          active: true,
        });
        break;
    }
  }

  const maxY = Math.max(...[].concat(...$.y.map(line => line.data)));

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
              viewBox: `0 0 ${$.x.length - 1} ${maxY}`,
              preserveAspectRatio: 'none',
            },
          },
          [['use', { a: { 'xlink:href': '#chart-1' } }]],
        ],
      ],
    ],
    [
      'div.chart__preview',
      { r: bindRel($, 'previewEl') },
      [
        [
          'svg',
          {
            a: {
              viewBox: `0 0 ${$.x.length - 1} ${maxY}`,
              preserveAspectRatio: 'none',
            },
          },
          [
            ['symbol.chart__symbol', { a: { id: 'chart-1' } }, $.y.map(createPath)],
            ['use', { a: { 'xlink:href': '#chart-1' } }],
          ],
        ],
        [
          'div.chart__range',
          { r: bindRel($, 'rangeEl') },
          [
            ['div.chart__adjust', { l: { mousedown: beforeAdjust('start') } }],
            ['div.chart__handle', { l: { mousedown: beforeAdjust('both') } }],
            ['div.chart__adjust', { l: { mousedown: beforeAdjust('end') } }],
          ],
        ],
      ],
    ],
    ['div.chart__controls', {}, $.y.map(createSwitcher)],
  ]);

  function createPath({ data, color }, i) {
    return create('path.fade-out', {
      a: {
        stroke: color,
        fill: 'none',
        'vector-effect': 'non-scaling-stroke',
        d: data.reduce((d, y, x) => (d += (x === 0 ? 'M' : 'L') + `${x} ${maxY - y}`), ''),
      },
      r: bindRel($.y[i], 'path'),
    });
  }

  function createSwitcher({ name, color }, i) {
    return create(
      'button.chart__switcher.switcher',
      {
        l: { click: toggleSwitch(i) },
        r: bindRel($.y[i], 'switcher'),
      },
      [
        ['span.switcher__checkbox', { s: { backgroundColor: color } }],
        ['span.switcher__label', { d: { textContent: name } }],
      ]
    );
  }

  function beforeAdjust(type) {
    return function(e) {
      e.stopPropagation();
      $.isAdjusting = true;
      $.eventType = type;
      $.adjustCurrent = [$.start, $.end];
      $.adjustStart = getEventX(e);
      $.chartWidth = $.previewEl.offsetWidth;
    };
  }

  function adjust(e) {
    if ($.isAdjusting) {
      const delta = (getEventX(e) - $.adjustStart) / $.chartWidth;
      const start = $.adjustCurrent[0] + delta;
      const end = $.adjustCurrent[1] + delta;
      if ($.eventType === 'start' || ($.eventType === 'both' && end <= 1)) {
        $.start = limit(start, 0, 1);
      }
      if ($.eventType === 'end' || ($.eventType === 'both' && start >= 0)) {
        $.end = limit(end, 0, 1);
      }
      redraw(Math.sign(delta));
    }
  }

  function afterAdjust(e) {
    $.isAdjusting = false;
  }

  function toggleSwitch(i) {
    return function() {
      const line = $.y[i];
      line.active = !line.active;
      redrawLines();
    };
  }

  function redraw(direction) {
    requestAnimationFrame(function() {
      $.rangeEl.style.left = `${$.start * 100}%`;
      $.rangeEl.style.right = `${(1 - $.end) * 100}%`;
    });
  }

  function redrawLines() {
    $.y.forEach(line => {
      toggleClass(line.switcher, line.active, 'active');
      toggleClass(line.path, line.active, 'active');
    });
  }

  document.addEventListener('mousemove', adjust, false);
  document.addEventListener('mouseup', afterAdjust, false);

  redraw();
  redrawLines();

  chartEl.$chart = $;
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
