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
- [x] Legends Y
- [ ] Legends X
- [x] themes switching below all charts. handle chart colors with rgb function
- [x] detailed line
- [ ] detailed dots
- [ ] detailed tooltip
- [x] debounce legends animation 

# Animations
- [ ] Legend Y
- [ ] Legend X

# Optimizing
- [x] move auxiliary data from options keys to variables for better minification
- [x] reduce y key size
- [x] calculate range with left + width, not left..right
- [x] optimize redrawing checking is delta changed
- [ ] lens check edge maximum?
- [x] fetch data asynchronously
- [ ] ~~optimize redrawing with requestAnimationFrame~~
- [ ] minimize js

# CSS
- [x] hide overflow y
- [x] try variables
- [ ] !optimize css
- [ ] adopt for small screens

# Bugs
- [x] dragging left-right fast causing expanging range

# Canvas
try canvas if time isn't over