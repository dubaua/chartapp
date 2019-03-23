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
- [x] Legends X
- [x] themes switching below all charts. handle chart colors with rgb function
- [x] detailed line
- [x] detailed dots
- [x] detailed tooltip
- [x] debounce legends animation 

# Animations
- [ ] Legend Y
- [x] Legend X

# Optimizing
- [x] optimize change range redrawing with requestAnimationFrame
- [x] move auxiliary data from options keys to variables for better minification
- [x] reduce y key size
- [x] calculate range with left + width, not left..right
- [x] optimize redrawing checking is delta changed
- [x] fetch data asynchronously
- [x] optimize scaling chartX
- [ ] optimize scaling legendX
- [ ] minimize js
- [ ] minimize ref keys

# CSS
- [x] adopt for small screens
- [x] hide overflow y
- [x] try variables
- [ ] !optimize css

# Bugs
- [x] dragging left-right fast causing expanging range
- [x] order of charts and dots: [chart, dot, pin]
- [x] Firefox can't proper calc variable
- [x] Firefox can't vector-effect non-scaling-stroke
- [x] Firefox transformY distorts chart
- [x] Safari doesn't support transform origin, while transform is set as svg attribute
- [x] Show lens only on hover
- [x] Tooltip lags when moving backwards
- [ ] Firefox wrong tooltip positioning
- [ ] restore default on touchmove and remove user select globally 
# Canvas
- [ ] ~~try canvas if time isn't over~~