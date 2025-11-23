# Kaleidoscope Designer

A beautiful, interactive web application for creating symmetrical kaleidoscope, snowflake, and mandala patterns optimized for coloring apps.

## Features

### Symmetry Types

- **Rotational Symmetry (Snowflake)**: Elements are duplicated around the center point
- **Radial Symmetry (Mandala)**: Elements are duplicated AND mirrored, creating more complex patterns
- **Variable Order**: Choose from 2 to 24-fold symmetry

### Drawing Tools

1. **Line Tool**: Click and drag to draw straight lines
2. **Circle Tool**: Click and drag from center to create circles
3. **Bezier Curve Tool**: Click multiple times to create smooth curves
   - First click: Start point
   - Second click: Control point
   - Third click: End point

### Smart Randomizer

The randomizer creates interesting patterns by:
- Generating N random lines/circles in the wedge
- Using three strategies to maximize interesting shapes:
  - **Radial lines**: Lines emanating from the center
  - **Concentric circles**: Circles at various radii
  - **Diagonal lines**: Random crossing lines
- Applying jitter to avoid overly deterministic patterns
- Creating numerous small regions perfect for coloring

### Export to SVG

Export your designs as scalable vector graphics (SVG) with:
- Customizable line width for different coloring applications
- Clean, optimized paths
- Perfect for importing into coloring apps or printing

## How to Use

1. **Open `index.html`** in a modern web browser (Chrome, Firefox, Safari, Edge)

2. **Choose your symmetry**:
   - Select type (Rotational or Radial)
   - Adjust order (number of repetitions)

3. **Draw your pattern**:
   - Select a tool (Line, Circle, or Bezier)
   - Draw in the canvas - it will automatically duplicate with symmetry
   - Only the first wedge is interactive; others show the duplicated pattern

4. **Use the Randomizer**:
   - Adjust number of lines and jitter amount
   - Click "Randomize" to generate a pattern
   - Try multiple times to find interesting patterns

5. **Export**:
   - Adjust export line width as desired
   - Click "Export SVG" to download
   - Use the SVG in coloring apps or print it

## Tips for Best Results

- **For coloring**: Use the randomizer with 10-20 lines for good complexity
- **For intricate patterns**: Use higher symmetry orders (12+) with radial symmetry
- **For bold designs**: Use lower symmetry orders (3-6) with rotational symmetry
- **Layer your drawings**: Combine circles, lines, and curves for variety
- **Use Undo**: Made a mistake? Click "Undo Last" to remove the most recent element

## Technical Details

- Pure HTML/CSS/JavaScript - no dependencies
- Uses HTML5 Canvas for drawing
- Exports to SVG for perfect scalability
- Responsive design works on various screen sizes
- All processing happens in the browser (no server needed)

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript
- CSS Grid

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure

```
kaleidoscope-designer/
├── index.html          # Main application (standalone)
└── README.md          # This file
```

## Future Enhancements

Possible additions:
- Gradient and pattern fills
- Import existing SVGs
- Gallery of saved designs
- Share designs via URL
- More drawing tools (polygons, stars)
- Custom color palettes

## License

Free to use for personal and commercial projects.

## Credits

Created with ❤️ for artists and coloring enthusiasts everywhere.
