const chart = document.getElementById('chart');

const chartWidth = window.innerWidth - 16;
const chartHeight = window.innerHeight - 16;

chart.setAttribute('width', chartWidth);
chart.setAttribute('height', chartHeight);
chart.setAttribute('viewBox', `0 0 ${chartWidth} ${chartHeight}`);

const ascending = (a,b) => a-b;
const descending = (a,b) => b-a;

// draw chart
const dataX = data.map(point => point.result).sort(ascending);
const minX = dataX[0];
const maxX = dataX[dataX.length - 1];

const dataY = data.map(point => point.chance).sort(ascending);
const minY = dataY[0];
const maxY = dataY[dataX.length - 1];

function collectPath(path, point) {
  const x = (point.result - minX) / (maxX - minX) * chartWidth;
  const y = (maxY - point.chance) / (maxY - minY) * chartHeight;
  if (path === '') {
    return `M${x} ${y}`;
  }
  return `${path}L${x} ${y}`;
}

const sortedData = data.sort((a, b) => a.result - b.result);

const pathData = sortedData.reduce(collectPath, '');

const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
path.setAttribute('d', pathData);
path.setAttribute('stroke', 'red');
path.setAttribute('stroke-width', 3);

chart.appendChild(path);
