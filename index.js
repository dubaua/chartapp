/* CONSTANTS */
const MAX_ZOOM = 0.05;
const INITIAL_ZOOM = 0.2;
let currentIndex = 1;

function createChart({ columns, types, names, colors }) {
  let $ = {
    x: [],
    y: [],
    maxY: 0,
    minY: 0,
    start: 1 - INITIAL_ZOOM,
    end: 1,
    isAdjusting: false,
    eventType: '',
    adjustStart: 0,
    prev: [1 - INITIAL_ZOOM, 1],
    chartWidth: 0,
  };

  for (const key in types) {
    switch (types[key]) {
      case 'x':
        $.x = getByFirst(columns, key).slice(1);
        $.xCount = $.x.length - 1;
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

  const allY = [].concat(...$.y.map(line => line.data));
  $.maxY = Math.max(...allY);
  $.minY = Math.min(...allY);

  // reactive getters
  $.activeYs = function() {
    return $.y.filter(line => line.active);
  };

  $.selectedY = function() {
    return [].concat(
      ...$.activeYs().map(line => line.data.slice(Math.floor($.xCount * $.start), Math.floor($.xCount * $.end)))
    );
  };

  $.maxActiveY = function() {
    return Math.max(...[].concat(...$.activeYs().map(line => line.data)));
  };

  $.maxSelectedY = function() {
    return Math.max(...$.selectedY());
  };

  // create DOM with hyperscript
  const chartEl = create('section.chart', {}, [
    [
      'div.chart__lens',
      {
        l: {
          mouseover: setChartWidth,
          touchstart: setChartWidth,
          mousemove: showDetailed,
          touchmove: showDetailed,
        },
        r: bindRel($, 'lensEl'),
      },
      [
        [
          'svg',
          {
            a: {
              viewBox: `0 0 ${$.xCount} ${$.maxY}`,
              preserveAspectRatio: 'none',
            },
            r: bindRel($, 'lensSvg'),
          },
          [
            ['symbol.chart__symbol', { a: { id: `chart-${currentIndex}` } }, $.y.map(createPath)],
            ['use', { a: { 'xlink:href': `#chart-${currentIndex}` }, r: bindRel($, 'lensUse') }],
            [
              'path.chart__zoom',
              {
                a: { d: `M0 0L0 ${$.maxY}`, fill: 'none', 'vector-effect': 'non-scaling-stroke' },
                r: bindRel($, 'lensZoom'),
              },
            ],
          ],
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
              viewBox: `0 0 ${$.xCount} ${$.maxY - $.minY}`,
              preserveAspectRatio: 'none',
            },
          },
          [['use', { a: { 'xlink:href': `#chart-${currentIndex}` }, r: bindRel($, 'previewUse') }]],
        ],
        [
          'div.chart__range',
          { r: bindRel($, 'rangeEl') },
          [
            ['div.chart__adjust', { l: { mousedown: beforeAdjust('start'), touchstart: beforeAdjust('start') } }],
            ['div.chart__handle', { l: { mousedown: beforeAdjust('both'), touchstart: beforeAdjust('both') } }],
            ['div.chart__adjust', { l: { mousedown: beforeAdjust('end'), touchstart: beforeAdjust('end') } }],
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
        d: data.reduce((d, y, x) => (d += (x === 0 ? 'M' : 'L') + `${x} ${$.maxY - y}`), ''),
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

  // on create and resize
  function setChartWidth() {
    $.chartWidth = $.previewEl.offsetWidth;
    $.chartOffsetX = $.previewEl.getBoundingClientRect().x;
    console.log('here');
  }

  function beforeAdjust(type) {
    return function(e) {
      e.stopPropagation();
      $.isAdjusting = true;
      $.eventType = type;
      $.prev = [$.start, $.end];
      $.adjustStart = getEventX(e);
      setChartWidth();
    };
  }

  function adjust(e) {
    if ($.isAdjusting) {
      const delta = (getEventX(e) - $.adjustStart) / $.chartWidth;
      const start = $.prev[0] + delta;
      const end = $.prev[1] + delta;
      switch ($.eventType) {
        case 'start':
          if ($.prev[1] - start >= MAX_ZOOM) {
            $.start = limit(start, 0, 1);
          }
          break;
        case 'end':
          if (end - $.prev[0] >= MAX_ZOOM) {
            $.end = limit(end, 0, 1);
          }
          break;
        case 'both':
          if (end <= 1) {
            $.start = limit(start, 0, 1);
          }
          if (start >= 0) {
            $.end = limit(end, 0, 1);
          }
          break;
      }
      draw(Math.sign(delta));
    }
  }

  function afterAdjust(e) {
    $.isAdjusting = false;
  }

  function toggleSwitch(i) {
    return function() {
      const line = $.y[i];
      line.active = !line.active;
      draw(0);
    };
  }

  function showDetailed(e) {
    // set on dom inserted, reset on resize
    // grab position 0..1 from eventX
    const posX = Math.floor((getEventX(e) - $.chartOffsetX) / $.chartWidth * $.xCount);
    console.log(posX);
    // create line over svg, create crossing rounds for each line

    // $.lensZoom.setAttribute('d', `M${x} 0L${x} ${$.maxY}`);
    // show lens line over svg, show rounds, grab data
    // show data
  }

  function draw(direction) {
    $.y.forEach(({ switcher, active, path }) => {
      toggleClass(switcher, active, 'active');
      toggleClass(path, active, 'active');
    });

    $.rangeEl.style.left = `${$.start * 100}%`;
    $.rangeEl.style.right = `${(1 - $.end) * 100}%`;

    $.lensSvg.setAttribute('viewBox', `0 0 ${$.xCount * ($.end - $.start)} ${$.maxY}`);
    $.lensUse.setAttribute('x', -$.xCount * $.start);
    $.lensUse.style.transform = `scale(1, ${$.maxY / $.maxSelectedY()})`;

    $.previewUse.style.transform = `scale(1, ${$.maxY / $.maxActiveY()})`;
  }

  // $.destroy = function() {
  //   document.removeEventListener('mousemove', adjust, false);
  //   document.removeEventListener('touchmove', adjust, false);
  //   document.removeEventListener('mouseup', afterAdjust, false);
  //   document.removeEventListener('touchend', afterAdjust, false);
  //   window.removeEventListener('resize', setChartWidth, false);
  //   chartEl.remove();
  // }

  document.addEventListener('mousemove', adjust, false);
  document.addEventListener('touchmove', adjust, false);
  document.addEventListener('mouseup', afterAdjust, false);
  document.addEventListener('touchend', afterAdjust, false);
  window.addEventListener('resize', setChartWidth, false);

  draw(0);

  currentIndex++;

  chartEl.$chart = $;
  return chartEl;
}

/* UTILS */

function getByFirst(array, key) {
  return array.find(item => item[0] === key);
}

function create(t, { s, l, a, r, d } = {}, h) {
  // extract classlist from tag name
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
console.time('creating');
const chart0 = createChart(chart_data[0]);
console.timeEnd('creating');
console.log(chart0.$chart);
app.appendChild(chart0);
// chart_data.forEach(element => {
//   console.time('creating');
//   const chart = createChart(element)
//   console.timeEnd('creating');
//   app.appendChild(chart);
// });
