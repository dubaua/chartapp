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
- [ ] !legends 
- [ ] !themes switching below all charts. handle chart colors with rgb function
- [ ] !detailed view of chart point
- [x] debounce legends animation 

# Optimizing
- [x] move auxiliary data from options keys to variables for better minification
- [x] reduce y key size
- [ ] lens check edge maximum?
- [ ] fetch data asynchronously
- [x] optimize redrawing checking is delta changed
- [ ] optimize redrawing with requestAnimationFrame
- [ ] minimize js
- [ ] calculate range with left + width, not left..right

# CSS
- [x] hide overflow y
- [ ] try variables
- [ ] !optimize css
- [ ] adopt for small screens

# Bugs
- [ ] dragging left-right fast causing expanging range

# Flow

immediately show controls moving: switchers and range. Lines animates very fast.

chart lens animates smoothy after changing controls

legends animates after chart lens animation