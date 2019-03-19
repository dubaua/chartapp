- [ ] ~~Check shadow DOM and templates~~
- [ ] ~~chart can be template~~
- [ ] ~~switch can be template~~
- [x] move
- [x] check chart width with chart ragne width
- [x] bind listeners once, set flag is adjusting
- [x] zoom
- [x] deal with symbol id
- [x] scale zoom Y to fit
- [x] preview shows from min to max
- [x] lens shows from 0 to max
- [x] path animations
- [x] restrain max zoom
- [x] show detailed: Insert each chart in element. Listen to mutation observer on this element and callback on insert.

# Features
- [ ] themes switching below all charts. handle chart colors with rgb function
- [ ] detailed view of chart point
- [ ] legends
- [ ] legends animation

# Optimizing
- [x] move auxiliary data from options keys to variables for better minification
- [ ] lens check edge maximum?
- [ ] fetch data asynchronously
- [x] optimize redrawing checking is delta changed
- [ ] optimize redrawing with requestAnimationFrame
- [ ] minimize js

# CSS
- [x] hide overflow y
- [ ] try variables
- [ ] optimize css
- [ ] adopt for small screens
