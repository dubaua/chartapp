/* CONSTANTS */
const MAX_ZOOM = 0.05;
const INITIAL_ZOOM = 0.15;
const LEGEND_Y_LINE_COUNT = 6;
const MODE_NAMES = {
  day: 'Switch to Night Mode',
  night: 'Switch to Day Mode',
};
const MIN_LEGEND_X_LABEL_WIDHT_PX = 120;
const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

let currentId = 1;

function createChart({ columns, types, names, colors }, parentElement) {
  let xAxis = [];
  let xAxisLength = 0;
  let yAxis = [];
  let width = INITIAL_ZOOM;
  let start = 1 - width;
  let maxY = 0;
  let minY = 0;
  let chartWidth = 0;
  let chartOffsetX = 0;
  let prevX = 0;
  let isAdjusting = false;
  let eventType = '';
  let refs = {};
  let zoomedIndex = 0;

  for (const key in types) {
    switch (types[key]) {
      case 'x':
        xAxis = getByFirst(columns, key).slice(1);
        xAxisLength = xAxis.length - 1;
        break;
      case 'line':
        yAxis.push({
          d: getByFirst(columns, key).slice(1),
          c: colors[key],
          n: names[key],
          a: true,
        });
        break;
    }
  }

  const allY = [].concat(...yAxis.map(line => line.d));
  maxY = Math.max(...allY);
  minY = Math.min(...allY);

  function getStartIndex() {
    return xAxisLength * start;
  }

  function getEndIndex() {
    return xAxisLength * (start + width);
  }

  function getViewBoxXRange() {
    return getEndIndex() - getStartIndex();
  }

  function getActiveYs() {
    return yAxis.filter(line => line.a);
  }

  function getSelectedY() {
    return [].concat(...getActiveYs().map(line => line.d.slice(Math.ceil(getStartIndex()), Math.ceil(getEndIndex()))));
  }

  function getMaxActiveY() {
    return Math.max(...[].concat(...getActiveYs().map(line => line.d)));
  }

  function getMaxSelectedY() {
    return Math.max(...getSelectedY());
  }

  function getPreviewScale() {
    return maxY / getMaxActiveY();
  }

  function getLensScale() {
    return maxY / getMaxSelectedY();
  }

  function getLedendY(i) {
    const maxSelectedY = getMaxSelectedY();
    if (maxSelectedY === -Infinity) {
      return '';
    }
    return shortNumber(Math.floor(maxSelectedY / LEGEND_Y_LINE_COUNT) * i);
  }

  // create DOM with hyperscript
  const chartElement = create('section.chart', {}, [
    [
      'div.chart__body',
      {},
      [
        [
          'div.chart__details',
          {
            l: {
              mousemove: moveLens,
              touchmove: moveLens,
            },
          },
          [
            [
              'svg.muting',
              {
                a: {
                  viewBox: `0 0 ${xAxisLength} ${maxY}`,
                  preserveAspectRatio: 'none',
                },
              },
              [
                [
                  'g',
                  { r: bindReference(refs, 'lensTranslateGroup') },
                  [
                    ['g',
                    { r: bindReference(refs, 'lensScaleXGroup')},
                    [
                      ['g.chart__group',
                      { r: bindReference(refs, 'lensScaleYGroup') },
                      [
                        [
                          'path.chart__lens.lens',
                          {
                            a: { d: `M0 0L0 ${maxY}`, fill: 'none', 'vector-effect': 'non-scaling-stroke' },
                            r: bindReference(refs, 'lensZoom'),
                          },
                        ],
                        ...[].concat(...yAxis.map(createPathAndDots('lensPath'))),
                      ],]
                    ],]
                  ],
                ],
              ],
            ],
          ],
        ],
        ['div.chart__legend-y', {}, [...createLegendY()]],
        ['div.chart__legend-x', { r: bindReference(refs, 'legendX') }, [...createLegendX()]],
        ['div.tooltip.lens', {r: bindReference(refs, 'tooltip')}, [
          ['div.tooltip__date', { r: bindReference(refs, 'tooltipDate') }],
          ['div.tooltip__set', {}, yAxis.map(createTooltipValues)],
        ]],
      ],
    ],
    [
      'div.chart__preview',
      { r: bindReference(refs, 'previewEl') },
      [
        [
          'svg.muting',
          {
            a: {
              viewBox: `0 0 ${xAxisLength} ${maxY - minY}`,
              preserveAspectRatio: 'none',
            },
          },
          [['g.chart__group', { r: bindReference(refs, 'previewGroup') }, yAxis.map(createPath('previewPath'))]],
        ],
        [
          'div.chart__range',
          { r: bindReference(refs, 'rangeEl') },
          [
            ['div.chart__adjust', { l: { mousedown: beforeAdjust('start'), touchstart: beforeAdjust('start') } }],
            ['div.chart__handle', { l: { mousedown: beforeAdjust('move'), touchstart: beforeAdjust('move') } }],
            ['div.chart__adjust', { l: { mousedown: beforeAdjust('width'), touchstart: beforeAdjust('width') } }],
          ],
        ],
      ],
    ],
    ['div.chart__controls', {}, yAxis.map(createSwitcher)],
  ]);

  function createPath(referenceKey) {
    return function({ d, c }, i) {
      return create('path.fade', {
        a: {
          stroke: c,
          fill: 'none',
          'vector-effect': 'non-scaling-stroke',
          d: d.reduce((a, y, x) => (a += (x === 0 ? 'M' : 'L') + `${x} ${maxY - y}`), ''),
        },
        r: bindReference(yAxis[i], referenceKey),
      });
    };
  }

  function createSwitcher({ n, c }, i) {
    return create(
      'button.chart__switcher.switcher',
      {
        l: { click: toggleLine(yAxis[i]) },
        r: bindReference(yAxis[i], 'switcher'),
      },
      [
        ['span.switcher__checkbox.muting', { s: { backgroundColor: c } }],
        ['span.switcher__label', { d: { textContent: n } }],
      ]
    );
  }

  function createDot(flag) {
    return function({ c }, i) {
      return create(`path.fade.lens.chart__${flag ? 'dot' : 'pin'}`, {
        a: {
          stroke: flag ? c : null,
          fill: 'none',
          'vector-effect': 'non-scaling-stroke',
          d: 'M0 0L0 0.01',
        },
        r: bindReference(yAxis[i], flag ? 'dot' : 'pin'),
      });
    };
  }

  function createPathAndDots(referenceKey) {
    return function(с, i) {
      return [createPath(referenceKey)(с, i), createDot(true)(с, i), createDot(false)(с, i)];
    };
  }

  function createLegendY() {
    let legend = [];
    for (let i = 0; i < LEGEND_Y_LINE_COUNT; i++) {
      legend.unshift(
        create('div.chart__legend-y-section', {
          d: { textContent: getLedendY(i) },
          r: bindReference(refs, `legendY${i}`),
        })
      );
    }
    return legend;
  }

  function createLegendX() {
    const legendX = xAxis.map(date =>
      create('div.chart__legend-x-section.fade', {}, [
        ['div.chart__legend-x-label', { d: { textContent: getDateString(date) } }],
      ])
    );
    bindReference(refs, 'legendXLabels', legendX);
    return legendX;
  }

  function createTooltipValues({ n, c }, i) {
    return create('div.tooltip__value.muting', { r: bindReference(yAxis[i], 'tooltipValue'), s: { color: c } }, [
      ['div.tooltip__number', { r: bindReference(yAxis[i], 'tooltip') }],
      ['div.tooltip__label', { d: { textContent: n } }],
    ]);
  }

  function onResize() {
    setChartWidthAndOffset();
    moveLegendX();
  }

  function setChartWidthAndOffset() {
    chartWidth = refs.previewEl.offsetWidth;
    chartOffsetX = refs.previewEl.getBoundingClientRect().x;
  }

  function beforeAdjust(type) {
    return function (e) {
      e.preventDefault();
      e.stopPropagation();
      isAdjusting = true;
      eventType = type;
      prevX = getEventX(e);
    };
  }

  function adjust(e) {
    e.preventDefault();
    e.stopPropagation();
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
    let nextWidth = width + delta;
    switch (eventType) {
      case 'start':
        nextWidth = width - delta;
        if (nextStart >= 0) {
          width = limit(nextWidth, MAX_ZOOM, 1);
          start = limit(nextStart, 0, 1 - MAX_ZOOM);
        }
        break;
      case 'width':
        if (nextWidth + start <= 1) {
          width = limit(nextWidth, MAX_ZOOM, 1);
        }
        break;
      case 'move':
        if (nextStart + width <= 1) {
          start = limit(nextStart, 0, 1);
        }
        break;
    }
    movePreview();
    drawCharts();
    moveLegendX();
    scaleLegendX();
    drawLegendY(Math.sign(delta));
  }

  function afterAdjust() {
    isAdjusting = false;
  }

  function toggleLine(line) {
    return function() {
      const direction = line.a ? 1 : -1;
      line.a = !line.a;
      drawLinesAndSwitches();
      scalePreview();
      drawCharts();
      drawLegendY(direction);
    };
  }

  function moveLens(e) {
    e.stopPropagation();
    const lensX = limit((getEventX(e) - chartOffsetX) / chartWidth, 0, 1);
    const x = Math.round(getStartIndex() + getViewBoxXRange() * lensX);
    if (zoomedIndex !== x) {
      zoomedIndex = x;
      refs.lensZoom.setAttribute('d', `M${x} 0L${x} ${maxY}`);
      refs.tooltipDate.textContent = getDateString(xAxis[x], true);
      const lensPos = (x - getStartIndex()) / getViewBoxXRange() * chartWidth;
      const tooltipOffset = refs.tooltip.offsetWidth * lensX;
      refs.tooltip.style.transform = `translateX(${lensPos - tooltipOffset}px)`;
      yAxis.forEach(({ d, dot, pin, tooltip }) => {
        const yValue = d[x];
        const y = maxY - yValue;
        const dd = `M${x} ${y}L${x} ${y + 0.01}`;
        dot.setAttribute('d', dd);
        pin.setAttribute('d', dd);
        tooltip.textContent = shortNumber(yValue);
      });
    }
  }

  function drawLinesAndSwitches() {
    yAxis.forEach(({ a, switcher, lensPath, previewPath, dot, pin, tooltipValue }) => {
      [switcher, lensPath, previewPath, dot, pin, tooltipValue].forEach(el => toggleClass(el, a, 'active'));
    });
  }

  function movePreview() {
    refs.rangeEl.style.left = `${start.toFixed(4) * 100}%`;
    refs.rangeEl.style.width = `${width.toFixed(4) * 100}%`;
  }

  function scalePreview() {
    const transform = `scale(1, ${getPreviewScale().toFixed(2)})`;
    setTransform(refs.previewGroup, transform);
  }

  function drawCharts() {
    const translateX = (-(100 / getViewBoxXRange()) * getStartIndex()).toFixed(2);
    const scaleX = (xAxisLength / getViewBoxXRange()).toFixed(2);
    const scaleY = getLensScale().toFixed(2);
    refs.lensTranslateGroup.style.transform = `translate(${translateX}%, 0)`;
    setTransform(refs.lensScaleXGroup, `scale(${scaleX}, 1)`);
    setTransform(refs.lensScaleYGroup, `scale(1, ${scaleY})`);
  }

  let drawLegendY = debounce(function(direction) {
    for (let i = 0; i < LEGEND_Y_LINE_COUNT; i++) {
      refs[`legendY${i}`].textContent = getLedendY(i);
    }
  }, 100);

  function moveLegendX() {
    refs.legendX.style.transform = `translateX(${-start * 100}%)`;
  }

  let scaleLegendX = debounce (function() {
    const legendXWidth = ((chartWidth * xAxisLength) / getViewBoxXRange()).toFixed(2);
    refs.legendX.style.width = `${legendXWidth}px`;
    const labelsToSkipDivider = Math.ceil(MIN_LEGEND_X_LABEL_WIDHT_PX / (legendXWidth / xAxisLength));
    refs.legendXLabels.forEach((label, i) => {
      toggleClass(label, i % labelsToSkipDivider === 0, 'active');
    });
  },16)

  // function destroy() {
  //   document.removeEventListener('mousemove', adjust, false);
  //   document.removeEventListener('touchmove', adjust, false);
  //   document.removeEventListener('mouseup', afterAdjust, false);
  //   document.removeEventListener('touchend', afterAdjust, false);
  //   window.removeEventListener('resize', onResize, false);
  //   chartElement.remove();
  // }

  function init() {
    setChartWidthAndOffset();
    movePreview();
    scalePreview();
    drawLinesAndSwitches();
    drawCharts();
    moveLegendX();
    scaleLegendX();
    document.addEventListener('mousemove', adjust, false);
    document.addEventListener('touchmove', adjust, false);
    document.addEventListener('mouseup', afterAdjust, false);
    document.addEventListener('touchend', afterAdjust, false);
    window.addEventListener('resize', onResize, false);
  }

  const observer = new MutationObserver(mutationCallback);

  function mutationCallback(mutationsList, observer) {
    for (var mutation of mutationsList) {
      if (mutation.type == 'childList') {
        init();
        observer.disconnect();
      }
    }
  }

  observer.observe(parentElement, { childList: true });

  currentId++;

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
    ['svg', 'path', 'g'].indexOf(_t) > -1
      ? document.createElementNS('http://www.w3.org/2000/svg', _t)
      : document.createElement(_t);
  // add classes
  if (c.length) {
    c.forEach(i => e.classList.add(i));
  }
  // set attributes by key
  if (a) {
    for (const k in a) {
      var attr = a[k];
      if (attr) {
        e.setAttribute(k, attr);
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

function throttle(func, ms) {

  var isThrottled = false,
    savedArgs,
    savedThis;

  function wrapper() {

    if (isThrottled) { // (2)
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    func.apply(this, arguments); // (1)

    isThrottled = true;

    setTimeout(function() {
      isThrottled = false; // (3)
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

function getDateString(date, flag) {
  const [weekday, month, day] = new Date(date).toString().split(' ');
  return `${flag ? weekday + ', ' : ''}${month} ${day.replace(/^0/, '')}`;
}

function setTransform(el, transform) {
  if (isFirefox) {
    el.setAttribute('transform', transform);
  } else {
    el.style.transform = transform;
  }
}

function shortNumber(number) {
  if (number > 1e6) {
    return (number/1e6).toFixed(1) + 'M';
  }
  if (number > 1e3) {
    return (number/1e3).toFixed(1) + 'K';
  }
  return number;
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

const body = document.body;

fetch('/chart_data.json')
  .then(response => response.json())
  .then(charts =>
    charts.forEach(data => {
      const holder = create('div.holder');
      console.time('creating');
      createChart(data, holder);
      console.timeEnd('creating');
      body.appendChild(holder);
    })
  )
  .then(() => {
    body.appendChild(
      create('button.mode.muting', {
        d: { textContent: MODE_NAMES.day },
        l: {
          click: function(e) {
            const el = e.target;
            const isNight = el.textContent === MODE_NAMES.night;
            el.textContent = isNight ? MODE_NAMES.day : MODE_NAMES.night;
            toggleClass(document.documentElement, !isNight, 'night-mode');
          },
        },
      })
    );
  });
