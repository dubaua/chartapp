/* CONSTANTS */
const MAX_ZOOM = 0.05;
const INITIAL_ZOOM = 0.2;
let currentIndex = 1;

function createChart({ columns, types, names, colors }, parentElement) {
  let xAxis = [];
  let xAxisLength = [];
  let yAxis = [];
  let start = 1 - INITIAL_ZOOM;
  let end = 1;
  let maxY = 0;
  let minY = 0;
  let chartWidth = 0;
  let chartOffsetX = 0;
  let prevX = 0;
  let isAdjusting = false;
  let eventType = '';
  let refs = {};

  for (const key in types) {
    switch (types[key]) {
      case 'x':
        xAxis = getByFirst(columns, key).slice(1);
        xAxisLength = xAxis.length - 1;
        break;
      case 'line':
        yAxis.push({
          data: getByFirst(columns, key).slice(1),
          color: colors[key],
          name: names[key],
          active: true,
        });
        break;
    }
  }

  const allY = [].concat(...yAxis.map(line => line.data));
  maxY = Math.max(...allY);
  minY = Math.min(...allY);

  function getStartIndex() {
    return Math.floor(xAxisLength * start);
  }

  function getEndIndex() {
    return Math.ceil(xAxisLength * end);
  }

  // getters
  function activeYs() {
    return yAxis.filter(line => line.active);
  }

  function selectedY() {
    return [].concat(...activeYs().map(line => line.data.slice(getStartIndex(), getEndIndex())));
  }

  function maxActiveY() {
    return Math.max(...[].concat(...activeYs().map(line => line.data)));
  }

  function maxSelectedY() {
    return Math.max(...selectedY());
  }

  // create DOM with hyperscript
  const chartElement = create('section.chart', {}, [
    [
      'div.chart__lens',
      {
        l: {
          mousemove: showDetailed,
          touchmove: showDetailed,
        },
        r: bindReference(refs, 'lensEl'),
      },
      [
        [
          'svg',
          {
            a: {
              viewBox: `0 0 ${xAxisLength} ${maxY}`,
              preserveAspectRatio: 'none',
            },
            r: bindReference(refs, 'lensSvg'),
          },
          [
            ['symbol.chart__symbol', { a: { id: `chart-${currentIndex}` } }, yAxis.map(createPath)],
            ['use', { a: { 'xlink:href': `#chart-${currentIndex}` }, r: bindReference(refs, 'lensUse') }],
            [
              'path.chart__zoom',
              {
                a: { d: `M0 0L0 ${maxY}`, fill: 'none', 'vector-effect': 'non-scaling-stroke' },
                r: bindReference(refs, 'lensZoom'),
              },
            ],
          ],
        ],
      ],
    ],
    [
      'div.chart__preview',
      { r: bindReference(refs, 'previewEl') },
      [
        [
          'svg',
          {
            a: {
              viewBox: `0 0 ${xAxisLength} ${maxY - minY}`,
              preserveAspectRatio: 'none',
            },
          },
          [['use', { a: { 'xlink:href': `#chart-${currentIndex}` }, r: bindReference(refs, 'previewUse') }]],
        ],
        [
          'div.chart__range',
          { r: bindReference(refs, 'rangeEl') },
          [
            ['div.chart__adjust', { l: { mousedown: beforeAdjust('start'), touchstart: beforeAdjust('start') } }],
            ['div.chart__handle', { l: { mousedown: beforeAdjust('both'), touchstart: beforeAdjust('both') } }],
            ['div.chart__adjust', { l: { mousedown: beforeAdjust('end'), touchstart: beforeAdjust('end') } }],
          ],
        ],
      ],
    ],
    ['div.chart__controls', {}, yAxis.map(createSwitcher)],
  ]);

  function createPath({ data, color }, i) {
    return create('path.fade-out', {
      a: {
        stroke: color,
        fill: 'none',
        'vector-effect': 'non-scaling-stroke',
        d: data.reduce((d, y, x) => (d += (x === 0 ? 'M' : 'L') + `${x} ${maxY - y}`), ''),
      },
      r: bindReference(yAxis[i], 'path'),
    });
  }

  function createSwitcher({ name, color }, i) {
    return create(
      'button.chart__switcher.switcher',
      {
        l: { click: toggleSwitch(i) },
        r: bindReference(yAxis[i], 'switcher'),
      },
      [
        ['span.switcher__checkbox', { s: { backgroundColor: color } }],
        ['span.switcher__label', { d: { textContent: name } }],
      ]
    );
  }

  // after create and on resize
  function setChartWidthAndOffset() {
    chartWidth = refs.previewEl.offsetWidth;
    chartOffsetX = refs.previewEl.getBoundingClientRect().x;
  }

  function beforeAdjust(type) {
    return function(e) {
      e.stopPropagation();
      isAdjusting = true;
      eventType = type;
      prevX = getEventX(e);
    };
  }

  function adjust(e) {
    if (!isAdjusting) {
      return;
    }
    const x = getEventX(e);
    const delta = (x - prevX) / chartWidth;
    prevX = x;
    if (!delta) {
      return;
    }
    const nextStart = start + delta;
    const nextEnd = end + delta;
    switch (eventType) {
      case 'start':
        if (end - nextStart >= MAX_ZOOM) {
          start = limit(nextStart, 0, 1);
        }
        break;
      case 'end':
        if (nextEnd - start >= MAX_ZOOM) {
          end = limit(nextEnd, 0, 1);
        }
        break;
      case 'both':
        if (nextEnd <= 1) {
          start = limit(nextStart, 0, 1);
        }
        if (nextStart >= 0) {
          end = limit(nextEnd, 0, 1);
        }
        break;
    }
    updateLegend(Math.sign(delta));
    draw(Math.sign(delta));
  }

  function afterAdjust(e) {
    isAdjusting = false;
  }

  function toggleSwitch(i) {
    return function() {
      const line = yAxis[i];
      line.active = !line.active;
      draw(0);
    };
  }

  function showDetailed(e) {
    // set on dom inserted, reset on resize
    // grab position 0..1 from eventX
    const posX = Math.floor(((getEventX(e) - chartOffsetX) / chartWidth) * xAxisLength);
    // console.log(posX);
    // create line over svg, create crossing rounds for each line

    // refs.lensZoom.setAttribute('d', `M${x} 0L${x} ${maxY}`);
    // show lens line over svg, show rounds, grab data
    // show data
  }

  function draw(direction) {
    yAxis.forEach(({ switcher, active, path }) => {
      toggleClass(switcher, active, 'active');
      toggleClass(path, active, 'active');
    });

    refs.rangeEl.style.left = `${start * 100}%`;
    refs.rangeEl.style.right = `${(1 - end) * 100}%`;

    refs.lensSvg.setAttribute('viewBox', `0 0 ${xAxisLength * (end - start)} ${maxY}`);
    refs.lensUse.setAttribute('x', -xAxisLength * start);
    refs.lensUse.style.transform = `scale(1, ${maxY / maxSelectedY()})`;

    refs.previewUse.style.transform = `scale(1, ${maxY / maxActiveY()})`;
  }

  let updateLegend = debounce(function(param) {
    console.log('updateLegend', param);
  }, 100);

  // function destroy() {
  //   document.removeEventListener('mousemove', adjust, false);
  //   document.removeEventListener('touchmove', adjust, false);
  //   document.removeEventListener('mouseup', afterAdjust, false);
  //   document.removeEventListener('touchend', afterAdjust, false);
  //   window.removeEventListener('resize', setChartWidthAndOffset, false);
  //   chartElement.remove();
  // }

  const observer = new MutationObserver(mutationCallback);

  function mutationCallback(mutationsList, observer) {
    for (var mutation of mutationsList) {
      if (mutation.type == 'childList') {
        setChartWidthAndOffset();
        observer.disconnect();
      }
    }
  }

  observer.observe(parentElement, { childList: true });

  document.addEventListener('mousemove', adjust, false);
  document.addEventListener('touchmove', adjust, false);
  document.addEventListener('mouseup', afterAdjust, false);
  document.addEventListener('touchend', afterAdjust, false);
  window.addEventListener('resize', setChartWidthAndOffset, false);

  draw(0);

  currentIndex++;

  parentElement.appendChild(chartElement);
  return chartElement;
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

function bindReference(target, key, el) {
  if (!el) {
    return bindReference.bind(this, target, key);
  }
  target[key] = el;
}

function debounce(fn, delay) {
  let timeoutId;
  return function() {
    const args = arguments;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function() {
      timeoutId = null;
      fn.apply(null, args);
    }, delay);
  };
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
chart_data.slice(0, 1).forEach(data => {
  var holder = document.createElement('div');

  console.time('creating');
  var chart = createChart(data, holder);
  console.timeEnd('creating');

  app.appendChild(holder);
  console.log(chart);
});
